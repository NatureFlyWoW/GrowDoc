// GrowDoc Companion — Note Contextualizer (public API, section-01)
//
// Pure projection over every existing note source in GrowDoc state.
// No serialization — Observations are built on demand and cached in
// a module-scoped singleton invalidated by a cheap composite hash.
//
// Stubs in this section: `parseObservation` (empty parsed) and
// `mergeNoteContext` (empty ctx) — real implementations land in
// sections 03 and 04 respectively.

import {
  mergeNoteContext as _mergeNoteContext,
  getRelevantObservations as _getRelevantObservations,
  findActionsTakenSince as _findActionsTakenSince,
} from './merge.js';
import {
  adjustScoresFromNotes as _adjustScoresFromNotes,
  SCORE_ADJUSTMENTS as _SCORE_ADJUSTMENTS,
} from './rules-score.js';
import {
  generateContextualAdvice as _generateContextualAdvice,
  ADVICE_RULES as _ADVICE_RULES,
} from './rules-advice.js';
import {
  KEYWORD_PATTERNS,
  DOMAIN_BY_RULE_ID,
  FRANCO_OVERRIDE_RULE_IDS,
  SEVERITY_HEURISTICS,
  ACTION_TAKEN_PATTERNS,
  applyLegacyRule,
} from './rules-keywords.js';
import { NOTE_PLACEHOLDERS } from './placeholders.js';

// Re-export placeholders so callers can migrate their imports to the
// contextualizer package without touching presentation code.
export { NOTE_PLACEHOLDERS };

const INDEX_VERSION = 1;

// ── Module state (singleton + sidecar) ─────────────────────────────
// Note: the rebuild is synchronous, so there is no single-flight window
// to track. If that changes (async parser, worker thread) add an
// in-flight promise here.
/** @type {import('../observation-schema.js').ObservationIndex | null} */
let cache = null;
/** @type {Map<string, Set<string>>} obsId -> Set<consumerId> */
const citations = new Map();
let storeRef = null;
let subscribed = false;
let debounceTimer = null;

// ── Severity mapping ──────────────────────────────────────────────
function mapSeverity(rawInput) {
  if (rawInput === 'urgent') return { severityRaw: 'urgent', severity: 'alert' };
  if (rawInput === 'concern') return { severityRaw: 'concern', severity: 'watch' };
  return { severityRaw: null, severity: 'info' };
}

// ── Deterministic string hash (FNV-1a 32-bit → hex) ───────────────
function stringHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function makeObservationId(source, sourceRefId, rawText) {
  return stringHash(`${source}:${sourceRefId ?? ''}:${rawText ?? ''}`);
}

function nowIso() {
  return new Date().toISOString();
}

function isNonEmpty(s) {
  return typeof s === 'string' && s.trim().length > 0;
}

// ── parseObservation (section-03) ────────────────────────────────

/**
 * Fresh ctx object with every §4a field pre-populated with its default
 * (null or []). Legacy ported rules write to additional keys (temp, ph,
 * rh, ec, stage, timeline, wateringPattern, previousTreatment, …) which
 * are left undefined here and appear on first write.
 *
 * @returns {Object}
 */
function emptyCtx() {
  return {
    // §4a scalars
    plantType: null,
    medium: null,
    waterSource: null,
    lighting: null,
    phExtracted: null,
    ecExtracted: null,
    tempExtracted: null,
    rhExtracted: null,
    vpdExtracted: null,
    severity: null,
    rootHealth: null,
    growerIntent: null,
    timelineDays: null,
    // §4a arrays
    amendments: [],
    previousProblems: [],
    actions: [],
  };
}

/**
 * Map legacy severity heuristic labels → (severityRaw, severity) pair
 * in the on-disk / display enums.
 *   'alert' → raw:'urgent',  display:'alert'
 *   'watch' → raw:'concern', display:'watch'
 *   'info'  → raw:null,      display:'info'
 */
function severityFromHeuristic(label) {
  if (label === 'alert') return { severityRaw: 'urgent', severity: 'alert' };
  if (label === 'watch') return { severityRaw: 'concern', severity: 'watch' };
  if (label === 'info')  return { severityRaw: null,     severity: 'info'  };
  return null;
}

/**
 * Parse a single Observation in place.
 *
 * Pipeline:
 *   1. Idempotent — if `obs.parsed != null`, return early.
 *   2. Run every KEYWORD_PATTERNS entry against `obs.rawText`, pushing
 *      matched rule ids into `parsed.keywords` in declaration order.
 *      Dispatch to `applyLegacyRule` (non-wizard rules only — wizard
 *      rules are skipped here; they're handled by `parseProfileText`).
 *   3. Populate `parsed.frankoOverrides` = matched keywords ∩ Franco set.
 *   4. Populate `obs.domains` from DOMAIN_BY_RULE_ID (+ 'action-taken'
 *      when an ACTION_TAKEN_PATTERNS entry fires). Deduped.
 *   5. Run ACTION_TAKEN_PATTERNS — push {type,value} into actionsTaken.
 *   6. Extract `?`/`is|does|should|can` sentences into `parsed.questions`.
 *   7. If `obs.severityRaw` was null and not already auto-inferred, run
 *      SEVERITY_HEURISTICS and set severity + severityAutoInferred=true
 *      on first match.
 *
 * Never throws. Rule-closure errors are absorbed and pushed into
 * `obs.parsed.ruleErrors` (see section-01 index-level ruleErrors).
 *
 * @param {import('../observation-schema.js').Observation} obs
 * @returns {import('../observation-schema.js').Observation}
 */
export function parseObservation(obs) {
  if (!obs) return obs;
  if (obs.parsed != null) return obs;

  const rawText = typeof obs.rawText === 'string' ? obs.rawText : '';
  const parsed = {
    ctx: emptyCtx(),
    observations: [],
    actionsTaken: [],
    questions: [],
    keywords: [],
    frankoOverrides: [],
    ruleErrors: [],
  };

  // Wizard notes keep their own (empty) parsed shell — wizard rules are
  // handled out-of-band by `parseProfileText`. Early-return preserves
  // the default ctx shape.
  if (obs.source === 'profile') {
    obs.parsed = parsed;
    return obs;
  }

  if (rawText === '') {
    obs.parsed = parsed;
    return obs;
  }

  const domainSet = new Set(Array.isArray(obs.domains) ? obs.domains : []);

  // 1. Run KEYWORD_PATTERNS in declaration order. Skip wizard-scoped
  //    rules — they're only meaningful in the profile/wizard shim.
  for (const rule of KEYWORD_PATTERNS) {
    if (rule.wizardStep) continue;
    try {
      const match = rawText.match(rule.pattern);
      if (!match) continue;

      applyLegacyRule(rule, match, parsed.ctx);
      parsed.keywords.push(rule.id);

      // Merge rule domains into the observation's domain set.
      const ruleDomains = DOMAIN_BY_RULE_ID[rule.id];
      if (Array.isArray(ruleDomains)) {
        for (const d of ruleDomains) domainSet.add(d);
      }
    } catch (err) {
      parsed.ruleErrors.push({
        ruleId: rule.id,
        error: err && err.message ? err.message : String(err),
        timestamp: nowIso(),
      });
    }
  }

  // 2. Franco overrides = intersection of matched keywords with the
  //    override set.
  for (const id of parsed.keywords) {
    if (FRANCO_OVERRIDE_RULE_IDS.has(id)) {
      parsed.frankoOverrides.push(id);
    }
  }

  // 3. Action-taken detection. ACTION_TAKEN_PATTERNS is an object
  //    keyed by taskType → RegExp (shape required by merge.js).
  let anyActionFired = false;
  for (const taskType of Object.keys(ACTION_TAKEN_PATTERNS)) {
    const pattern = ACTION_TAKEN_PATTERNS[taskType];
    if (!(pattern instanceof RegExp)) continue;
    try {
      if (pattern.test(rawText)) {
        parsed.actionsTaken.push({ type: taskType, value: taskType });
        if (!parsed.ctx.actions.includes(taskType)) {
          parsed.ctx.actions.push(taskType);
        }
        anyActionFired = true;
      }
    } catch (err) {
      parsed.ruleErrors.push({
        ruleId: `action-${taskType}`,
        error: err && err.message ? err.message : String(err),
        timestamp: nowIso(),
      });
    }
  }
  if (anyActionFired) domainSet.add('action-taken');

  // 4. Question extraction — crude but effective: sentences containing
  //    a literal '?' or starting with is/does/should/can become questions.
  const sentences = rawText.split(/(?<=[.?!])\s+|\n+/);
  for (const s of sentences) {
    const trimmed = s && s.trim();
    if (!trimmed) continue;
    if (trimmed.endsWith('?') || /^(is|does|should|can|will|could|would|why|what|how)\b/i.test(trimmed)) {
      parsed.questions.push(trimmed);
    }
  }
  if (parsed.questions.length > 0) domainSet.add('question');

  // 5. Severity auto-infer — only when caller left severityRaw null and
  //    hasn't already auto-inferred. First matching heuristic wins.
  const sevAlreadySet = obs.severityRaw != null;
  const alreadyAutoInferred = obs.severityAutoInferred === true;
  if (!sevAlreadySet && !alreadyAutoInferred) {
    for (const entry of SEVERITY_HEURISTICS) {
      if (!entry || !(entry.regex instanceof RegExp)) continue;
      try {
        if (entry.regex.test(rawText)) {
          const mapped = severityFromHeuristic(entry.severity);
          if (mapped) {
            obs.severityRaw = mapped.severityRaw;
            obs.severity = mapped.severity;
            obs.severityAutoInferred = true;
          }
          break;
        }
      } catch (err) {
        parsed.ruleErrors.push({
          ruleId: `severity-${entry.severity}`,
          error: err && err.message ? err.message : String(err),
          timestamp: nowIso(),
        });
      }
    }
  }

  // 6. Persist merged domains back to the observation.
  obs.domains = Array.from(domainSet);

  obs.parsed = parsed;
  return obs;
}

/**
 * Bulk parser — mutates and returns the same array. Collects
 * per-observation rule errors into an index-level `ruleErrors[]`
 * (consumed by `buildIndex` below).
 *
 * @param {import('../observation-schema.js').Observation[]} obsArr
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function parseAllObservations(obsArr) {
  if (!Array.isArray(obsArr)) return [];
  for (const o of obsArr) parseObservation(o);
  return obsArr;
}

// ── Pure projection walker ────────────────────────────────────────

/**
 * Walks grow + profile and emits Observation[]. Pure: no store access,
 * no singleton reads, no side effects.
 *
 * @param {Object} grow
 * @param {Object} profile
 * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function collectObservations(grow, profile, opts = {}) {
  const out = [];
  // createdAt = time of projection, NOT time of authorship. Do not rely on
  // this being stable across rebuilds of the same store state.
  const createdAt = nowIso();

  // 1. profile.notes — wizard-step free text
  if (profile && profile.notes && typeof profile.notes === 'object') {
    const profileObservedAt = profile.updatedAt || createdAt;
    for (const [wizardStep, rawText] of Object.entries(profile.notes)) {
      if (!isNonEmpty(rawText)) continue;
      out.push({
        id: makeObservationId('profile', wizardStep, rawText),
        createdAt,
        observedAt: profileObservedAt,
        // no plantId, no sourceRefId for profile sources
        source: 'profile',
        wizardStep,
        domains: [],
        ...mapSeverity(null),
        severityAutoInferred: false,
        rawText,
        parsed: null,
        tags: [],
      });
    }
  }

  const plants = (grow && Array.isArray(grow.plants)) ? grow.plants : [];

  for (const plant of plants) {
    if (!plant || !plant.id) continue;

    // 2. plant.notes
    if (isNonEmpty(plant.notes)) {
      const observedAt = plant.stageStartDate || plant.createdAt || createdAt;
      out.push({
        id: makeObservationId('plant', plant.id, plant.notes),
        createdAt,
        observedAt,
        plantId: plant.id,
        source: 'plant',
        sourceRefId: plant.id,
        domains: [],
        ...mapSeverity(null),
        severityAutoInferred: false,
        rawText: plant.notes,
        parsed: null,
        tags: [],
      });
    }

    // 3 + 5. plant.logs[*]
    const logs = Array.isArray(plant.logs) ? plant.logs : [];
    for (const log of logs) {
      if (!log || !log.id) continue;
      const notes = log.details && log.details.notes;
      if (!isNonEmpty(notes)) continue;

      const isStageTransition = log.type === 'stage-transition';
      const source = isStageTransition ? 'stage-transition' : 'log';
      const rawSeverity = log.details ? log.details.severity : null;
      out.push({
        id: makeObservationId(source, log.id, notes),
        createdAt,
        observedAt: log.timestamp || createdAt,
        plantId: plant.id,
        source,
        sourceRefId: log.id,
        domains: [],
        ...mapSeverity(rawSeverity),
        severityAutoInferred: false,
        rawText: notes,
        parsed: null,
        tags: [],
      });
    }
  }

  // 4. grow.tasks[*]
  const tasks = (grow && Array.isArray(grow.tasks)) ? grow.tasks : [];
  for (const task of tasks) {
    if (!task || !task.id) continue;
    if (!isNonEmpty(task.notes)) continue;
    out.push({
      id: makeObservationId('task', task.id, task.notes),
      createdAt,
      observedAt: task.updatedAt || task.createdAt || createdAt,
      plantId: task.plantId,
      source: 'task',
      sourceRefId: task.id,
      domains: [],
      ...mapSeverity(null),
      severityAutoInferred: false,
      rawText: task.notes,
      parsed: null,
      tags: [],
    });
  }

  // Apply opts filters (domains/minSeverity pass-through in section-01)
  let filtered = out;
  if (opts.plantId) {
    filtered = filtered.filter(o => o.plantId === opts.plantId);
  }
  if (opts.since) {
    const sinceMs = Date.parse(opts.since);
    if (!Number.isNaN(sinceMs)) {
      filtered = filtered.filter(o => Date.parse(o.observedAt) >= sinceMs);
    }
  }
  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
    const wanted = new Set(opts.domains);
    // Section-01 observations all have empty domains, so this returns []
    filtered = filtered.filter(o => o.domains.some(d => wanted.has(d)));
  }
  if (typeof opts.limit === 'number' && opts.limit >= 0) {
    filtered = filtered.slice(0, opts.limit);
  }

  return filtered;
}

// ── Cheap composite hash for staleness detection ──────────────────
function computeHash(grow, profile) {
  const plantCount = (grow && Array.isArray(grow.plants)) ? grow.plants.length : 0;
  const taskCount = (grow && Array.isArray(grow.tasks)) ? grow.tasks.length : 0;
  let logTotal = 0;
  if (grow && Array.isArray(grow.plants)) {
    for (const p of grow.plants) {
      if (p && Array.isArray(p.logs)) logTotal += p.logs.length;
    }
  }
  const growJson = (() => {
    try { return JSON.stringify(grow); } catch { return ''; }
  })();
  const profileJson = (() => {
    try { return JSON.stringify(profile); } catch { return ''; }
  })();
  return [
    plantCount,
    taskCount,
    logTotal,
    growJson.length,
    profileJson.length,
    profile && profile.updatedAt,
    stringHash(growJson),
    stringHash(profileJson),
  ].join('|');
}

function buildIndex(grow, profile) {
  const all = parseAllObservations(collectObservations(grow, profile));
  const byPlant = {};
  const byDomain = {};
  const ruleErrors = [];
  for (const o of all) {
    if (o.plantId) {
      (byPlant[o.plantId] = byPlant[o.plantId] || []).push(o);
    }
    for (const d of o.domains) {
      (byDomain[d] = byDomain[d] || []).push(o);
    }
    if (o.parsed && Array.isArray(o.parsed.ruleErrors)) {
      for (const err of o.parsed.ruleErrors) {
        ruleErrors.push({ obsId: o.id, ...err });
      }
    }
  }
  const index = {
    version: INDEX_VERSION,
    builtAt: nowIso(),
    fromHash: computeHash(grow, profile),
    byPlant,
    byDomain,
    all: Object.freeze(all),
    ruleErrors,
  };
  return index;
}

function emptyIndex() {
  return {
    version: INDEX_VERSION,
    builtAt: nowIso(),
    fromHash: '',
    byPlant: {},
    byDomain: {},
    all: Object.freeze([]),
    ruleErrors: [],
  };
}

// ── Store hook ────────────────────────────────────────────────────

/**
 * Idempotent store subscription. Subscribes a 300ms-debounced invalidator
 * to both `grow` and `profile` commits. The invalidator clears the cache;
 * the next `getObservationIndex()` call does the rebuild synchronously.
 *
 * @param {Object} store — createStore() instance from store.js
 */
export function initContextualizer(store) {
  if (subscribed) {
    if (store && store !== storeRef) {
      console.warn('initContextualizer: re-init with a different store ignored — call __resetForTests first.');
    }
    return;
  }
  storeRef = store;
  const invalidate = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      cache = null;
      debounceTimer = null;
    }, 300);
  };
  store.subscribe('grow', invalidate);
  store.subscribe('profile', invalidate);
  subscribed = true;
}

/**
 * Synchronous index accessor with hash-check rebuild. Safe to call
 * before `initContextualizer` — returns an empty frozen index.
 *
 * @returns {import('../observation-schema.js').ObservationIndex}
 */
export function getObservationIndex() {
  if (!storeRef) return emptyIndex();
  const grow = storeRef.state.grow;
  const profile = storeRef.state.profile;
  const currentHash = computeHash(grow, profile);
  if (cache && cache.fromHash === currentHash) return cache;
  cache = buildIndex(grow, profile);
  return cache;
}

/**
 * Query helper. In section-01 this delegates to the `merge.js` helper,
 * which applies plantId/since/domains/limit filters client-side.
 * minSeverity is a pass-through until section-04.
 *
 * @param {Object} store
 * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
 */
export function getRelevantObservations(_store, opts = {}) {
  // Note: `_store` is accepted for API symmetry with the rest of GrowDoc's
  // getX(store, opts) convention, but the singleton is owned by
  // `initContextualizer`. Passing a different store here is a no-op.
  if (!storeRef) return [];
  const index = getObservationIndex();
  return _getRelevantObservations(index.all, opts);
}

/**
 * Re-export stubs so callers can import everything from index.js.
 * Real bodies arrive in section-04.
 */
export function mergeNoteContext(observations) {
  return _mergeNoteContext(observations);
}

export function findActionsTakenSince(observations, taskType, sinceHours) {
  return _findActionsTakenSince(observations, taskType, sinceHours);
}

// ── Section-05: Plant Doctor note-awareness re-exports ────────────
//
// These live in `rules-score.js` / `rules-advice.js` but are re-exported
// here so callers import everything from the contextualizer's public
// surface (`data/note-contextualizer/index.js`).

export function adjustScoresFromNotes(scoresMap, ctx) {
  return _adjustScoresFromNotes(scoresMap, ctx);
}

export function generateContextualAdvice(ctx, conditionName) {
  return _generateContextualAdvice(ctx, conditionName);
}

export { _SCORE_ADJUSTMENTS as SCORE_ADJUSTMENTS, _ADVICE_RULES as ADVICE_RULES };

// ── Sidecar citations ─────────────────────────────────────────────

/**
 * Record that `consumerId` cited these observation IDs. The sidecar
 * is a plain in-memory Map<obsId, Set<consumerId>> — not serialized.
 *
 * @param {string[]} obsIds
 * @param {string}   consumerId
 */
export function recordReferencedIn(obsIds, consumerId) {
  if (!Array.isArray(obsIds) || !consumerId) return;
  for (const id of obsIds) {
    if (!id) continue;
    let set = citations.get(id);
    if (!set) {
      set = new Set();
      citations.set(id, set);
    }
    set.add(consumerId);
  }
}

/**
 * Read consumers for an observation id.
 * @param {string} obsId
 * @returns {string[]}
 */
export function getCitationsFor(obsId) {
  const set = citations.get(obsId);
  return set ? Array.from(set) : [];
}

// ── Wizard-note compatibility shim (section-04) ──────────────────
//
// Legacy `profile-context-rules.js` exposed `parseProfileNotes(notes)`
// that produced a flat ctx object. We preserve that shape here so the
// onboarding / settings / plant-detail views don't have to change their
// consumers. The shim runs the wizard-scoped KEYWORD_PATTERNS directly
// against each step's rawText — no Observation plumbing required.
//
// Once section-03's `parseObservation` lands, this function still works:
// it only reads entries from KEYWORD_PATTERNS that carry a `wizardStep`
// tag, so any general keyword rules section-03 appends are ignored.

const _PROFILE_DEFAULT_CTX = () => ({
  plantType: null,
  isAutoflower: false,
  mediumDetail: null,
  amendments: [],
  amendmentDensity: 'none',
  nutrientLine: null,
  nutrientBrand: null,
  lightBrand: null,
  lightDistance: null,
  lightDimming: null,
  container: null,
  waterSource: null,
  waterPH: null,
  irrigation: null,
  ventilation: null,
  ventilationBrand: null,
  trainingIntent: null,
  envConstraints: [],
  previousProblems: [],
  stealthRequired: false,
  budgetConstrained: false,
  noiseConscious: false,
  trueFirstTimer: false,
  feedingNeed: null,
  stretchLevel: null,
  heightLimit: null,
  location: null,
  rawUnmatched: [],
});

const _ARRAY_FIELDS = new Set(['amendments', 'previousProblems', 'envConstraints', 'sensitivities', 'rawUnmatched']);

function _wizardRulesForStep(step) {
  return KEYWORD_PATTERNS.filter(r => r.wizardStep === step);
}

function _handleWizardExtract(ctx, type, match, step) {
  switch (type) {
    case 'weeksOld':       ctx.weeksOld = parseInt(match[1], 10); break;
    case 'daysOld':        ctx.daysOld = parseInt(match[1], 10); break;
    case 'waterPH':        ctx.waterPH = parseFloat(match[1]); break;
    case 'waterPPM':       ctx.waterPPM = parseInt(match[1], 10); break;
    case 'lightDistance':  ctx.lightDistance = parseInt(match[1], 10); break;
    case 'lightDimming':   ctx.lightDimming = parseInt(match[1], 10); break;
    case 'lightWattageActual': ctx.lightWattageActual = parseInt(match[1], 10); break;
    case 'flowerWeeks':    ctx.expectedFlowerWeeks = parseInt(match[1], 10); break;
    case 'sensitivity':
      if (!ctx.sensitivities) ctx.sensitivities = [];
      ctx.sensitivities.push(match[1].toLowerCase());
      break;
    case 'tentSize':       ctx.tentSize = `${match[1]}x${match[2]}`; break;
    case 'fanSize':        ctx.fanSize = parseInt(match[1], 10); break;
    case 'heightLimit':    ctx.heightLimit = parseInt(match[1], 10); break;
    case 'location':       ctx.location = match[1].toLowerCase(); break;
    case 'previousProblem':
      ctx.rawUnmatched.push({ step, text: match[0] });
      break;
    default:
      // Unknown extract — preserved as raw unmatched.
      ctx.rawUnmatched.push({ step, text: match[0] });
  }
}

/**
 * parseProfileText — replacement for the legacy `parseProfileNotes`.
 *
 * Accepts either the wizard `notes` map `{ stage, medium, lighting, ... }`
 * OR a single `{ <customStep>: rawText }` entry. Returns a ctx object with
 * the same shape that `parseProfileNotes` used to produce.
 *
 * @param {Object} notes
 * @param {Object} [opts]
 * @param {string} [opts.wizardStep] when provided, parses `notes` as a plain
 *                                    string under that step (caller convenience)
 * @returns {Object}
 */
export function parseProfileText(notes, opts = {}) {
  const ctx = _PROFILE_DEFAULT_CTX();

  let entries;
  if (typeof notes === 'string' && opts.wizardStep) {
    entries = [[opts.wizardStep, notes]];
  } else if (notes && typeof notes === 'object') {
    entries = Object.entries(notes);
  } else {
    return ctx;
  }

  for (const [step, text] of entries) {
    if (!text || typeof text !== 'string') continue;
    const rules = _wizardRulesForStep(step);
    if (rules.length === 0) continue;

    let unmatched = text;

    for (const rule of rules) {
      const match = text.match(rule.pattern);
      if (!match) continue;

      unmatched = unmatched.replace(match[0], '');

      if (rule.extract) {
        _handleWizardExtract(ctx, rule.extract, match, step);
      } else if (rule.field && _ARRAY_FIELDS.has(rule.field)) {
        if (!Array.isArray(ctx[rule.field])) ctx[rule.field] = [];
        if (!ctx[rule.field].includes(rule.value)) ctx[rule.field].push(rule.value);
      } else if (rule.field) {
        ctx[rule.field] = rule.value;
      }
    }

    const remaining = unmatched.trim().replace(/\s+/g, ' ');
    if (remaining.length > 3) ctx.rawUnmatched.push({ step, text: remaining });
  }

  // Derived fields
  ctx.isAutoflower = ctx.plantType === 'autoflower';

  const count = ctx.amendments.length;
  if (count === 0) ctx.amendmentDensity = 'none';
  else if (count === 1) ctx.amendmentDensity = 'low';
  else if (count === 2) ctx.amendmentDensity = 'medium';
  else ctx.amendmentDensity = 'high';

  if (ctx.amendmentDensity === 'high' && !ctx.mediumDetail) {
    ctx.mediumDetail = 'amended';
  }

  return ctx;
}

// ── Test helper ───────────────────────────────────────────────────

/**
 * Clears singleton cache, in-flight promise, sidecar, debounce timer
 * and store reference. Tests MUST call this before each case so the
 * module has no leaked state between runs.
 */
export function __resetForTests() {
  cache = null;
  citations.clear();
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  storeRef = null;
  subscribed = false;
}
