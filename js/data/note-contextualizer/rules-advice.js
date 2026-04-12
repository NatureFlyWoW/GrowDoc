// GrowDoc Companion — Note Contextualizer: Advice rules (section-05)
//
// Authored advice rules that generate contextual "Your Action Plan" items
// for a diagnosed Plant Doctor condition. Each rule is keyed to a
// Companion condition name (matching `doctor-data.js` `CORE_SCORING`) and
// fires when its closure returns truthy against the merged ctx object.
//
// Shape:
//   { id, appliesTo, condition: (ctx)=>bool, headline, detail, severity }
//
// `severity` uses the display enum: 'alert' | 'watch' | 'info'.
// Advice text is static — couple to ctx via `condition`, not by
// interpolating ctx fields into headline/detail.

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
function _truthy() { return true; }

const SEVERITY_RANK = { alert: 2, watch: 1, info: 0 };

/**
 * Frozen advice rule set. Target 2-4 rules per condition to give the
 * Action Plan breathing room. A final `*` generic fallback per condition
 * ensures something renders when no specific closure matches.
 *
 * @type {ReadonlyArray<{
 *   id: string,
 *   appliesTo: string,
 *   condition: (ctx: Object) => boolean,
 *   headline: string,
 *   detail: string,
 *   severity: 'alert'|'watch'|'info',
 * }>}
 */
export const ADVICE_RULES = Object.freeze([
  // ── pH Imbalance ────────────────────────────────────────────
  {
    id: 'advice-ph-lockout-flush-low',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _isNum(ctx.phExtracted) && ctx.phExtracted < 5.5,
    headline: 'Flush with pH-corrected water',
    detail: 'Your runoff read below 5.5 — cations are likely locked out. Run 1.5× pot-volume of pH 6.3 water, then resume normal feeding at half strength.',
    severity: 'alert',
  },
  {
    id: 'advice-ph-lockout-flush-high',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _isNum(ctx.phExtracted) && ctx.phExtracted > 7.0,
    headline: 'pH is too high — lock out of Fe, Mn, Zn likely',
    detail: 'Above 7.0 your micros are precipitating. Drop feed pH to 6.0 for soil or 5.8 for coco and hold there for a week before re-reading runoff.',
    severity: 'alert',
  },
  {
    id: 'advice-ph-calibrate-meter',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'pH-drift'),
    headline: 'Re-calibrate your pH meter',
    detail: 'Drift history on this grow suggests a meter calibration issue or old probe. Run a 2-point calibration with fresh 4.01/7.00 buffers before your next feed.',
    severity: 'watch',
  },
  {
    id: 'advice-ph-generic',
    appliesTo: 'pH Imbalance',
    condition: _truthy,
    headline: 'Check pH at every feeding',
    detail: 'Confirm input pH and runoff pH on your next two feeds. Most nutrient symptoms disguise themselves as pH lockout.',
    severity: 'info',
  },

  // ── Overwatering ────────────────────────────────────────────
  {
    id: 'advice-overwater-let-dry',
    appliesTo: 'Overwatering',
    condition: (ctx) => _lc(ctx.rootHealth) === 'suspect' || _lc(ctx.rootHealth) === 'rotting',
    headline: 'Let the medium dry completely before next watering',
    detail: 'Lift the pot and wait until it feels noticeably lighter. Overwatering drowns roots and mimics nitrogen deficiency — dry-back is the cheapest fix.',
    severity: 'alert',
  },
  {
    id: 'advice-overwater-reduce-freq',
    appliesTo: 'Overwatering',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'overwater'),
    headline: 'Stretch your watering interval',
    detail: 'You have a history of overwatering. Extend your interval by one day and prioritize lifting the pot over watering by schedule.',
    severity: 'watch',
  },
  {
    id: 'advice-overwater-generic',
    appliesTo: 'Overwatering',
    condition: _truthy,
    headline: 'Water by weight, not by calendar',
    detail: 'Healthy roots need oxygen between waterings. Let the pot drop 30–40% in weight before the next drink.',
    severity: 'info',
  },

  // ── Underwatering ───────────────────────────────────────────
  {
    id: 'advice-underwater-slow-soak',
    appliesTo: 'Underwatering',
    condition: (ctx) => _lc(ctx.rootHealth) === 'healthy',
    headline: 'Slow-soak the root ball',
    detail: 'Water in three passes at 5-minute intervals until you get 10–15% runoff. Hydrophobic dry soil channels water around the root ball — slow soaking rehydrates it.',
    severity: 'alert',
  },
  {
    id: 'advice-underwater-frequency',
    appliesTo: 'Underwatering',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'underwater'),
    headline: 'Increase watering frequency by one day',
    detail: 'Your grow history shows repeated underwatering. Move to a more frequent watering schedule until growth rate recovers.',
    severity: 'watch',
  },
  {
    id: 'advice-underwater-generic',
    appliesTo: 'Underwatering',
    condition: _truthy,
    headline: 'Water deeply until runoff appears',
    detail: 'Shallow watering leaves the lower root zone dry. Always water until you see 10–20% runoff to ensure full saturation.',
    severity: 'info',
  },

  // ── Heat Stress ─────────────────────────────────────────────
  {
    id: 'advice-heat-severe',
    appliesTo: 'Heat Stress',
    condition: (ctx) => _isNum(ctx.tempExtracted) && ctx.tempExtracted > 32,
    headline: 'Drop canopy temp below 30°C immediately',
    detail: 'Above 32°C you stall photosynthesis and risk foxtailing in flower. Raise your light, add exhaust speed, or dim 15% until you can get temps down.',
    severity: 'alert',
  },
  {
    id: 'advice-heat-mild',
    appliesTo: 'Heat Stress',
    condition: (ctx) => _isNum(ctx.tempExtracted) && ctx.tempExtracted > 28 && ctx.tempExtracted <= 32,
    headline: 'Increase air exchange',
    detail: 'You are running warm. Add a clip-on circulation fan and consider moving your light cycle to run at night when ambient temps are lower.',
    severity: 'watch',
  },
  {
    id: 'advice-heat-generic',
    appliesTo: 'Heat Stress',
    condition: _truthy,
    headline: 'Monitor canopy temp during lights-on',
    detail: 'Place a thermometer at canopy height (not tent wall) and track peak temp during mid-photoperiod. 24–28°C is the sweet spot.',
    severity: 'info',
  },

  // ── Nutrient Burn ───────────────────────────────────────────
  {
    id: 'advice-nute-burn-flush',
    appliesTo: 'Nutrient Burn',
    condition: (ctx) => _isNum(ctx.ecExtracted) && ctx.ecExtracted > 2.2,
    headline: 'Flush with plain water',
    detail: 'Your EC is above 2.2 — that is excess salt at the roots. Run 1.5× pot-volume of clean pH-corrected water, then resume at 50% feed strength.',
    severity: 'alert',
  },
  {
    id: 'advice-nute-burn-cut-feed',
    appliesTo: 'Nutrient Burn',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'nute-burn'),
    headline: 'Cut feed strength 25%',
    detail: 'You have a history of burning this plant. Back off to 75% of label strength and only ramp up if new growth stays pale.',
    severity: 'watch',
  },
  {
    id: 'advice-nute-burn-generic',
    appliesTo: 'Nutrient Burn',
    condition: _truthy,
    headline: 'Ease off feed and observe for 3 days',
    detail: 'Burnt tips are rarely urgent but signal the plant is past saturation. Skip one feed, water plain, then reassess.',
    severity: 'info',
  },

  // ── Nitrogen Deficiency ─────────────────────────────────────
  {
    id: 'advice-ndef-coco-low-ec',
    appliesTo: 'Nitrogen Deficiency',
    condition: (ctx) => _lc(ctx.medium) === 'coco' && _isNum(ctx.ecExtracted) && ctx.ecExtracted < 0.8,
    headline: 'Raise feed EC to 1.2–1.4',
    detail: 'Coco is inert — you must feed every watering. Your current EC is below where veg plants need it. Bump to 1.2–1.4 in veg, 1.6–1.8 in flower.',
    severity: 'alert',
  },
  {
    id: 'advice-ndef-bump-feed',
    appliesTo: 'Nitrogen Deficiency',
    condition: _truthy,
    headline: 'Increase N-heavy feed',
    detail: 'Fading from the bottom up is classic nitrogen mobility. Move up your feed chart one level or add a high-N supplement if in mid-veg.',
    severity: 'watch',
  },
  {
    id: 'advice-ndef-generic',
    appliesTo: 'Nitrogen Deficiency',
    condition: _truthy,
    headline: 'Confirm runoff pH before adding more nitrogen',
    detail: 'Nitrogen looks missing but is often pH-locked at 6.5+ in soil. Check runoff pH first — throwing more N at a lockout makes the problem worse.',
    severity: 'info',
  },

  // ── Light Burn ──────────────────────────────────────────────
  {
    id: 'advice-light-burn-raise',
    appliesTo: 'Light Burn',
    condition: (ctx) => _lc(ctx.lighting) === 'led',
    headline: 'Raise the light 10–15 cm',
    detail: 'LED bleaching is usually distance, not heat. Raise the fixture until you can hold your hand at canopy for 30 seconds without discomfort.',
    severity: 'alert',
  },
  {
    id: 'advice-light-burn-dim',
    appliesTo: 'Light Burn',
    condition: (ctx) => _lc(ctx.severity) === 'worsening',
    headline: 'Dim output 20% for a week',
    detail: 'Bleaching is progressing — cut PPFD by raising or dimming. Once new growth comes in green again, slowly ramp back up.',
    severity: 'watch',
  },
  {
    id: 'advice-light-burn-generic',
    appliesTo: 'Light Burn',
    condition: _truthy,
    headline: 'Measure distance to canopy',
    detail: 'Most LED light burn happens within 15 cm of the fixture. Use a tape measure — your eye underestimates distance.',
    severity: 'info',
  },

  // ── Root Rot ────────────────────────────────────────────────
  {
    id: 'advice-root-rot-hydro-chill',
    appliesTo: 'Root Rot',
    condition: (ctx) => _lc(ctx.medium) === 'hydro' && _isNum(ctx.tempExtracted) && ctx.tempExtracted > 24,
    headline: 'Chill your reservoir to 18–20°C',
    detail: 'Root rot in hydro is almost always warm water. Add a chiller or frozen bottles until reservoir temp drops. Pythium dies at 18°C.',
    severity: 'alert',
  },
  {
    id: 'advice-root-rot-h2o2',
    appliesTo: 'Root Rot',
    condition: (ctx) => _lc(ctx.rootHealth) === 'rotting',
    headline: 'Sterilize the root zone',
    detail: 'Brown, slimy roots need shock treatment. Dose 3 mL of 3% H₂O₂ per litre of fresh reservoir, replace weekly, and clean all tubing.',
    severity: 'alert',
  },
  {
    id: 'advice-root-rot-generic',
    appliesTo: 'Root Rot',
    condition: _truthy,
    headline: 'Inspect roots at next feed',
    detail: 'Healthy roots are bright white. Any brown or tan discoloration deserves immediate action — root rot progresses fast in warm conditions.',
    severity: 'info',
  },

  // ── Calcium Deficiency ──────────────────────────────────────
  {
    id: 'advice-cal-def-coco',
    appliesTo: 'Calcium Deficiency',
    condition: (ctx) => _lc(ctx.medium) === 'coco',
    headline: 'Add CalMag to every feed',
    detail: 'Coco binds calcium. Even on soft water, dose 1 mL/L of CalMag until your Ca is stable. Skip nothing — coco will not buffer for you.',
    severity: 'alert',
  },
  {
    id: 'advice-cal-def-low-rh',
    appliesTo: 'Calcium Deficiency',
    condition: (ctx) => _isNum(ctx.rhExtracted) && ctx.rhExtracted < 35,
    headline: 'Raise humidity above 45%',
    detail: 'Transpiration moves calcium. Below 35% RH the plant cannot pull enough water to deliver Ca to new growth regardless of feed concentration.',
    severity: 'watch',
  },
  {
    id: 'advice-cal-def-generic',
    appliesTo: 'Calcium Deficiency',
    condition: _truthy,
    headline: 'Check input CalMag',
    detail: 'Most Ca deficiencies in mid-veg are under-fed CalMag. Verify your cal-mag bottle has not run out or been skipped.',
    severity: 'info',
  },

  // ── Magnesium Deficiency ────────────────────────────────────
  {
    id: 'advice-mg-def-epsom',
    appliesTo: 'Magnesium Deficiency',
    condition: (ctx) => _hasTag(ctx.previousProblems, 'mg-deficiency'),
    headline: 'Foliar feed 1% Epsom salts',
    detail: 'Mix 10 g Epsom salt per litre and spray leaves 30 minutes before lights-on. You will see green return to interveinal areas within 3–5 days.',
    severity: 'alert',
  },
  {
    id: 'advice-mg-def-generic',
    appliesTo: 'Magnesium Deficiency',
    condition: _truthy,
    headline: 'Add Epsom salts to next feed',
    detail: 'Root-drench 0.5 g/L Epsom with your next feeding. Interveinal yellowing on older leaves responds fast to Mg correction.',
    severity: 'info',
  },

  // ── Potassium Deficiency ────────────────────────────────────
  {
    id: 'advice-k-def-flower',
    appliesTo: 'Potassium Deficiency',
    condition: _truthy,
    headline: 'Boost potassium in flower',
    detail: 'K demand doubles in flower. Add a PK booster or move up on your feed chart — rusty edges on fan leaves are classic mid-flower K need.',
    severity: 'alert',
  },
  {
    id: 'advice-k-def-generic',
    appliesTo: 'Potassium Deficiency',
    condition: _truthy,
    headline: 'Check runoff EC',
    detail: 'K deficiency often shows up when salt accumulation crowds out uptake. If runoff EC is 1.5× input, flush first then rebuild.',
    severity: 'info',
  },

  // ── Phosphorus Deficiency ───────────────────────────────────
  {
    id: 'advice-p-def-warm',
    appliesTo: 'Phosphorus Deficiency',
    condition: (ctx) => _isNum(ctx.tempExtracted) && ctx.tempExtracted < 18,
    headline: 'Warm your root zone',
    detail: 'Phosphorus uptake halts below 18°C. Get canopy temp to 22–25°C and P absorption returns without any feed change.',
    severity: 'alert',
  },
  {
    id: 'advice-p-def-generic',
    appliesTo: 'Phosphorus Deficiency',
    condition: _truthy,
    headline: 'Verify feed P levels',
    detail: 'Purple stems and dark leaves in early flower can be P deficiency or simply cold stress. Check both before reaching for a bloom booster.',
    severity: 'info',
  },

  // ── Spider Mites ────────────────────────────────────────────
  {
    id: 'advice-mites-raise-rh',
    appliesTo: 'Spider Mites',
    condition: (ctx) => {
      const vegStages = ['seedling', 'early-veg', 'late-veg'];
      if (ctx.stage && !vegStages.includes(ctx.stage)) return false;
      return _isNum(ctx.rhExtracted) && ctx.rhExtracted < 40;
    },
    headline: 'Raise humidity above 50%',
    detail: 'Mites thrive in dry air. Pump RH to 50–60% and they stop reproducing — single most effective environmental intervention.',
    severity: 'alert',
  },
  {
    id: 'advice-mites-spray',
    appliesTo: 'Spider Mites',
    condition: (ctx) => {
      const vegStages = ['seedling', 'early-veg', 'late-veg'];
      return !ctx.stage || vegStages.includes(ctx.stage);
    },
    headline: 'Neem oil the undersides',
    detail: 'Spray pure water onto leaf undersides first to shock them, then apply neem at lights-off. Repeat every 3 days for two weeks.',
    severity: 'watch',
  },
  {
    id: 'advice-mites-generic',
    appliesTo: 'Spider Mites',
    condition: _truthy,
    headline: 'Inspect daily with a loupe',
    detail: 'Catching mites early matters. Use a 30× loupe and check leaf undersides every day — webbing means you are already behind.',
    severity: 'info',
  },

  // ── Fungus Gnats ────────────────────────────────────────────
  {
    id: 'advice-gnats-dry-top',
    appliesTo: 'Fungus Gnats',
    condition: _truthy,
    headline: 'Let the top 2 cm dry out',
    detail: 'Gnat larvae need moist soil to hatch. Dry the top layer hard between waterings — they cannot lay eggs in dry medium.',
    severity: 'alert',
  },
  {
    id: 'advice-gnats-bti',
    appliesTo: 'Fungus Gnats',
    condition: _truthy,
    headline: 'Drench with BTi (Mosquito Bits)',
    detail: 'BTi kills larvae in the soil without harming roots. Soak 1 Tbsp per litre of water and use as your next watering.',
    severity: 'watch',
  },
  {
    id: 'advice-gnats-generic',
    appliesTo: 'Fungus Gnats',
    condition: _truthy,
    headline: 'Yellow sticky traps',
    detail: 'Place yellow sticky cards at canopy height to measure infestation size. If you see 5+ per trap in a week, escalate to BTi.',
    severity: 'info',
  },
]);

/**
 * generateContextualAdvice — filter ADVICE_RULES by `appliesTo`, evaluate
 * each rule's closure against `ctx`, sort matches by severity (alert >
 * watch > info), take the top 5, and return them.
 *
 * Never throws. Rule-closure errors are recorded in the observation index
 * ruleErrors channel and that rule is skipped.
 *
 * @param {Object} ctx — merged scalar field map (NOT the full merge result)
 * @param {string} conditionName — canonical Companion condition name
 * @returns {Array<{id:string, headline:string, detail:string, severity:string, citedObsIds:string[]}>}
 */
export function generateContextualAdvice(ctx, conditionName) {
  if (!conditionName || typeof conditionName !== 'string') return [];
  const safeCtx = (ctx && typeof ctx === 'object') ? ctx : {};

  const matched = [];
  for (const rule of ADVICE_RULES) {
    if (rule.appliesTo !== conditionName) continue;
    let hit = false;
    try {
      hit = !!rule.condition(safeCtx);
    } catch (err) {
      _recordRuleError(rule.id, err);
      continue;
    }
    if (!hit) continue;
    matched.push(rule);
  }

  if (matched.length === 0) {
    return [{
      id: `advice-${_slug(conditionName)}-generic`,
      headline: `Investigate ${conditionName} further`,
      detail: 'No contextual notes matched this diagnosis. Add a plant note describing pH, EC, temp, or root condition to get tailored guidance.',
      severity: 'info',
      citedObsIds: [],
    }];
  }

  // Stable sort by severity desc, preserving declaration order on ties.
  const indexed = matched.map((r, i) => ({ r, i }));
  indexed.sort((a, b) => {
    const sa = SEVERITY_RANK[a.r.severity] ?? 0;
    const sb = SEVERITY_RANK[b.r.severity] ?? 0;
    if (sa !== sb) return sb - sa;
    return a.i - b.i;
  });

  return indexed.slice(0, 5).map(({ r }) => ({
    id: r.id,
    headline: r.headline,
    detail: r.detail,
    severity: r.severity,
    citedObsIds: [],
  }));
}

function _slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function _recordRuleError(ruleId, err) {
  try {
    const idx = getObservationIndex();
    if (idx && Array.isArray(idx.ruleErrors)) {
      idx.ruleErrors.push({
        ruleId,
        error: err && err.message ? err.message : String(err),
        timestamp: new Date().toISOString(),
        source: 'advice',
      });
    }
  } catch (err) {
    console.error('[rules-advice:record-error]', err);
    // Swallow — index may be unavailable in tests.
  }
}
