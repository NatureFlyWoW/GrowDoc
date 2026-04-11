// GrowDoc Companion — Edge-Case Engine
//
// Active-edge-case computation layer. Sits above edge-case-knowledge.js and
// advisor-microcopy.js to produce ready-to-render warning objects for the
// Timeline panel, Plant Doctor action plan, and task engine.
//
// Consumer contract:
//   getActiveEdgeCases({ plant, grow, observations, nowMs }) -> EdgeCase[]
//   getBlockedActions(opts)       -> Set<string>
//   getRecommendedActions(opts)   -> Array<Object>
//   getActiveWarnings(opts)       -> Array<Object>
//
// All functions are null-safe and return empty collections on bad input.

import { EDGE_CASES, findEdgeCases } from './edge-case-knowledge.js';
import { ADVISOR_MICROCOPY } from './advisor-microcopy.js';

import { EDGE_CASES_SUPPLEMENTAL } from './edge-case-knowledge-supplemental.js';

// ── Constants ────────────────────────────────────────────────────────

/** How far back (in ms) to walk logs for recent-event detection. */
const DEFAULT_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Keyword ids that indicate a recent event when found in observation
 * keywords or action-taken entries. The engine collects these from
 * parsed observations and from the plant.diagnoses array.
 *
 * This list covers every id referenced by EDGE_CASES triggers plus the
 * four new PROPOSED_NEW_KEYWORDS now promoted to real rules.
 */
const EVENT_PREFIX_PATTERNS = [
  /^event-/,
  /^env-/,
  /^treatment-/,
  /^watering-/,
  /^action-taken:/,
  /^dome-on$/,
];

/**
 * Mapping from plant-doctor diagnosis ids to the event keyword id used in
 * edge-case triggers. Extends auto-detection from parsed notes to the
 * diagnoses array so guardrails fire even when the grower did not write a
 * note.
 *
 * @type {ReadonlyMap<string, string>}
 */
const DIAGNOSIS_TO_EVENT = new Map([
  ['bud-rot',     'event-bud-rot'],
  ['botrytis',    'event-bud-rot'],
  ['hermie',      'event-hermie'],
  ['hermaphrodite', 'event-hermie'],
  ['nanners',     'event-hermie'],
]);

// ── Internal helpers ─────────────────────────────────────────────────

/**
 * Return true when keyword id looks like a trackable recent event.
 * @param {string} id
 * @returns {boolean}
 */
function isEventKeyword(id) {
  if (typeof id !== 'string') return false;
  for (const pattern of EVENT_PREFIX_PATTERNS) {
    if (pattern.test(id)) return true;
  }
  return false;
}

/**
 * Collect recent-event keyword ids from pre-parsed observations.
 *
 * @param {Array<import('./note-contextualizer/index.js').Observation>} observations
 * @param {string} plantId
 * @param {number} nowMs
 * @returns {Set<string>}
 */
function collectEventsFromObservations(observations, plantId, nowMs) {
  const events = new Set();
  if (!Array.isArray(observations)) return events;

  for (const obs of observations) {
    if (!obs) continue;
    // Filter to this plant's observations only (grow-wide obs still relevant
    // if plantId is null on the obs, e.g. cure-tracker entries).
    if (plantId && obs.plantId && obs.plantId !== plantId) continue;

    const ageMs = nowMs - (Date.parse(obs.observedAt) || 0);
    if (ageMs > DEFAULT_LOOKBACK_MS) continue;

    const parsed = obs.parsed;
    if (!parsed) continue;

    // keywords array
    if (Array.isArray(parsed.keywords)) {
      for (const id of parsed.keywords) {
        if (isEventKeyword(id)) events.add(id);
      }
    }

    // actionsTaken array — entries shaped { type, value }
    if (Array.isArray(parsed.actionsTaken)) {
      for (const at of parsed.actionsTaken) {
        if (at && at.type && isEventKeyword(at.type)) events.add(at.type);
        if (at && at.value && typeof at.value === 'string' && isEventKeyword(at.value)) {
          events.add(at.value);
        }
      }
    }

    // ctx.recentEvent / ctx.envEvent (written by applyLegacyRule)
    if (parsed.ctx) {
      if (parsed.ctx.recentEvent) {
        // Value stored without prefix (e.g. 'transplant') — prefix it.
        events.add(`event-${parsed.ctx.recentEvent}`);
      }
      if (parsed.ctx.envEvent) {
        events.add(`env-${parsed.ctx.envEvent}`);
      }
    }
  }

  return events;
}

/**
 * Walk plant.logs directly (fallback when no pre-parsed observations).
 * Scans rawText heuristically for the event keyword patterns that
 * PROPOSED_NEW_KEYWORDS and EDGE_CASES triggers rely on.
 *
 * @param {Object} plant
 * @param {number} nowMs
 * @returns {Set<string>}
 */
function collectEventsFromLogs(plant, nowMs) {
  const events = new Set();
  const logs = Array.isArray(plant.logs) ? plant.logs : [];

  // Regex bank for the keyword ids referenced by EDGE_CASES triggers.
  // Key = event id, value = regex. Aligned with PROPOSED_NEW_KEYWORDS.
  const EVENT_REGEXES = new Map([
    ['event-transplant',  /\b(after\s+transplant(ing)?|just\s+transplanted|recently\s+transplanted|transplanted\s+already|already\s+transplanted)\b/i],
    ['event-topping',     /\b(after\s+topping|just\s+topped|recently\s+topped)\b/i],
    ['event-defoliation', /\b(after\s+defoliation|defoliated|lollipop(ped)?)\b/i],
    ['event-flip',        /\b(after\s+(the\s+)?flip|switched\s+to\s+(12\/12|flower)|flipped)\b/i],
    ['event-hermie',      /\b(hermie|herm(ed|ing)?|nanners?|bananas?|male\s+flowers?|pollen\s+sacs?)\b/i],
    ['event-bud-rot',     /\b(bud\s*rot|botrytis|grey\s*mould|grey\s*mold|brown\s+bud)\b/i],
    ['event-clone-cut',   /\b(took\s+(a\s+)?cut(ting)?|cloned|rooting|in\s+the\s+dome)\b/i],
    ['env-heatwave',      /\bheat\s+wave\b/i],
    ['env-ac-failed',     /\b(AC\s+(broke|failed|died)|air\s+conditioning\s+(broke|failed))\b/i],
    ['env-light-leak',    /\blight\s+leak\b/i],
    ['env-timer-issue',   /\b(timer\s+(issue|fail(ed)?|problem)|timer\s+went\s+off)\b/i],
    ['env-cold-snap',     /\b(cold\s+snap|temperature\s+dropped|freeze)\b/i],
    ['env-power-outage',  /\b(power\s+outage|power\s+cut|power\s+failure)\b/i],
    ['treatment-flush',   /\b(flush(ed|ing)?)\b/i],
    ['treatment-increased-nutes', /\b(increased|bumped\s+up|raised)\s+(nutes|nutrients|feed)\b/i],
    ['treatment-decreased-nutes', /\b(decreased|lowered|cut\s+back|reduced)\s+(nutes|nutrients|feed)\b/i],
    ['watering-overwatered',  /\boverwater(ed|ing)?\b/i],
    ['watering-underwatered', /\bunderwater(ed|ing)?\b/i],
    ['dome-on', /\bhumidity\s+dome|dome\s+(on|covered)\b/i],
  ]);

  for (const log of logs) {
    if (!log) continue;
    const logTs = Date.parse(log.timestamp) || 0;
    if (nowMs - logTs > DEFAULT_LOOKBACK_MS) continue;

    const notes = log.details && log.details.notes;
    if (typeof notes !== 'string' || notes.trim() === '') continue;

    for (const [eventId, regex] of EVENT_REGEXES) {
      if (regex.test(notes)) events.add(eventId);
    }
  }

  return events;
}

/**
 * Walk plant.diagnoses for plant-doctor hits that map to event ids.
 *
 * @param {Object} plant
 * @param {number} nowMs
 * @returns {Set<string>}
 */
function collectEventsFromDiagnoses(plant, nowMs) {
  const events = new Set();
  const diagnoses = Array.isArray(plant.diagnoses) ? plant.diagnoses : [];

  for (const diag of diagnoses) {
    if (!diag) continue;
    const diagTs = Date.parse(diag.timestamp || diag.createdAt) || 0;
    if (nowMs - diagTs > DEFAULT_LOOKBACK_MS) continue;

    const conditionId = diag.conditionId || diag.id || '';
    const eventId = DIAGNOSIS_TO_EVENT.get(conditionId);
    if (eventId) events.add(eventId);
  }

  return events;
}

/**
 * Apply withinHours filter: given a set of raw event ids, retain only
 * those that appear in at least one log/obs within the edge case's time window.
 *
 * This is a best-effort pass — when timestamp data is unavailable the event
 * is retained (fail-open) so the guardrail still fires.
 *
 * @param {Set<string>} events          raw event ids (not time-filtered yet)
 * @param {Array<Object>} logs          plant.logs
 * @param {Array<Object>} observations  pre-parsed observations (may be [])
 * @param {number} withinHours          edge case trigger window
 * @param {number} nowMs
 * @returns {Set<string>}
 */
function filterEventsByWindow(events, logs, observations, withinHours, nowMs) {
  if (!withinHours || withinHours <= 0) return events;
  const windowMs = withinHours * 60 * 60 * 1000;
  const filtered = new Set();

  for (const evId of events) {
    // Check observations first (richer data).
    let found = false;
    if (Array.isArray(observations)) {
      for (const obs of observations) {
        if (!obs) continue;
        const ageMs = nowMs - (Date.parse(obs.observedAt) || 0);
        if (ageMs > windowMs) continue;
        const kws = obs.parsed && Array.isArray(obs.parsed.keywords) ? obs.parsed.keywords : [];
        if (kws.includes(evId)) { found = true; break; }
        // Also check ctx values.
        if (obs.parsed && obs.parsed.ctx) {
          const ctx = obs.parsed.ctx;
          if (`event-${ctx.recentEvent}` === evId) { found = true; break; }
          if (`env-${ctx.envEvent}` === evId) { found = true; break; }
        }
      }
    }
    if (!found && Array.isArray(logs)) {
      for (const log of logs) {
        if (!log) continue;
        const ageMs = nowMs - (Date.parse(log.timestamp) || 0);
        if (ageMs > windowMs) continue;
        const notes = log.details && log.details.notes;
        if (typeof notes === 'string' && notes.includes(evId.replace(/^event-/, ''))) {
          found = true; break;
        }
      }
    }
    // Fail-open: if we could not find a timestamp, keep the event.
    if (found || (!found && events.has(evId))) {
      filtered.add(evId);
    }
  }

  return filtered;
}

/**
 * Derive plant-level flags from the plant object for edge-case matching.
 *
 * Returns strings matching the format used in EDGE_CASES trigger.plantFlags:
 *   'plantType:autoflower', 'previousProblems:spider-mites', etc.
 *
 * @param {Object} plant
 * @param {Array<Object>} observations
 * @returns {Set<string>}
 */
function derivePlantFlags(plant, observations) {
  const flags = new Set();
  if (!plant) return flags;

  // Explicit flags array on the plant record.
  if (Array.isArray(plant.flags)) {
    for (const f of plant.flags) {
      if (f && typeof f === 'string') flags.add(f);
    }
  }

  // Plant type — from strainClass, strainId hints, or parsed notes.
  const strainClass = (plant.strainClass || '').toLowerCase();
  if (strainClass === 'autoflower' || strainClass === 'auto') {
    flags.add('plantType:autoflower');
  } else if (strainClass === 'clone') {
    flags.add('plantType:clone');
  } else if (strainClass === 'photoperiod' || strainClass === 'photo') {
    flags.add('plantType:photoperiod');
  }

  // plantType from the plant record directly.
  if (plant.plantType) {
    flags.add(`plantType:${plant.plantType}`);
  }

  // previousProblems — array of strings on the plant record.
  if (Array.isArray(plant.previousProblems)) {
    for (const prob of plant.previousProblems) {
      if (prob && typeof prob === 'string') flags.add(`previousProblems:${prob}`);
    }
  }

  // Harvest from parsed observations (plantType extracted from note text).
  if (Array.isArray(observations)) {
    for (const obs of observations) {
      if (!obs || !obs.parsed || !obs.parsed.ctx) continue;
      const ctx = obs.parsed.ctx;
      if (ctx.plantType) flags.add(`plantType:${ctx.plantType}`);
      if (Array.isArray(ctx.previousProblems)) {
        for (const prob of ctx.previousProblems) {
          if (prob) flags.add(`previousProblems:${prob}`);
        }
      }
    }
  }

  return flags;
}

/**
 * Merge and deduplicate edge cases from primary and supplemental arrays.
 * Primary entries win on id collision.
 *
 * @param {Array} primary
 * @param {Array} supplemental
 * @returns {Array}
 */
function mergeEdgeCases(primary, supplemental) {
  if (!Array.isArray(supplemental) || supplemental.length === 0) return primary;
  const seen = new Set(primary.map(ec => ec.id));
  const merged = primary.slice();
  for (const ec of supplemental) {
    if (ec && !seen.has(ec.id)) {
      merged.push(ec);
      seen.add(ec.id);
    }
  }
  return merged;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Return every active edge case for this plant + grow snapshot.
 *
 * @param {Object} opts
 * @param {Object}  opts.plant         plant from store (id, stage, stageStartDate, strainClass, logs, diagnoses, flags)
 * @param {Object}  opts.grow          full grow state from store
 * @param {Array}   [opts.observations] precomputed observations from note contextualizer
 * @param {number}  [opts.nowMs]       epoch ms, defaults to Date.now() (injectable for tests)
 * @returns {Array<import('./edge-case-knowledge.js').EdgeCase>}
 */
export function getActiveEdgeCases({ plant, grow, observations, nowMs } = {}) {
  if (!plant) return [];

  const now = (typeof nowMs === 'number' && !Number.isNaN(nowMs)) ? nowMs : Date.now();
  const logs = Array.isArray(plant.logs) ? plant.logs : [];
  const obs  = Array.isArray(observations) ? observations : [];

  // 1. Collect recent-event ids from the richer source (parsed observations)
  //    then supplement with raw log scan and diagnoses.
  let events = collectEventsFromObservations(obs, plant.id, now);
  const logEvents = collectEventsFromLogs(plant, now);
  const diagEvents = collectEventsFromDiagnoses(plant, now);
  for (const ev of logEvents) events.add(ev);
  for (const ev of diagEvents) events.add(ev);

  // 2. Derive plant flags.
  const plantFlagsSet = derivePlantFlags(plant, obs);
  const plantFlags = Array.from(plantFlagsSet);

  // 3. Normalise stage id.
  const stage = typeof plant.stage === 'string' ? plant.stage.trim().toLowerCase() : '';
  if (!stage) return [];

  // 4. Expand events set to include 'NEW-KEYWORD:*' prefixed variants so that
  //    EDGE_CASES triggers still using the proposal prefix will match until the
  //    knowledge-base is updated to drop those prefixes.
  for (const ev of Array.from(events)) {
    events.add(`NEW-KEYWORD:${ev}`);
  }

  // 5. Run edge-case matching on both primary and supplemental sets.
  //    withinHours pre-filtering: for each edge case we check its window
  //    against the events we collected. We pass all events through
  //    findEdgeCases (which does keyword matching) and then apply the time
  //    window filter post-match so the engine never silently drops
  //    edge cases whose events lack timestamps.
  const primaryMatches = findEdgeCases({
    stage,
    recentEvents: Array.from(events),
    plantFlags,
  });

  // Supplemental matching (stub until file is created).
  let suppMatches = [];
  if (Array.isArray(EDGE_CASES_SUPPLEMENTAL) && EDGE_CASES_SUPPLEMENTAL.length > 0) {
    // Replicate findEdgeCases logic for supplemental entries.
    suppMatches = EDGE_CASES_SUPPLEMENTAL.filter(ec => {
      if (!ec || !ec.trigger) return false;
      const t = ec.trigger;
      if (!Array.isArray(t.stage) || !t.stage.includes(stage)) return false;
      if (Array.isArray(t.recentEvents) && t.recentEvents.length > 0) {
        const hit = t.recentEvents.some(ev => events.has(ev));
        if (!hit) return false;
      }
      if (Array.isArray(t.plantFlags) && t.plantFlags.length > 0) {
        const allPresent = t.plantFlags.every(f => plantFlagsSet.has(f));
        if (!allPresent) return false;
      }
      return true;
    });
  }

  const allMatches = mergeEdgeCases(primaryMatches, suppMatches);

  // 5. Apply withinHours post-filter. For each match, check whether any of
  //    its required trigger events appear within the time window. Edge cases
  //    with empty recentEvents[] (flag-only triggers) are never time-filtered.
  const timeFiltered = allMatches.filter(ec => {
    const t = ec.trigger;
    if (!Array.isArray(t.recentEvents) || t.recentEvents.length === 0) return true;
    if (!t.withinHours || t.withinHours <= 0) return true;
    const windowMs = t.withinHours * 60 * 60 * 1000;
    const windowEvents = filterEventsByWindow(
      new Set(t.recentEvents.filter(ev => events.has(ev))),
      logs,
      obs,
      t.withinHours,
      now,
    );
    return windowEvents.size > 0 || (now - (Date.parse(plant.stageStartDate) || 0)) < windowMs;
  });

  return timeFiltered;
}

/**
 * Return the set of action ids that should be suppressed for this plant.
 * Used by the task engine and plant doctor to filter their outputs.
 *
 * @param {Object} opts - same as getActiveEdgeCases
 * @returns {Set<string>}
 */
export function getBlockedActions(opts) {
  const active = getActiveEdgeCases(opts);
  const blocked = new Set();
  for (const ec of active) {
    if (Array.isArray(ec.blockActions)) {
      for (const action of ec.blockActions) {
        if (action) blocked.add(action);
      }
    }
  }
  return blocked;
}

/**
 * Return the list of recommended actions from active edge cases.
 * Each item: { id, severity, title, body, action, edgeCaseId }
 *
 * @param {Object} opts - same as getActiveEdgeCases
 * @returns {Array<{id:string, severity:string, title:string, body:string, action:string, edgeCaseId:string}>}
 */
export function getRecommendedActions(opts) {
  const active = getActiveEdgeCases(opts);
  const out = [];
  const seen = new Set();

  for (const ec of active) {
    if (!Array.isArray(ec.recommendActions)) continue;
    for (const actionId of ec.recommendActions) {
      if (!actionId || seen.has(actionId)) continue;
      seen.add(actionId);
      const microcopy = ADVISOR_MICROCOPY[actionId] || null;
      out.push({
        id: actionId,
        severity: ec.severity,
        title: microcopy ? microcopy.title : actionId,
        body: microcopy ? microcopy.body : ec.correctAction,
        action: microcopy ? microcopy.action : '',
        edgeCaseId: ec.id,
      });
    }
  }

  return out;
}

/**
 * Pretty-formatted warning objects for UI surfaces (Timeline panel,
 * plant doctor action plan, task engine).
 *
 * Microcopy lookup: when ADVISOR_MICROCOPY has an entry whose key matches
 * the edge case id (kebab-case, same id), its title/body/action are used.
 * Otherwise synthesised from the edge case's correctAction and generalAdvice.
 *
 * @param {Object} opts - same as getActiveEdgeCases
 * @returns {Array<{id:string, severity:string, title:string, body:string, action:string, edgeCaseId:string, blockedActions:string[], recommendedActions:string[]}>}
 */
export function getActiveWarnings(opts) {
  const active = getActiveEdgeCases(opts);
  const out = [];

  for (const ec of active) {
    const microcopy = ADVISOR_MICROCOPY[ec.id] || null;

    let title, body, action;
    if (microcopy) {
      title  = microcopy.title;
      body   = microcopy.body;
      action = microcopy.action;
    } else {
      // Synthesise from the edge case data.
      title  = _synthesiseTitle(ec);
      body   = ec.correctAction || ec.generalAdvice || '';
      action = ec.recommendActions && ec.recommendActions.length > 0
        ? ec.recommendActions[0]
        : '';
    }

    out.push({
      id:                 ec.id,
      severity:           ec.severity,
      title,
      body,
      action,
      edgeCaseId:         ec.id,
      blockedActions:     Array.isArray(ec.blockActions)    ? ec.blockActions.slice()    : [],
      recommendedActions: Array.isArray(ec.recommendActions) ? ec.recommendActions.slice() : [],
    });
  }

  return out;
}

/**
 * Synthesise a short title string from an EdgeCase when no microcopy entry
 * exists. Converts the kebab-case id to Title Case words, truncated to 40
 * characters.
 *
 * @param {import('./edge-case-knowledge.js').EdgeCase} ec
 * @returns {string}
 */
function _synthesiseTitle(ec) {
  const raw = ec.id
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return raw.length <= 40 ? raw : raw.slice(0, 37) + '...';
}

// ── Self-test suite ───────────────────────────────────────────────────
//
// Keeps assertions under 10 to respect the quality bar.
// Run with: node -e "import('./js/data/edge-case-engine.js').then(m=>m.runTests())"

/**
 * Minimal inline assertion helper.
 *
 * @param {boolean} condition
 * @param {string}  message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

/**
 * Run the built-in smoke tests. Returns true on full pass, throws on failure.
 *
 * Tests:
 *   1. Post-transplant plant in early-veg returns 'fresh-transplant-early-veg-no-feed'.
 *   2. Autoflower plant returns auto-specific rules when plantFlags includes
 *      'plantType:autoflower', and does NOT return them without that flag.
 *   3. getBlockedActions returns a non-empty Set.
 *   4. getActiveWarnings returns an array.
 *   5. Plant with no logs / empty stage returns empty array.
 *   6. Event-bud-rot in mid-flower activates 'bud-rot-defol-contraindicated'.
 *   7. Event-hermie in early-flower activates 'hermie-nanners-no-stress-advice'.
 *
 * @returns {boolean}
 */
export function runTests() {
  const NOW = 1_700_000_000_000; // stable anchor epoch for determinism

  // ── Test 1: post-transplant early-veg returns the no-feed guardrail ──

  const transplantObs = [{
    id: 'obs-1',
    observedAt: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
    plantId: 'p1',
    source: 'log',
    rawText: 'just transplanted into final pot',
    parsed: {
      keywords: ['event-transplant'],
      actionsTaken: [],
      ctx: { recentEvent: 'transplant', envEvent: null },
    },
  }];

  const transplantPlant = {
    id: 'p1',
    stage: 'early-veg',
    stageStartDate: new Date(NOW - 48 * 60 * 60 * 1000).toISOString(),
    logs: [],
    diagnoses: [],
    flags: [],
  };

  const cases1 = getActiveEdgeCases({ plant: transplantPlant, grow: {}, observations: transplantObs, nowMs: NOW });
  const ids1 = cases1.map(ec => ec.id);
  assert(
    ids1.includes('fresh-transplant-early-veg-no-feed'),
    'Test 1: post-transplant early-veg returns fresh-transplant-early-veg-no-feed',
  );

  // ── Test 2a: autoflower returns auto-specific rules when flag present ──

  const autoPlant = {
    id: 'p2',
    stage: 'early-veg',
    stageStartDate: new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString(),
    plantType: 'autoflower',
    logs: [],
    diagnoses: [],
    flags: ['plantType:autoflower'],
  };

  const cases2a = getActiveEdgeCases({ plant: autoPlant, grow: {}, observations: [], nowMs: NOW });
  const ids2a = cases2a.map(ec => ec.id);
  assert(
    ids2a.some(id => id.startsWith('autoflower-')),
    'Test 2a: autoflower plant returns autoflower-* rules with plantType:autoflower flag',
  );

  // ── Test 2b: non-autoflower plant does NOT return auto-specific rules ──

  const photoPlant = {
    id: 'p3',
    stage: 'early-veg',
    stageStartDate: new Date(NOW - 10 * 24 * 60 * 60 * 1000).toISOString(),
    logs: [],
    diagnoses: [],
    flags: [],
  };

  const cases2b = getActiveEdgeCases({ plant: photoPlant, grow: {}, observations: [], nowMs: NOW });
  const ids2b = cases2b.map(ec => ec.id);
  assert(
    !ids2b.some(id => id.startsWith('autoflower-')),
    'Test 2b: non-autoflower plant does not return autoflower-* rules',
  );

  // ── Test 3: getBlockedActions returns a non-empty Set ──

  const blocked = getBlockedActions({ plant: transplantPlant, grow: {}, observations: transplantObs, nowMs: NOW });
  assert(blocked instanceof Set, 'Test 3: getBlockedActions returns a Set');
  assert(blocked.size > 0, 'Test 3: getBlockedActions Set is non-empty for transplant plant');

  // ── Test 4: getActiveWarnings returns an array ──

  const warnings = getActiveWarnings({ plant: transplantPlant, grow: {}, observations: transplantObs, nowMs: NOW });
  assert(Array.isArray(warnings), 'Test 4: getActiveWarnings returns an array');

  // ── Test 5: plant with no logs, empty stage → empty array ──

  const emptyPlant = { id: 'p4', stage: '', logs: [], diagnoses: [], flags: [] };
  const cases5 = getActiveEdgeCases({ plant: emptyPlant, grow: {}, observations: [], nowMs: NOW });
  assert(Array.isArray(cases5) && cases5.length === 0, 'Test 5: empty stage returns empty array');

  // ── Test 6: event-bud-rot in mid-flower activates bud-rot guardrail ──

  const budRotObs = [{
    id: 'obs-br',
    observedAt: new Date(NOW - 12 * 60 * 60 * 1000).toISOString(),
    plantId: 'p5',
    source: 'log',
    rawText: 'spotted bud rot on main cola',
    parsed: {
      keywords: ['event-bud-rot'],
      actionsTaken: [],
      ctx: { recentEvent: 'bud-rot', envEvent: null },
    },
  }];

  const budRotPlant = {
    id: 'p5',
    stage: 'mid-flower',
    stageStartDate: new Date(NOW - 28 * 24 * 60 * 60 * 1000).toISOString(),
    logs: [],
    diagnoses: [],
    flags: [],
  };

  const cases6 = getActiveEdgeCases({ plant: budRotPlant, grow: {}, observations: budRotObs, nowMs: NOW });
  const ids6 = cases6.map(ec => ec.id);
  assert(
    ids6.includes('bud-rot-defol-contraindicated'),
    'Test 6: event-bud-rot in mid-flower activates bud-rot-defol-contraindicated',
  );

  // ── Test 7: event-hermie in early-flower activates hermie guardrail ──

  const hermieObs = [{
    id: 'obs-h',
    observedAt: new Date(NOW - 6 * 60 * 60 * 1000).toISOString(),
    plantId: 'p6',
    source: 'log',
    rawText: 'found nanners on two bud sites',
    parsed: {
      keywords: ['event-hermie'],
      actionsTaken: [],
      ctx: { recentEvent: 'hermie', envEvent: null },
    },
  }];

  const hermiePlant = {
    id: 'p6',
    stage: 'early-flower',
    stageStartDate: new Date(NOW - 14 * 24 * 60 * 60 * 1000).toISOString(),
    logs: [],
    diagnoses: [],
    flags: [],
  };

  const cases7 = getActiveEdgeCases({ plant: hermiePlant, grow: {}, observations: hermieObs, nowMs: NOW });
  const ids7 = cases7.map(ec => ec.id);
  assert(
    ids7.includes('hermie-nanners-no-stress-advice'),
    'Test 7: event-hermie in early-flower activates hermie-nanners-no-stress-advice',
  );

  console.log('All edge-case-engine tests passed.');
  return true;
}
