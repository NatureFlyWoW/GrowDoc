// GrowDoc Companion — Harvest Advisor Logic

import { calculateWeights } from './priority-engine.js';
import { DRYING_TARGETS, CURING_TARGETS } from './stage-rules.js';

/**
 * getHarvestRecommendation(trichomes, priorities) — Analyze trichome ratios.
 *
 * Returns: { recommendation, confidence, tradeoffNote, staggerSuggestion }
 */
export function getHarvestRecommendation(trichomes, priorities) {
  const { clear, milky, amber } = trichomes;
  const weights = calculateWeights(priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 });

  // Base assessment
  let recommendation = 'keep-waiting';
  let confidence = 'low';
  let tradeoffNote = null;

  if (clear > 50) {
    recommendation = 'keep-waiting';
    confidence = 'high';
    tradeoffNote = 'Trichomes are mostly clear — THC production hasn\'t peaked. Wait for more milky trichomes.';
  } else if (milky >= 60 && amber < 10) {
    // Peak milky — best for terpenes and cerebral effects
    if (weights.terpenes > 0.3 || weights.effect > 0.3) {
      recommendation = 'harvest-now';
      confidence = 'high';
      tradeoffNote = `Peak milky trichomes — ideal for terpene preservation and cerebral effects. Your terpene/effect priority (${priorities.terpenes}/${priorities.effect} stars) aligns with harvesting now.`;
    } else {
      recommendation = 'harvest-soon';
      confidence = 'medium';
      tradeoffNote = 'Mostly milky trichomes — close to peak. Waiting for some amber will increase body effects and yield weight.';
    }
  } else if (milky >= 40 && amber >= 10 && amber <= 30) {
    // Classic harvest window
    recommendation = 'harvest-now';
    confidence = 'high';

    if (weights.yield > 0.3) {
      tradeoffNote = `Good balance of milky and amber. Your yield priority (${priorities.yield} stars) suggests you could wait a bit more for maximum weight.`;
    } else if (weights.terpenes > 0.3) {
      tradeoffNote = `Good harvest window. Your terpene priority (${priorities.terpenes} stars) suggests harvesting sooner rather than later for peak volatile terpene content.`;
    }
  } else if (amber > 30) {
    recommendation = 'harvest-now';
    confidence = 'high';
    tradeoffNote = 'High amber percentage — harvest now to prevent THC degradation. More amber = more sedative/body effects.';
    if (weights.yield > 0.3) {
      tradeoffNote += ` Your yield priority benefits from the extra weight, but quality may be declining.`;
    }
  }

  // Stagger suggestion
  let staggerSuggestion = null;
  if (recommendation === 'harvest-now' || recommendation === 'harvest-soon') {
    staggerSuggestion = 'Consider harvesting top colas first (they ripen fastest), then letting lower buds develop 3-5 more days under the light.';
  }

  return {
    recommendation,
    confidence,
    tradeoffNote,
    staggerSuggestion,
    dryingProtocol: { ...DRYING_TARGETS },
    curingProtocol: { ...CURING_TARGETS },
  };
}

export const RECOMMENDATION_LABELS = {
  'keep-waiting': { label: 'Keep Waiting', color: 'var(--status-action)' },
  'harvest-soon': { label: 'Harvest Soon', color: 'var(--status-good)' },
  'harvest-now': { label: 'Harvest Now', color: 'var(--accent-green)' },
};
