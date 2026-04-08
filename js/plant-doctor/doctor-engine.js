// GrowDoc Companion — Plant Doctor Unified Diagnostic Engine
// Adapted from v3 monolithic tool into ES modules.

/**
 * runDiagnosis(symptoms, context) — Score all conditions and return ranked results.
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
 * buildContext(store) — Pre-fill diagnostic context from companion profile.
 */
export function buildContext(store) {
  if (!store) return {};
  const profile = store.state.profile || {};
  const grow = store.state.grow;
  const plant = grow?.plants?.[0];

  return {
    medium: profile.medium || null,
    lighting: profile.lighting || null,
    stage: plant?.stage || null,
    experience: profile.experience || null,
    recentLogs: _getRecentLogs(plant),
  };
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
