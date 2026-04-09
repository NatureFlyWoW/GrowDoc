// GrowDoc Companion — Feeding Schedule & Nutrient Calculator

import { NUTRIENT_TARGETS } from './grow-knowledge.js';
import { calculateWeights, blendTarget } from './priority-engine.js';

/**
 * getFeedingSchedule(medium, stage, priorities) — Returns feeding targets.
 */
/**
 * getFeedingSchedule(medium, stage, priorities, context) — Returns feeding targets.
 * Context-aware: autoflower reduces EC 25%, living soil gradient adjusts further.
 */
export function getFeedingSchedule(medium, stage, priorities, context) {
  const targets = NUTRIENT_TARGETS[medium]?.[stage];
  if (!targets) return null;

  const weights = calculateWeights(priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 });
  const ctx = context || {};

  // Autoflower EC reduction: 25% across the board
  const autoMultiplier = ctx.isAutoflower ? 0.75 : 1.0;

  // Living soil gradient reduction
  let soilMultiplier = 1.0;
  if (ctx.amendmentDensity === 'high') soilMultiplier = 0.4;     // Water only territory
  else if (ctx.amendmentDensity === 'medium') soilMultiplier = 0.65;
  else if (ctx.amendmentDensity === 'low') soilMultiplier = 0.8;

  // Priority-adjusted EC: yield increases, terpenes decreases
  const ecAdjust = {
    yield: { min: targets.ec.min * 1.1, max: targets.ec.max * 1.1 },
    quality: { min: targets.ec.min, max: targets.ec.max },
    terpenes: { min: targets.ec.min * 0.85, max: targets.ec.max * 0.85 },
  };

  const ecMin = blendTarget({
    yield: ecAdjust.yield.min,
    quality: ecAdjust.quality.min,
    terpenes: ecAdjust.terpenes.min,
  }, weights);

  const ecMax = blendTarget({
    yield: ecAdjust.yield.max,
    quality: ecAdjust.quality.max,
    terpenes: ecAdjust.terpenes.max,
  }, weights);

  // Apply autoflower and soil multipliers
  const finalMin = ecMin * autoMultiplier * soilMultiplier;
  const finalMax = ecMax * autoMultiplier * soilMultiplier;

  const calmagRequired = medium === 'coco' || (medium === 'hydro' && targets.calmagNote);

  // Build context-specific notes
  const contextNotes = [];
  if (ctx.isAutoflower) contextNotes.push('Autoflower: EC reduced 25% from photoperiod baseline — autos are more sensitive to nutrient concentration.');
  if (ctx.amendmentDensity === 'high') contextNotes.push('Living soil with amendments: water only first 4-6 weeks. Top-dress when deficiency appears.');
  else if (ctx.amendmentDensity === 'medium') contextNotes.push('Amended soil: lighter feeding schedule. Top-dress every 2-3 weeks rather than liquid feed.');
  if (ctx.waterPH && ctx.waterPH > 7.5) contextNotes.push(`Your tap water pH (${ctx.waterPH}) is high — always pH down before feeding.`);

  return {
    ecTarget: { min: Math.round(finalMin * 10) / 10, max: Math.round(finalMax * 10) / 10 },
    phTarget: { min: targets.ph.min, max: targets.ph.max },
    npkRatio: targets.npkRatio,
    calmagRequired,
    calmagDose: targets.calmagNote || null,
    notes: [...(targets.notes || []), ...contextNotes],
    evidence: 'established',
  };
}

/**
 * compareToTarget(actualEC, actualPH, medium, stage, priorities) — Compare readings.
 */
export function compareToTarget(actualEC, actualPH, medium, stage, priorities) {
  const schedule = getFeedingSchedule(medium, stage, priorities);
  if (!schedule) return { ecStatus: 'unknown', ecAdvice: '', phStatus: 'unknown', phAdvice: '', overallStatus: 'unknown' };

  let ecStatus = 'on-target';
  let ecAdvice = '';
  if (actualEC > schedule.ecTarget.max) {
    ecStatus = 'above';
    const pct = Math.round(((actualEC - schedule.ecTarget.max) / schedule.ecTarget.max) * 100);
    ecAdvice = `EC ${actualEC} is above target (${schedule.ecTarget.min}-${schedule.ecTarget.max}). Reduce base nutrient concentration by ~${Math.min(pct, 30)}%.`;
  } else if (actualEC < schedule.ecTarget.min) {
    ecStatus = 'below';
    ecAdvice = `EC ${actualEC} is below target (${schedule.ecTarget.min}-${schedule.ecTarget.max}). Increase nutrient concentration gradually.`;
  } else {
    ecAdvice = `EC ${actualEC} is on target (${schedule.ecTarget.min}-${schedule.ecTarget.max}).`;
  }

  let phStatus = 'on-target';
  let phAdvice = '';
  if (actualPH > schedule.phTarget.max) {
    phStatus = 'above';
    phAdvice = `pH ${actualPH} is above target (${schedule.phTarget.min}-${schedule.phTarget.max}). Add pH Down.`;
  } else if (actualPH < schedule.phTarget.min) {
    phStatus = 'below';
    phAdvice = `pH ${actualPH} is below target (${schedule.phTarget.min}-${schedule.phTarget.max}). Add pH Up.`;
    if (medium === 'coco') phAdvice += ' For coco, potassium silicate can raise pH while providing silicon benefits.';
  } else {
    phAdvice = `pH ${actualPH} is on target (${schedule.phTarget.min}-${schedule.phTarget.max}).`;
  }

  const overallStatus = (ecStatus === 'on-target' && phStatus === 'on-target') ? 'good' :
    (ecStatus === 'above' || phStatus === 'above' || phStatus === 'below') ? 'concern' : 'adjust';

  return { ecStatus, ecAdvice, phStatus, phAdvice, overallStatus };
}

// ── Tests ──────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Soil/veg targets
  {
    const sched = getFeedingSchedule('soil', 'late-veg', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(sched !== null, 'soil/late-veg schedule exists');
    assert(sched.npkRatio === '3-1-2', `soil/late-veg NPK is 3-1-2 (got ${sched.npkRatio})`);
    assert(sched.ecTarget.min > 0, 'soil/late-veg has EC target');
  }

  // Coco/flower CalMag
  {
    const sched = getFeedingSchedule('coco', 'mid-flower', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(sched.calmagRequired === true, 'coco/mid-flower requires CalMag');
    assert(sched.calmagDose !== null, 'coco/mid-flower has CalMag dose note');
  }

  // Terpene priority reduces EC
  {
    const terpSched = getFeedingSchedule('soil', 'mid-flower', { yield: 1, quality: 3, terpenes: 5, effect: 1 });
    const yieldSched = getFeedingSchedule('soil', 'mid-flower', { yield: 5, quality: 3, terpenes: 1, effect: 1 });
    assert(terpSched.ecTarget.max < yieldSched.ecTarget.max, 'terpene priority reduces EC target vs yield priority');
  }

  // EC above target
  {
    const result = compareToTarget(2.8, 6.3, 'soil', 'mid-flower', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(result.ecStatus === 'above', 'EC 2.8 is above target for soil/mid-flower');
    assert(result.ecAdvice.includes('Reduce'), 'advice says to reduce');
  }

  // pH below target
  {
    const result = compareToTarget(1.5, 5.2, 'coco', 'mid-flower', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    assert(result.phStatus === 'below', 'pH 5.2 is below target for coco');
    assert(result.phAdvice.includes('pH Up'), 'advice mentions pH Up');
  }

  return results;
}
