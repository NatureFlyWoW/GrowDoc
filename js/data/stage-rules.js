// GrowDoc Companion — Stage Definitions & Transition Rules

/**
 * STAGES — Ordered array of growth stage definitions.
 * Each stage has typical duration range, milestones, and display info.
 */
export const STAGES = [
  {
    id: 'germination',
    name: 'Germination',
    typicalDays: 5,
    minDays: 3,
    maxDays: 7,
    milestones: [
      { id: 'taproot', name: 'Taproot visible', triggerDay: 2, icon: 'sprout' }
    ]
  },
  {
    id: 'seedling',
    name: 'Seedling',
    typicalDays: 10,
    minDays: 7,
    maxDays: 14,
    milestones: [
      { id: 'first-true-leaves', name: 'First true leaves', triggerDay: 5, icon: 'leaf' }
    ]
  },
  {
    id: 'early-veg',
    name: 'Early Veg',
    typicalDays: 18,
    minDays: 14,
    maxDays: 21,
    milestones: [
      { id: 'topping-window', name: 'Topping window (4-5 nodes)', triggerDay: 14, icon: 'scissors' }
    ]
  },
  {
    id: 'late-veg',
    name: 'Late Veg',
    typicalDays: 21,
    minDays: 14,
    maxDays: 28,
    milestones: [
      { id: 'lst-start', name: 'LST start', triggerDay: 7, icon: 'bend' },
      { id: 'canopy-fill', name: 'Canopy filling', triggerDay: 18, icon: 'canopy' }
    ]
  },
  {
    id: 'transition',
    name: 'Transition',
    typicalDays: 10,
    minDays: 7,
    maxDays: 14,
    milestones: [
      { id: 'flip-12-12', name: 'Flip to 12/12', triggerDay: 1, icon: 'light' },
      { id: 'stretch-peak', name: 'Stretch peak', triggerDay: 7, icon: 'arrow-up' }
    ]
  },
  {
    id: 'early-flower',
    name: 'Early Flower',
    typicalDays: 18,
    minDays: 14,
    maxDays: 21,
    milestones: [
      { id: 'first-pistils', name: 'First pistils', triggerDay: 5, icon: 'flower' },
      { id: 'bud-sites', name: 'Bud site formation', triggerDay: 12, icon: 'bud' }
    ]
  },
  {
    id: 'mid-flower',
    name: 'Mid Flower',
    typicalDays: 18,
    minDays: 14,
    maxDays: 21,
    milestones: [
      { id: 'bud-swell', name: 'Bud swell', triggerDay: 7, icon: 'bud' },
      { id: 'defol-day21', name: 'Defoliation day 21', triggerDay: 14, icon: 'scissors' }
    ]
  },
  {
    id: 'late-flower',
    name: 'Late Flower',
    typicalDays: 18,
    minDays: 14,
    maxDays: 21,
    milestones: [
      { id: 'trichome-check', name: 'Trichome check begins', triggerDay: 7, icon: 'magnify' },
      { id: 'flush-window', name: 'Flush window (if applicable)', triggerDay: 14, icon: 'water' }
    ]
  },
  {
    id: 'ripening',
    name: 'Ripening',
    typicalDays: 10,
    minDays: 7,
    maxDays: 14,
    milestones: [
      { id: 'amber-assessment', name: 'Milky/amber assessment', triggerDay: 5, icon: 'magnify' },
      { id: 'harvest-decision', name: 'Harvest decision', triggerDay: 8, icon: 'harvest' }
    ]
  },
  {
    id: 'drying',
    name: 'Drying',
    typicalDays: 12,
    minDays: 10,
    maxDays: 14,
    milestones: [
      { id: 'daily-weight', name: 'Daily weight check', triggerDay: 1, icon: 'scale' },
      { id: 'snap-test', name: 'Snap test', triggerDay: 8, icon: 'snap' }
    ]
  },
  {
    id: 'curing',
    name: 'Curing',
    typicalDays: 30,
    minDays: 14,
    maxDays: 60,
    milestones: [
      { id: 'burp-reduce-1', name: 'Reduce to 1x/day burps', triggerDay: 7, icon: 'jar' },
      { id: 'burp-reduce-2', name: 'Reduce to every 2-3 days', triggerDay: 14, icon: 'jar' },
      { id: 'cure-check', name: 'Cure quality check', triggerDay: 28, icon: 'check' }
    ]
  }
];

/**
 * STAGE_TRANSITIONS — Maps current stage to next stage and auto-advance trigger.
 */
export const STAGE_TRANSITIONS = {
  germination:   { next: 'seedling',     triggerDays: 5,  confirmMessage: 'Seedling has emerged — move to Seedling stage?' },
  seedling:      { next: 'early-veg',    triggerDays: 10, confirmMessage: 'Plant has 3-4 true leaf sets — move to Early Veg?' },
  'early-veg':   { next: 'late-veg',     triggerDays: 18, confirmMessage: 'Strong vegetative growth — move to Late Veg?' },
  'late-veg':    { next: 'transition',   triggerDays: 21, confirmMessage: 'Ready to flip to 12/12? Move to Transition (Stretch)?' },
  transition:    { next: 'early-flower', triggerDays: 10, confirmMessage: 'Stretch is slowing — move to Early Flower?' },
  'early-flower':{ next: 'mid-flower',   triggerDays: 18, confirmMessage: 'Buds forming well — move to Mid Flower?' },
  'mid-flower':  { next: 'late-flower',  triggerDays: 18, confirmMessage: 'Buds fattening — move to Late Flower?' },
  'late-flower': { next: 'ripening',     triggerDays: 18, confirmMessage: 'Trichomes clouding up — move to Ripening?' },
  ripening:      { next: 'drying',       triggerDays: 10, confirmMessage: 'Ready to harvest? Move to Drying stage?' },
  drying:        { next: 'curing',       triggerDays: 12, confirmMessage: 'Branches snap cleanly — move to Curing stage?' },
};

/**
 * Burp schedule for curing stage.
 * Returns burps-per-day based on days in cure.
 */
export function getCureBurpSchedule(daysInCure) {
  if (daysInCure <= 7) return { perDay: 3, label: '3x daily (morning, afternoon, evening)' };
  if (daysInCure <= 14) return { perDay: 1, label: '1x daily' };
  if (daysInCure <= 28) return { perDay: 0.5, label: 'Every 2-3 days' };
  return { perDay: 0.14, label: 'Weekly check' };
}

/**
 * Helper: get days elapsed in current stage for a plant.
 */
export function getDaysInStage(plant) {
  if (!plant.stageStartDate) return 0;
  const start = new Date(plant.stageStartDate);
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

/**
 * Helper: check if a plant should be prompted for auto-advance.
 */
export function shouldAutoAdvance(plant) {
  const transition = STAGE_TRANSITIONS[plant.stage];
  if (!transition) return null;
  const days = getDaysInStage(plant);
  if (days >= transition.triggerDays) {
    return { nextStage: transition.next, message: transition.confirmMessage, daysInStage: days };
  }
  return null;
}

/**
 * Helper: get stage definition by ID.
 */
export function getStageById(stageId) {
  return STAGES.find(s => s.id === stageId) || null;
}

/**
 * Helper: get total typical grow duration (germination through ripening, excluding dry/cure).
 */
export function getTotalGrowDays() {
  return STAGES.filter(s => s.id !== 'drying' && s.id !== 'curing')
    .reduce((sum, s) => sum + s.typicalDays, 0);
}

/**
 * Helper: get stage index in the ordered STAGES array.
 */
export function getStageIndex(stageId) {
  return STAGES.findIndex(s => s.id === stageId);
}

// ── Drying/Curing Target Conditions ──────────────────────────────────

export const DRYING_TARGETS = {
  temp: { min: 15, max: 21 },
  rh: { min: 55, max: 65 },
  terpenePriority: { temp: { min: 15, max: 17 }, notes: 'Terpene priority: cooler/slower dry (15-17C) preserves volatile terpenes' }
};

export const CURING_TARGETS = {
  jarRH: { min: 58, max: 62 },
  tooMoist: 65,
  tooDry: 55,
  minWeeks: 2,
  recommendedWeeks: { min: 4, max: 8 }
};

export const SMELL_OPTIONS_DRYING = ['No smell', 'Faint', 'Moderate', 'Strong', 'Hay-like'];
export const SMELL_OPTIONS_CURING = ['Hay', 'Grassy', 'Sweet', 'Floral', 'Dank', 'Pungent'];
