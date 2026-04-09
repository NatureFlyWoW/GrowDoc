// GrowDoc Companion — Profile Context Rules
// Parses free-text notes from wizard steps into structured grow context.

// ── Step-Scoped Keyword Patterns ─────────────────────────────────────

const STAGE_PATTERNS = [
  { pattern: /\b(autoflowers?|auto[\s-]?flowers?|autos)\b/i, field: 'plantType', value: 'autoflower' },
  { pattern: /\b(photoperiods?|photos?)\b/i, field: 'plantType', value: 'photoperiod' },
  { pattern: /\bclones?\b/i, field: 'plantType', value: 'clone' },
  { pattern: /\bcuttings?\b/i, field: 'plantType', value: 'clone' },
  { pattern: /\bseeds?\b/i, field: 'plantType', value: 'seed' },
  { pattern: /\bfeminized\b/i, field: 'plantType', value: 'feminized' },
  { pattern: /\b(regular|regs?)\b/i, field: 'plantType', value: 'regular' },
  { pattern: /\b(bag\s?seeds?)\b/i, field: 'plantType', value: 'bagseed' },
  { pattern: /\bmother\b/i, field: 'plantType', value: 'mother' },
  { pattern: /(\d+)\s*weeks?\s*(old|from|into)/i, extract: 'weeksOld' },
  { pattern: /(\d+)\s*days?\s*(old|from|into)/i, extract: 'daysOld' },
];

const MEDIUM_PATTERNS = [
  { pattern: /\bliving\s+soil\b/i, field: 'mediumDetail', value: 'living-soil' },
  { pattern: /\bsuper\s+soil\b/i, field: 'mediumDetail', value: 'super-soil' },
  { pattern: /\bamended\b/i, field: 'mediumDetail', value: 'amended' },
  { pattern: /\bworm\s+castings?\b/i, field: 'amendments', value: 'worm-castings' },
  { pattern: /\bperlite\b/i, field: 'amendments', value: 'perlite' },
  { pattern: /\bcompost\b/i, field: 'amendments', value: 'compost' },
  { pattern: /\bbone\s+meal\b/i, field: 'amendments', value: 'bone-meal' },
  { pattern: /\bblood\s+meal\b/i, field: 'amendments', value: 'blood-meal' },
  { pattern: /\bguano\b/i, field: 'amendments', value: 'guano' },
  { pattern: /\bkelp\b/i, field: 'amendments', value: 'kelp' },
  { pattern: /\bmycorrhizae?\b/i, field: 'amendments', value: 'mycorrhizae' },
  { pattern: /\bdolomite\b/i, field: 'amendments', value: 'dolomite-lime' },
  { pattern: /\borganic\b/i, field: 'nutrientLine', value: 'organic' },
  { pattern: /\bdry\s+amendments?\b/i, field: 'nutrientLine', value: 'organic-dry' },
  { pattern: /\bsynthetic\b/i, field: 'nutrientLine', value: 'synthetic' },
  { pattern: /\b(general\s+hydroponics|GH)\b/i, field: 'nutrientBrand', value: 'general-hydroponics' },
  { pattern: /\b(canna)\b/i, field: 'nutrientBrand', value: 'canna' },
  { pattern: /\b(biobizz)\b/i, field: 'nutrientBrand', value: 'biobizz' },
  { pattern: /\b(fox\s+farm)\b/i, field: 'nutrientBrand', value: 'fox-farm' },
  { pattern: /\b(advanced\s+nutrients)\b/i, field: 'nutrientBrand', value: 'advanced-nutrients' },
  { pattern: /\bfabric\s+pots?\b/i, field: 'container', value: 'fabric' },
  { pattern: /\bsmart\s+pots?\b/i, field: 'container', value: 'fabric' },
  { pattern: /\bair\s+pots?\b/i, field: 'container', value: 'air-pot' },
  { pattern: /\bplastic\b/i, field: 'container', value: 'plastic' },
  { pattern: /\b(sip|sub[\s-]?irrigat)/i, field: 'container', value: 'sip' },
  { pattern: /\b(autopot)\b/i, field: 'container', value: 'autopot' },
  { pattern: /\b(hand\s+water)/i, field: 'irrigation', value: 'hand' },
  { pattern: /\b(drip\s+system|drip\s+irrigation)/i, field: 'irrigation', value: 'drip' },
  { pattern: /\b(bottom\s+feed)/i, field: 'irrigation', value: 'bottom-feed' },
  { pattern: /\b(blumat)/i, field: 'irrigation', value: 'blumat' },
  { pattern: /\b(tap\s+water|tap)\b/i, field: 'waterSource', value: 'tap' },
  { pattern: /\b(RO|reverse\s+osmosis)\b/i, field: 'waterSource', value: 'ro' },
  { pattern: /\b(well\s+water)\b/i, field: 'waterSource', value: 'well' },
  { pattern: /\b(distilled)\b/i, field: 'waterSource', value: 'distilled' },
  { pattern: /\bph\s*[\s:=]?\s*(\d+\.?\d*)/i, extract: 'waterPH' },
  { pattern: /\bppm\s*[\s:=]?\s*(\d+)/i, extract: 'waterPPM' },
];

const LIGHTING_PATTERNS = [
  { pattern: /\b(spider\s*farmer|SF\d+)/i, field: 'lightBrand', value: 'spider-farmer' },
  { pattern: /\b(mars\s*hydro)/i, field: 'lightBrand', value: 'mars-hydro' },
  { pattern: /\b(HLG)/i, field: 'lightBrand', value: 'hlg' },
  { pattern: /\b(viparspectra)/i, field: 'lightBrand', value: 'viparspectra' },
  { pattern: /\b(gavita)/i, field: 'lightBrand', value: 'gavita' },
  { pattern: /(\d+)\s*(inches?|in|cm)\s*(from|above|away)/i, extract: 'lightDistance' },
  { pattern: /\bdimmed?\s*(?:to\s*)?(\d+)\s*%/i, extract: 'lightDimming' },
  { pattern: /(\d+)\s*w(?:atts?)?\s*(from\s+wall|actual|true)/i, extract: 'lightWattageActual' },
];

const STRAIN_PATTERNS = [
  { pattern: /(\d+)[\s-]*(weeks?|wks?)\s*(flower|bloom)/i, extract: 'flowerWeeks' },
  { pattern: /\bsensitiv\w*\s+(?:to\s+)?(\w+)/i, extract: 'sensitivity' },
  { pattern: /\bheavy\s+feeder/i, field: 'feedingNeed', value: 'heavy' },
  { pattern: /\blight\s+feeder/i, field: 'feedingNeed', value: 'light' },
  { pattern: /\bstretchy?\b/i, field: 'stretchLevel', value: 'high' },
  { pattern: /\bcompact\b/i, field: 'stretchLevel', value: 'low' },
];

const SPACE_PATTERNS = [
  { pattern: /\b(\d+)\s*x\s*(\d+)\s*(tent|grow)/i, extract: 'tentSize' },
  { pattern: /\b(carbon\s+filter)\b/i, field: 'ventilation', value: 'carbon-filter' },
  { pattern: /\b(inline\s+fan)\b/i, field: 'ventilation', value: 'inline-fan' },
  { pattern: /\b(AC\s+Infinity)/i, field: 'ventilationBrand', value: 'ac-infinity' },
  { pattern: /(\d+)\s*(inch|in|")\s*(fan|inline|exhaust)/i, extract: 'fanSize' },
  { pattern: /\b(passive\s+intake)\b/i, field: 'ventilation', value: 'passive' },
  { pattern: /\bonly\s+(\d+)\s*(cm|inches?)\s*(tall|height|high)/i, extract: 'heightLimit' },
  { pattern: /\b(basement|attic|closet|garage|spare\s+room|balcony|greenhouse)\b/i, extract: 'location' },
];

const PRIORITIES_PATTERNS = [
  { pattern: /\bstealth\b/i, field: 'stealthRequired', value: true },
  { pattern: /\bsmell\b/i, field: 'stealthRequired', value: true },
  { pattern: /\bneighbo[u]?rs?\b/i, field: 'stealthRequired', value: true },
  { pattern: /\bnoise\b/i, field: 'noiseConscious', value: true },
  { pattern: /\bbudget\b/i, field: 'budgetConstrained', value: true },
  { pattern: /\bcheap\b/i, field: 'budgetConstrained', value: true },
  { pattern: /\b(first\s+time|never\s+grown|brand\s+new)\b/i, field: 'trueFirstTimer', value: true },
  { pattern: /\b(last\s+grow|previous|always\s+get|struggled?\s+with)\b/i, extract: 'previousProblem' },
  { pattern: /\b(overwater)/i, field: 'previousProblems', value: 'overwatering' },
  { pattern: /\b(mold|mould|bud\s*rot|botrytis)/i, field: 'previousProblems', value: 'mold' },
  { pattern: /\b(gnats?|fungus\s+gnats?)/i, field: 'previousProblems', value: 'fungus-gnats' },
  { pattern: /\b(mites?|spider\s+mites?)/i, field: 'previousProblems', value: 'spider-mites' },
  { pattern: /\b(calcium|cal[\s-]?mag)/i, field: 'previousProblems', value: 'calcium-def' },
  { pattern: /\b(airy\s+buds?|larfy)/i, field: 'previousProblems', value: 'airy-buds' },
];

const STEP_PATTERNS = {
  stage: STAGE_PATTERNS,
  medium: MEDIUM_PATTERNS,
  lighting: LIGHTING_PATTERNS,
  strain: STRAIN_PATTERNS,
  space: SPACE_PATTERNS,
  priorities: PRIORITIES_PATTERNS,
};

// ── Parser ───────────────────────────────────────────────────────────

/**
 * parseProfileNotes(notes) — Parse wizard notes into structured context.
 * @param {Object} notes — { stage: "...", medium: "...", ... }
 * @returns {Object} structured context object
 */
export function parseProfileNotes(notes) {
  const ctx = {
    plantType: null,
    isAutoflower: false,
    mediumDetail: null,
    amendments: [],
    amendmentDensity: 'none',
    nutrientLine: null,
    nutrientBrand: null,
    lightBrand: null,
    lightDistance: null,
    lightDimming: null,
    container: null,
    waterSource: null,
    waterPH: null,
    irrigation: null,
    ventilation: null,
    ventilationBrand: null,
    trainingIntent: null,
    envConstraints: [],
    previousProblems: [],
    stealthRequired: false,
    budgetConstrained: false,
    noiseConscious: false,
    trueFirstTimer: false,
    feedingNeed: null,
    stretchLevel: null,
    heightLimit: null,
    location: null,
    rawUnmatched: [],
  };

  if (!notes || typeof notes !== 'object') return ctx;

  for (const [step, text] of Object.entries(notes)) {
    if (!text || typeof text !== 'string') continue;
    const patterns = STEP_PATTERNS[step];
    if (!patterns) continue;

    let unmatched = text;

    for (const rule of patterns) {
      const match = text.match(rule.pattern);
      if (!match) continue;

      // Remove matched portion from unmatched tracker
      unmatched = unmatched.replace(match[0], '');

      if (rule.extract) {
        _handleExtract(ctx, rule.extract, match);
      } else if (rule.field === 'amendments' || rule.field === 'previousProblems') {
        // Array fields — push
        if (!ctx[rule.field].includes(rule.value)) {
          ctx[rule.field].push(rule.value);
        }
      } else {
        ctx[rule.field] = rule.value;
      }
    }

    // Track unmatched text
    const remaining = unmatched.trim().replace(/\s+/g, ' ');
    if (remaining.length > 3) {
      ctx.rawUnmatched.push({ step, text: remaining });
    }
  }

  // Derived fields
  ctx.isAutoflower = ctx.plantType === 'autoflower';

  // Amendment density
  const count = ctx.amendments.length;
  if (count === 0) ctx.amendmentDensity = 'none';
  else if (count === 1) ctx.amendmentDensity = 'low';
  else if (count === 2) ctx.amendmentDensity = 'medium';
  else ctx.amendmentDensity = 'high';

  // Infer living soil from multiple amendments even without explicit keyword
  if (ctx.amendmentDensity === 'high' && !ctx.mediumDetail) {
    ctx.mediumDetail = 'amended';
  }

  return ctx;
}

function _handleExtract(ctx, type, match) {
  switch (type) {
    case 'weeksOld':
      ctx.weeksOld = parseInt(match[1], 10);
      break;
    case 'daysOld':
      ctx.daysOld = parseInt(match[1], 10);
      break;
    case 'waterPH':
      ctx.waterPH = parseFloat(match[1]);
      break;
    case 'waterPPM':
      ctx.waterPPM = parseInt(match[1], 10);
      break;
    case 'lightDistance':
      ctx.lightDistance = parseInt(match[1], 10);
      break;
    case 'lightDimming':
      ctx.lightDimming = parseInt(match[1], 10);
      break;
    case 'lightWattageActual':
      ctx.lightWattageActual = parseInt(match[1], 10);
      break;
    case 'flowerWeeks':
      ctx.expectedFlowerWeeks = parseInt(match[1], 10);
      break;
    case 'sensitivity':
      if (!ctx.sensitivities) ctx.sensitivities = [];
      ctx.sensitivities.push(match[1].toLowerCase());
      break;
    case 'tentSize':
      ctx.tentSize = `${match[1]}x${match[2]}`;
      break;
    case 'fanSize':
      ctx.fanSize = parseInt(match[1], 10);
      break;
    case 'heightLimit':
      ctx.heightLimit = parseInt(match[1], 10);
      break;
    case 'location':
      ctx.location = match[1].toLowerCase();
      break;
    case 'previousProblem':
      // Generic "last grow had..." — store raw
      ctx.rawUnmatched.push({ step: 'priorities', text: match[0] });
      break;
  }
}

/**
 * NOTE_PLACEHOLDERS — Step-specific placeholder text.
 */
export const NOTE_PLACEHOLDERS = {
  stage: 'e.g., autoflower, 3 weeks from sprout, clones from a friend',
  medium: 'e.g., living soil with worm castings, 30% perlite, organic dry amendments',
  lighting: 'e.g., Spider Farmer SF2000, 18 inches from canopy, dimmed to 75%',
  strain: 'e.g., breeder says 8-9 weeks flower, sensitive to nitrogen, heavy feeder',
  space: 'e.g., 2x4 tent, AC Infinity 4-inch with carbon filter, basement grow',
  priorities: 'e.g., stealth is critical — close neighbors, struggled with overwatering last grow',
};
