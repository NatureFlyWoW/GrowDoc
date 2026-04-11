// GrowDoc Companion — Note Contextualizer: merge & weighting (section-04)
//
// Real implementations of `mergeNoteContext`, `getRelevantObservations`,
// and `findActionsTakenSince`. Pure — no store access. Operates on arrays
// of Observations (from `collectObservations` / `getObservationIndex`).
//
// See `weighting.js` for the 4-step severity-first decay algorithm.

import { resolveScalar } from './weighting.js';
import { ACTION_TAKEN_PATTERNS } from './rules-keywords.js';

const SEVERITY_RANK = { info: 0, watch: 1, alert: 2 };

function rankSeverity(sev) {
  return SEVERITY_RANK[sev] != null ? SEVERITY_RANK[sev] : 0;
}

function toMs(v) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? NaN : parsed;
}

/**
 * normalizeSince — accept ISO string, ms timestamp, or relative like '14d' / '24h'.
 * @param {string|number|Date} raw
 * @returns {number} ms timestamp, NaN if unparseable.
 */
function normalizeSince(raw) {
  if (raw == null) return NaN;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return NaN;
  const rel = raw.match(/^(\d+)\s*(h|hr|hrs|d|day|days|w|wk|weeks?)$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const unit = rel[2].toLowerCase();
    let ms = 0;
    if (unit.startsWith('h')) ms = n * 3_600_000;
    else if (unit.startsWith('d')) ms = n * 86_400_000;
    else if (unit.startsWith('w')) ms = n * 7 * 86_400_000;
    return Date.now() - ms;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? NaN : parsed;
}

/**
 * mergeNoteContext — given an array of Observations, produce a merged context
 * object where the strongest/most recent value wins per field.
 *
 * The merged result is an object:
 *   {
 *     ctx:              <scalar field map — winning values>,
 *     keywords:         string[]  deduped union of all parsed.keywords
 *     frankoOverrides:  string[]  deduped union of all parsed.frankoOverrides
 *     sources:          { <obsId>: { source, wizardStep? } }
 *     _citations:       { <field>: string[] }   obsIds that backed each field
 *   }
 *
 * Array-typed fields (amendments, previousProblems, envConstraints, sensitivities,
 * rawUnmatched) are unioned rather than replaced — conflicts are rare and union
 * captures more info for downstream advisors.
 *
 * @param {import('../observation-schema.js').Observation[]} observations
 * @param {number|Date|string} [now=Date.now()]
 * @returns {Object}
 */
export function mergeNoteContext(observations, now = Date.now()) {
  const ctx = {};
  const keywords = new Set();
  const frankoOverrides = new Set();
  const sources = {};
  const citations = {};

  if (!Array.isArray(observations) || observations.length === 0) {
    return { ctx, keywords: [], frankoOverrides: [], sources, _citations: citations };
  }

  // candidatesByField maps fieldName -> Array<{value, obs, source, severity, observedAt, ...}>
  /** @type {Object<string, Array<Object>>} */
  const scalarCandidates = {};
  /** @type {Object<string, Set<*>>} */
  const arrayUnions = {};
  /** @type {Object<string, Set<string>>} */
  const arrayCitations = {};

  const ARRAY_FIELDS = new Set([
    'amendments',
    'previousProblems',
    'envConstraints',
    'sensitivities',
    'rawUnmatched',
  ]);

  for (const obs of observations) {
    if (!obs) continue;
    const parsed = obs.parsed;

    // 1. Keywords + franco overrides + source attribution
    if (parsed) {
      if (Array.isArray(parsed.keywords)) {
        for (const k of parsed.keywords) keywords.add(k);
      }
      if (Array.isArray(parsed.frankoOverrides)) {
        for (const f of parsed.frankoOverrides) frankoOverrides.add(f);
      }
    }
    if (obs.id) {
      sources[obs.id] = {
        source: obs.source,
        ...(obs.wizardStep ? { wizardStep: obs.wizardStep } : {}),
      };
    }

    // 2. Ctx field candidates — only meaningful for parsed observations
    const pctx = parsed && parsed.ctx;
    if (!pctx || typeof pctx !== 'object') continue;

    for (const [field, value] of Object.entries(pctx)) {
      if (value == null) continue;

      if (ARRAY_FIELDS.has(field) && Array.isArray(value)) {
        if (!arrayUnions[field]) {
          arrayUnions[field] = new Set();
          arrayCitations[field] = new Set();
        }
        for (const item of value) arrayUnions[field].add(item);
        if (obs.id) arrayCitations[field].add(obs.id);
        continue;
      }

      if (Array.isArray(value)) {
        // Unknown array field — still union.
        if (!arrayUnions[field]) {
          arrayUnions[field] = new Set();
          arrayCitations[field] = new Set();
        }
        for (const item of value) arrayUnions[field].add(item);
        if (obs.id) arrayCitations[field].add(obs.id);
        continue;
      }

      // Scalar candidate
      if (!scalarCandidates[field]) scalarCandidates[field] = [];
      scalarCandidates[field].push({
        // Weighted-candidate shape expected by resolveScalar:
        value,
        source: obs.source,
        severity: obs.severity,
        observedAt: obs.observedAt,
        parsed: obs.parsed,
        // Carry obsId so we can cite the winner.
        __obsId: obs.id,
      });
    }
  }

  // Resolve scalar winners
  for (const [field, candidates] of Object.entries(scalarCandidates)) {
    const winner = resolveScalar(candidates, now);
    if (winner == null) continue;
    ctx[field] = winner.value;
    if (winner.__obsId) {
      citations[field] = [winner.__obsId];
    }
  }

  // Hydrate array fields onto ctx + citations
  for (const [field, set] of Object.entries(arrayUnions)) {
    ctx[field] = Array.from(set);
    citations[field] = Array.from(arrayCitations[field] || []);
  }

  return {
    ctx,
    keywords: Array.from(keywords),
    frankoOverrides: Array.from(frankoOverrides),
    sources,
    _citations: citations,
  };
}

/**
 * getRelevantObservations — pure filter/sort helper over an Observation[].
 *
 * Returns a fresh array sorted by observedAt DESC. Never mutates input.
 *
 * @param {import('../observation-schema.js').Observation[]} observations
 * @param {Object} [opts]
 * @param {string}   [opts.plantId]
 * @param {string|number|Date} [opts.since]     ISO / ms / '14d' / '24h'
 * @param {string[]} [opts.domains]             intersection (rule fires if obs has ANY of these)
 * @param {number}   [opts.limit]
 * @param {string}   [opts.minSeverity]         'info'|'watch'|'alert'
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function getRelevantObservations(observations, opts = {}) {
  if (!Array.isArray(observations)) return [];
  let out = observations.slice();

  if (opts.plantId) {
    out = out.filter(o => o && o.plantId === opts.plantId);
  }

  if (opts.since != null) {
    const sinceMs = normalizeSince(opts.since);
    if (!Number.isNaN(sinceMs)) {
      out = out.filter(o => {
        const ms = toMs(o && o.observedAt);
        return !Number.isNaN(ms) && ms >= sinceMs;
      });
    }
  }

  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
    const wanted = new Set(opts.domains);
    out = out.filter(o => Array.isArray(o && o.domains) && o.domains.some(d => wanted.has(d)));
  }

  if (opts.minSeverity) {
    const minRank = rankSeverity(opts.minSeverity);
    out = out.filter(o => rankSeverity(o && o.severity) >= minRank);
  }

  // Sort DESC by observedAt
  out.sort((a, b) => toMs(b && b.observedAt) - toMs(a && a.observedAt));

  if (typeof opts.limit === 'number' && opts.limit >= 0) {
    out = out.slice(0, opts.limit);
  }

  return out;
}

/**
 * findActionsTakenSince — returns observations representing a matching
 * user action taken within the last `sinceHours`.
 *
 * Matching strategy:
 *   1. Look at `obs.parsed.actionsTaken` (array of {type,…}) — match when
 *      any entry's `type` equals `taskType`.
 *   2. Fall back to keyword-level match on `obs.parsed.keywords` (rule ids
 *      like `wizard-medium-hand-water`) OR a rawText regex match via
 *      `ACTION_TAKEN_PATTERNS[taskType]`.
 *
 * GUARD: observations with `source === 'profile'` are always excluded —
 * wizard notes describe the grow setup, not a moment-in-time action.
 *
 * @param {import('../observation-schema.js').Observation[]} observations
 * @param {string} taskType    e.g. 'water', 'feed', 'flush', 'ipm', 'defoliate', 'top'
 * @param {number} sinceHours
 * @param {number|Date|string} [now=Date.now()]
 * @returns {import('../observation-schema.js').Observation[]}
 */
export function findActionsTakenSince(observations, taskType, sinceHours, now = Date.now()) {
  if (!Array.isArray(observations) || !taskType) return [];
  const nowMs = toMs(now);
  if (Number.isNaN(nowMs)) return [];
  const cutoffMs = nowMs - (Number(sinceHours) || 0) * 3_600_000;
  const pattern = ACTION_TAKEN_PATTERNS[taskType];

  const out = [];
  for (const obs of observations) {
    if (!obs) continue;
    if (obs.source === 'profile') continue; // GUARD: preferences, not events

    const obsMs = toMs(obs.observedAt);
    if (Number.isNaN(obsMs) || obsMs < cutoffMs) continue;

    let match = false;

    const parsed = obs.parsed;
    if (parsed && Array.isArray(parsed.actionsTaken)) {
      for (const a of parsed.actionsTaken) {
        if (a && a.type === taskType) { match = true; break; }
      }
    }

    if (!match && parsed && Array.isArray(parsed.keywords)) {
      // Keyword ids shaped like `<prefix>-<taskType>-<...>` indicate the action.
      // We match lenient: any keyword whose id contains the taskType token.
      const needle = String(taskType).toLowerCase();
      for (const k of parsed.keywords) {
        if (typeof k === 'string' && k.toLowerCase().includes(needle)) { match = true; break; }
      }
    }

    if (!match && pattern && typeof obs.rawText === 'string') {
      if (pattern.test(obs.rawText)) match = true;
    }

    if (match) out.push(obs);
  }

  // Sort DESC by observedAt
  out.sort((a, b) => toMs(b && b.observedAt) - toMs(a && a.observedAt));
  return out;
}
