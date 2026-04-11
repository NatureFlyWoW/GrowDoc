// GrowDoc Companion — Note Contextualizer: weighting & resolver (section-04)
//
// Pure functions that decide which candidate wins when multiple observations
// carry a value for the same scalar field. No store access. No side effects.
//
// ── Algorithm (4-step severity-first with half-life decay) ─────────
//
//   Step 1 — Franco-override candidates always win.
//            If any candidate has a non-empty `frankoOverrides` list, the
//            freshest such candidate wins outright (decay ignored).
//
//   Step 2 — Partition the rest by display severity into
//            { alert, watch, info }.
//
//   Step 3 — Pick the top non-empty severity group (severity-first).
//
//   Step 4 — Within that group, rank by half-life decay:
//              weight = 0.5 ^ (ageHours / HALF_LIFE[severity])
//
//   Synthetic non-note candidates carry explicit `weight` (log-fresh 0.85,
//   sensor-fresh 0.80, profile-default 0.20) and are only consulted if the
//   note groups are empty.
//
// A non-Franco note at ANY severity wins over structured / sensor / profile
// defaults because the note groups are ranked before the synthetic group.

import { FRANCO_OVERRIDE_RULE_IDS } from './rules-keywords.js';

/** Half-life (hours) per display severity. */
export const HALF_LIFE = Object.freeze({ alert: 24, watch: 48, info: 168 });

/** Default half-life for non-note callers that just want decay math. */
export const HALF_LIFE_HOURS = 72;

const SEVERITY_ORDER = ['alert', 'watch', 'info'];

function toMs(v) {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? NaN : parsed;
}

function ageHours(observedAt, now) {
  const obsMs = toMs(observedAt);
  const nowMs = toMs(now);
  if (Number.isNaN(obsMs) || Number.isNaN(nowMs)) return 0;
  return Math.max(0, (nowMs - obsMs) / 3_600_000);
}

function hasFrankoOverride(candidate) {
  const fo = candidate && candidate.parsed && candidate.parsed.frankoOverrides;
  if (Array.isArray(fo) && fo.length > 0) return true;
  // Allow synthetic inputs to flag themselves explicitly.
  if (Array.isArray(candidate && candidate.frankoOverrides) && candidate.frankoOverrides.length > 0) return true;
  return false;
}

function normalizeSeverity(sev) {
  if (sev === 'alert' || sev === 'watch' || sev === 'info') return sev;
  return 'info';
}

function candidateSource(c) {
  return (c && c.source) || 'unknown';
}

/**
 * computeWeight — decay score for a single candidate.
 *
 * Notes (source in {log, task, plant, stage-transition, cure, plant-doctor,
 * override, wizard, profile}) use severity-tiered half-life decay.
 *
 * Synthetic {source:'sensor'|'structured'|'profile-default', weight:n} are
 * respected verbatim if an explicit `weight` is provided.
 *
 * @param {Object} obs         Observation or synthetic candidate.
 * @param {number|Date|string} [now=Date.now()]
 * @returns {number}           Weight in [0, ~2.5].
 */
export function computeWeight(obs, now = Date.now()) {
  if (!obs) return 0;
  if (typeof obs.weight === 'number' && Number.isFinite(obs.weight)) {
    return obs.weight;
  }
  const severity = normalizeSeverity(obs.severity);
  const hl = HALF_LIFE[severity] || HALF_LIFE.info;
  const age = ageHours(obs.observedAt, now);
  return Math.pow(0.5, age / hl);
}

/**
 * resolveScalar — pick the winning candidate for a scalar field.
 *
 * Accepts Observations or synthetic `{source, severity, observedAt, value}`
 * shapes. Returns the winning candidate object (not its `.value`) so the
 * caller can extract whichever field it wants and keep a citation trail.
 *
 * @param {Array<Object>} candidates
 * @param {number|Date|string} [now=Date.now()]
 * @returns {Object|null}
 */
export function resolveScalar(candidates, now = Date.now()) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  // Step 1 — Franco-override candidates
  const franco = candidates.filter(hasFrankoOverride);
  if (franco.length > 0) {
    return [...franco].sort((a, b) => toMs(b.observedAt) - toMs(a.observedAt))[0];
  }

  // Step 2 — Partition by severity. Non-note synthetic candidates (no
  // observedAt OR explicit {source:'sensor'|'structured'|'profile-default'})
  // go into a side bucket consulted only if all note groups are empty.
  const groups = { alert: [], watch: [], info: [] };
  const synthetic = [];
  for (const c of candidates) {
    if (!c) continue;
    const src = candidateSource(c);
    if (src === 'sensor' || src === 'structured' || src === 'profile-default') {
      synthetic.push(c);
      continue;
    }
    const sev = normalizeSeverity(c.severity);
    groups[sev].push(c);
  }

  // Step 3 — pick top non-empty severity group
  for (const sev of SEVERITY_ORDER) {
    const grp = groups[sev];
    if (grp.length === 0) continue;
    // Step 4 — within group, rank by weight (stable by observedAt desc on ties)
    const ranked = [...grp].sort((a, b) => {
      const wa = computeWeight(a, now);
      const wb = computeWeight(b, now);
      if (wb !== wa) return wb - wa;
      return toMs(b.observedAt) - toMs(a.observedAt);
    });
    return ranked[0];
  }

  // No note groups — fall back to synthetic
  if (synthetic.length > 0) {
    const ranked = [...synthetic].sort((a, b) => computeWeight(b, now) - computeWeight(a, now));
    return ranked[0];
  }

  return null;
}

// Re-export for tests that want to assert the franco set is wired up.
export { FRANCO_OVERRIDE_RULE_IDS };
