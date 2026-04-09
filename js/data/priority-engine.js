// GrowDoc Companion — Priority Weight Calculation & Target Blending
// Pure functions that convert star ratings into normalized weights and blend targets.

import { DLI_TARGETS, TEMP_DIF } from './grow-knowledge.js';

/**
 * calculateWeights(priorities) -> { yield, quality, terpenes, effect }
 *
 * Normalizes star ratings (0-5) into weights summing to 1.0.
 * All zeros returns equal weights (0.25 each).
 */
export function calculateWeights(priorities) {
  const { yield: y = 0, quality: q = 0, terpenes: t = 0, effect: e = 0 } = priorities;
  const total = y + q + t + e;

  if (total === 0) {
    return { yield: 0.25, quality: 0.25, terpenes: 0.25, effect: 0.25 };
  }

  return {
    yield: y / total,
    quality: q / total,
    terpenes: t / total,
    effect: e / total,
  };
}

/**
 * blendTarget(parameterByPriority, weights) -> Number
 *
 * Weighted average of parameter values per priority dimension.
 * If a dimension is absent from parameterByPriority (typically 'effect'),
 * its weight is redistributed proportionally among the present dimensions.
 */
export function blendTarget(parameterByPriority, weights) {
  const dims = Object.keys(parameterByPriority);
  if (dims.length === 0) return 0;

  // Sum of weights for present dimensions
  let presentWeightSum = 0;
  for (const d of dims) {
    presentWeightSum += (weights[d] || 0);
  }

  // If all present dimensions have zero weight, equal-weight them
  if (presentWeightSum === 0) {
    let sum = 0;
    for (const d of dims) sum += parameterByPriority[d];
    return sum / dims.length;
  }

  // Weighted average with redistribution
  let result = 0;
  for (const d of dims) {
    const normalizedWeight = (weights[d] || 0) / presentWeightSum;
    result += parameterByPriority[d] * normalizedWeight;
  }
  return result;
}

/**
 * getRecommendation(param, stage, medium, priorities) -> {
 *   value: Number,
 *   range: { min: Number, max: Number },
 *   tradeoffNote: String | null
 * }
 *
 * Supported params: 'dli', 'temp_dif'
 */
export function getRecommendation(param, stage, medium, priorities) {
  const weights = calculateWeights(priorities);

  if (param === 'dli') {
    return _dliRecommendation(stage, priorities, weights);
  }

  if (param === 'temp_dif') {
    return _tempDifRecommendation(priorities, weights);
  }

  return { value: 0, range: { min: 0, max: 0 }, tradeoffNote: null };
}

function _dliRecommendation(stage, priorities, weights) {
  const stageData = DLI_TARGETS[stage];
  if (!stageData) {
    return { value: 0, range: { min: 0, max: 0 }, tradeoffNote: null };
  }

  // Blend optimal, min, and max across priority dimensions
  const optimalByPriority = {};
  const minByPriority = {};
  const maxByPriority = {};

  for (const dim of ['yield', 'quality', 'terpenes']) {
    if (stageData[dim]) {
      optimalByPriority[dim] = stageData[dim].optimal;
      minByPriority[dim] = stageData[dim].min;
      maxByPriority[dim] = stageData[dim].max;
    }
  }

  const value = blendTarget(optimalByPriority, weights);
  const min = blendTarget(minByPriority, weights);
  const max = blendTarget(maxByPriority, weights);

  const tradeoffNote = _dliTradeoffNote(stageData, priorities);

  return {
    value: Math.round(value * 10) / 10,
    range: { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 },
    tradeoffNote,
  };
}

function _dliTradeoffNote(stageData, priorities) {
  // Only generate when two priorities with >= 3 stars pull in different directions
  const dims = ['yield', 'quality', 'terpenes'];
  const highDims = dims.filter(d => priorities[d] >= 3 && stageData[d]);

  if (highDims.length < 2) return null;

  // Find the pair with the largest divergence in optimal values
  let maxDiff = 0;
  let highDim = null;
  let lowDim = null;

  for (let i = 0; i < highDims.length; i++) {
    for (let j = i + 1; j < highDims.length; j++) {
      const diff = Math.abs(stageData[highDims[i]].optimal - stageData[highDims[j]].optimal);
      if (diff > maxDiff) {
        maxDiff = diff;
        if (stageData[highDims[i]].optimal > stageData[highDims[j]].optimal) {
          highDim = highDims[i];
          lowDim = highDims[j];
        } else {
          highDim = highDims[j];
          lowDim = highDims[i];
        }
      }
    }
  }

  // Only generate note if difference is significant (> 5 DLI)
  if (maxDiff <= 5 || !highDim || !lowDim) return null;

  const highLabel = highDim.charAt(0).toUpperCase() + highDim.slice(1);
  const lowLabel = lowDim.charAt(0).toUpperCase() + lowDim.slice(1);

  return `Higher DLI benefits ${highLabel.toLowerCase()} but may reduce ${lowDim === 'terpenes' ? 'terpene complexity' : lowLabel.toLowerCase() + ' outcomes'}. ` +
    `Your ${lowLabel.toLowerCase()} priority (${priorities[lowDim]} stars) suggests keeping DLI below ${stageData[lowDim].max}.`;
}

function _tempDifRecommendation(priorities, weights) {
  const minByPriority = {};
  const maxByPriority = {};

  for (const dim of ['yield', 'quality', 'terpenes']) {
    if (TEMP_DIF[dim]) {
      minByPriority[dim] = TEMP_DIF[dim].dayNightDifferential.min;
      maxByPriority[dim] = TEMP_DIF[dim].dayNightDifferential.max;
    }
  }

  const min = blendTarget(minByPriority, weights);
  const max = blendTarget(maxByPriority, weights);
  const value = (min + max) / 2;

  const tradeoffNote = _tempDifTradeoffNote(priorities);

  return {
    value: Math.round(value * 10) / 10,
    range: { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 },
    tradeoffNote,
  };
}

function _tempDifTradeoffNote(priorities) {
  const yieldHigh = priorities.yield >= 3;
  const terpHigh = priorities.terpenes >= 3;

  if (yieldHigh && terpHigh && Math.abs(priorities.yield - priorities.terpenes) <= 2) {
    return `Larger temperature differentials benefit terpene preservation but may slow metabolism. ` +
      `Your yield priority (${priorities.yield} stars) suggests keeping differentials moderate (${TEMP_DIF.yield.dayNightDifferential.min}-${TEMP_DIF.yield.dayNightDifferential.max}C).`;
  }

  return null;
}
