// GrowDoc Companion — Grow Knowledge Data Modules
// Single source of truth for cultivation targets and protocols.
// Every recommendation system queries these structures.

export const STAGES = [
  'germination', 'seedling', 'early-veg', 'late-veg',
  'transition', 'early-flower', 'mid-flower', 'late-flower',
  'ripening', 'drying', 'curing'
];

// ── VPD Targets ──────────────────────────────────────────────────────────
// VPD_TARGETS[stage] = { dayTemp, nightTemp, dayRH, nightRH, vpdRange }
// Temps in Celsius, RH in %, VPD in kPa

export const VPD_TARGETS = {
  germination: {
    dayTemp:   { min: 24, max: 28 },
    nightTemp: { min: 22, max: 26 },
    dayRH:     { min: 70, max: 85 },
    nightRH:   { min: 75, max: 88 },
    vpdRange:  { min: 0.4, max: 0.7 }
  },
  seedling: {
    dayTemp:   { min: 24, max: 28 },
    nightTemp: { min: 20, max: 24 },
    dayRH:     { min: 65, max: 80 },
    nightRH:   { min: 70, max: 85 },
    vpdRange:  { min: 0.4, max: 0.8 }
  },
  'early-veg': {
    dayTemp:   { min: 24, max: 28 },
    nightTemp: { min: 20, max: 24 },
    dayRH:     { min: 55, max: 70 },
    nightRH:   { min: 60, max: 75 },
    vpdRange:  { min: 0.8, max: 1.2 }
  },
  'late-veg': {
    dayTemp:   { min: 24, max: 28 },
    nightTemp: { min: 20, max: 24 },
    dayRH:     { min: 50, max: 65 },
    nightRH:   { min: 55, max: 70 },
    vpdRange:  { min: 0.9, max: 1.2 }
  },
  transition: {
    dayTemp:   { min: 24, max: 27 },
    nightTemp: { min: 20, max: 23 },
    dayRH:     { min: 48, max: 60 },
    nightRH:   { min: 53, max: 65 },
    vpdRange:  { min: 0.9, max: 1.3 }
  },
  'early-flower': {
    dayTemp:   { min: 24, max: 27 },
    nightTemp: { min: 20, max: 23 },
    dayRH:     { min: 45, max: 55 },
    nightRH:   { min: 50, max: 60 },
    vpdRange:  { min: 1.0, max: 1.3 }
  },
  'mid-flower': {
    dayTemp:   { min: 24, max: 26 },
    nightTemp: { min: 20, max: 22 },
    dayRH:     { min: 40, max: 50 },
    nightRH:   { min: 45, max: 55 },
    vpdRange:  { min: 1.1, max: 1.4 }
  },
  'late-flower': {
    dayTemp:   { min: 22, max: 25 },
    nightTemp: { min: 18, max: 21 },
    dayRH:     { min: 35, max: 45 },
    nightRH:   { min: 40, max: 50 },
    vpdRange:  { min: 1.2, max: 1.5 }
  },
  ripening: {
    dayTemp:   { min: 20, max: 24 },
    nightTemp: { min: 16, max: 20 },
    dayRH:     { min: 30, max: 40 },
    nightRH:   { min: 35, max: 45 },
    vpdRange:  { min: 1.2, max: 1.6 }
  },
  drying: {
    dayTemp:   { min: 15, max: 21 },
    nightTemp: { min: 13, max: 18 },
    dayRH:     { min: 55, max: 65 },
    nightRH:   { min: 58, max: 68 },
    vpdRange:  { min: 0.5, max: 0.9 }
  },
  curing: {
    dayTemp:   { min: 18, max: 22 },
    nightTemp: { min: 16, max: 20 },
    dayRH:     { min: 58, max: 65 },
    nightRH:   { min: 60, max: 68 },
    vpdRange:  { min: 0.5, max: 0.8 }
  }
};

// ── DLI Targets ──────────────────────────────────────────────────────────
// DLI_TARGETS[stage][priority] = { min, optimal, max } in mol/m2/day
// Priority ordering: yield >= quality >= terpenes

export const DLI_TARGETS = {
  seedling: {
    yield:    { min: 12, optimal: 16, max: 20 },
    quality:  { min: 12, optimal: 15, max: 18 },
    terpenes: { min: 10, optimal: 14, max: 17 }
  },
  'early-veg': {
    yield:    { min: 18, optimal: 25, max: 30 },
    quality:  { min: 16, optimal: 22, max: 28 },
    terpenes: { min: 15, optimal: 20, max: 25 }
  },
  'late-veg': {
    yield:    { min: 25, optimal: 35, max: 42 },
    quality:  { min: 22, optimal: 30, max: 38 },
    terpenes: { min: 20, optimal: 28, max: 35 }
  },
  transition: {
    yield:    { min: 28, optimal: 38, max: 45 },
    quality:  { min: 25, optimal: 35, max: 42 },
    terpenes: { min: 22, optimal: 30, max: 38 }
  },
  'early-flower': {
    yield:    { min: 30, optimal: 40, max: 50 },
    quality:  { min: 28, optimal: 38, max: 46 },
    terpenes: { min: 25, optimal: 33, max: 42 }
  },
  'mid-flower': {
    yield:    { min: 35, optimal: 50, max: 65, note: 'Heat stress, not light saturation, is typically the limiting factor. Whole-plant yield scales linearly to at least 1800 PPFD per Rodriguez-Morrison 2021.' },
    quality:  { min: 30, optimal: 40, max: 50 },
    terpenes: { min: 25, optimal: 35, max: 45 }
  },
  'late-flower': {
    yield:    { min: 30, optimal: 42, max: 55, note: 'Heat stress, not light saturation, is typically the limiting factor.' },
    quality:  { min: 28, optimal: 36, max: 45 },
    terpenes: { min: 20, optimal: 26, max: 35 }
  },
  ripening: {
    yield:    { min: 20, optimal: 28, max: 35 },
    quality:  { min: 18, optimal: 25, max: 32 },
    terpenes: { min: 15, optimal: 22, max: 28 }
  }
};

// ── Nutrient Targets ─────────────────────────────────────────────────────
// NUTRIENT_TARGETS[medium][stage] = { ec, ph, npkRatio, calmagNote, notes }

const _soilNutrients = {
  seedling:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 6.2, max: 6.8 }, npkRatio: '1-1-1', calmagNote: null, notes: ['Light feed only — seedlings are sensitive', 'Most quality soils have enough for 2-3 weeks', 'Seedlings prefer slightly higher pH floor (6.2) for nutrient availability'] },
  'early-veg':    { ec: { min: 0.8, max: 1.2 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '3-1-2', calmagNote: 'Under LED lighting: add CalMag at 0.5-1ml/L. LEDs produce less infrared, reducing transpiration-driven calcium transport. This is the #1 hidden deficiency under LED in soil.', notes: ['Increase N to support foliage growth', 'Top-dress or liquid feed every other watering'] },
  'late-veg':     { ec: { min: 1.2, max: 1.6 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '3-1-2', calmagNote: 'Under LED lighting: add CalMag at 0.5-1ml/L. LEDs produce less infrared, reducing transpiration-driven calcium transport. This is the #1 hidden deficiency under LED in soil.', notes: ['Peak vegetative demand', 'Watch for N excess (dark waxy leaves)', 'Living soil/organic amendments may show higher runoff EC (1.8-2.0) — this is normal soil release, not overfeeding'] },
  transition:     { ec: { min: 1.2, max: 1.6 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '2-1-3', calmagNote: 'Under LED lighting: continue CalMag at 0.5-1ml/L. Stretch demand for calcium increases.', notes: ['Bridge between veg and bloom nutrients', 'Start reducing N, increasing PK'] },
  'early-flower': { ec: { min: 1.4, max: 1.8 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '2-2-3', calmagNote: 'Under LED lighting: add CalMag at 0.5-1ml/L. Bud-site formation pulls calcium from new growth.', notes: ['Transition to bloom nutrients', 'Increase P and K gradually'] },
  'mid-flower':   { ec: { min: 1.6, max: 2.2 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '1-2-3', calmagNote: 'Under LED lighting: add CalMag at 0.5-1ml/L. Peak Ca demand during bud swell.', notes: ['Peak flower demand', 'PK boosters if desired — use conservatively'] },
  'late-flower':  { ec: { min: 1.2, max: 1.6 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '0-1-2', calmagNote: 'Under LED lighting: 0.5ml/L CalMag is usually still warranted to prevent late-stage deficiency.', notes: ['Begin reducing feed', 'Reduce nitrogen to near zero'] },
  ripening:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 6.0, max: 6.8 }, npkRatio: '0-0-1', calmagNote: null, notes: ['Minimal feed or plain water', 'Let the plant use stored reserves'] }
};

const _cocoNutrients = {
  seedling:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 5.5, max: 6.2 }, npkRatio: '1-1-1', calmagNote: 'Coco binds Ca/Mg — always supplement CalMag (1-2ml/L)', notes: ['Buffer new coco with CalMag before use', 'Feed from day 1 — coco has no nutrients'] },
  'early-veg':    { ec: { min: 0.8, max: 1.2 }, ph: { min: 5.5, max: 6.2 }, npkRatio: '3-1-2', calmagNote: 'Add CalMag every feed (2-3ml/L); LED lighting increases demand', notes: ['Coco can be fed every watering', 'Frequent fertigation preferred'] },
  'late-veg':     { ec: { min: 1.2, max: 1.8 }, ph: { min: 5.5, max: 6.2 }, npkRatio: '3-1-2', calmagNote: 'CalMag 2-3ml/L every feed; increase if LED-only', notes: ['Coco supports higher EC than soil', 'Monitor runoff EC for salt buildup'] },
  transition:     { ec: { min: 1.2, max: 1.8 }, ph: { min: 5.5, max: 6.3 }, npkRatio: '2-1-3', calmagNote: 'CalMag 2-3ml/L; maintain through transition', notes: ['Bridge veg to bloom — start shifting NPK ratio', 'Coco transition is quick, 3-5 days'] },
  'early-flower': { ec: { min: 1.4, max: 2.0 }, ph: { min: 5.5, max: 6.3 }, npkRatio: '2-2-3', calmagNote: 'CalMag 2-3ml/L; flower stretch increases Ca demand', notes: ['Transition to bloom nutes', 'Run-to-waste recommended for consistency'] },
  'mid-flower':   { ec: { min: 1.8, max: 2.4 }, ph: { min: 5.5, max: 6.3 }, npkRatio: '1-2-3', calmagNote: 'CalMag 2ml/L minimum; heavy feeders may need 3-4ml/L', notes: ['Peak feeding — coco handles higher EC', 'Flush with low-EC solution if runoff EC rises above 2.8'] },
  'late-flower':  { ec: { min: 1.2, max: 1.8 }, ph: { min: 5.5, max: 6.3 }, npkRatio: '0-1-2', calmagNote: 'Maintain CalMag at 1-2ml/L through late flower', notes: ['Reduce feed strength gradually', 'Drop N but maintain PK'] },
  ripening:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 5.5, max: 6.2 }, npkRatio: '0-0-1', calmagNote: 'Light CalMag only (1ml/L) or plain water', notes: ['Minimal feed', 'Short flush period if desired (2-3 days max)'] }
};

const _hydroNutrients = {
  seedling:       { ec: { min: 0.4, max: 0.6 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '1-1-1', calmagNote: null, notes: ['Very light nutrient solution', 'Check pH daily — hydro drifts fast'] },
  'early-veg':    { ec: { min: 0.8, max: 1.2 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '3-1-2', calmagNote: null, notes: ['Ramp slowly — roots have direct contact', 'Change reservoir weekly'] },
  'late-veg':     { ec: { min: 1.2, max: 1.6 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '3-1-2', calmagNote: null, notes: ['Peak veg strength', 'Top off with half-strength between full changes'] },
  transition:     { ec: { min: 1.2, max: 1.6 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '2-1-3', calmagNote: null, notes: ['Begin bloom formulation transition', 'Change reservoir with new ratio'] },
  'early-flower': { ec: { min: 1.4, max: 1.8 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '2-2-3', calmagNote: 'CalMag may be needed with RO/soft water, especially under LED', notes: ['Switch to bloom formulation', 'Keep water temp below 22C to prevent root rot'] },
  'mid-flower':   { ec: { min: 1.6, max: 2.2 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '1-2-3', calmagNote: 'CalMag supplementation recommended under LED; Ca demand peaks at mid-flower', notes: ['Peak flower strength', 'Monitor for salt buildup on roots'] },
  'late-flower':  { ec: { min: 1.0, max: 1.6 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '0-1-2', calmagNote: null, notes: ['Reduce feed', 'Lower reservoir temp if possible'] },
  ripening:       { ec: { min: 0.2, max: 0.6 }, ph: { min: 5.5, max: 6.0 }, npkRatio: '0-0-1', calmagNote: null, notes: ['Near-plain water', 'Final reservoir change before harvest'] }
};

const _soillessNutrients = {
  seedling:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '1-1-1', calmagNote: null, notes: ['Treat similar to coco — limited buffering', 'CalMag may be needed depending on mix'] },
  'early-veg':    { ec: { min: 0.8, max: 1.2 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '3-1-2', calmagNote: null, notes: ['Peat-based mixes acidify over time — watch pH', 'Feed every watering'] },
  'late-veg':     { ec: { min: 1.2, max: 1.6 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '3-1-2', calmagNote: null, notes: ['Increase feed as plant size grows', 'Runoff monitoring recommended'] },
  transition:     { ec: { min: 1.2, max: 1.6 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '2-1-3', calmagNote: null, notes: ['Bridge veg to bloom — shift NPK gradually', 'Monitor pH as nutrient ratio changes'] },
  'early-flower': { ec: { min: 1.4, max: 1.8 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '2-2-3', calmagNote: null, notes: ['Begin bloom transition', 'Perlite-heavy mixes dry faster — adjust frequency'] },
  'mid-flower':   { ec: { min: 1.6, max: 2.2 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '1-2-3', calmagNote: null, notes: ['Peak demand', 'Flush if runoff EC exceeds input by 50%+'] },
  'late-flower':  { ec: { min: 1.0, max: 1.6 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '0-1-2', calmagNote: null, notes: ['Reduce N', 'Maintain PK for final bud swell'] },
  ripening:       { ec: { min: 0.4, max: 0.8 }, ph: { min: 5.8, max: 6.3 }, npkRatio: '0-0-1', calmagNote: null, notes: ['Minimal feed or plain water'] }
};

export const NUTRIENT_TARGETS = {
  soil:     _soilNutrients,
  coco:     _cocoNutrients,
  hydro:    _hydroNutrients,
  soilless: _soillessNutrients
};

// ── Temperature Differentials ────────────────────────────────────────────
// TEMP_DIF[priority] = { dayNightDifferential, lateFlowerShift }

export const TEMP_DIF = {
  yield: {
    dayNightDifferential: { min: 5, max: 8 },
    lateFlowerShift: 'Maintain moderate differential; avoid extreme night drops that slow metabolism'
  },
  quality: {
    dayNightDifferential: { min: 6, max: 9 },
    lateFlowerShift: 'Slight night drop (18-20C) in late flower for resin production without stressing plant'
  },
  terpenes: {
    dayNightDifferential: { min: 8, max: 10 },
    lateFlowerShift: 'Drop night temps to 17-18C in last 2 weeks for terpene preservation; 15C possible for anthocyanin expression but advanced only — slows metabolism and may reduce bud density'
  }
};

// ── Watering Frequency ───────────────────────────────────────────────────
// WATERING_FREQUENCY[medium][potSize][stage] = { minDays, maxDays, notes }
// Pot sizes: small (1-3L), medium (5-7L), large (10L+)

function _waterEntry(minDays, maxDays, notes) {
  return { minDays, maxDays, notes };
}

export const WATERING_FREQUENCY = {
  soil: {
    small: {
      seedling:       _waterEntry(3, 5, 'Small pots dry faster — check daily by weight'),
      'early-veg':    _waterEntry(2, 4, 'Increasing root mass speeds uptake'),
      'late-veg':     _waterEntry(2, 3, 'Plants drink more in late veg; lift test daily'),
      transition:     _waterEntry(2, 3, 'Stretch phase — water demand increasing'),
      'early-flower': _waterEntry(2, 3, 'Flower stretch increases water demand'),
      'mid-flower':   _waterEntry(1, 2, 'Peak transpiration; may need daily in small pots'),
      'late-flower':  _waterEntry(2, 3, 'Demand decreases slightly as plant matures')
    },
    medium: {
      seedling:       _waterEntry(4, 6, 'Medium pots buffer well — avoid overwatering seedlings'),
      'early-veg':    _waterEntry(3, 5, 'Water when top inch is dry'),
      'late-veg':     _waterEntry(2, 4, 'Lift test — water when pot feels light'),
      transition:     _waterEntry(2, 3, 'Plants stretching — monitor daily'),
      'early-flower': _waterEntry(2, 3, 'Consistent watering supports flower development'),
      'mid-flower':   _waterEntry(2, 3, 'Don\'t let medium dry out completely during peak bloom'),
      'late-flower':  _waterEntry(2, 4, 'Allow slight dry-back between waterings')
    },
    large: {
      seedling:       _waterEntry(5, 7, 'Large pots retain moisture — be patient, let roots seek water'),
      'early-veg':    _waterEntry(4, 6, 'Water deeply but infrequently; promotes deep root growth'),
      'late-veg':     _waterEntry(3, 5, 'Roots filling pot — frequency naturally increases'),
      transition:     _waterEntry(3, 4, 'Stretch increases uptake — check more frequently'),
      'early-flower': _waterEntry(3, 4, 'Steady moisture for flower initiation'),
      'mid-flower':   _waterEntry(2, 4, 'Water thoroughly; 10-20% runoff in soil is fine'),
      'late-flower':  _waterEntry(3, 5, 'Can extend intervals slightly as demand drops')
    }
  },
  coco: {
    small: {
      seedling:       _waterEntry(1, 2, 'Coco dries fast in small pots — check twice daily'),
      'early-veg':    _waterEntry(1, 2, 'Feed every watering in coco; never let it dry out'),
      'late-veg':     _waterEntry(1, 1, 'Daily fertigation in small coco pots'),
      transition:     _waterEntry(1, 1, 'Daily; stretch phase increases water demand'),
      'early-flower': _waterEntry(1, 1, 'Daily minimum; twice daily if temps are high'),
      'mid-flower':   _waterEntry(1, 1, 'Daily; consider automated drip for consistency'),
      'late-flower':  _waterEntry(1, 1, 'Maintain daily schedule through late flower')
    },
    medium: {
      seedling:       _waterEntry(1, 3, 'Young plants in medium coco — every 1-3 days'),
      'early-veg':    _waterEntry(1, 2, 'Increase to daily as roots establish'),
      'late-veg':     _waterEntry(1, 1, 'Daily fertigation; aim for 10-20% runoff'),
      transition:     _waterEntry(1, 1, 'Daily; plant stretching means more uptake'),
      'early-flower': _waterEntry(1, 1, 'Daily; consistent moisture is key in coco'),
      'mid-flower':   _waterEntry(1, 1, 'Daily; never let coco dry out completely'),
      'late-flower':  _waterEntry(1, 1, 'Maintain daily; reduce nutrient strength instead of frequency')
    },
    large: {
      seedling:       _waterEntry(2, 3, 'Large coco pots retain more — still check daily'),
      'early-veg':    _waterEntry(1, 2, 'Transition to daily as plant grows'),
      'late-veg':     _waterEntry(1, 2, 'Daily to every-other-day in large pots'),
      transition:     _waterEntry(1, 1, 'Daily; stretch demands consistent moisture'),
      'early-flower': _waterEntry(1, 1, 'Daily fertigation recommended'),
      'mid-flower':   _waterEntry(1, 1, 'Daily; run-to-waste for best results'),
      'late-flower':  _waterEntry(1, 2, 'Daily; slight dry-back okay in very large pots')
    }
  },
  hydro: {
    small: {
      seedling:       _waterEntry(1, 1, 'Continuous — reservoir-based; check water level daily'),
      'early-veg':    _waterEntry(1, 1, 'Top off reservoir daily; full change weekly'),
      'late-veg':     _waterEntry(1, 1, 'Monitor water level — plants drink more in veg'),
      transition:     _waterEntry(1, 1, 'Continuous; change reservoir with bloom formula'),
      'early-flower': _waterEntry(1, 1, 'Daily reservoir check; maintain solution level'),
      'mid-flower':   _waterEntry(1, 1, 'Peak water uptake — may need to top off twice daily'),
      'late-flower':  _waterEntry(1, 1, 'Continuous; adjust solution strength down')
    },
    medium: {
      seedling:       _waterEntry(1, 1, 'Continuous — check reservoir daily'),
      'early-veg':    _waterEntry(1, 1, 'Full reservoir change every 5-7 days'),
      'late-veg':     _waterEntry(1, 1, 'Top off between changes; watch EC drift'),
      transition:     _waterEntry(1, 1, 'Continuous; fresh reservoir with transition nutrients'),
      'early-flower': _waterEntry(1, 1, 'Change reservoir weekly minimum'),
      'mid-flower':   _waterEntry(1, 1, 'Peak uptake; change reservoir every 5 days'),
      'late-flower':  _waterEntry(1, 1, 'Maintain schedule; reduce nutrient concentration')
    },
    large: {
      seedling:       _waterEntry(1, 1, 'Continuous — larger reservoir buffers pH better'),
      'early-veg':    _waterEntry(1, 1, 'Check and top off daily'),
      'late-veg':     _waterEntry(1, 1, 'Full change weekly; top off as needed'),
      transition:     _waterEntry(1, 1, 'Continuous; swap to bloom nutrients at reservoir change'),
      'early-flower': _waterEntry(1, 1, 'Weekly changes; daily monitoring'),
      'mid-flower':   _waterEntry(1, 1, 'Peak demand — keep reservoir full'),
      'late-flower':  _waterEntry(1, 1, 'Continuous; fresh solution at reduced strength')
    }
  },
  soilless: {
    small: {
      seedling:       _waterEntry(2, 4, 'Similar to coco — limited buffering in small pots'),
      'early-veg':    _waterEntry(2, 3, 'Feed every watering; peat mixes hold more than coco'),
      'late-veg':     _waterEntry(1, 2, 'Increasing demand; check daily'),
      transition:     _waterEntry(1, 2, 'Stretch increases uptake; may need daily'),
      'early-flower': _waterEntry(1, 2, 'Daily to every-other-day depending on mix'),
      'mid-flower':   _waterEntry(1, 2, 'Peak demand; don\'t let peat dry out completely'),
      'late-flower':  _waterEntry(1, 2, 'Maintain consistent schedule; reduce nutrient strength')
    },
    medium: {
      seedling:       _waterEntry(3, 5, 'Medium pots buffer well; avoid overwatering'),
      'early-veg':    _waterEntry(2, 4, 'Water when top layer feels dry'),
      'late-veg':     _waterEntry(2, 3, 'Lift test — similar to soil but dries faster'),
      transition:     _waterEntry(2, 3, 'Monitor closely as plant stretches'),
      'early-flower': _waterEntry(1, 3, 'Consistent moisture for flower initiation'),
      'mid-flower':   _waterEntry(1, 2, 'Peak demand; feed every watering'),
      'late-flower':  _waterEntry(2, 3, 'Slight dry-back okay between waterings')
    },
    large: {
      seedling:       _waterEntry(4, 6, 'Large soilless pots retain moisture well'),
      'early-veg':    _waterEntry(3, 5, 'Water deeply; allow some dry-back'),
      'late-veg':     _waterEntry(2, 4, 'Roots filling pot — frequency increases'),
      transition:     _waterEntry(2, 3, 'Stretch phase — check every 1-2 days'),
      'early-flower': _waterEntry(2, 3, 'Steady moisture supports flower development'),
      'mid-flower':   _waterEntry(2, 3, 'Thorough watering with some runoff'),
      'late-flower':  _waterEntry(2, 4, 'Can extend intervals as demand drops')
    }
  }
};
