// GrowDoc Companion — Note Contextualizer: keyword rules & domain tables
//
// This module is the single source of truth for every regex-based rule the
// Note Contextualizer fires. Two distinct groups live here:
//
//   1. Wizard rules (`wizard-*`) — migrated from the legacy
//      `profile-context-rules.js`. Each carries a `wizardStep` so the
//      `parseProfileText` shim in `./index.js` can scope matching to a
//      specific onboarding step. Consumed by onboarding / settings /
//      plant-detail views through that shim.
//
//   2. Legacy note-context rules (section-03) — ported verbatim from the
//      now-deleted `docs/note-context-rules.js`. Used by `parseObservation`
//      to populate `obs.parsed.{ctx, keywords, frankoOverrides, domains,
//      actionsTaken}`. Array-declaration order is preserved exactly.
//
// Rule shape:
//   { id, pattern, domains[], [wizardStep], [field], [value], [extract] }
//
// Rules with `extract` pull capture groups via `EXTRACT_HANDLERS` (for the
// legacy group) or `_handleWizardExtract` (for wizard rules, lives in
// `index.js`).

/**
 * @typedef {Object} KeywordRule
 * @property {string}   id           stable rule id
 * @property {RegExp}   pattern      compiled match pattern
 * @property {string[]} domains      ObservationDomain[] this rule fires for
 * @property {string}   [wizardStep] 'stage'|'medium'|'lighting'|'strain'|'space'|'priorities' when rule originated from a wizard question
 * @property {string}   [field]      target ctx field name
 * @property {*}        [value]      literal value to assign when matched
 * @property {string}   [extract]    special extractor id (numeric parse etc)
 */

// ── Wizard rules (merged from legacy profile-context-rules.js) ────
// Each entry carries `wizardStep` so callers can scope to a specific step.
// Domains map onto the ObservationDomain enum from observation-schema.js.

/** @type {KeywordRule[]} */
export const KEYWORD_PATTERNS = [
  // stage wizard step
  { id: 'wizard-stage-autoflower', pattern: /\b(autoflowers?|auto[\s-]?flowers?|autos)\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'autoflower' },
  { id: 'wizard-stage-photoperiod', pattern: /\b(photoperiods?|photos?)\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'photoperiod' },
  { id: 'wizard-stage-clone', pattern: /\bclones?\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'clone' },
  { id: 'wizard-stage-cutting', pattern: /\bcuttings?\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'clone' },
  { id: 'wizard-stage-seed', pattern: /\bseeds?\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'seed' },
  { id: 'wizard-stage-feminized', pattern: /\bfeminized\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'feminized' },
  { id: 'wizard-stage-regular', pattern: /\b(regular|regs?)\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'regular' },
  { id: 'wizard-stage-bagseed', pattern: /\b(bag\s?seeds?)\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'bagseed' },
  { id: 'wizard-stage-mother', pattern: /\bmother\b/i, domains: ['phenotype'], wizardStep: 'stage', field: 'plantType', value: 'mother' },
  { id: 'wizard-stage-weeks-old', pattern: /(\d+)\s*weeks?\s*(old|from|into)/i, domains: ['timeline'], wizardStep: 'stage', extract: 'weeksOld' },
  { id: 'wizard-stage-days-old', pattern: /(\d+)\s*days?\s*(old|from|into)/i, domains: ['timeline'], wizardStep: 'stage', extract: 'daysOld' },

  // medium wizard step
  { id: 'wizard-medium-living-soil', pattern: /\bliving\s+soil\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'mediumDetail', value: 'living-soil' },
  { id: 'wizard-medium-super-soil', pattern: /\bsuper\s+soil\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'mediumDetail', value: 'super-soil' },
  { id: 'wizard-medium-amended', pattern: /\bamended\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'mediumDetail', value: 'amended' },
  { id: 'wizard-medium-worm-castings', pattern: /\bworm\s+castings?\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'worm-castings' },
  { id: 'wizard-medium-perlite', pattern: /\bperlite\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'perlite' },
  { id: 'wizard-medium-compost', pattern: /\bcompost\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'compost' },
  { id: 'wizard-medium-bone-meal', pattern: /\bbone\s+meal\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'bone-meal' },
  { id: 'wizard-medium-blood-meal', pattern: /\bblood\s+meal\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'blood-meal' },
  { id: 'wizard-medium-guano', pattern: /\bguano\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'guano' },
  { id: 'wizard-medium-kelp', pattern: /\bkelp\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'kelp' },
  { id: 'wizard-medium-mycorrhizae', pattern: /\bmycorrhizae?\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'mycorrhizae' },
  { id: 'wizard-medium-dolomite', pattern: /\bdolomite\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'amendments', value: 'dolomite-lime' },
  { id: 'wizard-medium-organic', pattern: /\borganic\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientLine', value: 'organic' },
  { id: 'wizard-medium-organic-dry', pattern: /\bdry\s+amendments?\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientLine', value: 'organic-dry' },
  { id: 'wizard-medium-synthetic', pattern: /\bsynthetic\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientLine', value: 'synthetic' },
  { id: 'wizard-medium-brand-gh', pattern: /\b(general\s+hydroponics|GH)\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientBrand', value: 'general-hydroponics' },
  { id: 'wizard-medium-brand-canna', pattern: /\b(canna)\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientBrand', value: 'canna' },
  { id: 'wizard-medium-brand-biobizz', pattern: /\b(biobizz)\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientBrand', value: 'biobizz' },
  { id: 'wizard-medium-brand-foxfarm', pattern: /\b(fox\s+farm)\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientBrand', value: 'fox-farm' },
  { id: 'wizard-medium-brand-advanced', pattern: /\b(advanced\s+nutrients)\b/i, domains: ['nutrients'], wizardStep: 'medium', field: 'nutrientBrand', value: 'advanced-nutrients' },
  { id: 'wizard-medium-fabric', pattern: /\bfabric\s+pots?\b/i, domains: ['root'], wizardStep: 'medium', field: 'container', value: 'fabric' },
  { id: 'wizard-medium-smart-pot', pattern: /\bsmart\s+pots?\b/i, domains: ['root'], wizardStep: 'medium', field: 'container', value: 'fabric' },
  { id: 'wizard-medium-air-pot', pattern: /\bair\s+pots?\b/i, domains: ['root'], wizardStep: 'medium', field: 'container', value: 'air-pot' },
  { id: 'wizard-medium-plastic', pattern: /\bplastic\b/i, domains: ['root'], wizardStep: 'medium', field: 'container', value: 'plastic' },
  { id: 'wizard-medium-sip', pattern: /\b(sip|sub[\s-]?irrigat)/i, domains: ['root'], wizardStep: 'medium', field: 'container', value: 'sip' },
  { id: 'wizard-medium-autopot', pattern: /\b(autopot)\b/i, domains: ['watering'], wizardStep: 'medium', field: 'container', value: 'autopot' },
  { id: 'wizard-medium-hand-water', pattern: /\b(hand\s+water)/i, domains: ['watering'], wizardStep: 'medium', field: 'irrigation', value: 'hand' },
  { id: 'wizard-medium-drip', pattern: /\b(drip\s+system|drip\s+irrigation)/i, domains: ['watering'], wizardStep: 'medium', field: 'irrigation', value: 'drip' },
  { id: 'wizard-medium-bottom-feed', pattern: /\b(bottom\s+feed)/i, domains: ['watering'], wizardStep: 'medium', field: 'irrigation', value: 'bottom-feed' },
  { id: 'wizard-medium-blumat', pattern: /\b(blumat)/i, domains: ['watering'], wizardStep: 'medium', field: 'irrigation', value: 'blumat' },
  { id: 'wizard-medium-water-tap', pattern: /\b(tap\s+water|tap)\b/i, domains: ['watering'], wizardStep: 'medium', field: 'waterSource', value: 'tap' },
  { id: 'wizard-medium-water-ro', pattern: /\b(RO|reverse\s+osmosis)\b/i, domains: ['watering'], wizardStep: 'medium', field: 'waterSource', value: 'ro' },
  { id: 'wizard-medium-water-well', pattern: /\b(well\s+water)\b/i, domains: ['watering'], wizardStep: 'medium', field: 'waterSource', value: 'well' },
  { id: 'wizard-medium-water-distilled', pattern: /\b(distilled)\b/i, domains: ['watering'], wizardStep: 'medium', field: 'waterSource', value: 'distilled' },
  { id: 'wizard-medium-water-ph', pattern: /\bph\s*[\s:=]?\s*(\d+\.?\d*)/i, domains: ['watering'], wizardStep: 'medium', extract: 'waterPH' },
  { id: 'wizard-medium-water-ppm', pattern: /\bppm\s*[\s:=]?\s*(\d+)/i, domains: ['watering'], wizardStep: 'medium', extract: 'waterPPM' },

  // lighting wizard step
  { id: 'wizard-lighting-spider-farmer', pattern: /\b(spider\s*farmer|SF\d+)/i, domains: ['environment'], wizardStep: 'lighting', field: 'lightBrand', value: 'spider-farmer' },
  { id: 'wizard-lighting-mars-hydro', pattern: /\b(mars\s*hydro)/i, domains: ['environment'], wizardStep: 'lighting', field: 'lightBrand', value: 'mars-hydro' },
  { id: 'wizard-lighting-hlg', pattern: /\b(HLG)/i, domains: ['environment'], wizardStep: 'lighting', field: 'lightBrand', value: 'hlg' },
  { id: 'wizard-lighting-viparspectra', pattern: /\b(viparspectra)/i, domains: ['environment'], wizardStep: 'lighting', field: 'lightBrand', value: 'viparspectra' },
  { id: 'wizard-lighting-gavita', pattern: /\b(gavita)/i, domains: ['environment'], wizardStep: 'lighting', field: 'lightBrand', value: 'gavita' },
  { id: 'wizard-lighting-distance', pattern: /(\d+)\s*(inches?|in|cm)\s*(from|above|away)/i, domains: ['environment'], wizardStep: 'lighting', extract: 'lightDistance' },
  { id: 'wizard-lighting-dimming', pattern: /\bdimmed?\s*(?:to\s*)?(\d+)\s*%/i, domains: ['environment'], wizardStep: 'lighting', extract: 'lightDimming' },
  { id: 'wizard-lighting-wattage', pattern: /(\d+)\s*w(?:atts?)?\s*(from\s+wall|actual|true)/i, domains: ['environment'], wizardStep: 'lighting', extract: 'lightWattageActual' },

  // strain wizard step
  { id: 'wizard-strain-flower-weeks', pattern: /(\d+)[\s-]*(weeks?|wks?)\s*(flower|bloom)/i, domains: ['phenotype', 'timeline'], wizardStep: 'strain', extract: 'flowerWeeks' },
  { id: 'wizard-strain-sensitivity', pattern: /\bsensitiv\w*\s+(?:to\s+)?(\w+)/i, domains: ['phenotype'], wizardStep: 'strain', extract: 'sensitivity' },
  { id: 'wizard-strain-heavy-feeder', pattern: /\bheavy\s+feeder/i, domains: ['nutrients', 'phenotype'], wizardStep: 'strain', field: 'feedingNeed', value: 'heavy' },
  { id: 'wizard-strain-light-feeder', pattern: /\blight\s+feeder/i, domains: ['nutrients', 'phenotype'], wizardStep: 'strain', field: 'feedingNeed', value: 'light' },
  { id: 'wizard-strain-stretchy', pattern: /\bstretchy?\b/i, domains: ['phenotype'], wizardStep: 'strain', field: 'stretchLevel', value: 'high' },
  { id: 'wizard-strain-compact', pattern: /\bcompact\b/i, domains: ['phenotype'], wizardStep: 'strain', field: 'stretchLevel', value: 'low' },

  // space wizard step
  { id: 'wizard-space-tent-size', pattern: /\b(\d+)\s*x\s*(\d+)\s*(tent|grow)/i, domains: ['environment'], wizardStep: 'space', extract: 'tentSize' },
  { id: 'wizard-space-carbon-filter', pattern: /\b(carbon\s+filter)\b/i, domains: ['environment'], wizardStep: 'space', field: 'ventilation', value: 'carbon-filter' },
  { id: 'wizard-space-inline-fan', pattern: /\b(inline\s+fan)\b/i, domains: ['environment'], wizardStep: 'space', field: 'ventilation', value: 'inline-fan' },
  { id: 'wizard-space-ac-infinity', pattern: /\b(AC\s+Infinity)/i, domains: ['environment'], wizardStep: 'space', field: 'ventilationBrand', value: 'ac-infinity' },
  { id: 'wizard-space-fan-size', pattern: /(\d+)\s*(inch|in|")\s*(fan|inline|exhaust)/i, domains: ['environment'], wizardStep: 'space', extract: 'fanSize' },
  { id: 'wizard-space-passive', pattern: /\b(passive\s+intake)\b/i, domains: ['environment'], wizardStep: 'space', field: 'ventilation', value: 'passive' },
  { id: 'wizard-space-height-limit', pattern: /\bonly\s+(\d+)\s*(cm|inches?)\s*(tall|height|high)/i, domains: ['environment', 'training'], wizardStep: 'space', extract: 'heightLimit' },
  { id: 'wizard-space-location', pattern: /\b(basement|attic|closet|garage|spare\s+room|balcony|greenhouse)\b/i, domains: ['environment'], wizardStep: 'space', extract: 'location' },

  // priorities wizard step
  { id: 'wizard-priorities-stealth', pattern: /\bstealth\b/i, domains: ['environment'], wizardStep: 'priorities', field: 'stealthRequired', value: true },
  { id: 'wizard-priorities-smell', pattern: /\bsmell\b/i, domains: ['aroma', 'environment'], wizardStep: 'priorities', field: 'stealthRequired', value: true },
  { id: 'wizard-priorities-neighbors', pattern: /\bneighbo[u]?rs?\b/i, domains: ['environment'], wizardStep: 'priorities', field: 'stealthRequired', value: true },
  { id: 'wizard-priorities-noise', pattern: /\bnoise\b/i, domains: ['environment'], wizardStep: 'priorities', field: 'noiseConscious', value: true },
  { id: 'wizard-priorities-budget', pattern: /\bbudget\b/i, domains: ['environment'], wizardStep: 'priorities', field: 'budgetConstrained', value: true },
  { id: 'wizard-priorities-cheap', pattern: /\bcheap\b/i, domains: ['environment'], wizardStep: 'priorities', field: 'budgetConstrained', value: true },
  { id: 'wizard-priorities-first-time', pattern: /\b(first\s+time|never\s+grown|brand\s+new)\b/i, domains: ['phenotype'], wizardStep: 'priorities', field: 'trueFirstTimer', value: true },
  { id: 'wizard-priorities-previous', pattern: /\b(last\s+grow|previous|always\s+get|struggled?\s+with)\b/i, domains: ['health'], wizardStep: 'priorities', extract: 'previousProblem' },
  { id: 'wizard-priorities-overwater', pattern: /\b(overwater)/i, domains: ['watering', 'health'], wizardStep: 'priorities', field: 'previousProblems', value: 'overwatering' },
  { id: 'wizard-priorities-mold', pattern: /\b(mold|mould|bud\s*rot|botrytis)/i, domains: ['pest', 'health'], wizardStep: 'priorities', field: 'previousProblems', value: 'mold' },
  { id: 'wizard-priorities-gnats', pattern: /\b(gnats?|fungus\s+gnats?)/i, domains: ['pest'], wizardStep: 'priorities', field: 'previousProblems', value: 'fungus-gnats' },
  { id: 'wizard-priorities-mites', pattern: /\b(mites?|spider\s+mites?)/i, domains: ['pest'], wizardStep: 'priorities', field: 'previousProblems', value: 'spider-mites' },
  { id: 'wizard-priorities-calcium', pattern: /\b(calcium|cal[\s-]?mag)/i, domains: ['nutrients', 'health'], wizardStep: 'priorities', field: 'previousProblems', value: 'calcium-def' },
  { id: 'wizard-priorities-airy', pattern: /\b(airy\s+buds?|larfy)/i, domains: ['phenotype', 'health'], wizardStep: 'priorities', field: 'previousProblems', value: 'airy-buds' },

  // ─────────────────────────────────────────────────────────────────
  // Legacy note-context rules (section-03 port)
  // Ported verbatim from `docs/note-context-rules.js` — preserves array
  // declaration order exactly. These fire against plant/log/task notes
  // via `parseObservation` (not against wizard notes, which use the
  // wizardStep-filtered subset above).
  // ─────────────────────────────────────────────────────────────────

  /* ── Plant Type ── */
  { id: 'plantType-clone', pattern: /\bclones?\b/i, domains: ['phenotype'], field: 'plantType', value: 'clone' },
  { id: 'plantType-cutting', pattern: /\bcuttings?\b/i, domains: ['phenotype'], field: 'plantType', value: 'clone' },
  { id: 'plantType-seedling', pattern: /\bseedlings?\b/i, domains: ['phenotype'], field: 'plantType', value: 'seedling' },
  { id: 'plantType-sprout', pattern: /\bsprouts?\b/i, domains: ['phenotype'], field: 'plantType', value: 'seedling' },
  { id: 'plantType-seed', pattern: /\bseeds?\b/i, domains: ['phenotype'], field: 'plantType', value: 'seed' },
  { id: 'plantType-mother', pattern: /\b(mother\s+plant|mom\s+plant|mother\s+room|keeping\s+as\s+mother|keeping\s+a\s+mother)\b/i, domains: ['phenotype'], field: 'plantType', value: 'mother' },
  { id: 'plantType-autoflower', pattern: /\b(autoflowers?|auto[\s-]?flowers?|autos)\b/i, domains: ['phenotype'], field: 'plantType', value: 'autoflower' },
  { id: 'plantType-photoperiod', pattern: /\b(photoperiods?|photo[\s-]?periods?)\b/i, domains: ['phenotype'], field: 'plantType', value: 'photoperiod' },
  { id: 'plantType-feminized', pattern: /\b(feminized|fems?)\b/i, domains: ['phenotype'], field: 'plantType', value: 'feminized' },
  { id: 'plantType-regular', pattern: /\b(regular seeds?|reg seeds?)\b/i, domains: ['phenotype'], field: 'plantType', value: 'regular' },
  { id: 'plantType-bagseed', pattern: /\b(bag ?seeds?|bagseed)\b/i, domains: ['phenotype'], field: 'plantType', value: 'bagseed' },
  { id: 'plantType-clone2', pattern: /\brooted\s+cutting\b/i, domains: ['phenotype'], field: 'plantType', value: 'clone' },
  { id: 'plantType-auto2', pattern: /\bautomatic\b/i, domains: ['phenotype'], field: 'plantType', value: 'autoflower' },
  { id: 'plantType-photo2', pattern: /\b12\/12\s+from\s+seed\b/i, domains: ['phenotype'], field: 'plantType', value: 'photoperiod' },

  /* ── Timeline ── */
  { id: 'timeline-days-ago', pattern: /(\d+)\s*days?\s*ago/i, domains: ['timeline'], extract: 'days' },
  { id: 'timeline-days-old', pattern: /(\d+)\s*days?\s*old/i, domains: ['timeline'], extract: 'days' },
  { id: 'timeline-days-since', pattern: /(\d+)\s*days?\s*since/i, domains: ['timeline'], extract: 'days' },
  { id: 'timeline-weeks-ago', pattern: /(\d+)\s*weeks?\s*ago/i, domains: ['timeline'], extract: 'weeks-to-days' },
  { id: 'timeline-weeks-old', pattern: /(\d+)\s*weeks?\s*old/i, domains: ['timeline'], extract: 'weeks-to-days' },
  { id: 'timeline-months-ago', pattern: /(\d+)\s*months?\s*ago/i, domains: ['timeline'], field: 'timeline', value: 'chronic' },
  { id: 'timeline-hours-ago', pattern: /(\d+)\s*hours?\s*ago/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-yesterday', pattern: /since\s+yesterday/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-just-started', pattern: /just\s+(started|noticed|appeared|showed)/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-overnight', pattern: /overnight/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-suddenly', pattern: /suddenly/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-gradual', pattern: /gradually/i, domains: ['timeline'], field: 'timeline', value: 'gradual' },
  { id: 'timeline-few-hours', pattern: /\bfew\s+hours\b/i, domains: ['timeline'], field: 'timeline', value: 'recent' },
  { id: 'timeline-been-a-while', pattern: /\b(been\s+a\s+while|been\s+weeks|long\s+time)\b/i, domains: ['timeline'], field: 'timeline', value: 'chronic' },
  { id: 'timeline-slow', pattern: /\b(slowly|slow\s+progression)\b/i, domains: ['timeline'], field: 'timeline', value: 'gradual' },

  /* ── Scope ── */
  { id: 'scope-just-one', pattern: /\b(just\s+one|this\s+plant\s+only|only\s+this\s+plant)\b/i, domains: ['health'], field: 'scope', value: 'single-plant' },
  { id: 'scope-one-plant', pattern: /\bone\s+plant\s+only\b/i, domains: ['health'], field: 'scope', value: 'single-plant' },
  { id: 'scope-only-one', pattern: /\b(only\s+one|only\s+this)\b/i, domains: ['health'], field: 'scope', value: 'single-plant' },
  { id: 'scope-all-plants', pattern: /\b(all\s+(plants?|girls|them))\b/i, domains: ['health'], field: 'scope', value: 'all-plants' },
  { id: 'scope-every-plant', pattern: /\bevery\s+plant\b/i, domains: ['health'], field: 'scope', value: 'all-plants' },
  { id: 'scope-whole-tent', pattern: /\b(whole\s+tent|entire\s+tent|whole\s+room)\b/i, domains: ['health'], field: 'scope', value: 'all-plants' },
  { id: 'scope-spreading', pattern: /\bspreading\b/i, domains: ['health'], field: 'scope', value: 'spreading' },
  { id: 'scope-moving', pattern: /\bmoving\s+to\s+other\b/i, domains: ['health'], field: 'scope', value: 'spreading' },
  { id: 'scope-several', pattern: /\bseveral\s+plants?\b/i, domains: ['health'], field: 'scope', value: 'multiple' },
  { id: 'scope-few-plants', pattern: /\b(few|couple)\s+plants?\b/i, domains: ['health'], field: 'scope', value: 'multiple' },

  /* ── Growing Medium ── */
  { id: 'medium-soil', pattern: /\b(potting\s+soil|in\s+soil|soil\s+mix)\b/i, domains: ['environment'], field: 'medium', value: 'soil' },
  { id: 'medium-soil2', pattern: /\b(fox\s*farm|roots\s*organics|happy\s+frog|ocean\s+forest)\b/i, domains: ['environment'], field: 'medium', value: 'soil' },
  { id: 'medium-coco', pattern: /\b(coco\s+coir|coco)\b/i, domains: ['environment'], field: 'medium', value: 'coco' },
  { id: 'medium-perlite', pattern: /\bperlite\b/i, domains: ['environment'], field: 'medium', value: 'perlite-mix' },
  { id: 'medium-rockwool', pattern: /\brockwool\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-dwc', pattern: /\b(DWC|deep\s+water\s+culture)\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-rdwc', pattern: /\bRDWC\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-ebb-flow', pattern: /\b(ebb\s+(and|&)\s+flow|ebb\s+flow)\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-nft', pattern: /\bNFT\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-hydro', pattern: /\b(hydro|hydroponics)\b/i, domains: ['environment'], field: 'medium', value: 'hydro' },
  { id: 'medium-living-soil', pattern: /\bliving\s+soil\b/i, domains: ['environment'], field: 'medium', value: 'living-soil' },
  { id: 'medium-super-soil', pattern: /\bsuper\s+soil\b/i, domains: ['environment'], field: 'medium', value: 'living-soil' },
  { id: 'medium-no-till', pattern: /\bno[\s-]till\b/i, domains: ['environment'], field: 'medium', value: 'living-soil' },
  { id: 'medium-peat', pattern: /\b(peat\s+moss|peat\s+based|peat)\b/i, domains: ['environment'], field: 'medium', value: 'soilless' },

  /* ── Lighting ── */
  { id: 'lighting-led', pattern: /\bLEDs?\b|\bled\s+(?:lights?|panels?|bars?|strips?|grow|board|fixture)\b/, domains: ['environment'], field: 'lighting', value: 'led' },
  { id: 'lighting-qb', pattern: /\b(quantum\s+board|QB)\b/i, domains: ['environment'], field: 'lighting', value: 'led' },
  { id: 'lighting-cob', pattern: /\bCOB\b/i, domains: ['environment'], field: 'lighting', value: 'led' },
  { id: 'lighting-hps', pattern: /\bHPS\b/i, domains: ['environment'], field: 'lighting', value: 'hps' },
  { id: 'lighting-cmh', pattern: /\b(CMH|LEC)\b/i, domains: ['environment'], field: 'lighting', value: 'cmh' },
  { id: 'lighting-cfl', pattern: /\bCFL\b/i, domains: ['environment'], field: 'lighting', value: 'cfl' },
  { id: 'lighting-fluorescent', pattern: /\bfluorescent\b/i, domains: ['environment'], field: 'lighting', value: 'cfl' },
  { id: 'lighting-sunlight', pattern: /\b(sunlight|outdoor|outside|greenhouse)\b/i, domains: ['environment'], field: 'lighting', value: 'sunlight' },
  { id: 'lighting-t5', pattern: /\b(T5|T8)\b/i, domains: ['environment'], field: 'lighting', value: 'cfl' },
  { id: 'lighting-mh', pattern: /\b(metal\s+halide|MH)\b/i, domains: ['environment'], field: 'lighting', value: 'hps' },

  /* ── Environment Numbers ── */
  { id: 'env-temp-f', pattern: /\b([5-9]\d|1[0-2]\d)\s*(?:deg(?:rees)?|°)?\s*F\b/i, domains: ['environment'], extract: 'temp-f' },
  { id: 'env-temp-c', pattern: /\b([1-4]\d)\s*(?:deg(?:rees)?|°)?\s*C\b/i, domains: ['environment'], extract: 'temp' },
  { id: 'env-rh-label', pattern: /\bRH\s+(\d{1,3})%?/i, domains: ['environment'], extract: 'rh' },
  { id: 'env-rh-pct', pattern: /(\d{1,3})%\s*RH\b/i, domains: ['environment'], extract: 'rh' },
  { id: 'env-ph-before', pattern: /\bpH\b[^\d\n]{0,20}(\d+(?:\.\d+)?)/i, domains: ['nutrients'], extract: 'ph' },
  { id: 'env-ph-after', pattern: /(\d+(?:\.\d+)?)\s*pH\b/i, domains: ['nutrients'], extract: 'ph' },
  { id: 'env-ec-label', pattern: /\bEC\s+(\d+\.?\d*)/i, domains: ['nutrients'], extract: 'ec' },
  { id: 'env-ppm-after', pattern: /(\d{2,4})\s*(PPM|ppm)\b/, domains: ['nutrients'], field: 'ec', value: 'ppm-noted' },
  { id: 'env-ppm-before', pattern: /\b(PPM|ppm)\s+(\d{2,4})\b/, domains: ['nutrients'], field: 'ec', value: 'ppm-noted' },
  { id: 'env-tds', pattern: /(\d{2,4})\s*TDS\b/i, domains: ['nutrients'], field: 'ec', value: 'ppm-noted' },

  /* ── Watering ── */
  { id: 'watering-daily', pattern: /\b(water\s+daily|watering\s+daily|watered\s+every\s+day)\b/i, domains: ['watering'], field: 'wateringPattern', value: 'daily' },
  { id: 'watering-interval', pattern: /water(?:ing|ed)?\s+every\s+(\d+)\s+days?/i, domains: ['watering'], field: 'wateringPattern', value: 'interval' },
  { id: 'watering-when-dry', pattern: /\b(when\s+(top\s+)?dry|water\s+when\s+dry|let\s+it\s+dry)\b/i, domains: ['watering'], field: 'wateringPattern', value: 'when-dry' },
  { id: 'watering-just-watered', pattern: /\b(just\s+watered|watered\s+(this\s+morning|today|yesterday))\b/i, domains: ['watering'], field: 'wateringPattern', value: 'just-watered' },
  { id: 'watering-dryback', pattern: /\b(dry[-\s]?back|dryback)\b/i, domains: ['watering'], field: 'wateringPattern', value: 'dryback' },
  { id: 'watering-bottom', pattern: /\bbottom\s+water(ing)?\b/i, domains: ['watering'], field: 'wateringPattern', value: 'bottom-water' },
  { id: 'watering-overwatered', pattern: /\boverwater(ed|ing)?\b/i, domains: ['watering'], field: 'wateringPattern', value: 'overwatered' },
  { id: 'watering-underwatered', pattern: /\bunderwater(ed|ing)?\b/i, domains: ['watering'], field: 'wateringPattern', value: 'underwatered' },

  /* ── Previous Treatments ── */
  { id: 'treatment-calmag', pattern: /\b(cal[-\s]?mag|calmag)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'calmag' },
  { id: 'treatment-epsom', pattern: /\b(epsom\s+salt|epsom)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'epsom' },
  { id: 'treatment-flush', pattern: /\b(flush(ed|ing)?)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'flush' },
  { id: 'treatment-neem', pattern: /\b(neem\s+oil|neem)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'neem' },
  { id: 'treatment-peroxide', pattern: /\b(h2o2|hydrogen\s+peroxide|peroxide)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'peroxide' },
  { id: 'treatment-spinosad', pattern: /\bspinosad\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'spinosad' },
  { id: 'treatment-avid', pattern: /\babamectin\b|\b(?:used|applied|sprayed|tried)\s+avid\b|\bavid\s+(?:spray|application|drench|treatment|dip|miticide)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'avid' },
  { id: 'treatment-recent-feed', pattern: /\bfed\s+(yesterday|today|recently|this\s+week)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'recent-feed' },
  { id: 'treatment-increased-nutes', pattern: /\b(increased|bumped\s+up|raised)\s+(nutes|nutrients|feed)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'increased-nutes' },
  { id: 'treatment-decreased-nutes', pattern: /\b(decreased|lowered|cut\s+back|reduced)\s+(nutes|nutrients|feed)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'decreased-nutes' },
  { id: 'treatment-foliar', pattern: /\bfoliar\s+(spray|feed|application)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'foliar' },
  { id: 'treatment-topdress', pattern: /\b(top[-\s]?dress(ing|ed)?|topdress)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'topdress' },
  { id: 'treatment-bti', pattern: /\b(BTi|gnatrol|mosquito\s+bits|dunks)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'bti' },
  { id: 'treatment-predators', pattern: /\b(beneficial\s+(insects|nematodes)|predatory\s+mites|hypoaspis)\b/i, domains: ['action-taken'], field: 'previousTreatment', value: 'beneficials' },

  /* ── Severity ── */
  { id: 'severity-worsening', pattern: /\b(getting\s+worse|worsening|progressing)\b/i, domains: ['health'], field: 'severity', value: 'worsening' },
  { id: 'severity-mild', pattern: /\b(mild|slight|minor)\b/i, domains: ['health'], field: 'severity', value: 'mild' },
  { id: 'severity-severe', pattern: /\b(severe|(?:really|very)\s+bad|heavy\s+(?:damage|infestation|deficiency|burn|stress))\b/i, domains: ['health'], field: 'severity', value: 'severe' },
  { id: 'severity-early', pattern: /\b(just\s+started|early\s+stage|caught\s+early)\b/i, domains: ['health'], field: 'severity', value: 'early' },
  { id: 'severity-chronic', pattern: /\b(been\s+a\s+while|weeks\s+now|chronic|persistent)\b/i, domains: ['health'], field: 'severity', value: 'chronic' },
  { id: 'severity-rapid', pattern: /\b(rapidly|fast|quickly|overnight)\b/i, domains: ['health'], field: 'severity', value: 'rapid' },
  { id: 'severity-slowly', pattern: /\b(slowly|gradual)\b/i, domains: ['health'], field: 'severity', value: 'slow' },
  { id: 'severity-spreading', pattern: /\b(spreading|spreading\s+fast)\b/i, domains: ['health'], field: 'severity', value: 'worsening' },

  /* ── Grower Intent ── */
  { id: 'intent-rare', pattern: /\b(rare|hard\s+to\s+find|limited)\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-cant-lose', pattern: /\b(can't\s+lose|cannot\s+lose)\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-valuable', pattern: /\bvaluable\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-keeper', pattern: /\bkeeper\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-irreplaceable', pattern: /\birreplaceable\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-special', pattern: /\bspecial\s+(plant|cut|clone|pheno|phenotype)\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'preserve' },
  { id: 'intent-test-plant', pattern: /\b(test\s+(plant|run)|trial\s+plant)\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'expendable' },
  { id: 'intent-dont-care', pattern: /\b(don't\s+care|doesn't\s+matter)\b/i, domains: ['phenotype'], field: 'growerIntent', value: 'expendable' },

  /* ── Plant Health Context ── */
  { id: 'health-otherwise-healthy', pattern: /\b(healthy\s+otherwise|otherwise\s+healthy|rest\s+look(s)?\s+healthy)\b/i, domains: ['health'], field: 'plantHealth', value: 'otherwise-healthy' },
  { id: 'health-vigorous', pattern: /\b(vigorous|explosive\s+growth|growing\s+fast)\b/i, domains: ['health'], field: 'plantHealth', value: 'vigorous' },
  { id: 'health-slow-grower', pattern: /\b(slow\s+grower|slow\s+growth|growing\s+slow)\b/i, domains: ['health'], field: 'plantHealth', value: 'slow-grower' },
  { id: 'health-stunted', pattern: /\bstunted\b/i, domains: ['health'], field: 'plantHealth', value: 'stunted' },
  { id: 'health-recovering', pattern: /\b(recovering|bouncing\s+back|coming\s+back)\b/i, domains: ['health'], field: 'plantHealth', value: 'recovering' },
  { id: 'health-stressed', pattern: /\bstressed\b/i, domains: ['health'], field: 'plantHealth', value: 'stressed' },

  /* ── Symptom Location ── */
  { id: 'location-bottom', pattern: /\b(bottom\s+leaves?|lower\s+leaves?|lower\s+canopy|fan\s+leaves?\s+at\s+bottom)\b/i, domains: ['health'], field: 'symptomLocation', value: 'bottom' },
  { id: 'location-top', pattern: /\b(top\s+leaves?|new\s+growth|growing\s+tips?|upper\s+canopy)\b/i, domains: ['health'], field: 'symptomLocation', value: 'top' },
  { id: 'location-one-side', pattern: /\b(one\s+side|only\s+on\s+one\s+side)\b/i, domains: ['health'], field: 'symptomLocation', value: 'one-side' },

  /* ── Recent Events ── */
  { id: 'event-transplant', pattern: /\b(after\s+transplant(ing)?|just\s+transplanted|recently\s+transplanted|transplanted\s+already|already\s+transplanted)\b/i, domains: ['action-taken'], field: 'recentEvent', value: 'transplant' },
  { id: 'event-topping', pattern: /\b(after\s+topping|just\s+topped|recently\s+topped)\b/i, domains: ['action-taken'], field: 'recentEvent', value: 'topping' },
  { id: 'event-defoliation', pattern: /\b(after\s+defoliation|defoliated|lollipop(ped)?)\b/i, domains: ['action-taken'], field: 'recentEvent', value: 'defoliation' },
  { id: 'event-flip', pattern: /\b(after\s+(the\s+)?flip|switched\s+to\s+(12\/12|flower)|flipped)\b/i, domains: ['action-taken'], field: 'recentEvent', value: 'flip' },

  /* ── Environmental Events ── */
  { id: 'env-power-outage', pattern: /\b(power\s+outage|power\s+cut|power\s+failure)\b/i, domains: ['environment'], field: 'envEvent', value: 'power-outage' },
  { id: 'env-heatwave', pattern: /\bheat\s+wave\b/i, domains: ['environment'], field: 'envEvent', value: 'heatwave' },
  { id: 'env-ac-failed', pattern: /\b(AC\s+(broke|failed|died)|air\s+conditioning\s+(broke|failed))\b/i, domains: ['environment'], field: 'envEvent', value: 'ac-failure' },
  { id: 'env-light-leak', pattern: /\blight\s+leak\b/i, domains: ['environment'], field: 'envEvent', value: 'light-leak' },
  { id: 'env-timer-issue', pattern: /\b(timer\s+(issue|fail(ed)?|problem)|timer\s+went\s+off)\b/i, domains: ['environment'], field: 'envEvent', value: 'timer-issue' },
  { id: 'env-cold-snap', pattern: /\b(cold\s+snap|temperature\s+dropped|freeze)\b/i, domains: ['environment'], field: 'envEvent', value: 'cold-snap' },
  { id: 'env-foul-smell', pattern: /\b(smells?\s+(bad|foul|rotten|musty)|foul\s+smell|bad\s+odor)\b/i, domains: ['environment', 'aroma'], field: 'envEvent', value: 'foul-smell' },
  { id: 'env-water-leak', pattern: /\b(water\s+leak|flooding|flood|reservoir\s+leaked)\b/i, domains: ['environment'], field: 'envEvent', value: 'water-leak' },

  /* ── Root Observations ── */
  { id: 'root-bound', pattern: /\b(root[-\s]?bound|pot\s+bound|root\s+bound)\b/i, domains: ['root'], field: 'rootHealth', value: 'root-bound' },
  { id: 'root-developing', pattern: /\b(roots?\s+(building|develop|grow|coming|establish|form)ing?\s*(up|out|in)?)\b/i, domains: ['root'], field: 'rootHealth', value: 'roots-developing' },
  { id: 'root-established', pattern: /\b(rooted|established|root\s*bound|roots?\s+everywhere|roots?\s+filling)\b/i, domains: ['root'], field: 'rootHealth', value: 'roots-established' },
  { id: 'root-white', pattern: /\bwhite\s+roots\b/i, domains: ['root'], field: 'rootHealth', value: 'healthy-roots' },
  { id: 'root-brown', pattern: /\bbrown\s+roots\b/i, domains: ['root'], field: 'rootHealth', value: 'brown-roots' },
  { id: 'root-slimy', pattern: /\b(slimy\s+roots?|root\s+slime)\b/i, domains: ['root'], field: 'rootHealth', value: 'slimy-roots' },
  { id: 'root-smell', pattern: /\b(smell\s+(from|in)\s+roots?|roots?\s+smell)\b/i, domains: ['root'], field: 'rootHealth', value: 'root-smell' },

  /* ── Feed Type ── */
  { id: 'feed-organic', pattern: /\b(organic\s+(nutes|nutrients|fertilizer))\b/i, domains: ['nutrients'], field: 'feedType', value: 'organic' },
  { id: 'feed-amended', pattern: /\b(amended|pre[\s-]?amended)\b/i, domains: ['nutrients'], field: 'feedType', value: 'organic' },
  { id: 'feed-synthetic', pattern: /\b(synthetic|salt[\s-]?based|mineral\s+nutes)\b/i, domains: ['nutrients'], field: 'feedType', value: 'synthetic' },
  { id: 'feed-bottled', pattern: /\bbottled\s+nutes\b/i, domains: ['nutrients'], field: 'feedType', value: 'synthetic' },
  { id: 'feed-worm-castings', pattern: /\bworm\s+castings\b/i, domains: ['nutrients'], field: 'feedType', value: 'organic' },
  { id: 'feed-compost-tea', pattern: /\bcompost\s+tea\b/i, domains: ['nutrients'], field: 'feedType', value: 'organic' },
  { id: 'feed-synthetic2', pattern: /\b(general\s+hydroponics|advanced\s+nutrients|botanicare|canna)\b/i, domains: ['nutrients'], field: 'feedType', value: 'synthetic' },

  /* ── Water Type ── */
  { id: 'water-ro', pattern: /\b(RO\s+water|reverse\s+osmosis)\b/i, domains: ['nutrients'], field: 'waterType', value: 'ro' },
  { id: 'water-ro-system', pattern: /\bRO\s+system\b/i, domains: ['nutrients'], field: 'waterType', value: 'ro' },
  { id: 'water-tap', pattern: /\btap\s+water\b/i, domains: ['nutrients'], field: 'waterType', value: 'tap' },

  /* ── Growth Stage Detection ── */
  { id: 'stage-veg', pattern: /\b(?:in\s+|into\s+|start\s+|ready\s+for\s+)?veg(?:etative|gie|ging)?\s*(?:stage|phase)?\b/i, domains: ['timeline'], field: 'stage', value: 'veg' },
  { id: 'stage-flower', pattern: /\b(?:in\s+)?flower(?:ing)?\s*(?:stage|phase)?\b/i, domains: ['timeline'], field: 'stage', value: 'flower' },
  { id: 'stage-flower-week', pattern: /\bweek\s*(\d+)\s*(?:of\s*)?(?:flower|bloom)\b/i, domains: ['timeline'], extract: 'weeks' },
  { id: 'stage-late-flower', pattern: /\b(?:late\s+flower|last\s+weeks?|final\s+weeks?|almost\s+done)\b/i, domains: ['timeline'], field: 'stage', value: 'late-flower' },
  { id: 'stage-early-flower', pattern: /\b(?:early\s+flower|just\s+flipped|first\s+weeks?)\b/i, domains: ['timeline'], field: 'stage', value: 'early-flower' },
  { id: 'stage-mid-flower', pattern: /\b(?:mid[\s-]*flower|week\s*[45])\b/i, domains: ['timeline'], field: 'stage', value: 'mid-flower' },
  { id: 'stage-day-count', pattern: /\bday\s*(\d+)\b/i, domains: ['timeline'], extract: 'days' },
];

/**
 * Rule id → domain(s). Convenience lookup for merge.js / task-engine /
 * parseObservation. Derived once at module init.
 * @type {Object<string, string[]>}
 */
export const DOMAIN_BY_RULE_ID = (() => {
  const map = {};
  for (const r of KEYWORD_PATTERNS) {
    map[r.id] = r.domains;
  }
  return map;
})();

/**
 * Rules whose match should force-override structured/sensor data and
 * bypass recency decay in merge weighting. Franco (the practitioner
 * advisor) treats these as survival-critical signals.
 *
 * NOTE: the original plan (claude-plan.md §4a) references rule-id
 * prefixes (`stress-heat-*`, `stress-overwater-*`, `root-rot-*`,
 * `hermie-*`) that do NOT exist in the ported legacy ruleset. We map to
 * the nearest semantic equivalents from the actual rule ids so the
 * override still fires on the phrases Franco cares about. If a future
 * section adds dedicated heat-stress / root-rot rules, extend this set.
 *
 * @type {Set<string>}
 */
export const FRANCO_OVERRIDE_RULE_IDS = new Set([
  // heat stress (legacy: env-heatwave / ac-failed)
  'env-heatwave',
  'env-ac-failed',
  // overwater / root-rot cluster
  'watering-overwatered',
  'root-brown',
  'root-slimy',
  'root-smell',
  // drought / severe cold
  'watering-underwatered',
  'env-cold-snap',
]);

// ── Severity heuristics ────────────────────────────────────────────
//
// Phrase → severity mapping used by `parseObservation` to auto-infer
// severity when the observation has no explicit severity on entry.
// Each entry: { regex, severity } where severity ∈ 'alert'|'watch'|'info'.
//
// The legacy `/\bbad|terrible|worst\b/i` bug form only anchors the first
// and last alternatives — we ship the grouped form `\b(bad|terrible|worst)\b`
// so every alternative is word-bounded.

/** @type {Array<{regex:RegExp, severity:'alert'|'watch'|'info'}>} */
export const SEVERITY_HEURISTICS = [
  // Alert — urgent intervention required
  { regex: /\b(dying|dead)\b/i,                                                  severity: 'alert' },
  { regex: /\bcollapsing\b/i,                                                    severity: 'alert' },
  { regex: /\b(bad|terrible|worst)\b/i,                                          severity: 'alert' },
  { regex: /\b(severe|severely)\b/i,                                             severity: 'alert' },
  { regex: /\b(wilting|wilted)\b/i,                                              severity: 'alert' },
  { regex: /\bleaves?\s+falling\b/i,                                             severity: 'alert' },
  { regex: /\b(infest(ed|ation)|crawling\s+with)\b/i,                            severity: 'alert' },
  { regex: /\broot\s+rot\b/i,                                                    severity: 'alert' },
  { regex: /\bburnt?\s+(tips?|leaves?|to\s+a\s+crisp)\b/i,                       severity: 'alert' },
  { regex: /\b(hermie|herm(ed|ing)?|nanners?|bananas?)\b/i,                      severity: 'alert' },

  // Watch — monitor, non-lethal but concerning
  { regex: /\byellow(ing|ed)?\b/i,                                               severity: 'watch' },
  { regex: /\b(droop(y|ing)?|sagging)\b/i,                                       severity: 'watch' },
  { regex: /\b(slight(ly)?|mild(ly)?|minor)\b/i,                                 severity: 'watch' },
  { regex: /\bspots?\b/i,                                                        severity: 'watch' },
  { regex: /\bcurling\b/i,                                                       severity: 'watch' },
  { regex: /\b(stressed|stress)\b/i,                                             severity: 'watch' },
  { regex: /\b(not\s+sure|might\s+be|maybe)\b/i,                                 severity: 'watch' },

  // Info — positive/neutral, nothing to escalate
  { regex: /\b(looks?\s+(fine|great|good|healthy)|everything\s+fine)\b/i,        severity: 'info' },
  { regex: /\b(doing\s+(great|well|fine)|happy|thriving)\b/i,                    severity: 'info' },
];

/**
 * Action-taken detection table. Keys are task types the engine cares
 * about; values are regexes that, if found in an observation's rawText
 * OR parsed keyword hits, indicate the user has already performed the
 * action.
 *
 * Consumed by `merge.js` → `findActionsTakenSince(taskType, ...)` which
 * looks up `ACTION_TAKEN_PATTERNS[taskType]` directly. Do NOT reshape
 * this export without updating that consumer.
 *
 * @type {Object<string, RegExp>}
 */
export const ACTION_TAKEN_PATTERNS = {
  water:      /\b(watered|watering|gave\s+\d+\s*ml|drench|soak)\b/i,
  feed:       /\b(fed|feeding|nutes|nutrients|fertili[sz]ed)\b/i,
  flush:      /\b(flush(ed|ing)?|plain\s+water)\b/i,
  ipm:        /\b(sprayed|neem|ipm|preventive\s+spray|pesticide)\b/i,
  defoliate:  /\b(defoliat(ed|ion)|lollipop(ped|ing)?|stripped)\b/i,
  top:        /\b(topp(ed|ing)|fimm(ed|ing)?|pinch(ed|ing)?)\b/i,
};

// ── Extract handlers ───────────────────────────────────────────────
//
// Dispatchers for legacy-rule `extract` types. Each handler pulls
// capture group 1 (or 2) from the regex match and writes to both the
// legacy-flat ctx field (ph, temp, rh, ec, stage, timeline, flowerWeek)
// and the §4a-shaped extracted field (phExtracted, tempExtracted, …)
// so consumers of either schema see the same value.
//
// Handlers mutate `ctx` in place. Throwing is caught by the caller and
// recorded in `obs.parsed.ruleErrors` / the index's `ruleErrors[]`.

const EXTRACT_HANDLERS = {
  'days': (match, ctx) => {
    if (match[1] == null) return;
    const days = parseInt(match[1], 10);
    if (Number.isNaN(days)) return;
    ctx.timelineDays = days;
    if (days <= 7) ctx.timeline = 'recent';
    else if (days <= 28) ctx.timeline = 'ongoing';
    else ctx.timeline = 'chronic';
  },
  'weeks-to-days': (match, ctx) => {
    if (match[1] == null) return;
    const weeks = parseInt(match[1], 10);
    if (Number.isNaN(weeks)) return;
    const days = weeks * 7;
    ctx.timelineDays = days;
    if (days <= 7) ctx.timeline = 'recent';
    else if (days <= 28) ctx.timeline = 'ongoing';
    else ctx.timeline = 'chronic';
  },
  'temp': (match, ctx) => {
    if (match[1] == null) return;
    const t = parseFloat(match[1]);
    if (Number.isNaN(t)) return;
    ctx.temp = t;
    ctx.tempExtracted = t;
  },
  'temp-f': (match, ctx) => {
    if (match[1] == null) return;
    const f = parseFloat(match[1]);
    if (Number.isNaN(f)) return;
    const c = Math.round(((f - 32) * 5 / 9) * 10) / 10;
    ctx.temp = c;
    ctx.tempExtracted = c;
  },
  'rh': (match, ctx) => {
    if (match[1] == null) return;
    const rh = parseFloat(match[1]);
    if (Number.isNaN(rh)) return;
    ctx.rh = rh;
    ctx.rhExtracted = rh;
  },
  'ph': (match, ctx) => {
    if (match[1] == null) return;
    const ph = parseFloat(match[1]);
    if (Number.isNaN(ph)) return;
    ctx.ph = ph;
    ctx.phExtracted = ph;
  },
  'ec': (match, ctx) => {
    if (match[1] == null) return;
    const ec = parseFloat(match[1]);
    if (Number.isNaN(ec)) return;
    ctx.ec = ec;
    ctx.ecExtracted = ec;
  },
  'weeks': (match, ctx) => {
    if (match[1] == null) return;
    const w = parseInt(match[1], 10);
    if (Number.isNaN(w)) return;
    ctx.flowerWeek = w;
    if (!ctx.stage) {
      if (w <= 3) ctx.stage = 'early-flower';
      else if (w <= 6) ctx.stage = 'mid-flower';
      else ctx.stage = 'late-flower';
    }
  },
};

/**
 * Apply a single matched legacy rule to `ctx`. Wizard rules use their
 * own dispatcher in `index.js` (`_handleWizardExtract`) — this helper is
 * only for the non-wizard rule set consumed by `parseObservation`.
 *
 * @param {KeywordRule} rule
 * @param {RegExpMatchArray} match
 * @param {Object} ctx
 */
export function applyLegacyRule(rule, match, ctx) {
  if (rule.extract) {
    const handler = EXTRACT_HANDLERS[rule.extract];
    if (handler) handler(match, ctx);
    return;
  }
  if (rule.field && rule.value !== undefined) {
    ctx[rule.field] = rule.value;
    // §4a superset mirror: waterType → waterSource (same semantics,
    // different name in the plan spec).
    if (rule.field === 'waterType') {
      ctx.waterSource = rule.value;
    }
  }
}
