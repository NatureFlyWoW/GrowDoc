// GrowDoc Companion — Task Engine Note Guards (section-07)
//
// Suppression / diagnose-trigger / env-conflict / override helpers that sit
// between the task engine and the Note Contextualizer. All pure functions
// except `overrideSuppression` which writes a log entry to the store.

import { findActionsTakenSince, getObservationIndex } from '../data/note-contextualizer/index.js';
import { generateId } from '../utils.js';

/**
 * Canonical anti-redundancy windows per task type, in hours.
 * Exported so task-card.js can label override buttons with the matching window.
 */
export const TASK_WINDOW_HOURS = {
  water: 12,
  feed: 24,
  flush: 48,
  ipm: 72,
  defoliate: 168,
  top: 336,
};

const WORSENING_KEYWORDS = new Set([
  'worsening',
  'getting-worse',
  'declining',
  'deteriorating',
  'crashing',
  'dying',
]);

/**
 * Anti-redundancy check. Scans parsed observations for action-taken entries
 * inside the window. Uses `findActionsTakenSince` which already excludes
 * `source === 'profile'`.
 *
 * @param {string} taskType
 * @param {import('../data/observation-schema.js').Observation[]} plantObservations
 * @param {number} [now=Date.now()]
 * @returns {{ suppressed: boolean, obsIds: string[], noteRef: (Object|null) }}
 */
export function checkRedundancy(taskType, plantObservations, now = Date.now()) {
  const windowHours = TASK_WINDOW_HOURS[taskType];
  if (!windowHours) {
    return { suppressed: false, obsIds: [], noteRef: null };
  }
  if (!Array.isArray(plantObservations) || plantObservations.length === 0) {
    return { suppressed: false, obsIds: [], noteRef: null };
  }

  // findActionsTakenSince returns matching observation IDs.
  let matches;
  try {
    matches = findActionsTakenSince(plantObservations, taskType, windowHours);
  } catch (_err) {
    return { suppressed: false, obsIds: [], noteRef: null };
  }

  if (!Array.isArray(matches) || matches.length === 0) {
    return { suppressed: false, obsIds: [], noteRef: null };
  }

  // `matches` may be an array of obsIds (strings) OR of observation objects —
  // merge.js tolerates both. Normalize to obs objects so we can build noteRef.
  const idSet = new Set();
  for (const m of matches) {
    if (typeof m === 'string') idSet.add(m);
    else if (m && typeof m === 'object' && m.id) idSet.add(m.id);
  }

  if (idSet.size === 0) return { suppressed: false, obsIds: [], noteRef: null };

  // Pick the most-recent matching observation for the noteRef payload.
  let newest = null;
  for (const obs of plantObservations) {
    if (!obs || !idSet.has(obs.id)) continue;
    if (!newest || Date.parse(obs.observedAt) > Date.parse(newest.observedAt)) {
      newest = obs;
    }
  }

  if (!newest) return { suppressed: false, obsIds: [], noteRef: null };

  return {
    suppressed: true,
    obsIds: Array.from(idSet),
    noteRef: {
      obsId: newest.id,
      rawText: newest.rawText,
      observedAt: newest.observedAt,
      source: newest.source,
    },
  };
}

/**
 * Env/note conflict check. Fires when the user wrote an alert-severity
 * environment note but the sensor snapshot says in-range.
 *
 * @param {{temp:boolean,rh:boolean,vpd:boolean}} envSnapshot in-range booleans
 * @param {import('../data/observation-schema.js').Observation[]} plantObservations
 * @param {number} [now=Date.now()]
 * @returns {{ conflict: boolean, obsId: (string|null) }}
 */
export function checkContradiction(envSnapshot, plantObservations, now = Date.now()) {
  if (!envSnapshot) return { conflict: false, obsId: null };
  if (!Array.isArray(plantObservations) || plantObservations.length === 0) {
    return { conflict: false, obsId: null };
  }

  const allInRange = envSnapshot.temp !== false && envSnapshot.rh !== false && envSnapshot.vpd !== false;
  if (!allInRange) return { conflict: false, obsId: null };

  // Look back 48h for alert-severity environment observations.
  const cutoff = now - 48 * 3_600_000;
  for (const obs of plantObservations) {
    if (!obs) continue;
    if (obs.severity !== 'alert') continue;
    const ms = Date.parse(obs.observedAt);
    if (Number.isNaN(ms) || ms < cutoff) continue;
    const domains = Array.isArray(obs.domains) ? obs.domains : [];
    if (domains.includes('environment')) {
      return { conflict: true, obsId: obs.id };
    }
  }

  return { conflict: false, obsId: null };
}

/**
 * Diagnose-trigger check. Fires if a recent (<=48h) observation has
 * alert severity OR the parsed keywords include a worsening marker.
 *
 * @param {import('../data/observation-schema.js').Observation[]} plantObservations
 * @param {number} [now=Date.now()]
 * @returns {{ trigger: boolean, obsIds: string[] }}
 */
export function inferAlertTrigger(plantObservations, now = Date.now()) {
  if (!Array.isArray(plantObservations) || plantObservations.length === 0) {
    return { trigger: false, obsIds: [] };
  }

  const cutoff = now - 48 * 3_600_000;
  const matchedIds = [];
  for (const obs of plantObservations) {
    if (!obs) continue;
    const ms = Date.parse(obs.observedAt);
    if (Number.isNaN(ms) || ms < cutoff) continue;

    if (obs.severity === 'alert') {
      matchedIds.push(obs.id);
      continue;
    }
    const keywords = obs.parsed && Array.isArray(obs.parsed.keywords) ? obs.parsed.keywords : [];
    for (const kw of keywords) {
      if (typeof kw === 'string' && WORSENING_KEYWORDS.has(kw)) {
        matchedIds.push(obs.id);
        break;
      }
    }
  }

  return { trigger: matchedIds.length > 0, obsIds: matchedIds };
}

/**
 * Public override API. Writes a real log entry on the plant with
 * `type: 'override'`, `details.notes: "Manual override: <taskType>"`,
 * `details.severity: null`, timestamp now. Commits `grow`.
 *
 * The next `generateTasks` pass will re-run `findActionsTakenSince`,
 * which will match the new override log (ACTION_TAKEN_PATTERNS includes
 * override → each task type) and re-block the task for the standard
 * window — this is the intentional cascade described in the spec.
 *
 * @param {Object} store       GrowDoc store instance
 * @param {string} _taskId     retained for API symmetry; not used directly
 * @param {string} plantId
 * @param {string} taskType
 * @returns {string|null}      id of the new log entry, or null on failure
 */
export function overrideSuppression(store, _taskId, plantId, taskType) {
  if (!store || !plantId || !taskType) return null;
  const snap = store.getSnapshot();
  const grow = snap && snap.grow;
  if (!grow || !Array.isArray(grow.plants)) return null;
  const plant = grow.plants.find(p => p.id === plantId);
  if (!plant) return null;
  if (!Array.isArray(plant.logs)) plant.logs = [];

  const logId = generateId();
  const timestamp = new Date().toISOString();
  plant.logs.push({
    id: logId,
    type: 'override',
    timestamp,
    date: timestamp,
    details: {
      notes: `Manual override: ${taskType}`,
      severity: null,
      overrideFor: taskType,
    },
  });

  store.commit('grow', grow);
  return logId;
}

/**
 * Convenience — exposed for tests to inspect index-level errors without
 * reaching into the private contextualizer module.
 */
export function _getRuleErrors() {
  try { return getObservationIndex().ruleErrors || []; } catch { return []; }
}
