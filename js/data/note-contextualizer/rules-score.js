// GrowDoc Companion — Note Contextualizer: Score adjustment rules (section-05)
//
// Authored rules that boost/penalize Plant Doctor condition scores based on
// merged ctx fields parsed from notes. Rules target Companion condition
// taxonomy (human-readable names as they appear in `doctor-data.js`
// `CORE_SCORING`), NOT legacy v3 rule ids.
//
// Each rule has shape:
//   { id, appliesTo, condition: (ctx) => bool, adjustment: number }
//
// `ctx` is the merged scalar map from `mergeNoteContext(observations).ctx`.
// Rule closures MUST be defensive: they may be called with a ctx missing
// any field. `null`/`undefined` checks are mandatory.

import { getObservationIndex } from './index.js';

function _isNum(v) {
  return typeof v === 'number' && !Number.isNaN(v);
}

function _hasTag(arr, tag) {
  return Array.isArray(arr) && arr.includes(tag);
}

function _lc(v) {
  return typeof v === 'string' ? v.toLowerCase() : v;
}

/**
 * Frozen score-adjustment rule set. Ordered by condition for readability;
 * evaluation order does not affect outcome since each rule's `adjustment`
 * is additive.
 *
 * @type {ReadonlyArray<{
 *   id: string,
 *   appliesTo: string,
 *   condition: (ctx: Object) => boolean,
 *   adjustment: number,
 * }>}
 */
export const SCORE_ADJUSTMENTS = Object.freeze([
  // ── pH Imbalance ────────────────────────────────────────────
  {
    id: 'score-ph-lockout-low',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _isNum(ctx.phExtracted) && ctx.phExtracted < 5.5,
    adjustment: 25,
  },
  {
    id: 'score-ph-lockout-high',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _isNum(ctx.phExtracted) && ctx.phExtracted > 7.0,
    adjustment: 25,
  },
  {
    id: 'score-ph-drift-history',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'pH-drift'),
    adjustment: 10,
  },

  // ── Overwatering ────────────────────────────────────────────
  {
    id: 'score-overwater-root-suspect',
    appliesTo: 'Overwatering',
    condition: (ctx) => _lc(ctx.rootHealth) === 'suspect',
    adjustment: 15,
  },
  {
    id: 'score-overwater-root-rotting',
    appliesTo: 'Overwatering',
    condition: (ctx) => _lc(ctx.rootHealth) === 'rotting',
    adjustment: 20,
  },
  {
    id: 'score-overwater-prev-problem',
    appliesTo: 'Overwatering',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'overwater'),
    adjustment: 10,
  },

  // ── Underwatering ───────────────────────────────────────────
  {
    id: 'score-underwater-healthy-roots',
    appliesTo: 'Underwatering',
    condition: (ctx) =>
      _lc(ctx.rootHealth) === 'healthy' &&
      _hasTag(ctx.previousProblems, 'wilting'),
    adjustment: 15,
  },
  {
    id: 'score-underwater-prev-problem',
    appliesTo: 'Underwatering',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'underwater'),
    adjustment: 10,
  },

  // ── Heat Stress ─────────────────────────────────────────────
  {
    id: 'score-heat-stress-mild',
    appliesTo: 'Heat Stress',
    condition: (ctx) =>
      _isNum(ctx.tempExtracted) && ctx.tempExtracted > 28 && ctx.tempExtracted <= 32,
    adjustment: 15,
  },
  {
    id: 'score-heat-stress-severe',
    appliesTo: 'Heat Stress',
    condition: (ctx) => _isNum(ctx.tempExtracted) && ctx.tempExtracted > 32,
    adjustment: 25,
  },
  {
    id: 'score-heat-severity-worsening',
    appliesTo: 'Heat Stress',
    condition: (ctx) =>
      _isNum(ctx.tempExtracted) && ctx.tempExtracted > 28 && _lc(ctx.severity) === 'worsening',
    adjustment: 10,
  },

  // ── Nutrient Burn ───────────────────────────────────────────
  {
    id: 'score-nute-burn-high-ec',
    appliesTo: 'Nutrient Burn',
    condition: (ctx) => _isNum(ctx.ecExtracted) && ctx.ecExtracted > 2.2,
    adjustment: 20,
  },
  {
    id: 'score-nute-burn-prev',
    appliesTo: 'Nutrient Burn',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'nute-burn'),
    adjustment: 10,
  },
  {
    id: 'score-nute-burn-heavy-amendments',
    appliesTo: 'Nutrient Burn',
    condition: (ctx) => Array.isArray(ctx.amendments) && ctx.amendments.length >= 3,
    adjustment: 5,
  },

  // ── Nitrogen Deficiency ─────────────────────────────────────
  {
    id: 'score-ndef-coco-low-ec',
    appliesTo: 'Nitrogen Deficiency',
    condition: (ctx) => _lc(ctx.medium) === 'coco' && _isNum(ctx.ecExtracted) && ctx.ecExtracted < 0.8,
    adjustment: 20,
  },
  {
    id: 'score-ndef-prev',
    appliesTo: 'Nitrogen Deficiency',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'n-deficiency'),
    adjustment: 10,
  },

  // ── Light Burn ──────────────────────────────────────────────
  {
    id: 'score-light-burn-led-worsening',
    appliesTo: 'Light Burn',
    condition: (ctx) =>
      _lc(ctx.lighting) === 'led' &&
      _lc(ctx.severity) === 'worsening' &&
      !(_isNum(ctx.tempExtracted) && ctx.tempExtracted > 28),
    adjustment: 15,
  },
  {
    id: 'score-light-burn-prev',
    appliesTo: 'Light Burn',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'light-burn'),
    adjustment: 10,
  },

  // ── Root Rot ────────────────────────────────────────────────
  {
    id: 'score-root-rot-explicit',
    appliesTo: 'Root Rot',
    condition: (ctx) => _lc(ctx.rootHealth) === 'rotting',
    adjustment: 30,
  },
  {
    id: 'score-root-rot-hydro-warm',
    appliesTo: 'Root Rot',
    condition: (ctx) =>
      _lc(ctx.medium) === 'hydro' && _isNum(ctx.tempExtracted) && ctx.tempExtracted > 24,
    adjustment: 15,
  },
  {
    id: 'score-root-rot-suspect',
    appliesTo: 'Root Rot',
    condition: (ctx) => _lc(ctx.rootHealth) === 'suspect',
    adjustment: 5,
  },

  // ── Calcium Deficiency ──────────────────────────────────────
  {
    id: 'score-cal-def-coco',
    appliesTo: 'Calcium Deficiency',
    condition: (ctx) =>
      _lc(ctx.medium) === 'coco' && _hasTag(ctx.previousProblems, 'ca-deficiency'),
    adjustment: 15,
  },
  {
    id: 'score-cal-def-rh-low',
    appliesTo: 'Calcium Deficiency',
    condition: (ctx) => _isNum(ctx.rhExtracted) && ctx.rhExtracted < 35,
    adjustment: 10,
  },

  // ── Magnesium Deficiency ────────────────────────────────────
  {
    id: 'score-mg-def-prev',
    appliesTo: 'Magnesium Deficiency',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'mg-deficiency'),
    adjustment: 15,
  },
  {
    id: 'score-mg-def-low-ec',
    appliesTo: 'Magnesium Deficiency',
    condition: (ctx) =>
      _lc(ctx.medium) === 'coco' && _isNum(ctx.ecExtracted) && ctx.ecExtracted < 1.0,
    adjustment: 10,
  },

  // ── Potassium Deficiency ────────────────────────────────────
  {
    id: 'score-k-def-prev',
    appliesTo: 'Potassium Deficiency',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'k-deficiency'),
    adjustment: 15,
  },

  // ── Phosphorus Deficiency ───────────────────────────────────
  {
    id: 'score-p-def-cold',
    appliesTo: 'Phosphorus Deficiency',
    condition: (ctx) => _isNum(ctx.tempExtracted) && ctx.tempExtracted < 18,
    adjustment: 10,
  },
  {
    id: 'score-p-def-prev',
    appliesTo: 'Phosphorus Deficiency',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'p-deficiency'),
    adjustment: 15,
  },

  // ── Spider Mites ────────────────────────────────────────────
  {
    id: 'score-mites-low-rh',
    appliesTo: 'Spider Mites',
    condition: (ctx) => _isNum(ctx.rhExtracted) && ctx.rhExtracted < 40,
    adjustment: 10,
  },
  {
    id: 'score-mites-prev',
    appliesTo: 'Spider Mites',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'spider-mites'),
    adjustment: 15,
  },

  // ── Fungus Gnats ────────────────────────────────────────────
  {
    id: 'score-gnats-overwater',
    appliesTo: 'Fungus Gnats',
    condition: (ctx) =>
      _lc(ctx.rootHealth) === 'suspect' && _hasTag(ctx.previousProblems, 'fungus-gnats'),
    adjustment: 15,
  },
  {
    id: 'score-gnats-prev',
    appliesTo: 'Fungus Gnats',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'fungus-gnats'),
    adjustment: 10,
  },
]);

/**
 * adjustScoresFromNotes — mutate a Plant Doctor scoresMap in place by
 * applying all SCORE_ADJUSTMENTS rules whose `condition(ctx)` is truthy.
 *
 * Never throws: rule closure errors are pushed into
 * `getObservationIndex().ruleErrors` and iteration continues.
 *
 * Scores are floor-clamped at 0.
 *
 * If a rule targets a condition that has no entry in `scoresMap`, a
 * minimal entry is created on demand so note-driven conditions can
 * surface even when no symptom was clicked. The created entry is
 * tagged with `noteAdjusted: true` for downstream filtering.
 *
 * @param {Object<string, {condition:string, score:number, matches:string[], maxScore:number}>} scoresMap
 * @param {Object} ctx — merged scalar field map (NOT the full mergeNoteContext return)
 * @returns {Object} same scoresMap (mutated)
 */
export function adjustScoresFromNotes(scoresMap, ctx) {
  if (!scoresMap || typeof scoresMap !== 'object') return scoresMap;
  if (!ctx || typeof ctx !== 'object') return scoresMap;

  for (const rule of SCORE_ADJUSTMENTS) {
    let match = false;
    try {
      match = !!rule.condition(ctx);
    } catch (err) {
      _recordRuleError(rule.id, err);
      continue;
    }
    if (!match) continue;

    let entry = scoresMap[rule.appliesTo];
    if (!entry) {
      entry = {
        condition: rule.appliesTo,
        score: 0,
        matches: [],
        maxScore: 100,
        noteAdjusted: true,
      };
      scoresMap[rule.appliesTo] = entry;
    }

    const next = (entry.score || 0) + rule.adjustment;
    entry.score = next < 0 ? 0 : next;
    entry.noteAdjusted = true;
  }

  return scoresMap;
}

function _recordRuleError(ruleId, err) {
  try {
    const idx = getObservationIndex();
    if (idx && Array.isArray(idx.ruleErrors)) {
      idx.ruleErrors.push({
        ruleId,
        error: err && err.message ? err.message : String(err),
        timestamp: new Date().toISOString(),
        source: 'score-adjust',
      });
    }
  } catch {
    // Index may be unavailable during tests — swallow.
  }
}
