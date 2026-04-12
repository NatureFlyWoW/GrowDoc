// GrowDoc Companion — Plant Doctor Unified Diagnostic Engine
// Adapted from v3 monolithic tool into ES modules.

import {
  adjustScoresFromNotes,
  getRelevantObservations,
  mergeNoteContext,
  recordReferencedIn,
} from '../data/note-contextualizer/index.js';

/**
 * runDiagnosis(symptoms, context) — Score all conditions and return ranked results.
 *
 * When `context.ctx` is a populated merged-note ctx object, score rules
 * from `adjustScoresFromNotes` run between tally and normalization so
 * note-driven conditions can surface and outrank symptom-only matches.
 */
export function runDiagnosis(symptoms, context = {}) {
  const { SCORING } = _getDataModule();
  if (!SCORING) return [];

  const scores = {};

  for (const rule of SCORING) {
    if (!scores[rule.condition]) {
      scores[rule.condition] = { condition: rule.condition, score: 0, matches: [], maxScore: 0 };
    }
    scores[rule.condition].maxScore += rule.weight;

    // Check if this symptom is present
    if (symptoms.includes(rule.symptom)) {
      let weight = rule.weight;

      // Context modifiers
      if (rule.contextBoost && context[rule.contextBoost.key] === rule.contextBoost.value) {
        weight *= rule.contextBoost.multiplier || 1.5;
      }

      scores[rule.condition].score += weight;
      scores[rule.condition].matches.push(rule.symptom);
    }
  }

  // Note-aware score adjustments (section-05): merged ctx from plant notes
  // can boost or surface conditions. Runs BEFORE normalization so adjustments
  // factor into the confidence percentage.
  if (context && context.ctx && typeof context.ctx === 'object') {
    try {
      adjustScoresFromNotes(scores, context.ctx);
    } catch (err) {
      console.error('[doctor-engine:note-adjust]', err);
      // adjustScoresFromNotes is defensive; this catch is insurance only.
    }
  }

  // Normalize and sort
  const results = Object.values(scores)
    .filter(s => s.score > 0)
    .map(s => ({
      condition: s.condition,
      confidence: Math.round((s.score / Math.max(s.maxScore, 1)) * 100),
      matchedSymptoms: s.matches,
      score: s.score,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  // Section-10: citation trail. When notes influenced the diagnosis,
  // record the observation IDs that fed into mergeNoteContext.
  if (context && context.plantId && Array.isArray(context.observations) && context.observations.length > 0) {
    try {
      const obsIds = context.observations.map(o => o && o.id).filter(Boolean);
      if (obsIds.length > 0) {
        recordReferencedIn(obsIds, `plant-doctor:runDiagnosis:${context.plantId}`);
      }
    } catch (err) { console.error('[doctor-engine:citation-write]', err); }
  }

  return results.slice(0, 10); // Top 10
}

/**
 * getRefineQuestions(topConditions) — Return refining questions to narrow diagnosis.
 */
export function getRefineQuestions(topConditions) {
  const { REFINE_RULES } = _getDataModule();
  if (!REFINE_RULES) return [];

  const questions = [];
  for (const condition of topConditions.slice(0, 3)) {
    const rules = REFINE_RULES.filter(r => r.condition === condition.condition);
    for (const rule of rules.slice(0, 2)) {
      questions.push({
        question: rule.question,
        condition: rule.condition,
        yesBoost: rule.yesBoost || 15,
        noBoost: rule.noBoost || -10,
      });
    }
  }
  return questions;
}

/**
 * buildContext(store) — Pre-fill diagnostic context from companion profile
 * + the currently active plant's merged note context.
 *
 * Resolution order for the target plant:
 *   1. `store.state.ui.activePlantId` (set by plant-detail mount + Plant
 *      Doctor launch handlers).
 *   2. `grow.plants[0]` fallback for legacy / non-plant-scoped launches.
 *
 * Observations are filtered to the active plant and the last 14 days,
 * then merged into a ctx scalar map. `runDiagnosis` reads `context.ctx`.
 */
export function buildContext(store) {
  if (!store) return {};
  const profile = store.state.profile || {};
  const grow = store.state.grow;

  const activeId = store.state.ui?.activePlantId ?? null;
  const plant =
    (activeId && grow?.plants?.find(p => p.id === activeId)) ||
    grow?.plants?.[0] ||
    null;

  let observations = [];
  let ctx = {};
  if (plant && plant.id) {
    try {
      observations = getRelevantObservations(store, {
        plantId: plant.id,
        since: _daysAgoIso(14),
      });
      const merged = mergeNoteContext(observations);
      ctx = (merged && merged.ctx) || {};
    } catch (err) {
      console.error('[doctor-engine:observation]', err);
      observations = [];
      ctx = {};
    }
  }

  return {
    medium: profile.medium || null,
    lighting: profile.lighting || null,
    stage: plant?.stage || null,
    experience: profile.experience || null,
    recentLogs: _getRecentLogs(plant),
    plantId: plant?.id || null,
    ctx,
    observations, // preserved for section-10 citation wiring
  };
}

function _daysAgoIso(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function _getRecentLogs(plant) {
  if (!plant || !plant.logs) return [];
  const weekAgo = Date.now() - 7 * 86400000;
  return plant.logs.filter(l => new Date(l.date || l.timestamp) >= weekAgo);
}

// Lazy data loading
let _data = null;
function _getDataModule() {
  if (!_data) {
    _data = { SCORING: [], REFINE_RULES: [] };
    // Will be populated by doctor-data.js import
  }
  return _data;
}

export function setDiagnosticData(scoring, refineRules) {
  _data = { SCORING: scoring, REFINE_RULES: refineRules };
}
