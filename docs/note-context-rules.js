/**
 * note-context-rules.js
 * Knowledge base for the GrowDoc note-aware cannabis plant diagnosis engine.
 * Consumed by: extractNoteContext, generateContextualAdvice, adjustScoresFromNotes
 * in tool-plant-doctor.html.
 *
 * ES5 compatible — no const/let, no arrow functions, no template literals.
 * Must be loaded via <script> before tool-plant-doctor.html runs those functions.
 */

/* ==========================================================================
   SECTION 1: KEYWORD_PATTERNS
   Array of pattern objects. Each has:
     pattern  {RegExp}  — tested against concatenated note text
     field    {string}  — ctx property to write to (when using .value)
     value    {string}  — value to assign to ctx[field]
     extract  {string}  — special extraction type: 'days'|'temp'|'rh'|'ph'|'ec'
     id       {string}  — pushed into ctx.keywords for downstream use
   ========================================================================== */

var KEYWORD_PATTERNS = [

  /* ── Plant Type ── */
  {
    id: 'plantType-clone',
    pattern: /\bclones?\b/i,
    field: 'plantType',
    value: 'clone'
  },
  {
    id: 'plantType-cutting',
    pattern: /\bcuttings?\b/i,
    field: 'plantType',
    value: 'clone'
  },
  {
    id: 'plantType-seedling',
    pattern: /\bseedlings?\b/i,
    field: 'plantType',
    value: 'seedling'
  },
  {
    id: 'plantType-sprout',
    pattern: /\bsprouts?\b/i,
    field: 'plantType',
    value: 'seedling'
  },
  {
    id: 'plantType-seed',
    pattern: /\bseeds?\b/i,
    field: 'plantType',
    value: 'seed'
  },
  {
    id: 'plantType-mother',
    pattern: /\b(mother\s+plant|mom\s+plant|mother\s+room|keeping\s+as\s+mother|keeping\s+a\s+mother)\b/i,
    field: 'plantType',
    value: 'mother'
  },
  {
    id: 'plantType-autoflower',
    pattern: /\b(autoflowers?|auto[\s-]?flowers?|autos)\b/i,
    field: 'plantType',
    value: 'autoflower'
  },
  {
    id: 'plantType-photoperiod',
    pattern: /\b(photoperiods?|photo[\s-]?periods?)\b/i,
    field: 'plantType',
    value: 'photoperiod'
  },
  {
    id: 'plantType-feminized',
    pattern: /\b(feminized|fems?)\b/i,
    field: 'plantType',
    value: 'feminized'
  },
  {
    id: 'plantType-regular',
    pattern: /\b(regular seeds?|reg seeds?)\b/i,
    field: 'plantType',
    value: 'regular'
  },
  {
    id: 'plantType-bagseed',
    pattern: /\b(bag ?seeds?|bagseed)\b/i,
    field: 'plantType',
    value: 'bagseed'
  },
  {
    id: 'plantType-clone2',
    pattern: /\brooted\s+cutting\b/i,
    field: 'plantType',
    value: 'clone'
  },
  {
    id: 'plantType-auto2',
    pattern: /\bautomatic\b/i,
    field: 'plantType',
    value: 'autoflower'
  },
  {
    id: 'plantType-photo2',
    pattern: /\b12\/12\s+from\s+seed\b/i,
    field: 'plantType',
    value: 'photoperiod'
  },

  /* ── Timeline ── */
  {
    id: 'timeline-days-ago',
    pattern: /(\d+)\s*days?\s*ago/i,
    extract: 'days'
  },
  {
    id: 'timeline-days-old',
    pattern: /(\d+)\s*days?\s*old/i,
    extract: 'days'
  },
  {
    id: 'timeline-days-since',
    pattern: /(\d+)\s*days?\s*since/i,
    extract: 'days'
  },
  {
    id: 'timeline-weeks-ago',
    pattern: /(\d+)\s*weeks?\s*ago/i,
    extract: 'weeks-to-days'
  },
  {
    id: 'timeline-weeks-old',
    pattern: /(\d+)\s*weeks?\s*old/i,
    extract: 'weeks-to-days'
  },
  {
    id: 'timeline-months-ago',
    pattern: /(\d+)\s*months?\s*ago/i,
    field: 'timeline',
    value: 'chronic'
  },
  {
    id: 'timeline-hours-ago',
    pattern: /(\d+)\s*hours?\s*ago/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-yesterday',
    pattern: /since\s+yesterday/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-just-started',
    pattern: /just\s+(started|noticed|appeared|showed)/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-overnight',
    pattern: /overnight/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-suddenly',
    pattern: /suddenly/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-gradual',
    pattern: /gradually/i,
    field: 'timeline',
    value: 'gradual'
  },
  {
    id: 'timeline-few-hours',
    pattern: /\bfew\s+hours\b/i,
    field: 'timeline',
    value: 'recent'
  },
  {
    id: 'timeline-been-a-while',
    pattern: /\b(been\s+a\s+while|been\s+weeks|long\s+time)\b/i,
    field: 'timeline',
    value: 'chronic'
  },
  {
    id: 'timeline-slow',
    pattern: /\b(slowly|slow\s+progression)\b/i,
    field: 'timeline',
    value: 'gradual'
  },

  /* ── Scope ── */
  {
    id: 'scope-just-one',
    pattern: /\b(just\s+one|this\s+plant\s+only|only\s+this\s+plant)\b/i,
    field: 'scope',
    value: 'single-plant'
  },
  {
    id: 'scope-one-plant',
    pattern: /\bone\s+plant\s+only\b/i,
    field: 'scope',
    value: 'single-plant'
  },
  {
    id: 'scope-only-one',
    pattern: /\b(only\s+one|only\s+this)\b/i,
    field: 'scope',
    value: 'single-plant'
  },
  {
    id: 'scope-all-plants',
    pattern: /\b(all\s+(plants?|girls|them))\b/i,
    field: 'scope',
    value: 'all-plants'
  },
  {
    id: 'scope-every-plant',
    pattern: /\bevery\s+plant\b/i,
    field: 'scope',
    value: 'all-plants'
  },
  {
    id: 'scope-whole-tent',
    pattern: /\b(whole\s+tent|entire\s+tent|whole\s+room)\b/i,
    field: 'scope',
    value: 'all-plants'
  },
  {
    id: 'scope-spreading',
    pattern: /\bspreading\b/i,
    field: 'scope',
    value: 'spreading'
  },
  {
    id: 'scope-moving',
    pattern: /\bmoving\s+to\s+other\b/i,
    field: 'scope',
    value: 'spreading'
  },
  {
    id: 'scope-several',
    pattern: /\bseveral\s+plants?\b/i,
    field: 'scope',
    value: 'multiple'
  },
  {
    id: 'scope-few-plants',
    pattern: /\b(few|couple)\s+plants?\b/i,
    field: 'scope',
    value: 'multiple'
  },

  /* ── Growing Medium ── */
  {
    id: 'medium-soil',
    pattern: /\b(potting\s+soil|in\s+soil|soil\s+mix)\b/i,
    field: 'medium',
    value: 'soil'
  },
  {
    id: 'medium-soil2',
    pattern: /\b(fox\s*farm|roots\s*organics|happy\s+frog|ocean\s+forest)\b/i,
    field: 'medium',
    value: 'soil'
  },
  {
    id: 'medium-coco',
    pattern: /\b(coco\s+coir|coco)\b/i,
    field: 'medium',
    value: 'coco'
  },
  {
    id: 'medium-perlite',
    pattern: /\bperlite\b/i,
    field: 'medium',
    value: 'perlite-mix'
  },
  {
    id: 'medium-rockwool',
    pattern: /\brockwool\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-dwc',
    pattern: /\b(DWC|deep\s+water\s+culture)\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-rdwc',
    pattern: /\bRDWC\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-ebb-flow',
    pattern: /\b(ebb\s+(and|&)\s+flow|ebb\s+flow)\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-nft',
    pattern: /\bNFT\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-hydro',
    pattern: /\b(hydro|hydroponics)\b/i,
    field: 'medium',
    value: 'hydro'
  },
  {
    id: 'medium-living-soil',
    pattern: /\bliving\s+soil\b/i,
    field: 'medium',
    value: 'living-soil'
  },
  {
    id: 'medium-super-soil',
    pattern: /\bsuper\s+soil\b/i,
    field: 'medium',
    value: 'living-soil'
  },
  {
    id: 'medium-no-till',
    pattern: /\bno[\s-]till\b/i,
    field: 'medium',
    value: 'living-soil'
  },
  {
    id: 'medium-peat',
    pattern: /\b(peat\s+moss|peat\s+based|peat)\b/i,
    field: 'medium',
    value: 'soilless'
  },

  /* ── Lighting ── */
  {
    id: 'lighting-led',
    pattern: /\bLEDs?\b|\bled\s+(?:lights?|panels?|bars?|strips?|grow|board|fixture)\b/,
    field: 'lighting',
    value: 'led'
  },
  {
    id: 'lighting-qb',
    pattern: /\b(quantum\s+board|QB)\b/i,
    field: 'lighting',
    value: 'led'
  },
  {
    id: 'lighting-cob',
    pattern: /\bCOB\b/i,
    field: 'lighting',
    value: 'led'
  },
  {
    id: 'lighting-hps',
    pattern: /\bHPS\b/i,
    field: 'lighting',
    value: 'hps'
  },
  {
    id: 'lighting-cmh',
    pattern: /\b(CMH|LEC)\b/i,
    field: 'lighting',
    value: 'cmh'
  },
  {
    id: 'lighting-cfl',
    pattern: /\bCFL\b/i,
    field: 'lighting',
    value: 'cfl'
  },
  {
    id: 'lighting-fluorescent',
    pattern: /\bfluorescent\b/i,
    field: 'lighting',
    value: 'cfl'
  },
  {
    id: 'lighting-sunlight',
    pattern: /\b(sunlight|outdoor|outside|greenhouse)\b/i,
    field: 'lighting',
    value: 'sunlight'
  },
  {
    id: 'lighting-t5',
    pattern: /\b(T5|T8)\b/i,
    field: 'lighting',
    value: 'cfl'
  },
  {
    id: 'lighting-mh',
    pattern: /\b(metal\s+halide|MH)\b/i,
    field: 'lighting',
    value: 'hps'
  },

  /* ── Environment Numbers ── */
  {
    id: 'env-temp-f',
    pattern: /\b([5-9]\d|1[0-2]\d)\s*(?:deg(?:rees)?|°)?\s*F\b/i,
    extract: 'temp-f'
  },
  {
    id: 'env-temp-c',
    pattern: /\b([1-4]\d)\s*(?:deg(?:rees)?|°)?\s*C\b/i,
    extract: 'temp'
  },
  {
    id: 'env-rh-label',
    pattern: /\bRH\s+(\d{1,3})%?/i,
    extract: 'rh'
  },
  {
    id: 'env-rh-pct',
    pattern: /(\d{1,3})%\s*RH\b/i,
    extract: 'rh'
  },
  {
    id: 'env-ph-before',
    pattern: /\bpH\s*(\d\.?\d*)/i,
    extract: 'ph'
  },
  {
    id: 'env-ph-after',
    pattern: /(\d\.?\d*)\s*pH\b/i,
    extract: 'ph'
  },
  {
    id: 'env-ec-label',
    pattern: /\bEC\s+(\d+\.?\d*)/i,
    extract: 'ec'
  },
  {
    id: 'env-ppm-after',
    pattern: /(\d{2,4})\s*(PPM|ppm)\b/,
    field: 'ec',
    value: 'ppm-noted'
  },
  {
    id: 'env-ppm-before',
    pattern: /\b(PPM|ppm)\s+(\d{2,4})\b/,
    field: 'ec',
    value: 'ppm-noted'
  },
  {
    id: 'env-tds',
    pattern: /(\d{2,4})\s*TDS\b/i,
    field: 'ec',
    value: 'ppm-noted'
  },

  /* ── Watering ── */
  {
    id: 'watering-daily',
    pattern: /\b(water\s+daily|watering\s+daily|watered\s+every\s+day)\b/i,
    field: 'wateringPattern',
    value: 'daily'
  },
  {
    id: 'watering-interval',
    pattern: /water(?:ing|ed)?\s+every\s+(\d+)\s+days?/i,
    field: 'wateringPattern',
    value: 'interval'
  },
  {
    id: 'watering-when-dry',
    pattern: /\b(when\s+(top\s+)?dry|water\s+when\s+dry|let\s+it\s+dry)\b/i,
    field: 'wateringPattern',
    value: 'when-dry'
  },
  {
    id: 'watering-just-watered',
    pattern: /\b(just\s+watered|watered\s+(this\s+morning|today|yesterday))\b/i,
    field: 'wateringPattern',
    value: 'just-watered'
  },
  {
    id: 'watering-dryback',
    pattern: /\b(dry[-\s]?back|dryback)\b/i,
    field: 'wateringPattern',
    value: 'dryback'
  },
  {
    id: 'watering-bottom',
    pattern: /\bbottom\s+water(ing)?\b/i,
    field: 'wateringPattern',
    value: 'bottom-water'
  },
  {
    id: 'watering-overwatered',
    pattern: /\boverwater(ed|ing)?\b/i,
    field: 'wateringPattern',
    value: 'overwatered'
  },
  {
    id: 'watering-underwatered',
    pattern: /\bunderwater(ed|ing)?\b/i,
    field: 'wateringPattern',
    value: 'underwatered'
  },

  /* ── Previous Treatments ── */
  {
    id: 'treatment-calmag',
    pattern: /\b(cal[-\s]?mag|calmag)\b/i,
    field: 'previousTreatment',
    value: 'calmag'
  },
  {
    id: 'treatment-epsom',
    pattern: /\b(epsom\s+salt|epsom)\b/i,
    field: 'previousTreatment',
    value: 'epsom'
  },
  {
    id: 'treatment-flush',
    pattern: /\b(flush(ed|ing)?)\b/i,
    field: 'previousTreatment',
    value: 'flush'
  },
  {
    id: 'treatment-neem',
    pattern: /\b(neem\s+oil|neem)\b/i,
    field: 'previousTreatment',
    value: 'neem'
  },
  {
    id: 'treatment-peroxide',
    pattern: /\b(h2o2|hydrogen\s+peroxide|peroxide)\b/i,
    field: 'previousTreatment',
    value: 'peroxide'
  },
  {
    id: 'treatment-spinosad',
    pattern: /\bspinosad\b/i,
    field: 'previousTreatment',
    value: 'spinosad'
  },
  {
    id: 'treatment-avid',
    pattern: /\babamectin\b|\b(?:used|applied|sprayed|tried)\s+avid\b|\bavid\s+(?:spray|application|drench|treatment|dip|miticide)\b/i,
    field: 'previousTreatment',
    value: 'avid'
  },
  {
    id: 'treatment-recent-feed',
    pattern: /\bfed\s+(yesterday|today|recently|this\s+week)\b/i,
    field: 'previousTreatment',
    value: 'recent-feed'
  },
  {
    id: 'treatment-increased-nutes',
    pattern: /\b(increased|bumped\s+up|raised)\s+(nutes|nutrients|feed)\b/i,
    field: 'previousTreatment',
    value: 'increased-nutes'
  },
  {
    id: 'treatment-decreased-nutes',
    pattern: /\b(decreased|lowered|cut\s+back|reduced)\s+(nutes|nutrients|feed)\b/i,
    field: 'previousTreatment',
    value: 'decreased-nutes'
  },
  {
    id: 'treatment-foliar',
    pattern: /\bfoliar\s+(spray|feed|application)\b/i,
    field: 'previousTreatment',
    value: 'foliar'
  },
  {
    id: 'treatment-topdress',
    pattern: /\b(top[-\s]?dress(ing|ed)?|topdress)\b/i,
    field: 'previousTreatment',
    value: 'topdress'
  },
  {
    id: 'treatment-bti',
    pattern: /\b(BTi|gnatrol|mosquito\s+bits|dunks)\b/i,
    field: 'previousTreatment',
    value: 'bti'
  },
  {
    id: 'treatment-predators',
    pattern: /\b(beneficial\s+(insects|nematodes)|predatory\s+mites|hypoaspis)\b/i,
    field: 'previousTreatment',
    value: 'beneficials'
  },

  /* ── Severity ── */
  {
    id: 'severity-worsening',
    pattern: /\b(getting\s+worse|worsening|progressing)\b/i,
    field: 'severity',
    value: 'worsening'
  },
  {
    id: 'severity-mild',
    pattern: /\b(mild|slight|minor)\b/i,
    field: 'severity',
    value: 'mild'
  },
  {
    id: 'severity-severe',
    pattern: /\b(severe|(?:really|very)\s+bad|heavy\s+(?:damage|infestation|deficiency|burn|stress))\b/i,
    field: 'severity',
    value: 'severe'
  },
  {
    id: 'severity-early',
    pattern: /\b(just\s+started|early\s+stage|caught\s+early)\b/i,
    field: 'severity',
    value: 'early'
  },
  {
    id: 'severity-chronic',
    pattern: /\b(been\s+a\s+while|weeks\s+now|chronic|persistent)\b/i,
    field: 'severity',
    value: 'chronic'
  },
  {
    id: 'severity-rapid',
    pattern: /\b(rapidly|fast|quickly|overnight)\b/i,
    field: 'severity',
    value: 'rapid'
  },
  {
    id: 'severity-slowly',
    pattern: /\b(slowly|gradual)\b/i,
    field: 'severity',
    value: 'slow'
  },
  {
    id: 'severity-spreading',
    pattern: /\b(spreading|spreading\s+fast)\b/i,
    field: 'severity',
    value: 'worsening'
  },

  /* ── Grower Intent ── */
  {
    id: 'intent-rare',
    pattern: /\b(rare|hard\s+to\s+find|limited)\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-cant-lose',
    pattern: /\b(can't\s+lose|cannot\s+lose)\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-valuable',
    pattern: /\bvaluable\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-keeper',
    pattern: /\bkeeper\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-irreplaceable',
    pattern: /\birreplaceable\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-special',
    pattern: /\bspecial\s+(plant|cut|clone|pheno|phenotype)\b/i,
    field: 'growerIntent',
    value: 'preserve'
  },
  {
    id: 'intent-test-plant',
    pattern: /\b(test\s+(plant|run)|trial\s+plant)\b/i,
    field: 'growerIntent',
    value: 'expendable'
  },
  {
    id: 'intent-dont-care',
    pattern: /\b(don't\s+care|doesn't\s+matter)\b/i,
    field: 'growerIntent',
    value: 'expendable'
  },

  /* ── Plant Health Context ── */
  {
    id: 'health-otherwise-healthy',
    pattern: /\b(healthy\s+otherwise|otherwise\s+healthy|rest\s+look(s)?\s+healthy)\b/i,
    field: 'plantHealth',
    value: 'otherwise-healthy'
  },
  {
    id: 'health-vigorous',
    pattern: /\b(vigorous|explosive\s+growth|growing\s+fast)\b/i,
    field: 'plantHealth',
    value: 'vigorous'
  },
  {
    id: 'health-slow-grower',
    pattern: /\b(slow\s+grower|slow\s+growth|growing\s+slow)\b/i,
    field: 'plantHealth',
    value: 'slow-grower'
  },
  {
    id: 'health-stunted',
    pattern: /\bstunted\b/i,
    field: 'plantHealth',
    value: 'stunted'
  },
  {
    id: 'health-recovering',
    pattern: /\b(recovering|bouncing\s+back|coming\s+back)\b/i,
    field: 'plantHealth',
    value: 'recovering'
  },
  {
    id: 'health-stressed',
    pattern: /\bstressed\b/i,
    field: 'plantHealth',
    value: 'stressed'
  },

  /* ── Symptom Location ── */
  {
    id: 'location-bottom',
    pattern: /\b(bottom\s+leaves?|lower\s+leaves?|lower\s+canopy|fan\s+leaves?\s+at\s+bottom)\b/i,
    field: 'symptomLocation',
    value: 'bottom'
  },
  {
    id: 'location-top',
    pattern: /\b(top\s+leaves?|new\s+growth|growing\s+tips?|upper\s+canopy)\b/i,
    field: 'symptomLocation',
    value: 'top'
  },
  {
    id: 'location-one-side',
    pattern: /\b(one\s+side|only\s+on\s+one\s+side)\b/i,
    field: 'symptomLocation',
    value: 'one-side'
  },

  /* ── Recent Events ── */
  {
    id: 'event-transplant',
    pattern: /\b(after\s+transplant(ing)?|just\s+transplanted|recently\s+transplanted|transplanted\s+already|already\s+transplanted)\b/i,
    field: 'recentEvent',
    value: 'transplant'
  },
  {
    id: 'event-topping',
    pattern: /\b(after\s+topping|just\s+topped|recently\s+topped)\b/i,
    field: 'recentEvent',
    value: 'topping'
  },
  {
    id: 'event-defoliation',
    pattern: /\b(after\s+defoliation|defoliated|lollipop(ped)?)\b/i,
    field: 'recentEvent',
    value: 'defoliation'
  },
  {
    id: 'event-flip',
    pattern: /\b(after\s+(the\s+)?flip|switched\s+to\s+(12\/12|flower)|flipped)\b/i,
    field: 'recentEvent',
    value: 'flip'
  },

  /* ── Environmental Events ── */
  {
    id: 'env-power-outage',
    pattern: /\b(power\s+outage|power\s+cut|power\s+failure)\b/i,
    field: 'envEvent',
    value: 'power-outage'
  },
  {
    id: 'env-heatwave',
    pattern: /\bheat\s+wave\b/i,
    field: 'envEvent',
    value: 'heatwave'
  },
  {
    id: 'env-ac-failed',
    pattern: /\b(AC\s+(broke|failed|died)|air\s+conditioning\s+(broke|failed))\b/i,
    field: 'envEvent',
    value: 'ac-failure'
  },
  {
    id: 'env-light-leak',
    pattern: /\blight\s+leak\b/i,
    field: 'envEvent',
    value: 'light-leak'
  },
  {
    id: 'env-timer-issue',
    pattern: /\b(timer\s+(issue|fail(ed)?|problem)|timer\s+went\s+off)\b/i,
    field: 'envEvent',
    value: 'timer-issue'
  },
  {
    id: 'env-cold-snap',
    pattern: /\b(cold\s+snap|temperature\s+dropped|freeze)\b/i,
    field: 'envEvent',
    value: 'cold-snap'
  },
  {
    id: 'env-foul-smell',
    pattern: /\b(smells?\s+(bad|foul|rotten|musty)|foul\s+smell|bad\s+odor)\b/i,
    field: 'envEvent',
    value: 'foul-smell'
  },
  {
    id: 'env-water-leak',
    pattern: /\b(water\s+leak|flooding|flood|reservoir\s+leaked)\b/i,
    field: 'envEvent',
    value: 'water-leak'
  },

  /* ── Root Observations ── */
  {
    id: 'root-bound',
    pattern: /\b(root[-\s]?bound|pot\s+bound|root\s+bound)\b/i,
    field: 'rootHealth',
    value: 'root-bound'
  },
  {
    id: 'root-developing',
    pattern: /\b(roots?\s+(building|develop|grow|coming|establish|form)ing?\s*(up|out|in)?)\b/i,
    field: 'rootHealth',
    value: 'roots-developing'
  },
  {
    id: 'root-established',
    pattern: /\b(rooted|established|root\s*bound|roots?\s+everywhere|roots?\s+filling)\b/i,
    field: 'rootHealth',
    value: 'roots-established'
  },
  {
    id: 'root-white',
    pattern: /\bwhite\s+roots\b/i,
    field: 'rootHealth',
    value: 'healthy-roots'
  },
  {
    id: 'root-brown',
    pattern: /\bbrown\s+roots\b/i,
    field: 'rootHealth',
    value: 'brown-roots'
  },
  {
    id: 'root-slimy',
    pattern: /\b(slimy\s+roots?|root\s+slime)\b/i,
    field: 'rootHealth',
    value: 'slimy-roots'
  },
  {
    id: 'root-smell',
    pattern: /\b(smell\s+(from|in)\s+roots?|roots?\s+smell)\b/i,
    field: 'rootHealth',
    value: 'root-smell'
  },

  /* ── Feed Type ── */
  {
    id: 'feed-organic',
    pattern: /\b(organic\s+(nutes|nutrients|fertilizer))\b/i,
    field: 'feedType',
    value: 'organic'
  },
  {
    id: 'feed-amended',
    pattern: /\b(amended|pre[\s-]?amended)\b/i,
    field: 'feedType',
    value: 'organic'
  },
  {
    id: 'feed-synthetic',
    pattern: /\b(synthetic|salt[\s-]?based|mineral\s+nutes)\b/i,
    field: 'feedType',
    value: 'synthetic'
  },
  {
    id: 'feed-bottled',
    pattern: /\bbottled\s+nutes\b/i,
    field: 'feedType',
    value: 'synthetic'
  },
  {
    id: 'feed-worm-castings',
    pattern: /\bworm\s+castings\b/i,
    field: 'feedType',
    value: 'organic'
  },
  {
    id: 'feed-compost-tea',
    pattern: /\bcompost\s+tea\b/i,
    field: 'feedType',
    value: 'organic'
  },
  {
    id: 'feed-synthetic2',
    pattern: /\b(general\s+hydroponics|advanced\s+nutrients|botanicare|canna)\b/i,
    field: 'feedType',
    value: 'synthetic'
  },

  /* ── Water Type ── */
  {
    id: 'water-ro',
    pattern: /\b(RO\s+water|reverse\s+osmosis)\b/i,
    field: 'waterType',
    value: 'ro'
  },
  {
    id: 'water-ro-system',
    pattern: /\bRO\s+system\b/i,
    field: 'waterType',
    value: 'ro'
  },
  {
    id: 'water-tap',
    pattern: /\btap\s+water\b/i,
    field: 'waterType',
    value: 'tap'
  },

  /* ── Growth Stage Detection ── */
  {
    id: 'stage-veg',
    pattern: /\b(?:in\s+|into\s+|start\s+|ready\s+for\s+)?veg(?:etative|gie|ging)?\s*(?:stage|phase)?\b/i,
    field: 'stage',
    value: 'veg'
  },
  {
    id: 'stage-flower',
    pattern: /\b(?:in\s+)?flower(?:ing)?\s*(?:stage|phase)?\b/i,
    field: 'stage',
    value: 'flower'
  },
  {
    id: 'stage-flower-week',
    pattern: /\bweek\s*(\d+)\s*(?:of\s*)?(?:flower|bloom)\b/i,
    extract: 'weeks'
  },
  {
    id: 'stage-late-flower',
    pattern: /\b(?:late\s+flower|last\s+weeks?|final\s+weeks?|almost\s+done)\b/i,
    field: 'stage',
    value: 'late-flower'
  },
  {
    id: 'stage-early-flower',
    pattern: /\b(?:early\s+flower|just\s+flipped|first\s+weeks?)\b/i,
    field: 'stage',
    value: 'early-flower'
  },
  {
    id: 'stage-mid-flower',
    pattern: /\b(?:mid[\s-]*flower|week\s*[45])\b/i,
    field: 'stage',
    value: 'mid-flower'
  },
  {
    id: 'stage-day-count',
    pattern: /\bday\s*(\d+)\b/i,
    extract: 'days'
  }

];


/* ==========================================================================
   SECTION 2: ADVICE_RULES
   Array of rule objects. Each has:
     id        {string}   — unique identifier
     condition {Function} — function(ctx, diagId) returns boolean
     advice    {string}   — expert cultivation advice to display
     priority  {number}   — 1-10, higher shown first (max 5 shown total)
   ========================================================================== */

var ADVICE_RULES = [

  /* ── GENERIC CATCH-ALL RULES (fire broadly for any diagnosis) ── */
  {
    id: 'generic-clone-fresh',
    priority: 5,
    condition: function(ctx, diagId) {
      // Fresh clone without roots — general clone caution
      return ctx.plantType === 'clone' && ctx.rootHealth !== 'roots-developing' && ctx.rootHealth !== 'roots-established' && ctx.rootHealth !== 'healthy-roots' && !ctx.stage;
    },
    advice: 'You mentioned this is a clone. Fresh clones have underdeveloped root systems — nutrient uptake, water absorption, and stress recovery are all slower than in established plants. Keep environmental conditions gentle (lower light intensity, higher humidity) until roots are fully established. Any treatment should be applied at reduced strength.'
  },
  {
    id: 'generic-clone-rooted',
    priority: 5,
    condition: function(ctx, diagId) {
      // Clone that is already rooted/transplanted/in veg — different advice
      return ctx.plantType === 'clone' && (ctx.rootHealth === 'roots-developing' || ctx.rootHealth === 'roots-established' || ctx.rootHealth === 'healthy-roots' || ctx.stage === 'veg');
    },
    advice: 'You mentioned this is a rooted clone transitioning to veg. Now that roots are establishing, you can begin gentle feeding at 25-50% strength and gradually increase light intensity to 400-600 PPFD over the next week. Let the roots fill the new pot before pushing growth hard — watch for healthy white root tips at the drainage holes as your signal to increase feeding.'
  },
  {
    id: 'generic-seedling-any',
    priority: 5,
    condition: function(ctx, diagId) {
      // Only fire for seedlings that are genuinely young (no stage set, timeline
      // suggests early life).  If timelineDays is set and > 21, the seedling is
      // old enough to be past the ultra-sensitive window.  Similarly, if the user
      // has set a veg or flower stage, this plant has outgrown seedling advice.
      return ctx.plantType === 'seedling' && !ctx.stage && (ctx.timelineDays === null || ctx.timelineDays <= 21);
    },
    advice: 'You mentioned this is a seedling. Seedlings are extremely sensitive — they need almost zero supplemental nutrients for the first 10-14 days, gentle light (200-400 PPFD), and consistent moisture. Most seedling problems resolve on their own if you stop intervening and just provide stable conditions.'
  },
  {
    id: 'generic-autoflower-any',
    priority: 5,
    condition: function(ctx, diagId) {
      // Only fire when the auto is showing actual problems — skip when the
      // plant is otherwise healthy / vigorous / recovering with no severity
      // concern, because this advice adds alarm that is not useful for a
      // healthy plant.
      return ctx.plantType === 'autoflower' && ctx.plantHealth !== 'otherwise-healthy' && ctx.plantHealth !== 'vigorous' && ctx.plantHealth !== 'recovering';
    },
    advice: 'You mentioned this is an autoflower. Autos have a fixed lifecycle — every day of stress costs yield you cannot recover by extending veg. Act quickly on any issue, but gently. Avoid high-stress training and major interventions after week 3.'
  },
  {
    id: 'generic-preserve-any',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.growerIntent === 'preserve';
    },
    advice: 'You indicated this plant is valuable or irreplaceable. Consider taking insurance cuttings from healthy growth before applying any aggressive treatment. Conservative, gentle interventions are preferred over drastic measures. Isolate the plant if the issue could spread.'
  },
  {
    id: 'generic-coco-any',
    priority: 4,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco';
    },
    advice: 'You mentioned growing in coco. Remember: CalMag is mandatory at every watering in coco (3-5 ml/L). Coco pH must stay 5.8-6.2. Coco is nearly impossible to overwater if drainage is good. Always check runoff pH and EC.'
  },
  {
    id: 'generic-hydro-any',
    priority: 4,
    condition: function(ctx, diagId) {
      return ctx.medium === 'hydro';
    },
    advice: 'You mentioned growing in hydro. Keep reservoir temperature below 20C (68F) to prevent root rot. Check pH twice daily — hydro pH drifts faster than soil or coco. Ensure adequate dissolved oxygen with air stones.'
  },
  {
    id: 'generic-led-any',
    priority: 4,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led';
    },
    advice: 'You mentioned using LED lighting. LEDs increase CalMag demand because they produce less infrared heat, reducing leaf temperature and transpiration. Consider running room temperature 2-3C higher than you would with HPS, and supplement CalMag at 30-50% above standard recommendations.'
  },
  {
    id: 'generic-ro-water-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.waterType === 'ro';
    },
    advice: 'You mentioned using RO water. RO water has zero mineral content — you MUST add CalMag (target EC 0.2-0.4) before adding base nutrients. Without this step, CalMag deficiency is guaranteed regardless of your nutrient line.'
  },
  {
    id: 'generic-worsening-any',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.severity === 'worsening';
    },
    advice: 'You mentioned this is getting worse. A worsening problem means your current approach is not addressing the root cause. Before adding more supplements or treatments, re-check the fundamentals: pH of your water/feed, root zone health, and temperature/humidity. Most worsening issues are pH-related.'
  },
  {
    id: 'generic-chronic-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.timeline === 'chronic' || ctx.severity === 'chronic';
    },
    advice: 'You mentioned this has been going on for a while. Chronic issues that persist despite treatment usually point to a root zone problem: pH drift, salt buildup, root rot, or compacted medium. Do a thorough root zone audit — check runoff pH, runoff EC, and inspect root color and smell.'
  },
  {
    id: 'generic-recent-onset-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.timeline === 'sudden' || ctx.timeline === 'overnight' || ctx.timeline === 'recent';
    },
    advice: 'You mentioned this started recently or suddenly. Rapid onset rules out slow-developing deficiencies. Think about what changed in the last 24-48 hours: a new feeding, a temperature spike, a watering event, or a schedule change. The trigger is almost always something recent and specific.'
  },
  {
    id: 'generic-post-transplant-any',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'transplant';
    },
    advice: 'You mentioned a recent transplant. Most symptoms within 3-7 days of transplanting are transplant shock, not a new problem. Keep conditions gentle (lower light, slightly higher humidity), water with plain pH-adjusted water, and give the plant time. Do NOT add nutrients or supplements until new growth resumes.'
  },
  {
    id: 'generic-post-flip-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'flip';
    },
    advice: 'You mentioned recently flipping to flower. The transition period (weeks 1-3 after flip) causes rapid stretch, increased nutrient demand, and hormonal shifts. Reduce nitrogen by 30-40% and switch to bloom nutrients. Some stress symptoms during this transition are normal and resolve within a week.'
  },
  {
    id: 'generic-healthy-otherwise-any',
    priority: 3,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'otherwise-healthy' || ctx.plantHealth === 'vigorous';
    },
    advice: 'You mentioned the plant is otherwise healthy or vigorous. This is a good sign — a healthy plant recovers faster from most issues. Make targeted, minimal corrections rather than drastic changes. The plant has reserves to draw on while you address the problem.'
  },
  {
    id: 'generic-recovering-any',
    priority: 4,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'recovering';
    },
    advice: 'You mentioned the plant is recovering. Most nutrient and stress issues take 5-10 days to show improvement after correction. Look for healthy NEW growth as the sign of recovery — damaged leaves will not heal. Do not keep changing things during the recovery window. Patience is key.'
  },
  {
    id: 'generic-all-plants-any',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.scope === 'all-plants';
    },
    advice: 'You mentioned all plants are affected. When every plant shows the same symptoms simultaneously, the cause is almost certainly environmental or systemic — not plant-specific. Check: pH of your water/feed, temperature and humidity at canopy level, and nutrient concentration. Fix the environment, not individual plants.'
  },
  {
    id: 'generic-single-plant-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.scope === 'single-plant';
    },
    advice: 'You mentioned only one plant is affected. A single affected plant suggests either a localized root zone issue (check that specific pot for drainage, root health, pH) or a pest introduction on that plant specifically. Inspect closely and quarantine if you suspect pests.'
  },
  {
    id: 'generic-spreading-any',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.scope === 'spreading';
    },
    advice: 'You mentioned the problem is spreading. A spreading pattern strongly suggests a biological cause — pests, fungal infection, or bacterial disease. Treat the entire grow space, not just visibly affected plants. Act immediately; every day of delay allows the problem to double.'
  },
  {
    id: 'generic-brown-roots-any',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.rootHealth === 'brown-roots' || ctx.rootHealth === 'slimy-roots';
    },
    advice: 'You described brown or slimy roots. This is a strong sign of root rot (Pythium), regardless of other symptoms. Healthy roots should be white and firm. Treat root rot as the PRIMARY issue — no nutrient adjustment will help until roots are healthy. Trim dead roots, apply beneficial bacteria or mild H2O2, and fix the underlying cause (overwatering, high reservoir temp, poor drainage).'
  },
  {
    id: 'generic-foul-smell-any',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'foul-smell' || ctx.rootHealth === 'root-smell';
    },
    advice: 'You described a foul smell from the root zone. This is the definitive sign of root rot or anaerobic decomposition. A healthy root zone should smell earthy or have no smell. Address this before any other diagnosis — root health is the foundation of plant health.'
  },
  {
    id: 'generic-already-calmag-any',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'calmag';
    },
    advice: 'You mentioned already using CalMag. If deficiency persists despite CalMag supplementation, the most likely cause is pH lockout — CalMag at wrong pH is CalMag wasted. Check your runoff pH. Other possibilities: antagonist nutrients (excess K or P blocking Ca/Mg uptake) or insufficient dose (try increasing by 1-2 ml/L).'
  },
  {
    id: 'generic-already-flushed-any',
    priority: 5,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'flush';
    },
    advice: 'You mentioned already flushing. After a flush, wait 24-48 hours before re-evaluating — root zone chemistry takes time to stabilize. When resuming feeding, start at 50% strength. If the flush did not help, the problem may be root damage — check roots for brown or slimy appearance.'
  },
  {
    id: 'generic-high-ph-any',
    priority: 7,
    condition: function(ctx, diagId) {
      var ph = parseFloat(ctx.ph);
      return !isNaN(ph) && ph > 7.0;
    },
    advice: 'Your noted pH is above 7.0. This locks out iron, manganese, and zinc, and reduces calcium absorption. Acidify your water to pH 6.0-6.3 for the next several waterings. If using alkaline tap water, consider mixing with RO water.'
  },
  {
    id: 'generic-low-ph-any',
    priority: 7,
    condition: function(ctx, diagId) {
      var ph = parseFloat(ctx.ph);
      return !isNaN(ph) && ph < 5.5;
    },
    advice: 'Your noted pH is below 5.5. This locks out calcium, magnesium, and phosphorus. Flush with pH 6.5 water to bring the root zone back into range. Do not add CalMag until pH is corrected — it will not be absorbed.'
  },

  /* ── Clone-specific ── */
  {
    id: 'clone-ca-def',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'clone' && (diagId === 'r-ca-def' || diagId === 'r-ca-def-new' || diagId === 'r-ca-mg');
    },
    advice: 'Clones have an underdeveloped root system and cannot uptake calcium efficiently. Keep a humidity dome over the clone at 70-80% RH until roots are established. Foliar-spray a dilute CalMag solution (0.5 ml/L) on the undersides of leaves to bypass root delivery — do not rely on root uptake for Ca at this stage.'
  },
  {
    id: 'clone-mg-def',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'clone' && (diagId === 'r-mg-def' || diagId === 'r-mg-def-spots');
    },
    advice: 'Clones struggling with Mg deficiency are almost always root-development limited. Foliar-spray Epsom salt at 1 tsp per liter of water, applied to the undersides of leaves in the lights-off period. Ensure RH is 70%+ to keep the clone from transpiring too aggressively before roots are established.'
  },
  {
    id: 'clone-overwater',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'clone' && (diagId === 'r-overwater' || diagId === 'r-seedling-overwater');
    },
    advice: 'Clones have minimal root mass and an extremely limited water demand. Water only a small ring (pencil-width) around the stem rather than saturating the whole medium. The goal is to encourage roots to seek moisture outward. Overwatering a clone with no root mass is one of the top causes of clone death — let the medium dry significantly between waterings.'
  },
  {
    id: 'clone-drooping',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'clone' && (diagId === 'r-transplant' || diagId === 'r-normal-transpiration');
    },
    advice: 'Drooping in a fresh clone for the first 3-7 days is entirely normal. The cutting has no roots to supply water yet and is losing moisture through its leaves. A humidity dome at 70-80% RH dramatically reduces transpiration pressure and is the single most effective intervention. Do not over-water in response to drooping — this will suffocate the emerging root primordia.'
  },
  {
    id: 'clone-damping-off',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'clone' && diagId === 'r-damping-off';
    },
    advice: 'Damping off in a clone (stem going soft and brown at the base) cannot be reversed — discard this cutting immediately to prevent fungal spread. For next time: take cuttings with clean, sterilized tools; use a fresh rooting cube or medium; keep humidity dome vents slightly open to prevent stagnant air; apply a dilute hydrogen peroxide or Trichoderma root drench to prevent Pythium at the base.'
  },

  /* ── Autoflower-specific ── */
  {
    id: 'auto-n-def',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower' && diagId === 'r-n-def';
    },
    advice: 'Autoflowers have a compressed lifecycle of 60-90 days and will not recover size or yield lost to nitrogen deficiency. Unlike photoperiods, you cannot extend the vegetative phase to compensate. Act immediately: increase nitrogen by 25-30% and verify pH is in the 6.0-7.0 range (soil) or 5.8-6.2 (coco/hydro). Every week of stunted growth in an auto represents irreversible yield loss.'
  },
  {
    id: 'auto-overwater',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower' && diagId === 'r-overwater';
    },
    advice: 'Overwatering is devastating for autoflowers because you cannot extend veg to compensate for stunted days. Immediately let the medium dry out fully before next watering — lift the pot to judge dryness by weight. Autos in wet medium will grow at 20-30% of their potential. Go to a strict lift-the-pot method and only water when the pot feels very light.'
  },
  {
    id: 'auto-stunted',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower' && ctx.plantHealth === 'stunted';
    },
    advice: 'A stunted autoflower cannot recover its lost vegetative growth — the genetic timer will trigger flowering regardless of plant size. Shift your focus to maximizing the quality of what remains: ensure optimal light intensity at the canopy (600-900 PPFD), keep VPD in the 0.9-1.2 kPa range, and do not stress the plant further with transplanting or aggressive training. Check roots — root-bound or damaged roots are a top cause of auto stunting.'
  },
  {
    id: 'auto-hermie',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'Autoflowers are generally more stress-sensitive than photoperiods, and hermaphroditism in an auto often indicates a combination of genetic predisposition and environmental stress. If pollen sacs are found: remove the plant from the grow space immediately to prevent pollinating other plants. There is no reversal once pollen has been released. Start a fresh auto run — autoflower genetics from reputable breeders are inexpensive and recovery is quicker than spending weeks managing a hermie.'
  },
  {
    id: 'auto-natural-fade',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower' && diagId === 'r-natural-fade';
    },
    advice: 'Autoflowers naturally begin their senescence (fade) earlier than photoperiods — often 3-4 weeks before harvest. Lower-leaf yellowing in late flower on an auto is expected. Before assuming deficiency, check trichomes under magnification: if they are mostly cloudy with some amber, you may be looking at a plant that is ready to harvest, not one that is sick. Do not chase deficiencies in the last 2 weeks of an auto cycle.'
  },

  /* ── Seedling-specific ── */
  {
    id: 'seedling-nute-burn',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'seedling' && (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe' || diagId === 'r-seedling-nute');
    },
    advice: 'Seedlings carry sufficient nutrients in their cotyledons and do not require any supplemental nutrition for the first 10-14 days. Adding any nutrients to a seedling this young will cause burn and potentially kill it. Use only pH-corrected plain water (6.0-6.5) until the plant has 3-4 true nodes. If growing in a hot soil mix, transplant into a seedling-specific starter mix immediately.'
  },
  {
    id: 'seedling-heat-stress',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'seedling' && diagId === 'r-heat-stress';
    },
    advice: 'Seedlings are extremely sensitive to heat and light intensity. Keep air temperature at 22-26C and maintain light intensity at 200-400 PPFD max — this is far lower than what a mature plant needs. Raise your LED to at least 60-70 cm from seedlings or dim to 20-30% power. Seedlings showing heat stress curl and taco before any visible browning. A small humidity dome can also buffer temperature swings.'
  },
  {
    id: 'seedling-ph-lockout',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'seedling' && diagId === 'r-ph-lockout';
    },
    advice: 'Seedlings are extremely vulnerable to pH swings that a mature plant would tolerate. Even a 0.5 pH unit error can cause nutrient lockout in a seedling. Always pH-test your water before feeding: target 6.0-6.5 for soil, 5.8-6.2 for coco or hydro. Use a calibrated digital pH meter — pH strips are not accurate enough for seedling care. Flush with correctly pH-ed water and do not fertilize until recovered.'
  },

  /* ── LED-specific ── */
  {
    id: 'led-ca-def',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (diagId === 'r-ca-def' || diagId === 'r-ca-def-new' || diagId === 'r-ca-mg');
    },
    advice: 'Calcium deficiency under LED is the single most common hidden deficiency in modern grows. LED lights emit less infrared radiation than HPS, which means leaf temperature runs 2-3C cooler — this significantly reduces transpiration and calcium uptake (which is driven by transpiration, not active absorption). Increase CalMag by 30-50% over the manufacturer recommendation. Also check that pH is in the 6.2-7.0 range in soil or 5.8-6.2 in coco.'
  },
  {
    id: 'led-mg-def',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (diagId === 'r-mg-def' || diagId === 'r-mg-def-spots');
    },
    advice: 'LED grows have an elevated magnesium demand compared to HPS. The cooler leaf temperatures under LED reduce overall ion uptake. Add Epsom salt (magnesium sulfate) at 1-2 tsp per gallon as a foliar spray (undersides of leaves, lights-off), and increase your base CalMag by 1-2 ml/L. Also ensure RH is above 45% — very low humidity causes stomatal closure and reduces Mg uptake further.'
  },
  {
    id: 'led-light-burn',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && diagId === 'r-light-burn';
    },
    advice: 'Light burn from an LED is caused by photon intensity, not heat — unlike HPS, you cannot use "can I hold my hand there" as a test. The bleached/white or bright yellow upper leaves are receiving 1200+ PPFD. Raise the light or dim it: most cannabis tops out at 900-1100 PPFD in flower. Use a PAR meter or a smartphone app (Photone) to measure PPFD at the canopy. Affected leaves will not recover but new growth will be normal once intensity is corrected.'
  },
  {
    id: 'led-vpd',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (diagId === 'r-low-humidity' || diagId === 'r-heat-stress');
    },
    advice: 'Under LEDs, leaf surface temperature is 2-3C lower than air temperature — this is the opposite of HPS where leaves run hotter. When calculating VPD targets for LED grows, you need slightly higher air temperatures (26-28C) to hit the same VPD as HPS at 24C. If you are seeing stress symptoms, measure actual leaf temperature with an IR thermometer and recalculate VPD using the leaf temp, not the air temp.'
  },

  /* ── Coco-specific ── */
  {
    id: 'coco-ca-def',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco' && (diagId === 'r-ca-def' || diagId === 'r-ca-def-new' || diagId === 'r-ca-mg');
    },
    advice: 'Calcium deficiency in coco is the most common and most critical deficiency in this medium. Coco coir has cation exchange capacity (CEC) that actively holds Ca2+ ions, preventing plant uptake — this is the coco calcium trap. CalMag is MANDATORY at every single watering, no exceptions: use 3-5 ml/L of a CalMag product before adding your base nutrients. Do not reduce CalMag dosing even when cutting back other nutrients.'
  },
  {
    id: 'coco-overwater',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco' && diagId === 'r-overwater';
    },
    advice: 'Coco coir is extremely difficult to overwater when used correctly because it is not a true growing medium — it is a hydroponic substrate that holds air pockets even when saturated. If you are seeing classic overwatering signs in coco, reassess the diagnosis: more likely causes are root rot, pH lockout, or nitrogen toxicity mimicking overwater symptoms. True overwatering in coco only occurs if drainage holes are blocked or the medium is completely compacted.'
  },
  {
    id: 'coco-ph-lockout',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco' && diagId === 'r-ph-lockout';
    },
    advice: 'Coco coir has almost no pH buffering capacity — unlike soil, it will not self-correct pH drift. You must pH every feed to 5.8-6.2 with no exceptions. Check your runoff pH every feeding: if it is drifting outside this range, your plants are in lockout. Flush with pH 6.0 water until runoff comes out at 6.0, then resume normal feeding. An EC/pH pen with factory calibration is essential for coco growers.'
  },
  {
    id: 'coco-underwater',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco' && diagId === 'r-underwater';
    },
    advice: 'Never let coco coir dry out completely. Dry coco becomes hydrophobic and will repel water — subsequent waterings will channel along the pot walls instead of wetting the root zone. If coco has dried, slowly rehydrate from the bottom up by placing the pot in a shallow tray of pH-corrected water and allowing it to wick up for 20-30 minutes. Going forward, maintain at least 20% moisture content at all times by increasing watering frequency.'
  },
  {
    id: 'coco-fungus-gnats',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.medium === 'coco' && diagId === 'r-fungus-gnats';
    },
    advice: 'Fungus gnats in coco often indicate that the coco was contaminated with organic matter before use, or that you are adding organic amendments (worm castings, kelp meal) to an otherwise inorganic medium. Pure, buffered coco should not attract fungus gnats. Check your medium source. For treatment: use Bacillus thuringiensis israelensis (BTi/Gnatrol/Mosquito Bits) in every watering — it kills larvae in the root zone without harming roots or beneficials.'
  },

  /* ── Hydro-specific ── */
  {
    id: 'hydro-root-rot',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.medium === 'hydro' && diagId === 'r-root-rot';
    },
    advice: 'Root rot in DWC/RDWC is almost always caused by reservoir temperature above 20C. Warm water holds less dissolved oxygen AND is a perfect breeding ground for Pythium. Immediate priority: chill the reservoir to 18-20C using a water chiller or frozen water bottles (rotate them). Add Hydroguard (Bacillus amyloliquefaciens) at 2 ml/L to re-inoculate beneficial bacteria. Increase air pump output. Do not use hydrogen peroxide long-term — it kills the beneficial bacteria you need to fight the pathogen.'
  },
  {
    id: 'hydro-ph-drift',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.medium === 'hydro' && (diagId === 'r-ph-drift' || diagId === 'r-ph-lockout');
    },
    advice: 'pH drift is the number one ongoing maintenance challenge in hydro. A larger reservoir volume drifts more slowly — consider upsizing if you are checking pH multiple times per day. Roots absorbing nutrients unequally causes drift: vigorous plants in peak growth will drift pH upward as they consume more acidic anions. Check and adjust pH twice daily during peak growth. A quality digital dosing pump (Atlas Scientific or similar) can automate this completely for DWC systems.'
  },

  /* ── Living Soil / Organic ── */
  {
    id: 'living-soil-ph-lockout',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'living-soil' || ctx.feedType === 'organic') && diagId === 'r-ph-lockout';
    },
    advice: 'Living and organic soil systems are buffered by the soil food web — microbial activity, fungi, and organic matter naturally resist pH swings. Heavy flushing in a living soil system disrupts this biology and removes the organic acids that buffer pH. Instead of flushing, top-dress with a small amount of worm castings and water with plain pH-adjusted water (6.5-7.0). Allow the biology time to re-establish the buffer. Use dolomite lime as a long-term pH stabilizer in organic mixes.'
  },
  {
    id: 'living-soil-n-def',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'living-soil' || ctx.feedType === 'organic') && diagId === 'r-n-def';
    },
    advice: 'Nitrogen deficiency in living soil usually means the soil food web is not breaking down organic amendments fast enough to release plant-available nitrogen. This is common in cool root zones, overly dry soil, or after a soil disturbance. Top-dress with 1-2 cups of high-quality worm castings and water with a compost tea or a dilute fish emulsion (pH adjusted to 6.5). Ensure root zone temperature is 18-24C — cold roots dramatically slow microbial activity and nitrogen mineralization.'
  },
  {
    id: 'living-soil-nute-burn',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'living-soil') && (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe');
    },
    advice: 'Nutrient burn in a hot living soil or super soil mix means your amendment ratios released more soluble nutrients than your plant can handle at this stage. Unlike synthetic grows, you cannot simply flush organic nutrients out — they are bound in microbial biomass and will continue to mineralize. Options: transplant into a diluted or plain buffer medium; apply heavy waterings to leach some soluble salts; add more plain top-dress perlite to dilute the root zone. Patience is also a strategy — plants often acclimatize to hot soil over 1-2 weeks.'
  },
  {
    id: 'living-soil-fungus-gnats',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'living-soil') && diagId === 'r-fungus-gnats';
    },
    advice: 'Fungus gnats thrive in organic matter — living soil is naturally attractive to them. Do NOT treat with hydrogen peroxide as it will destroy the beneficial microbiology that makes living soil work. Use Bacillus thuringiensis israelensis (BTi) — Gnatrol, Mosquito Bits, or Microbe Life Hydroponics are compatible with soil biology. Top-dress with a 1-inch layer of sand or perlite to prevent adult egg-laying. Yellow sticky traps catch the adults. The BTi needs to be reapplied every 5-7 days for 3 cycles to break the lifecycle.'
  },

  /* ── RO Water ── */
  {
    id: 'ro-ca-mg-def',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.waterType === 'ro' && (diagId === 'r-ca-def' || diagId === 'r-mg-def' || diagId === 'r-ca-mg' || diagId === 'r-ca-def-new');
    },
    advice: 'RO (reverse osmosis) water strips out virtually all minerals, leaving you with 0-10 PPM source water. This is excellent for control but means you MUST add CalMag before your base nutrients to prevent calcium and magnesium deficiency. Target a baseline EC of 0.2-0.4 from CalMag alone (approximately 100-200 PPM) before adding any base nutrients. Skipping this step with RO water guarantees Ca/Mg deficiencies within 1-2 weeks of any fast-growing grow.'
  },

  /* ── Post Recent Events ── */
  {
    id: 'event-transplant-droop',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'transplant' && (diagId === 'r-transplant' || diagId === 'r-overwater');
    },
    advice: 'Drooping after transplant is transplant shock — not overwatering. The root disturbance during transplanting temporarily reduces water uptake capacity. Resist the urge to water heavily in response to droop; instead, water a small amount around the stem to keep the root ball moist but not saturated. Recovery is typically 24-72 hours. Provide normal or slightly reduced light intensity during recovery and maintain high RH (60-70%) to reduce transpiration demand on stressed roots.'
  },
  {
    id: 'event-transplant-yellowing',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'transplant' && diagId === 'r-n-def';
    },
    advice: 'Yellowing after transplant is most likely root disruption from the transplant, not a true nitrogen deficiency. The roots are temporarily unable to uptake nutrients from the new medium. Do not panic-feed with nitrogen — this can cause salt stress on already-damaged roots. Wait 48-72 hours and provide a light watering of pH-corrected water. If yellowing progresses after 5-7 days without improvement, then reassess nutrition.'
  },
  {
    id: 'event-topping-droop',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'topping' && diagId === 'r-transplant';
    },
    advice: 'A day or two of drooping after topping is completely normal — you just removed the plant\'s primary apical meristem and it is redirecting energy to the lateral branches. No intervention is needed. Continue normal watering and feeding. Recovery in 1-3 days is typical. Maintain slightly lower VPD (higher RH) during recovery to reduce transpiration stress on the topped plant.'
  },
  {
    id: 'event-defoliation-light-stress',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'defoliation' && (diagId === 'r-light-burn' || diagId === 'r-heat-stress');
    },
    advice: 'After heavy defoliation or lollipopping, the remaining leaves suddenly receive significantly more direct light than they were previously adapted to. If you are seeing bleaching or light-stress symptoms post-defoliation, temporarily raise your light or dim it by 20-30% for 3-5 days while the plant readjusts its leaf surface chemistry. This is a common oversight — the defoliation itself changes the light exposure, not your light position.'
  },
  {
    id: 'event-flip-stretch',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'flip' && diagId === 'r-stretching';
    },
    advice: 'The stretch after flipping to 12/12 is normal and expected — cannabis typically doubles to triples in height in the first 2-3 weeks of flower. This is the plant investing in vertical height before transitioning fully to flower production. If the stretch is more than you can accommodate: supercrop (gently bend the main stem until it kinks) stems that are getting too close to the light, or use low-stress training (LST) to redirect upward growth horizontally.'
  },
  {
    id: 'event-flip-n-tox',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'flip' && diagId === 'r-n-tox';
    },
    advice: 'After flipping to 12/12, plants rapidly switch from needing high nitrogen (veg phase) to needing high phosphorus and potassium (flower phase). Continuing to feed veg-level nitrogen into flower causes nitrogen toxicity — the characteristic dark green, clawing leaves. Immediately transition to a lower-nitrogen bloom feed. If you were using a single base nutrient, increase the P/K supplement and reduce N-heavy additives by 40-50%.'
  },

  /* ── Environmental Events ── */
  {
    id: 'event-power-outage-hermie',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'power-outage' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'A power outage during the dark period is one of the most reliable triggers for stress-induced hermaphroditism in flowering cannabis. Any light interruption during the 12-hour dark period — even from a phone screen or a door opening — signals the plant that conditions are unstable, triggering hermie as a survival response. After a power outage: inspect your plants carefully every 2-3 days for the next 2 weeks, looking at every node for banana-shaped pollen sacs. If found, remove immediately or isolate the plant.'
  },
  {
    id: 'event-power-outage-general',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'power-outage';
    },
    advice: 'During a power outage, ventilation and circulation fans also stop — this creates a stagnant, humid microclimate around the canopy that rapidly elevates bud rot and powdery mildew risk. After power is restored, check closely for any white powder on leaves (PM) or soft, mushy spots in buds (bud rot). If your tent smells musty rather than skunky after the outage, assume mold pressure has increased and increase airflow temporarily.'
  },
  {
    id: 'event-light-leak-hermie',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'light-leak' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'Light leak during the dark period is the single most common cause of stress-induced hermaphroditism in indoor cannabis. Even a pinhole of light is sufficient to interrupt the hormonal dark period and trigger pollen sac development. Seal every potential entry point: zipper gaps in tents, fan ports, cable pass-throughs, and any gaps around ducting. Test by entering the tent in complete darkness and waiting for your eyes to adjust — any glow is a light leak. Use black electrical tape on indicator LEDs.'
  },
  {
    id: 'event-timer-hermie',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'timer-issue' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'A timer failure that extends the dark period OR the light period can trigger hermaphroditism. Invest in a quality digital timer with a battery backup (Titan Controls or BN-LINK digital). Mechanical outlet timers with worn gears are a common failure point. Consider using two timers in series for critical lights-off control — both must fail simultaneously for the schedule to be disrupted.'
  },
  {
    id: 'event-heatwave-stress',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'heatwave' && (diagId === 'r-heat-stress' || diagId === 'r-heat-light');
    },
    advice: 'During a heatwave emergency: immediately dim your LED to 50-60% output (LED heat is additive to ambient heat) or raise it to maximum height. Run the lights during the coolest part of the day (night shift grow). Point additional fans directly at the canopy. Mist the exterior of the tent with cold water to reduce radiant heat transfer. If temperature exceeds 32C for more than a few hours, the terpene and cannabinoid profile will degrade — foxtailing and hermie risk also increase significantly.'
  },
  {
    id: 'event-cold-snap-p-def',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'cold-snap' && (diagId === 'r-p-def' || diagId === 'r-cold-purple');
    },
    advice: 'Cold temperatures below 15C in the root zone dramatically reduce phosphorus uptake even when phosphorus is present in the medium — the cold immobilizes the transport proteins. The resulting purple coloration can look like a genetic trait but is actually cold-induced phosphorus lockout. Raise night temperatures to at least 18C. In a pinch, wrap the pots with insulation. Once temperatures normalize, phosphorus uptake will resume and purple coloration will fade from new growth within 5-7 days.'
  },

  /* ── Scope-based ── */
  {
    id: 'advice-scope-all-plants',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.scope === 'all-plants';
    },
    advice: 'When all plants show the same symptoms simultaneously, the cause is almost certainly environmental or systemic — not plant-specific. Focus your investigation on shared inputs: pH of your water source, EC/nutrient concentration, temperature and humidity levels in the tent, light intensity and uniformity, and root zone conditions. A single-plant issue rarely affects all plants at the same time unless a contagious pathogen (PM, bud rot, spider mites) is spreading.'
  },
  {
    id: 'scope-single-plant-pest',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.scope === 'single-plant' && (diagId === 'r-pest-mites' || diagId === 'r-broad-mites' || diagId === 'r-thrips');
    },
    advice: 'With only one plant affected, you have an opportunity to contain the infestation before it spreads. Immediately quarantine this plant: physically separate it from other plants, ideally to a different room or area. Inspect every other plant closely with a loupe — look on the undersides of leaves. Treat the affected plant aggressively (appropriate miticide or insecticide) and treat surrounding plants preventively. The initial spread from a single plant is the easiest point to intercept a pest outbreak.'
  },
  {
    id: 'advice-scope-spreading',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.scope === 'spreading';
    },
    advice: 'A spreading issue requires immediate, aggressive action — do not wait for results from a single treatment. Remove and isolate any heavily affected plants from the grow space. Treat all plants simultaneously with an appropriate pesticide or treatment, not just the visibly affected ones. For pests: use a rotational approach with two or three different active ingredients to prevent resistance. Apply every 3-5 days for three full cycles to catch adults, eggs, and nymphs at different lifecycle stages.'
  },

  /* ── Severity / Timeline ── */
  {
    id: 'advice-severity-worsening',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.severity === 'worsening';
    },
    advice: 'If symptoms are getting worse despite treatment, your current approach is not working. Step back and audit the fundamentals before adding more treatments: (1) Verify pH at the root zone with a calibrated meter. (2) Check for root rot or root-binding issues that prevent any nutrient uptake. (3) Eliminate one variable at a time rather than changing everything simultaneously. (4) Consider whether the diagnosis itself is correct — worsening symptoms despite targeted treatment often indicate a missed root cause like pH drift, root disease, or environmental stress.'
  },
  {
    id: 'advice-severity-chronic',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.severity === 'chronic' || ctx.timeline === 'chronic';
    },
    advice: 'A problem that has persisted for weeks despite attempts to address it usually indicates either a misdiagnosis or an underlying root-zone issue that is preventing recovery. The most common culprits for chronic, hard-to-fix symptoms: (1) pH lockout from chronically incorrect or drifting pH. (2) Root rot that has been present but undetected. (3) Rootbound plants unable to uptake nutrients despite correct solution chemistry. (4) Buildup of salt deposits in the medium inhibiting absorption. Consider a root inspection and EC/pH runoff measurement to find the true cause.'
  },
  {
    id: 'advice-severity-rapid',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.severity === 'rapid' || ctx.severity === 'worsening';
    },
    advice: 'Rapid-onset symptoms appearing overnight or within hours are almost never caused by a slow nutrient deficiency (which takes days to weeks to develop). Think acute: heat event, cold snap, overwatering during a critical period, pH crash, equipment failure, or pesticide burn. Review what changed in the last 24-48 hours — a new nutrient bottle, a timer issue, a temperature spike, or a product applied. The timeline makes slow deficiencies statistically unlikely.'
  },

  /* ── Grower Intent: Preserve ── */
  {
    id: 'preserve-hermie',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.growerIntent === 'preserve' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'For a rare or irreplaceable plant showing hermaphroditism: isolate the plant immediately to a separate sealed space — even one open pollen sac can pollinate your entire grow room and cause seeding across all plants. If the hermie is stress-induced and you only see a few banana pollen sacs, carefully remove them with tweezers daily. Consider taking cuttings NOW before the plant advances further — the genetics are preserved in the clone even if the mother cannot be saved. A cloned hermie may or may not express hermaphroditism depending on whether it is genetically or stress-induced.'
  },
  {
    id: 'preserve-root-rot',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.growerIntent === 'preserve' && diagId === 'r-root-rot';
    },
    advice: 'For a rare or valuable plant with root rot: take insurance cuttings immediately before the plant deteriorates further — roots of cuttings will regenerate clean without the Pythium pathogen. For the mother plant: remove from its container, carefully rinse the root ball under pH-corrected water, trim all brown/slimy roots with sterilized scissors back to white tissue, and soak roots in a dilute hydrogen peroxide solution (3% H2O2 at 1 part to 10 parts water) for 5 minutes. Transplant into fresh medium, add Hydroguard or Trichoderma, and reduce watering frequency significantly.'
  },
  {
    id: 'preserve-pests',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.growerIntent === 'preserve' && (diagId === 'r-pest-mites' || diagId === 'r-broad-mites' || diagId === 'r-thrips');
    },
    advice: 'For a rare or irreplaceable plant under pest pressure: take cuttings immediately as insurance before any aggressive treatment. Cuttings rooted from an infested plant can be cleaned by dipping in dilute isopropyl (25% IPA solution) before rooting, or by applying miticide/insecticide to the cuttings directly before they root. Isolate the mother plant completely. Use the most effective pesticide available (Avid/abamectin or Forbid for mites; spinosad for thrips) rather than gentler alternatives that might not clear the infestation on a vulnerable plant.'
  },
  {
    id: 'preserve-bud-rot',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.growerIntent === 'preserve' && diagId === 'r-bud-rot';
    },
    advice: 'Bud rot on a rare or valued plant requires emergency triage. Botrytis spreads rapidly through flower material. Remove every affected bud and surrounding leaves immediately — cut 2-3 cm past any visible gray or brown rot. Double-bag removed material and remove from the grow room. Immediately increase airflow through the canopy and reduce RH below 45%. If the plant is close to harvest, strongly consider an early partial harvest of the unaffected upper portions. Saving the remaining clean flower is more important than preserving the full grow schedule.'
  },

  /* ── Treatment-specific ── */
  {
    id: 'treatment-calmag-still-deficient',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'calmag' && (diagId === 'r-ca-def' || diagId === 'r-mg-def' || diagId === 'r-ca-mg' || diagId === 'r-ca-def-new');
    },
    advice: 'If you are already using CalMag but still see calcium or magnesium deficiency, there are two likely causes: (1) pH is preventing uptake — calcium is best absorbed at pH 6.2-7.0 (soil) or 5.8-6.2 (coco). Even if your CalMag dose is correct, the wrong pH means the ion cannot be absorbed. (2) An antagonist nutrient is locking out Ca or Mg — high potassium directly competes with magnesium for uptake. Check your K levels and consider reducing the K portion of your feed.'
  },
  {
    id: 'treatment-flushed',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'flush';
    },
    advice: 'After flushing, wait 24-48 hours before assessing results — it takes time for the root zone to normalize and for the plant to signal whether the issue has resolved. Check the runoff EC and pH after flushing: if runoff EC drops to near your input EC, the salt buildup is cleared. Resume feeding at 50-60% of your normal dose and gradually increase over 3-5 feedings. Do not immediately return to full strength — the buffering capacity of the medium has been reduced by flushing.'
  },
  {
    id: 'treatment-increased-nutes-burn',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'increased-nutes' && (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe');
    },
    advice: 'Nutrient burn after increasing your nutrient dose confirms the concentration was too high. Immediately reduce by 30-40% from your previous dose and perform a light flush with 2-3x the container volume of pH-corrected plain water. The burned leaf tips are permanent but new growth should come in clean within 5-7 days. Going forward, increase nutrient concentration gradually (10-15% at a time) and watch for early signs of burn (tip curl, slight yellowing of leaf margins) before committing to a higher dose.'
  },
  {
    id: 'treatment-neem-pests-persist',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'neem' && (diagId === 'r-pest-mites' || diagId === 'r-broad-mites' || diagId === 'r-thrips');
    },
    advice: 'Neem oil provides marginal control of established mite or thrips infestations — it functions mainly as a repellent and growth disruptor rather than a contact killer. If neem has not resolved your pest issue after 2-3 applications, escalate the treatment: for spider mites, use Forbid (spiromesifen) or Avid (abamectin) — these are the industry standard for rapid knockdown. For thrips, use spinosad (Captain Jack\'s Deadbug) or pyrethrin. Always rotate active ingredients to prevent resistance development.'
  },
  {
    id: 'treatment-peroxide-root-rot',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'peroxide' && diagId === 'r-root-rot';
    },
    advice: 'Hydrogen peroxide (H2O2) can temporarily suppress Pythium in hydro but also destroys beneficial bacteria that compete with the pathogen. Relying on H2O2 alone for root rot creates a cycle: H2O2 kills both Pythium and beneficials, then when it off-gasses, Pythium repopulates faster than beneficials because the beneficial community has been disrupted. After H2O2 treatment, immediately re-inoculate with Hydroguard (Bacillus amyloliquefaciens) or a beneficial microbiology product, and address the root cause (usually high reservoir temperature).'
  },
  {
    id: 'treatment-foliar-in-flower',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'foliar' && ctx.recentEvent === 'flip';
    },
    advice: 'WARNING: Foliar spraying in flower is strongly discouraged after week 3 of flowering. Moisture trapped in developing buds is the primary cause of bud rot (Botrytis). If you must apply a foliar spray in early flower (weeks 1-3), do it at lights-on with excellent airflow and ensure the buds are completely dry before the dark period. After week 3, switch to root-zone delivery for all nutrient supplementation and pest management. Never foliar spray in late flower.'
  },

  /* ── Root Conditions ── */
  {
    id: 'root-bound-fix',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.rootHealth === 'root-bound';
    },
    advice: 'A rootbound plant cannot uptake nutrients or water effectively regardless of how well-balanced your nutrient solution is. If transplanting up is an option, move to a container at least 2x the current volume (e.g., 3-gallon to 7-gallon). If you cannot transplant (plant is too large or in late flower), root-prune: carefully remove the plant, trim 20-25% of the outer root mass with sterile scissors, and transplant back into the same container with fresh medium on the sides and bottom. This temporarily slows the plant but allows the root system to expand again.'
  },
  {
    id: 'root-brown-slimy-diagnosis',
    priority: 10,
    condition: function(ctx, diagId) {
      return (ctx.rootHealth === 'brown-roots' || ctx.rootHealth === 'slimy-roots') && diagId !== 'r-root-rot';
    },
    advice: 'You have reported brown or slimy roots — this is a strong indicator of root rot (Pythium) regardless of the surface-symptom diagnosis. Brown slimy roots that pull apart easily and smell foul are the defining characteristic of root rot. The symptoms visible on your leaves (yellowing, wilting, deficiencies) are likely secondary effects of the root rot rather than the primary diagnosis. Address root rot directly: improve dissolved oxygen, reduce reservoir temperature (hydro), reduce watering frequency (soil/coco), and apply beneficial bacteria (Hydroguard/Trichoderma).'
  },
  {
    id: 'root-healthy-overwater-reconsider',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.rootHealth === 'healthy-roots' && (diagId === 'r-overwater' || diagId === 'r-root-rot');
    },
    advice: 'You have reported healthy white roots, which significantly reduces the likelihood of root rot or overwatering as the primary cause. Healthy white roots indicate the root zone is functioning well. Reconsider the diagnosis: if the plant is drooping with white healthy roots, the cause is more likely high VPD (plant losing water faster than roots can supply it), nitrogen toxicity, or light stress. Check your VPD and leaf temperature first.'
  },

  /* ── Symptom Location ── */
  {
    id: 'location-bottom-mobile',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.symptomLocation === 'bottom' && (diagId === 'r-ca-def' || diagId === 'r-fe-def' || diagId === 'r-mn-def');
    },
    advice: 'Calcium, iron, and manganese are immobile nutrients — when deficient, symptoms appear first in new (top) growth, not old (bottom) growth. If you are seeing deficiency symptoms primarily in lower and older leaves, the deficiency is more likely to be a mobile nutrient: nitrogen, phosphorus, potassium, or magnesium. These mobile nutrients are relocated from old leaves to new growth when supply is limited. Reconsider whether N, P, K, or Mg deficiency might better explain the symptom pattern.'
  },
  {
    id: 'location-top-n-def',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.symptomLocation === 'top' && diagId === 'r-n-def';
    },
    advice: 'Nitrogen deficiency classically starts in lower, older leaves first because nitrogen is mobile and the plant relocates it from old tissue to new growth. If yellowing is appearing primarily in top/new growth rather than starting from the bottom, the cause is more likely an immobile nutrient deficiency (calcium, iron, or sulfur) or pH lockout preventing nutrient uptake at the root zone. Check your pH and inspect the newest growth for the pattern of discoloration.'
  },
  {
    id: 'advice-location-one-side',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.symptomLocation === 'one-side';
    },
    advice: 'Symptoms appearing on only one side of a plant almost always indicate a localized environmental cause rather than a systemic deficiency or disease. Common causes: (1) Concentrated heat or light from one direction. (2) A fan blowing directly on one side causing wind burn or excessive transpiration. (3) Root damage on one side of the root ball from a previous transplant or rootbound condition. (4) Patchy medium pH from localized salt buildup. Rotate the plant 180 degrees and observe whether symptoms follow the plant or stay in the same spot in the tent.'
  },

  /* ── Numeric pH Rules ── */
  {
    id: 'ph-too-high',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.ph !== null && ctx.ph > 7.0;
    },
    advice: 'Your reported pH above 7.0 creates lockout conditions for iron, manganese, zinc, and copper — all of which become chemically unavailable as pH rises above 7.0. This explains why standard nutrient solutions are not resolving the symptoms. Bring pH down to the appropriate range: 6.2-6.8 for soil, 5.8-6.2 for coco and hydro. Flush with correctly pH-ed water until runoff matches target. Use a pH-down product (phosphoric acid) to correct the source water before each feeding.'
  },
  {
    id: 'ph-too-low',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.ph !== null && ctx.ph < 5.5;
    },
    advice: 'Your reported pH below 5.5 creates lockout conditions for calcium, magnesium, and phosphorus — all of which precipitate or become chemically unavailable at low pH. This is a critical correction needed immediately. In soil: flush with pH 7.0 water to raise the root zone pH, then resume at the correct pH (6.5). In coco: flush at pH 6.0-6.2. In hydro: adjust reservoir to pH 5.8-6.0. Do not add lime or pH-up directly to the medium — correct through the water only.'
  },
  {
    id: 'rh-too-high',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.rh !== null && ctx.rh > 65;
    },
    advice: 'Relative humidity above 65% in a flowering cannabis plant creates serious mold pressure. Botrytis (bud rot) and powdery mildew require humidity above 65% to germinate and spread efficiently. Immediate action: add a dehumidifier rated for your tent size, increase exhaust fan speed, and improve air circulation within the canopy. Target 40-55% RH in late flower. Check inside any dense colas — internal humidity within thick buds can be 10-15% higher than the air around them.'
  },
  {
    id: 'env-high-temp',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.temp !== null && ctx.temp > 30;
    },
    advice: 'Temperatures above 30C will cause significant stress: terpene evaporation reduces the final aroma/flavor profile, chlorophyll degrades faster, and root zone temperatures rise (root zone above 25C dramatically increases Pythium risk in hydro). Reduce your light intensity by 20-30% as LEDs are the primary heat source in most setups. Increase exhaust fan speed to maximum. Consider a portable AC unit or moving the grow to a cooler space if sustained temps above 30C are expected.'
  },

  /* ── Mother Plant ── */
  {
    id: 'mother-n-def',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'mother' && diagId === 'r-n-def';
    },
    advice: 'Mother plants have a sustained high nitrogen demand because they are kept in perpetual vegetative growth. A nitrogen deficiency in a mother plant will cause declining clone quality and rooting success as the cuttings will be taken from stressed, nitrogen-depleted tissue. Top-dress with high-quality worm castings (1-2 cups per gallon of container volume) or switch to a high-nitrogen organic fertilizer. Also check that your mother is not rootbound — a rootbound mother cannot uptake nutrients efficiently regardless of feeding.'
  },
  {
    id: 'mother-rootbound',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'mother' && (ctx.rootHealth === 'root-bound' || diagId === 'r-underwater');
    },
    advice: 'A rootbound mother plant will show declining vigor and nutritional issues that cannot be fixed with nutrients alone. Mother plants should be root-pruned every 6-12 months to maintain productive growth in a fixed container. Remove from the container, prune 25% of the outer and bottom root mass with sterile scissors, and replant in the same container with fresh medium on the walls and bottom. The plant will recover in 2-3 weeks and resume vigorous vegetative growth. Alternatively, upsize to a larger container.'
  },

  /* ── Diagnosis Deep Dives ── */
  {
    id: 'n-def-late-flower',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-n-def' && ctx.recentEvent === 'flip';
    },
    advice: 'In late flower (weeks 6-10), some degree of lower leaf yellowing is normal and even desirable — this is the plant naturally senescing and mobilizing stored nitrogen back into the flowers. Before treating nitrogen deficiency in late flower, check your trichome development: if trichomes are all cloudy or showing amber, you may be seeing harvest fade rather than deficiency. Only supplement nitrogen in late flower if yellowing is progressing rapidly up the plant from bottom to top before trichomes are mature.'
  },
  {
    id: 'p-def-cold',
    priority: 9,
    condition: function(ctx, diagId) {
      return diagId === 'r-p-def' && ctx.envEvent === 'cold-snap';
    },
    advice: 'Phosphorus deficiency combined with a cold snap is highly likely to be cold-induced P lockout rather than a true P deficiency. Root zone temperatures below 15C shut down the phosphorus transport proteins in root cells. The solution is temperature correction, not more phosphate fertilizer. Insulate your pots, raise your grow space temperature, and ensure your nutrient solution is at least 18C before watering. If you are growing in a garage or shed during winter, this is a frequent and often overlooked problem.'
  },
  {
    id: 'overwater-daily',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.wateringPattern === 'daily' && diagId === 'r-overwater';
    },
    advice: 'Daily watering in soil is almost always overwatering unless you are in final flower with large plants in small pots. The standard test for soil watering timing is pot weight: lift the pot after watering to learn its saturated weight, then water again only when it feels 60-70% lighter. For most soil grows, this means watering every 2-4 days. Daily watering keeps oxygen out of the root zone, promotes root rot, and creates anaerobic conditions that prevent all nutrient uptake.'
  },
  {
    id: 'underwater-when-dry',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.wateringPattern === 'when-dry' && diagId === 'r-underwater';
    },
    advice: 'Watering only when the medium is dry is generally sound practice in soil, but there is a critical distinction between "top inch is dry" (correct timing) and "medium has pulled away from pot walls and is bone dry throughout" (too dry, causing root stress). If you are seeing underwatering symptoms with a when-dry approach, test by inserting a finger 2 inches into the medium — if it is bone dry at that depth, you are waiting too long. Water when just the top 1-2 inches are dry, not when the entire medium is dessicated.'
  },
  {
    id: 'bagseed-hermie',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'bagseed' && (diagId === 'r-hermie-stress' || diagId === 'r-hermie-genetic');
    },
    advice: 'Bagseed plants have a high rate of hermaphroditism because commercial cannabis is often grown in stressful conditions that trigger hermaphroditism, and those seeds carry both the genetic predisposition and potentially unstable genetics from poor breeding. If your bagseed has gone hermie, the cause is more likely genetic than environmental. You can attempt to manage stress-induced hermaphroditism by eliminating all stress factors (light leaks, temperature swings, overwatering), but a genetically unstable plant will continue to produce pollen sacs. Start fresh with feminized seeds from a reputable breeder for your next run.'
  },
  {
    id: 'recovering-patience',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'recovering';
    },
    advice: 'A recovering plant needs time and stability above all else. The most common mistake during recovery is changing too many things simultaneously, or re-treating before giving the previous treatment time to work. Establish stable conditions — correct pH, appropriate watering frequency, proper light intensity — and maintain them consistently. Visible improvement on existing damaged leaves is rare (damaged tissue does not repair itself); look for healthy new growth coming in as your marker of successful recovery. Allow 7-10 days minimum before concluding a treatment is not working.'
  },
  {
    id: 'stunted-check-roots',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'stunted' && diagId !== 'r-root-rot';
    },
    advice: 'Persistent stunting that does not respond to nutrient corrections almost always has a root zone origin. Before adding more nutrients or adjusting pH further, do a root inspection: unpot the plant and check the color, texture, and smell of the roots. White, firm, and earthy-smelling roots are healthy. Brown, soft, and foul-smelling roots indicate root rot. Circling, matted roots indicate rootbound conditions. Either root rot or rootbound growth can cause exactly the symptom picture you are seeing and will not respond to any amount of nutrient adjustment.'
  },
  {
    id: 'vigorous-mild-burn',
    priority: 6,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'vigorous' && diagId === 'r-nute-burn-mild';
    },
    advice: 'Mild nutrient burn on a vigorous, fast-growing plant is actually a sign you are very close to the optimal feed level. A 2-3mm tip burn on otherwise dark green, fast-growing plants indicates you are just slightly over the threshold — you are essentially at maximum nutrient loading with minimal waste. You can either back off 10-15% to eliminate the burn completely, or accept minimal tip burn as the trade-off for near-maximum growth rates. This is a different situation from burn on a struggling plant.'
  },
  {
    id: 'broad-mites-microscope',
    priority: 9,
    condition: function(ctx, diagId) {
      return diagId === 'r-broad-mites';
    },
    advice: 'Broad mites (Polyphagotarsonemus latus) are microscopic — too small to see with the naked eye or even most loupes. Confirm the diagnosis with a 60x-100x microscope or jeweler\'s loupe on a fresh leaf sample. Look for tiny translucent eggs along the midrib and petioles. Treatment must reach the mites directly: use Avid (abamectin) or Forbid (spiromesifen) as they are the most effective options available. Spinosad has limited efficacy. Broad mites cannot be treated effectively with pyrethrin or neem. Inspect new plant purchases carefully — broad mites are most commonly introduced on purchased clones.'
  },
  {
    id: 'thrips-lifecycle',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-thrips';
    },
    advice: 'Thrips have a complex lifecycle: adults lay eggs inside leaf tissue, larvae feed on the leaf surface for 7-14 days, then pupate in the soil. Effective control requires targeting multiple lifecycle stages simultaneously: spray spinosad (Captain Jack\'s Deadbug) on leaves to kill adults and larvae, AND drench the soil with spinosad to kill pupating larvae. Apply every 5-7 days for 3 consecutive cycles. Blue sticky traps catch adults and provide population monitoring. Introduce Amblyseius cucumeris predatory mites for biological control in combination with spinosad.'
  },
  {
    id: 'damping-off-prevention',
    priority: 9,
    condition: function(ctx, diagId) {
      return diagId === 'r-damping-off';
    },
    advice: 'Damping off (Pythium, Fusarium, or Rhizoctonia at the stem base) cannot be reversed — affected seedlings should be removed immediately to prevent spread. Prevention for the next run: (1) Use fresh, sterile seedling medium — never reuse seedling plugs. (2) Sterilize propagation trays and domes between runs. (3) Maintain humidity dome vents slightly open to prevent stagnant air. (4) Water with a dilute Trichoderma or beneficial bacteria product from day one. (5) Bottom-water or mist rather than top-watering directly onto the stem. (6) Keep seeds at 20-25C for germination but allow slight temperature cycling for hardening.'
  },
  {
    id: 'n-tox-after-flip',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-n-tox' && ctx.recentEvent === 'flip';
    },
    advice: 'Nitrogen toxicity after the flip is extremely common when growers do not adjust their nutrient program for the transition to flower. In veg, plants demand high N. In flower, demand shifts sharply to P and K. Continue feeding veg-level nitrogen into flower and you will see the characteristic dark green, glossy, claw-shaped leaves of N-tox within 1-2 weeks. Immediately: stop all N-heavy veg nutrients, switch to a dedicated bloom formula with low N and high P/K, and water with plain pH-corrected water for 1-2 feeds to bring nitrogen levels down.'
  },
  {
    id: 'bud-rot-worsening',
    priority: 10,
    condition: function(ctx, diagId) {
      return diagId === 'r-bud-rot' && (ctx.severity === 'worsening' || ctx.scope === 'spreading');
    },
    advice: 'Spreading bud rot is a harvest emergency. Botrytis spreads by airborne spores and once it has colonized multiple sites, it will spread to every dense bud in the tent within days in high humidity conditions. Your choices: (1) Emergency harvest all ripe or near-ripe flowers immediately and water-cure or dry promptly. (2) Aggressively remove all infected tissue and drop RH to below 45% with a dehumidifier running continuously. (3) Apply a potassium bicarbonate spray (Armicarb/GreenCure) to remaining clean buds as a preventive barrier — this is safe and residue-free. Do not spray affected buds, only healthy ones.'
  },

  /* ── K Deficiency ── */
  {
    id: 'k-def-late-flower',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-k-def' && (ctx.stage === 'flower' || ctx.stage === 'mid-flower' || ctx.stage === 'late-flower' || ctx.recentEvent === 'flip');
    },
    advice: 'Potassium demand peaks in mid-to-late flower when the plant is building dense buds and needs K for osmoregulation, sugar transport, and enzyme activation. After the flip, increase your K input significantly — a dedicated PK booster (like PK 13/14 or equivalent) is appropriate from week 3 of flower onward. Verify pH is in range: K becomes less available above pH 7.0 or below pH 5.5. Brown scorching that starts at leaf edges and progresses inward is the classic K-deficiency pattern.'
  },

  /* ── Fe/Mn/Zn Interplay ── */
  {
    id: 'fe-def-ph-cause',
    priority: 9,
    condition: function(ctx, diagId) {
      return (diagId === 'r-fe-def' || diagId === 'r-mn-def' || diagId === 'r-zn-def');
    },
    advice: 'Iron, manganese, and zinc deficiencies are almost never caused by a shortage of these elements in the nutrient solution — they are almost always pH-induced lockout. These micronutrients become chemically unavailable above pH 7.0 in any medium. Before adding iron chelates or micronutrient supplements, measure your root zone pH with a calibrated digital meter. Correct pH to 6.0-6.5 (soil) or 5.8-6.2 (coco/hydro) and the interveinal chlorosis will clear from new growth within 5-7 days as uptake resumes.'
  },

  /* ── PM / Mold ── */
  {
    id: 'pm-early-intervention',
    priority: 9,
    condition: function(ctx, diagId) {
      return (diagId === 'r-pm' || diagId === 'r-wpm-early') && ctx.severity === 'early';
    },
    advice: 'Powdery mildew caught early is the best case scenario — the colony is small and has not produced the airborne spores that spread it to the rest of the canopy. Immediate action: remove and bag affected leaves, do not shake them in the tent. Spray remaining foliage (including tops and undersides) with potassium bicarbonate solution (GreenCure/Armicarb at label rate), which raises leaf surface pH and kills PM spores. In veg, dilute neem oil spray (2-3ml/L) every 3 days is also effective. Reduce RH below 50% and increase airflow. Do not use these sprays in flower after week 3.'
  },
  {
    id: 'pm-genetics',
    priority: 7,
    condition: function(ctx, diagId) {
      return (diagId === 'r-pm' || diagId === 'r-wpm-early') && ctx.severity === 'chronic';
    },
    advice: 'Chronically recurring powdery mildew despite environmental control often indicates the strain has genetic susceptibility to PM. Some cultivars (particularly older indica-dominant varieties) are PM magnets in high-humidity environments. Consider: upgrading to PM-resistant genetics for future grows; maintaining a strict prophylactic spray program with potassium bicarbonate on susceptible plants; and running a UV-C air sterilizer inside the tent, which destroys PM spores as they circulate through the air.'
  },

  /* ── S Deficiency ── */
  {
    id: 's-def-organic',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-s-def' && ctx.feedType === 'organic';
    },
    advice: 'Sulfur deficiency in organic grows typically means the organic amendments are not breaking down fast enough to release plant-available sulfate. Sulfur is immobile, so symptoms appear first in new growth as uniform yellowing (similar to nitrogen deficiency but in young leaves). Fast remedy: add Epsom salt (magnesium sulfate, MgSO4) as a foliar spray at 1 tsp/L — this provides both magnesium and sulfur. Alternatively, top-dress with gypsum (calcium sulfate) which is soil-biology compatible and slowly releases sulfate.'
  },

  /* ── Natural Fade vs Deficiency ── */
  {
    id: 'natural-fade-timing',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-natural-fade';
    },
    advice: 'Natural late-flower fade (senescence) causes lower-leaf yellowing and is a normal and expected part of the cannabis lifecycle. The key distinction from deficiency: (1) Timing — if the plant is within 2-3 weeks of harvest, fade is normal. (2) Pattern — fade starts with the oldest lowest leaves and progresses slowly upward over weeks. (3) Trichome state — if trichomes are mostly cloudy with some amber appearing, you are looking at a maturing plant, not a sick one. Check trichomes with a 60x loupe before chasing deficiencies at this stage.'
  },

  /* ── Wind Burn ── */
  {
    id: 'wind-burn-identification',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-wind-burn';
    },
    advice: 'Wind burn from direct fan airflow causes leaves to claw downward in a characteristic way — the whole leaf blade curls uniformly (unlike nitrogen toxicity where just the tips claw). The affected leaves are always the ones closest to the fan output. Fix: redirect fans to bounce airflow off tent walls rather than blowing directly onto plants. You want air movement throughout the canopy but no single leaves fluttering vigorously. A gentle, oscillating fan pattern is ideal. Affected leaves will not recover but new growth will be normal once airflow is corrected.'
  },

  /* ── Low Humidity / VPD ── */
  {
    id: 'low-humidity-veg',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-low-humidity' && ctx.rh !== null && ctx.rh < 35;
    },
    advice: 'RH below 35% creates dangerously high VPD — the plant is losing water through transpiration faster than it can absorb through roots. Leaves will cup upward, growth will slow, and the plant shifts energy to survival mode. Add a humidifier rated for your tent size. In veg, target 60-70% RH. In early flower, target 50-60%. In late flower, keep 40-50% to balance VPD against mold risk. Very low RH also accelerates the drying out of top layers of growing medium, which can cause misleading apparent underwatering symptoms.'
  },

  /* ── Overwater with Symptoms Confusion ── */
  {
    id: 'overwater-looks-like-n-def',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.wateringPattern === 'daily' && diagId === 'r-n-def';
    },
    advice: 'If you are watering daily and seeing what looks like nitrogen deficiency, overwatering and the resulting anaerobic root zone conditions are the more likely cause. Saturated, oxygen-depleted roots cannot absorb nitrogen even when it is present in the medium — the plant shows yellowing that mimics N deficiency but adding more nitrogen will not help. Stop watering for 3-4 days and allow the medium to dry significantly. If yellowing stabilizes or new growth comes in green after the dry-out period, overwatering was the true cause.'
  },

  /* ── Mineral Deposits ── */
  {
    id: 'mineral-deposits-tap',
    priority: 6,
    condition: function(ctx, diagId) {
      return diagId === 'r-mineral' && ctx.waterType === 'tap';
    },
    advice: 'White crusty deposits on leaves from tap water are calcium and magnesium mineral salts that are left behind as water evaporates — they are cosmetically concerning but not harmful to the plant. They are not a sign of calcium deficiency (the mineral in question is already in the plant tissue). Wipe leaves with a damp cloth to remove deposits. To prevent recurrence: use RO water, filtered water, or allow tap water to sit for 24 hours before use. Heavy tap water (above 300 PPM baseline) can also affect your total EC calculation — factor in baseline EC when formulating your nutrient solution.'
  },

  /* ── Nute Burn from Specific Source ── */
  {
    id: 'nute-burn-hot-soil',
    priority: 8,
    condition: function(ctx, diagId) {
      return (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe') && ctx.medium === 'soil' && ctx.previousTreatment !== 'increased-nutes';
    },
    advice: 'Nutrient burn without recent feed changes in soil often means your medium is a "hot" mix (high in pre-loaded nutrients like blood meal, bat guano, or worm castings) that is releasing more nutrients than your current plant size can handle. Check runoff EC — if it is above 2.5 EC (1250 PPM on 500 scale), your medium is overloaded. Flush with 3x the pot volume of plain pH-corrected water to dilute the salt load. If you are potting up or starting new plants, use a starter mix or cut the hot soil with 30-40% perlite to dilute the nutrient load.'
  },

  /* ── General Stunted Recovery ── */
  {
    id: 'stunted-auto-vs-photo',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.plantHealth === 'stunted' && ctx.plantType !== 'autoflower';
    },
    advice: 'A stunted photoperiod plant has a significant advantage over a stunted autoflower: you can extend the vegetative phase indefinitely to allow recovery. Keep the plant in veg (18/6 light schedule) until it regains healthy growth momentum. During recovery: (1) inspect and correct the root zone first, (2) maintain stable pH and moderate EC (0.8-1.2 EC / 400-600 PPM during recovery), (3) keep temperature at 24-26C and RH at 60-65%, (4) avoid any training that stresses the plant further until 2 weeks of healthy new growth are established.'
  },

  /* ── Specific Hydro: Reservoir Management ── */
  {
    id: 'hydro-reservoir-ec',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.medium === 'hydro' && ctx.ec !== null && ctx.ec > 2.5;
    },
    advice: 'An EC above 2.5 in a hydro reservoir is approaching the threshold for nutrient burn and osmotic stress in most cannabis varieties. The plant draws water through osmosis, and at very high EC, the osmotic gradient reverses and actually pulls water out of root cells. Immediately dilute the reservoir by replacing 30-40% of the nutrient solution with pH-corrected RO or clean water. Target EC in the range of 1.2-2.0 during vegetative growth and 1.4-2.2 during peak flower, depending on the strain and growth rate.'
  },

  /* ── Cold Purple Without Cold Snap ── */
  {
    id: 'cold-purple-genetic',
    priority: 6,
    condition: function(ctx, diagId) {
      return diagId === 'r-cold-purple' && ctx.envEvent !== 'cold-snap';
    },
    advice: 'Purple coloration in cannabis can be either cold-induced (phosphorus lockout) or entirely genetic — some cultivars express purple anthocyanin pigments naturally regardless of temperature or nutrient status. Genetic purple expression typically appears uniformly in stems, petioles, and sometimes leaf tissue, and does not correlate with any other stress signs. Cold-induced purple tends to appear suddenly after a temperature drop and is accompanied by other deficiency signs (leaf curl, slow growth). If your plant has no other stress symptoms and has always grown with purple tones, this is likely a genetic expression — no action needed.'
  },

  /* ── Fungal Leaf Spots ── */
  {
    id: 'fungal-spots-humidity',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-fungal' && ctx.rh !== null && ctx.rh > 60;
    },
    advice: 'Fungal leaf spots (Septoria, Alternaria, or similar) thrive in high humidity with poor air circulation. Reduce RH below 55%, increase circulation fan speed, and ensure there is no standing water in the grow space. Remove all spotted leaves immediately and bag them — do not compost. Apply a copper-based fungicide (copper octanoate) or potassium bicarbonate as a preventive spray on remaining leaves during lights-on, ensuring complete coverage of both leaf surfaces. In established infections, defoliate aggressively to remove infected material and improve airflow through the remaining canopy.'
  },

  /* ── Light Too Close ── */
  {
    id: 'light-too-close-measure',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-light-too-close' || diagId === 'r-light-distance';
    },
    advice: 'Without a PAR meter, use these practical distance guidelines as a starting point: LED quantum boards at full power (240-480W): 45-60 cm from canopy. HPS 600W: 40-50 cm. HPS 1000W: 50-60 cm. CFL/T5: 5-10 cm. The Photone app (iOS/Android) with a white card diffuser provides a low-cost PAR estimate accurate to within 15-20% for basic guidance. For seedlings and clones: add 30-40% more distance than adult plants. Signs that the light is too close without being burn: tight internode spacing and very dark leaf color are actually positive signs of optimal intensity; it is only burning/bleaching that confirms excess.'
  },

  /* ── Slow pH Drift in Soil ── */
  {
    id: 'ph-drift-soil',
    priority: 7,
    condition: function(ctx, diagId) {
      return diagId === 'r-ph-drift' && ctx.medium === 'soil';
    },
    advice: 'Slow pH drift in soil is usually caused by a combination of nutrient uptake (roots release H+ ions as they absorb cations), acidic fertilizer salts accumulating, or an initial soil mix that was not properly buffered. To correct: flush with pH 6.8-7.0 water to push excess salts through. For long-term stability, incorporate dolomite lime into your next soil mix at 2 tablespoons per gallon of medium — it acts as a pH buffer and releases Ca and Mg slowly. Check runoff pH every 2-3 waterings to catch drift early.'
  },

  /* ── Transplant Shock Detail ── */
  {
    id: 'transplant-shock-coco',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-transplant' && ctx.medium === 'coco';
    },
    advice: 'Transplanting into coco requires pre-saturating the new coco medium with a full-strength (but slightly diluted, 0.8-1.0 EC) CalMag-first nutrient solution before introducing the transplant. Dry or plain-water-moistened coco has a high cation exchange capacity that will immediately strip calcium and magnesium from your plant roots during the most vulnerable window of transplant recovery. Pre-charging the coco with calcium saturates the exchange sites and prevents the initial Ca stripping. After transplanting, resume normal feeding within 24 hours — coco does not benefit from a "recovery water-only period" the way soil does.'
  },

  /* ── Overwater with Just-Watered ── */
  {
    id: 'overwater-just-watered',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.wateringPattern === 'just-watered' && diagId === 'r-overwater';
    },
    advice: 'If you watered very recently and are seeing droop, this is likely temporary post-watering droop rather than chronic overwatering — it is normal for some plants to droop slightly in the first 1-2 hours after a heavy watering as the root zone adjusts. Wait 2-4 hours before making any diagnosis. Chronic overwatering presents as persistent droop that does not resolve, even when the medium has partially dried. If the plant is still drooping 6+ hours after watering with no recovery, then overwatering is a more valid concern.'
  },

  /* ── Step-by-Step Cultivation Protocols ── */

  /* Protocol 1: N Def in Organic Soil + LED (Veg) */
  {
    id: 'soil-led-organic-n-def-veg',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && ctx.feedType === 'organic' && diagId === 'r-n-def';
    },
    advice: '(1) CHECK pH FIRST: Test runoff pH. Target 6.2-6.8 for soil. If outside range, correct pH before any nutrient treatment.\n(2) IMMEDIATE FIX: Apply worm castings top-dress, 1-2 cups per 5-gallon pot. Water in with pH 6.5 water.\n(3) FAST ORGANIC N: Fish hydrolysate at 5-10 ml/L as root drench for immediately available nitrogen.\n(4) COMPOST TEA: 4-6 cups castings + 1 oz molasses in 4 gal water, aerate 24-36 hours, then apply as drench.\n(5) CHECK ROOT ZONE TEMP under LED: Below 18C (64F) slows microbial N release dramatically. Elevate pots, consider heat mat set to 20-22C (68-72F).\n(6) MONITOR NEW GROWTH ONLY: Old yellowed leaves will NOT recover. Improvement in new growth visible in 5-7 days.\n(7) IF NO IMPROVEMENT after 10 days: Inspect roots for rot or binding before adding more nitrogen.'
  },

  /* Protocol 2: N Def in Flower (Natural Fade vs Real Deficiency) */
  {
    id: 'soil-led-n-def-flower-vs-fade',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-n-def' && (ctx.stage === 'flower' || ctx.stage === 'mid-flower' || ctx.stage === 'late-flower');
    },
    advice: '(1) CHECK TRICHOMES FIRST with 60x loupe on calyxes. Mostly cloudy + some amber = natural senescence fade, do NOT add nitrogen. Mostly clear = real deficiency requiring correction.\n(2) WEEKS 1-5 OF FLOWER: Gentle correction is appropriate. Use liquid seaweed at 5-10 ml/gal or fish hydrolysate at HALF your normal veg dose.\n(3) WEEKS 6 AND BEYOND: LEAVE IT ALONE. The plant is intentionally mobilizing stored nitrogen from fan leaves into buds. This is a feature, not a defect.\n(4) CRITICAL WARNING: Excess nitrogen in late flower delays maturity, suppresses terpene production, and creates harsh, chemical-tasting smoke. The cost of unnecessary N supplementation is worse than mild deficiency at this stage.'
  },

  /* Protocol 3: Ca Def Under LED in Soil */
  {
    id: 'soil-led-ca-def-mechanism',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (ctx.medium === 'soil' || ctx.medium === 'living-soil') && (diagId === 'r-ca-def' || diagId === 'r-ca-def-new' || diagId === 'r-ca-mg');
    },
    advice: '(1) THE LED MECHANISM: LEDs produce no infrared radiation, so leaves run 2-3C (3-5F) cooler than under HPS. Cooler leaves transpire less, and calcium uptake is driven by transpiration, not active absorption. Less transpiration = less Ca delivered.\n(2) RAISE ROOM TEMP to 26-28C (79-82F): This single environmental change often resolves mild Ca deficiency under LED without any product changes.\n(3) CHECK pH: Calcium is absorbed in the 6.2-7.0 range in soil. Outside this window, CalMag you apply is wasted.\n(4) CALMAG DRENCH: 5 ml/L at pH 6.5, applied at every watering for 2-3 weeks until new growth shows no spots.\n(5) IN VEG: Foliar spray CalMag at 1-2 ml/L on leaf undersides during lights-off period to bypass root delivery.\n(6) ORGANIC OPTION: Gypsum (calcium sulfate) top-dress at 1/4 cup per 5-gal pot provides slow-release calcium without changing soil pH.\n(7) MONITOR NEW GROWTH ONLY: Spots on existing leaves are permanent damage. Recovery in new growth visible within 5-7 days after correction.'
  },

  /* Protocol 4: Mg Def Under LED */
  {
    id: 'soil-led-mg-def-protocol',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (ctx.medium === 'soil' || ctx.medium === 'living-soil') && (diagId === 'r-mg-def' || diagId === 'r-mg-def-spots');
    },
    advice: '(1) CONFIRM DIAGNOSIS: Classic Mg deficiency = interveinal chlorosis (yellowing between veins) starting on LOWER and OLDER leaves. If yellowing is on new growth, it is likely iron deficiency, not magnesium.\n(2) CHECK pH: Magnesium is available in the 6.0-7.0 range in soil. Correct pH before treating.\n(3) FAST FIX - FOLIAR EPSOM: 1 tsp Epsom salt per liter of water. Spray undersides of leaves during lights-off, every 3-4 days for 2 weeks. This delivers Mg directly through leaf stomata.\n(4) ROOT DRENCH EPSOM: 1-2 tsp per gallon at pH 6.5, applied at each regular watering.\n(5) LED-SPECIFIC DOSE INCREASE: Under LED lighting, increase Mg supplementation by 30% compared to HPS grows. Also raise room temp 2-3C (3-5F) to improve transpiration and uptake.\n(6) CHECK FOR K ANTAGONISM: High potassium directly competes with magnesium uptake. If running heavy bloom boosters, reduce the potassium dose by 20% before adding more Mg.\n(7) STOP FOLIAR SPRAYING after week 3 of flower to prevent bud moisture and rot risk.\n(8) ORGANIC LONG-TERM: Dolomite lime at 1 tbsp per gallon of soil provides slow-release calcium and magnesium throughout the grow.'
  },

  /* Protocol 5: Combined Ca/Mg Under LED */
  {
    id: 'soil-led-ca-mg-combined',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-ca-mg';
    },
    advice: '(1) COMBINED DEFICIENCY SIGNATURE: Calcium symptoms appear on NEW growth (spots, brown edges on young leaves). Magnesium symptoms appear on OLD growth (interveinal yellowing on lower fans). Both together under LED = classic Ca+Mg deficiency, the number one deficiency in modern LED grows.\n(2) CHECK pH 6.2-6.8 in soil: Both Ca and Mg become unavailable outside this range. pH correction is step one.\n(3) DUAL PRODUCT DRENCH: CalMag at 5 ml/L plus Epsom salt at 1 tsp/gal in every watering until symptoms stabilize.\n(4) IN VEG - FOLIAR BOOST: CalMag at 2 ml/L sprayed on leaf undersides every 3 days for 2 weeks provides faster correction.\n(5) RAISE ROOM TEMP TO 26-28C (79-82F): The single most important long-term fix for Ca+Mg under LED. Warmer air increases transpiration which drives Ca delivery.\n(6) TARGET VPD: 1.0-1.3 kPa in veg, 1.2-1.5 kPa in flower. Low VPD = poor transpiration = poor Ca delivery.\n(7) ORGANIC GROW OPTION: Dolomite lime at 2 tbsp per gallon of soil provides buffered slow-release Ca+Mg throughout the run.\n(8) RECOVERY TIMELINE: Foliar correction visible in 2-4 days. Root drench correction visible in 5-7 days. Old damaged tissue will NOT recover.'
  },

  /* Protocol 6: P Def Cold Roots */
  {
    id: 'soil-led-p-def-cold-roots',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-p-def';
    },
    advice: '(1) CHECK ROOT ZONE TEMPERATURE FIRST: Use a soil thermometer at 5-10cm depth. Below 18C (64F) causes phosphorus transport lockout in root cells, even when P is present in the medium. This is not a true deficiency.\n(2) APPLY HEAT IMMEDIATELY: Heat mat under pot set to 22C (72F). Insulate the pot from cold floors with foam board. Raise night temperatures to minimum 18C.\n(3) WARM YOUR WATER: Water with room-temperature water at 20-22C (68-72F). Never water with cold water in cool conditions.\n(4) ONCE ROOTS ARE WARM: Phosphorus becomes available from the existing organic matter naturally. Give 3-5 days at correct temperature before adding P supplements.\n(5) IF STILL DEFICIENT at correct temperature after 5 days: Bat guano compost tea (1 tbsp per gal steeped 24 hours) or bone meal top-dress at 1 tbsp per gallon of soil.\n(6) PURPLE STEMS: Cold-induced purple stem coloration is permanent on existing tissue. Watch new growth for green recovery which confirms the cold lockout is resolved.\n(7) PREVENTION: Never sit pots directly on concrete floors. Use platforms, foam, or wooden boards to insulate root zone from cold surfaces.'
  },

  /* Protocol 7: pH Too High (>7.0) */
  {
    id: 'soil-ph-high-correction',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.ph !== null && parseFloat(ctx.ph) > 7.0 && (ctx.medium === 'soil' || ctx.medium === 'living-soil');
    },
    advice: '(1) VERIFY WITH CALIBRATED DIGITAL pH METER on fresh runoff (not input water). Confirm the reading before treating.\n(2) WATER WITH pH 6.0-6.3 for the next 3-5 waterings. Each watering should drop runoff pH by 0.2-0.3 points. Target final runoff of 6.2-6.5.\n(3) EXTREME HIGH pH (above 7.5): Targeted flush with 2x pot volume at pH 6.0-6.2 to rapidly reset the root zone.\n(4) ORGANIC ACIDIFICATION: Elemental sulfur at 1/2 tsp per gallon of soil, OR citric acid at 0.5g per liter added to water for short-term correction.\n(5) IDENTIFY THE SOURCE: Alkaline tap water? Excess lime added previously? Limestone-heavy growing medium? Fix the source or pH will drift back up.\n(6) LOCKED OUT AT HIGH pH: Iron, manganese, zinc, copper, and boron all become unavailable above 7.0. These deficiencies will resolve themselves when pH drops below 6.8 without adding any supplements.\n(7) MONITOR RUNOFF every watering until stable at 6.2-6.8. Full stabilization typically takes 1-2 weeks of corrected watering.'
  },

  /* Protocol 8: pH Too Low (<5.5) */
  {
    id: 'soil-ph-low-correction',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.ph !== null && parseFloat(ctx.ph) < 5.5 && (ctx.medium === 'soil' || ctx.medium === 'living-soil');
    },
    advice: '(1) VERIFY WITH CALIBRATED METER: Confirm pH below 5.5 with fresh runoff measurement. Below 5.5 is a critical correction.\n(2) EMERGENCY FLUSH: Flush with pH 7.0 water at 2-3x pot volume to rapidly raise root zone pH. This is necessary when pH is below 5.5.\n(3) TOP-DRESS LIME: Dolomite lime at 1-2 tbsp per 5-gallon pot immediately after flushing. Water in gently.\n(4) FOLLOW-UP WATERING: Water at pH 6.5-6.8 for the next 3-5 waterings to bring runoff into target range.\n(5) LOCKED OUT AT LOW pH: Calcium, magnesium, and phosphorus all precipitate and become unavailable below 5.5. Adding CalMag will NOT work until pH is corrected first.\n(6) LIVING SOIL OPTION: Use oyster shell flour instead of aggressive dolomite lime. It raises pH slowly and is biology-friendly.\n(7) AFTER pH CORRECTION: Apply compost tea or beneficial bacteria product to reinoculate soil biology disrupted by the flush.\n(8) STABILITY: pH should stabilize within 1-2 weeks of corrected watering. Monitor runoff pH every watering during recovery.'
  },

  /* Protocol 9: Overwatering Recovery */
  {
    id: 'soil-overwater-recovery-protocol',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && (diagId === 'r-overwater' || diagId === 'r-overwater-yellow');
    },
    advice: '(1) THE LIFT TEST: Pick up the pot. Very heavy = overwatered. Skeleton-light = underwatered. This is more reliable than any other diagnostic test.\n(2) STOP WATERING: Set the pot aside and wait 3-7 days until it feels 60-70% lighter than fully saturated weight.\n(3) INCREASE AIRFLOW: Point a fan at the pot (not directly at the plant). Raise room temperature 2-3C (3-5F) to accelerate drying.\n(4) DO NOT TRANSPLANT while the medium is waterlogged. Disturbing a wet root ball makes oxygen deficit worse.\n(5) CHECK FOR ROOT ROT: If no recovery in 48 hours of drying, unpot and inspect roots. Brown slimy foul-smelling roots = root rot emergency. White firm roots = pure overwatering.\n(6) RESUME WATERING BY WEIGHT NOT SCHEDULE: After proper dry-out, water to 10-15% runoff, then wait until pot returns to near-light weight before watering again.\n(7) PREVENTION: Fabric pots improve drainage and air-pruning. Mix in 25-30% perlite. Never water on a fixed schedule -- always by pot weight.\n(8) RECOVERY TIMELINE: 3-5 days after proper dry-out period. New growth resuming is the success indicator.'
  },

  /* Protocol 10: Underwatering + Hydrophobic Soil */
  {
    id: 'soil-underwater-rewet-protocol',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-underwater';
    },
    advice: '(1) CONFIRM UNDERWATERING: Thin papery wilted leaves, pot is skeleton-light, soil visibly pulling away from pot walls = underwatered.\n(2) IF SOIL IS HYDROPHOBIC (water beads on surface and runs off): BOTTOM WATER. Fill a tray with 5-8cm of pH 6.5 water, set pot in it, leave 30-45 minutes for capillary wicking from below.\n(3) ALTERNATIVE TOP-WATER METHOD: Poke 5-8 holes in the soil surface with a chopstick or pencil, then water very slowly in small amounts over 10-15 minutes to allow absorption.\n(4) ADD WETTING AGENT: 1-2 drops castile soap or yucca extract per gallon breaks surface tension and helps water penetrate hydrophobic soil.\n(5) RECOVERY IS FAST: Leaves should visibly perk up within 2-6 hours after proper rewetting. If no response in 12 hours, root damage may be involved.\n(6) PREVENTION FOR LIVING SOIL: Never allow living soil to completely dry out. Keep minimum 20-30% moisture at all times. Mulch the surface with straw or wood chips to retain moisture.\n(7) BIOLOGY RESTORATION: Soil that dried completely may need compost tea reapplication to restore beneficial microbial life that died during drought stress.'
  },

  /* Protocol 11: Root Rot Triage */
  {
    id: 'soil-root-rot-triage',
    priority: 10,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-root-rot';
    },
    advice: '(1) UNPOT AND INSPECT: Carefully remove plant from container. White and firm roots = healthy. Brown, slimy, pulls apart easily, smells foul = root rot (Pythium or Fusarium).\n(2) ASSESS SEVERITY: Less than 25% brown roots = treat in place. 25-50% brown = trim + treat aggressively. More than 50% brown roots = emergency intervention or take cuttings immediately.\n(3) TRIM ALL BROWN ROOTS: Cut all brown and slimy material back to clean white tissue using sterile scissors. Sterilize scissors between cuts with isopropyl alcohol.\n(4) ROOT BATH OPTION (SYNTHETIC GROWS): 3% hydrogen peroxide diluted 1:10 with water. Soak trimmed roots for 5 minutes. Rinse with clean water.\n(5) CRITICAL WARNING FOR ORGANIC/LIVING SOIL: Do NOT use H2O2 - it destroys the beneficial biology that is your plant\'s defense system. Use Great White, Mykos, or Trichoderma products instead.\n(6) TRANSPLANT INTO FRESH MEDIUM: Use new medium with 30-35% perlite for improved drainage and oxygen. Pre-moisten medium before transplanting.\n(7) POST-CARE PROTOCOL: Light waterings only for 2 weeks. Reduce light intensity by 30% during recovery. Apply Hydroguard (Bacillus amyloliquefaciens) at 2 ml/L for the first 3 waterings.\n(8) FIX THE ROOT CAUSE: Overwatering, poor drainage, cold root zone, or insufficient oxygen in medium. The rot will return if the underlying cause is not corrected.'
  },

  /* Protocol 12: Fungus Gnats in Organic Soil (BTi Safe) */
  {
    id: 'organic-soil-fungus-gnat-bti',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-fungus-gnats';
    },
    advice: '(1) MONITORING FIRST: Place yellow sticky traps at soil level to count adult populations. This tells you severity and tracks treatment progress.\n(2) DRY THE TOP LAYER: Allow the top 2-3cm of soil to dry between waterings. Larvae cannot survive in dry soil. Adjust watering to allow surface drying.\n(3) BTi DRENCH (PRIMARY TREATMENT): Mosquito Bits or Gnatrol - steep 2 tbsp in 1 gallon of water for 30 minutes, strain, then drench the soil. Repeat every 5-7 days for 3-4 WEEKS minimum.\n(4) BTi BIOLOGY SAFETY: Bacillus thuringiensis israelensis is 100% safe for living soil biology. It does NOT harm mycorrhizae, beneficial bacteria, earthworms, or predatory insects. Safe to use in organic and living soil grows.\n(5) DO NOT STOP EARLY: Continue BTi treatment for the full 3-4 week period even after adults disappear. Larvae persist in soil for 2-3 weeks after adults are eliminated.\n(6) PHYSICAL BARRIER: Top-dress with 2-3cm of coarse sand or perlite to block adult females from laying eggs in the soil surface.\n(7) AVOID H2O2 IN LIVING SOIL: Hydrogen peroxide kills fungus gnat larvae but also destroys the beneficial microbial biology that makes living soil function. Do not use H2O2 in any organic or living soil system.\n(8) LONG-TERM BIOLOGICAL CONTROL: Hypoaspis miles predatory soil mites consume larvae continuously. Compatible with BTi and living soil biology.'
  },

  /* Protocol 13: Heat Stress Under LED */
  {
    id: 'led-heat-stress-protocol',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (diagId === 'r-heat-stress' || diagId === 'r-heat-light');
    },
    advice: '(1) LED HEAT IS DIFFERENT FROM HPS: LED heat is ambient room heat, not radiant canopy heat like HPS. The "hand test" does not work for LEDs. Measure air temperature at canopy level with a thermometer.\n(2) TARGET TEMPERATURE: 24-28C (75-82F) at canopy. Above 30C (86F) = heat stress. Above 32C (90F) = emergency requiring immediate action.\n(3) IMMEDIATE ACTIONS: Dim LED to 75% output. Set exhaust fan to maximum. Move LED driver unit OUTSIDE the tent if possible - drivers generate significant heat and removing them can drop tent temperature 3-5C.\n(4) RUN LIGHTS DURING COOLEST HOURS: If ambient temperature allows, switch to a lights-on period during the night when outside temperatures are lowest.\n(5) AIRFLOW ACROSS CANOPY: Multiple oscillating fans creating movement through the canopy reduce leaf surface temperature. Emergency: frozen water bottles placed at the intake reduce incoming air temperature.\n(6) CHECK VPD AT HIGH TEMP: At 30C (86F), humidity must be 55-65% to keep VPD below 2.0 kPa. High temperature + low humidity creates extreme plant stress.\n(7) DAMAGE ASSESSMENT: Leaf taco (edges curling upward) is reversible and typically corrects within 6-24 hours after temperature drops. Terpene degradation above 30C is permanent and invisible - it affects final product quality even if the plant visually recovers.'
  },

  /* Protocol 14: Light Burn Under LED */
  {
    id: 'led-light-burn-ppfd-chart',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && (diagId === 'r-light-burn' || diagId === 'r-light-too-close');
    },
    advice: '(1) LED LIGHT BURN IS PHOTON DAMAGE: Unlike HPS, LED light burn is caused by excessive photon intensity (PPFD), not heat. The hand test is completely useless for LEDs - you can have dangerous PPFD at a comfortable temperature.\n(2) PPFD TARGETS BY STAGE: Seedling: 200-400 PPFD. Veg: 400-600 PPFD. Early flower: 600-800 PPFD. Peak flower: 800-1000 PPFD. Maximum without CO2 supplementation: 1000-1100 PPFD.\n(3) APPROXIMATE DISTANCE CHART: 100W quantum board at full power: 30-40cm from canopy. 240W quantum board: 40-50cm. 480W quantum board: 50-60cm. Always verify with actual measurement.\n(4) IMMEDIATE FIX: Dim LED to 75-80% output OR raise light 10-15cm higher. Do one, not both simultaneously, to understand which is working.\n(5) MEASURE PPFD: Use the free Photone app (iOS/Android) with a white card placed under the lens for accurate results. Takes the guesswork out of light positioning.\n(6) BLEACHED OR WHITE TISSUE IS PERMANENT: The photodamaged cells cannot recover. Watch for new green growth coming in at the corrected intensity within 3-5 days as confirmation the fix worked.'
  },

  /* Protocol 15: Post-Transplant Shock */
  {
    id: 'post-transplant-normal-vs-problem',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'transplant';
    },
    advice: '(1) NORMAL POST-TRANSPLANT RESPONSE: Drooping for 24-72 hours is entirely normal. Slight pallor (lighter color) for 2-3 days is normal. Complete growth pause for 3-5 days is normal. These are not problems.\n(2) WARNING SIGNS OF ACTUAL PROBLEM: Drooping that continues beyond 72 hours with no improvement. Progressive yellowing that worsens after day 3. Stem softening at the base. Foul odor from the medium.\n(3) RECOVERY PROTOCOL: Plain pH 6.5 water only (zero nutrients) for the first 3-5 days. Reduce light intensity by 20-30% to lower transpiration demand on disrupted roots. Raise relative humidity by 5-10% during recovery.\n(4) FIRST FEEDING: Only resume feeding after new growth visibly resumes, and start at 50% of your normal dose. Damaged roots cannot process full-strength nutrients.\n(5) CRITICAL MISTAKE TO AVOID: Do NOT overwater a freshly transplanted plant. The #1 cause of transplant failure is watering too frequently during the 48-72 hour recovery window when roots are disturbed and oxygen demand is highest.'
  },

  /* Protocol 16: Bud Rot Emergency */
  {
    id: 'bud-rot-emergency-harvest',
    priority: 10,
    condition: function(ctx, diagId) {
      return diagId === 'r-bud-rot';
    },
    advice: '(1) DO NOT SHAKE THE PLANT: Botrytis spreads by airborne spores. Shaking or disturbing infected buds releases millions of spores into your tent air and contaminates healthy flowers.\n(2) SURGICAL REMOVAL: Cut 2-3cm BELOW the visible rot into healthy tissue. Immediately double-bag the removed material inside the tent before moving it. Seal the bag.\n(3) SEVERITY TRIAGE: Single spot = containable with aggressive removal and environmental fix. 2-4 spots = serious, remove all plus drop RH immediately. 5+ spots = HARVEST EVERYTHING SALVAGEABLE RIGHT NOW. Do not wait.\n(4) ENVIRONMENTAL FIX: Drop relative humidity to 40% or below immediately. Set all fans to maximum. Inspect for blocked airflow pockets in the canopy. Never spray water on buds at any stage of flower.\n(5) HARVEST DECISION FRAMEWORK: Check trichomes on healthy buds. Mostly cloudy with some amber = harvest now, do not risk more rot loss. Still mostly clear = consider partial harvest of at-risk lower and denser colas, preserve top colas.\n(6) BUD WASH AFTER HARVEST: Three-bucket system. Bucket 1: H2O2 (hydrogen peroxide) 1 cup per gallon of water. Bucket 2 and 3: plain water. Dunk each cola gently for 30 seconds in each bucket in sequence. Removes mold spores and debris. Dry with good airflow immediately after.'
  },

  /* Protocol 17: CalMag Not Working */
  {
    id: 'calmag-not-working-troubleshoot',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'calmag' && (diagId === 'r-ca-def' || diagId === 'r-mg-def' || diagId === 'r-ca-mg' || diagId === 'r-ca-def-new');
    },
    advice: '(1) pH IS THE NUMBER ONE SUSPECT: CalMag applied at the wrong pH is completely wasted. Calcium is absorbed at pH 6.2-7.0 in soil. Magnesium at 6.0-7.0. Check runoff pH with calibrated meter BEFORE adding more product.\n(2) CHECK YOUR DOSE: Standard CalMag dose is 3-5 ml/L. Under LED lighting specifically, increase to 5-7 ml/L because reduced transpiration limits passive Ca delivery.\n(3) CHECK FOR POTASSIUM ANTAGONISM: High potassium (K) ions directly block magnesium uptake at the root. Heavy bloom boosters with high PK ratios are the most common cause of Mg lockout despite CalMag application. Reduce K-heavy supplements by 20-30%.\n(4) CHECK FOR PHOSPHORUS ANTAGONISM: Excess phosphorus can precipitate calcium in the root zone. If running high-P bloom formulas, check that P is not excessive relative to Ca.\n(5) INSPECT ROOT HEALTH: Damaged, brown, or slimy roots cannot absorb CalMag regardless of pH or dose. Healthy white firm roots are prerequisite for CalMag to work.\n(6) TRY SEPARATE SUPPLEMENTATION: Add Epsom salt at 1-2 tsp per gallon ON TOP of your regular CalMag product. This provides additional magnesium through a different salt form.\n(7) RAISE ROOM TEMPERATURE: Under LED specifically, raising room temp to 26-28C (79-82F) increases transpiration and passive Ca delivery, which often resolves mild deficiency without changing product dose.\n(8) RECOVERY TIMELINE: After pH correction and correct dose, expect visible improvement in new growth within 5-7 days. Old damaged tissue will not recover.'
  },

  /* Protocol 18: Post-Flush No Improvement */
  {
    id: 'post-flush-no-improvement',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'flush';
    },
    advice: '(1) WAIT 48 HOURS BEFORE JUDGING: Flushing resets root zone salt and pH chemistry but the plant requires time to respond to the changed environment. Evaluate after 48 hours, not immediately.\n(2) CHECK RUNOFF AFTER FLUSH: Measure runoff pH and EC post-flush. If runoff EC is still high (above 2.0), flush again with 3x pot volume. If pH is still off, it may need more corrective watering.\n(3) IF PLANT LOOKS WORSE AFTER FLUSH: You likely overwatered during the flush process. Let the medium dry completely before assessing further. Flushing adds a large water volume that can create temporary overwatering symptoms.\n(4) RESUME FEEDING AT REDUCED STRENGTH: Restart feeding at 50-60% of your normal dose. The medium buffering has been reset and cannot handle full-strength nutrients immediately. Build back up over 3-5 waterings.\n(5) REASSESS THE DIAGNOSIS: Flushing fixes salt buildup and pH issues but does NOT fix root rot, pest damage, environmental stress, or light problems. If symptoms persist after a proper flush, the root cause may have been misidentified.\n(6) ROOT DAMAGE RISK: If roots were already damaged before flushing, the large water volume from flushing can worsen root rot conditions. Always inspect root health if flush does not produce improvement.'
  },

  /* Protocol 19: Neem Failed for Pests */
  {
    id: 'neem-failed-pest-escalation',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'neem' && (diagId === 'r-pest-mites' || diagId === 'r-broad-mites' || diagId === 'r-thrips');
    },
    advice: '(1) WHY NEEM FAILED: Neem oil is a repellent and antifeedant (disrupts insect hormone cycles) but is NOT a contact killer. It works as prevention or for very light infestations, not established populations. Once pests have taken hold, neem is the wrong tool.\n(2) FOR SPIDER MITES: Escalate to spinosad at 3-4 ml/L applied every 5 days for 3 cycles. Or use predatory mites (Phytoseiulus persimilis for spider mites) for biological control. Forbid (spiromesifen) provides fastest knockdown for severe infestations.\n(3) FOR BROAD MITES: Neem is virtually ineffective against broad mites. Use Avid (abamectin) at 0.5-1 ml/L, two applications 5-7 days apart. Broad mites are microscopic and require systemic chemistry to reach the folded new growth where they live.\n(4) FOR THRIPS: Spinosad foliar spray plus soil drench every 5 days for 3 consecutive cycles. The soil drench is essential to kill pupating larvae in the medium.\n(5) ROTATION IS CRITICAL: Never use the same active ingredient for more than 2-3 consecutive applications. Pests develop resistance rapidly. Alternate between chemical classes.\n(6) IN FLOWER AFTER WEEK 3: Switch to biological control ONLY. Introduce predatory mites (Amblyseius cucumeris for thrips, Phytoseiulus persimilis for spider mites). No chemical sprays on developing buds.'
  },

  /* Protocol 20: Power Outage/Light Leak Damage */
  {
    id: 'power-outage-light-leak-damage',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.envEvent === 'power-outage' || ctx.envEvent === 'light-leak';
    },
    advice: '(1) DAMAGE RISK BY DURATION: Less than 5 minutes of light during dark period = very low hermie risk. 30+ minutes = moderate risk. Multiple events across several nights = HIGH risk requiring close monitoring.\n(2) RESUME NORMAL SCHEDULE EXACTLY: Do NOT try to compensate by extending the dark period or making other schedule adjustments. Resume exactly normal 12/12. Any additional changes increase hormonal disruption.\n(3) HERMIE WATCH PROTOCOL: Starting 5 days after the incident, inspect every single bud site closely with a loupe every 2-3 days for 3 weeks. You are looking for yellow banana-shaped structures (nanners) growing from within the bud calyxes.\n(4) IF NANNERS ARE FOUND: Use tweezers to carefully pluck each nanner at its base. Mist the immediate area with plain water to capture any released pollen. Continue inspecting daily. A few nanners is manageable if caught early.\n(5) PREVENTION FOR FUTURE: Seal every light leak including zipper gaps, fan ports, cable pass-throughs, and indicator LEDs with black tape. Use a quality digital timer with battery backup. Test with eyes fully adjusted to darkness inside the tent.\n(6) PROBABILITY: A single brief light event has roughly a 95% chance of no lasting consequences. Repeated events over multiple nights push hermie probability above 50% in stress-sensitive genetics.'
  },

  /* ── Protocols 21-40 (cultivation step-by-step) ── */
  {
    id: 'soil-led-k-def-flower',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-k-def';
    },
    advice: '(1) K demand increases 50-100% from veg to flower. Brown/crispy leaf EDGES (not tips) on older leaves = K def. (2) Check pH 6.2-6.8. (3) Organic K: kelp extract 5 ml/L as root drench (fast). Kelp meal top-dress 2 tbsp per 5-gal pot (slow). (4) Langbeinite (Sul-Po-Mag) 1 tbsp per 5-gal for K+Mg+S. (5) Watch for Ca/Mg antagonism when increasing K -- balance is key. (6) Edge burn is permanent -- monitor new growth for clean margins in 7-10 days.'
  },
  {
    id: 'soil-fe-def-high-ph',
    priority: 9,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && diagId === 'r-fe-def';
    },
    advice: '(1) THE GOLDEN RULE: Fe deficiency in soil is almost NEVER low iron -- it is pH above 7.0 locking out iron already present. Fix pH, do not add iron first. (2) Confirm: interveinal chlorosis on NEWEST leaves (Fe is immobile). If on old leaves, it is Mg not Fe. (3) Check runoff pH. Above 7.0 = confirmed lockout. (4) Lower pH: water at 6.0-6.3 for 3-5 waterings. Do NOT crash to pH 5.0. (5) Chelated iron foliar (Fe-EDDHA, NOT EDTA) at 0.5-1 g/L during lights-off for fast relief. EDDHA works at wide pH range. (6) Organic: citric acid 0.5g/L drench to locally acidify. (7) White/pale new leaves are permanent. Green growth resumes 5-7 days after pH correction.'
  },
  {
    id: 'soil-mn-def-ph-lockout',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-mn-def' && (ctx.medium === 'soil' || ctx.medium === 'living-soil');
    },
    advice: '(1) Mn locks out above pH 6.8. Almost always pH-induced, not shortage. (2) Confirm: mottled interveinal chlorosis on NEW and MID-AGE leaves, less intense than Fe def. Small necrotic spots may appear. (3) CHECK pH first. Above 7.0 = fix pH before supplementing. (4) pH correction: water at 6.0-6.3 for 3-5 waterings. (5) If pH is correct: MnSO4 at 0.25-0.5 g/L root drench. Very small amounts needed -- Mn toxicity possible with overdose. (6) Foliar (veg only): MnSO4 0.1-0.2 g/L. One application may suffice once pH is fixed. (7) Recovery: 5-7 days for new growth.'
  },
  {
    id: 'organic-soil-s-def',
    priority: 7,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'living-soil' || ctx.feedType === 'organic') && diagId === 'r-s-def';
    },
    advice: '(1) S deficiency looks like N deficiency BUT appears on NEW growth first (S is immobile). Uniform yellowing of youngest leaves. (2) Check pH 6.0-7.0. (3) FAST FIX: Epsom salt (MgSO4) 1 tsp/L as root drench -- provides both S and Mg. (4) PREFERRED for living soil: gypsum (CaSO4) top-dress 1 tbsp per 5-gal pot. Does NOT alter pH. Provides Ca+S. Effect in 10-14 days. (5) Long-term: ensure soil mix includes kelp meal and/or gypsum as S sources. (6) Check root zone temp -- cold roots slow microbial S release. (7) New growth normalizes in 5-7 days with Epsom, 10-14 with gypsum.'
  },
  {
    id: 'soil-ph-drift-interpretation',
    priority: 8,
    condition: function(ctx, diagId) {
      return (ctx.medium === 'soil' || ctx.medium === 'living-soil') && (diagId === 'r-ph-drift' || diagId === 'r-ph-flux');
    },
    advice: '(1) MEASURE: Water in at pH 6.5, collect 100ml runoff, compare. (2) INTERPRETATION: Runoff higher (7.0+) = alkaline buildup, use pH 6.0-6.2 input. Runoff lower (5.5-5.8) = acid accumulation, use pH 6.8-7.0 input. Within 0.3 = normal, no action. (3) Also check EC drift -- high runoff EC = salt buildup compounding pH issue. (4) For upward drift: citric acid, peat top-dress, reduce lime. (5) For downward drift: dolomite lime top-dress, reduce acidic inputs. (6) LIVING SOIL: Do NOT chase runoff pH aggressively. Biology buffers naturally. A 0.5-1.0 unit swing is NORMAL in living soil. Trust symptoms over numbers. (7) Flush only if drift exceeds 1.0 units.'
  },
  {
    id: 'living-soil-ph-biology-safe',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.medium === 'living-soil' && (diagId === 'r-ph-lockout' || diagId === 'r-ph-drift');
    },
    advice: '(1) NEVER heavy-flush living soil. Flushing with 3x pot volume strips beneficial microbes, mycorrhizae, and organic acids. (2) For HIGH pH (>7.2): top-dress worm castings 1-2 cups per 5-gal. Water with molasses tea (1 tbsp unsulfured blackstrap per gal at pH 6.2). Bacteria produce organic acids naturally. Allow 1-2 weeks. (3) For LOW pH (<5.5): top-dress oyster shell flour 1/2 tbsp per gal soil. Water at pH 6.8-7.0. (4) Compost tea (AACT) naturally trends pH 6.5-7.0 and reinoculates biology. Brew 24-36h. (5) NEVER USE in living soil: synthetic pH-down, H2O2, mineral acids, heavy chlorinated water. (6) Living soil pH corrections take 2-4 WEEKS. Patience required.'
  },
  {
    id: 'clone-recovery-7day',
    priority: 8,
    condition: function(ctx, diagId) {
      // Only fire for FRESH clones — not already rooted, transplanted, or in veg
      return ctx.plantType === 'clone' && !ctx.recentEvent && !ctx.stage && ctx.rootHealth !== 'roots-developing' && ctx.rootHealth !== 'roots-established' && ctx.rootHealth !== 'healthy-roots';
    },
    advice: '(1) DAY 0-1: Fresh cut at 45 degrees, dip in Clonex, insert in moist plug. Humidity dome 75-85% RH. Light: 150-200 PPFD max (dim LED or use CFL). Temp 22-25C/72-77F. Heat mat at 24C helps. NO nutrients. (2) DAY 2-3: Drooping is NORMAL -- no roots yet. Mist inside dome 2-3x daily. Vent dome 30 sec 2x daily. Trim largest fan leaves 50% if severe wilt. (3) DAY 4-5: White callus forming at cut site. Maintain 70-80% RH. Reduce misting to 1-2x daily. Still no nutrients. (4) DAY 6-7: Look for white root tips emerging. Once 2-3 roots at 1-2cm = ready for transplant to small pot. (5) If NO roots by day 7: don\'t panic. Some genetics take 10-14 days. (6) Transplant to 0.5-1 gal pot, light soil + 30% perlite, mycorrhizae at root tips. First nutrients at 25% strength after 3-5 days in new pot.'
  },
  {
    id: 'seedling-first-14-days',
    priority: 9,
    condition: function(ctx, diagId) {
      // Only fire for genuinely young seedlings — not ones the user has
      // indicated are older than ~20 days, in veg stage, or already established.
      return ctx.plantType === 'seedling' && !ctx.stage && (ctx.timelineDays === null || ctx.timelineDays <= 20);
    },
    advice: '(1) DAY 0-3: Seed 1-2cm deep in moist medium. 22-26C. No light needed until it breaks surface. (2) DAY 3-7 (cotyledons): Light 200-300 PPFD, 18/6. Water a small ring around seedling only -- NOT the whole pot. ZERO nutrients. (3) DAY 7-14 (first true leaves): Increase to 300-400 PPFD. Begin 1/4 strength nutrients (EC 0.2-0.4). pH 6.2-6.5 soil. (4) STRETCHING: Light too far/dim. Lower LED to 35-45cm, add gentle fan. Mound soil around elongated stem. (5) DAMPING OFF (soft brown stem base): Fatal. Sterilize, start over. Prevention: fresh medium, airflow, don\'t overwater. (6) SLOW GROWTH: Check light (too dim?), temp (too cold?), moisture (too wet?). These 3 cause 90% of slow seedlings.'
  },
  {
    id: 'autoflower-emergency-triage',
    priority: 10,
    condition: function(ctx, diagId) {
      // Only fire when the auto is actively stressed or stunted — not when
      // the plant is healthy, vigorous, or recovering.  Emergency triage
      // on a healthy auto is alarming and misleading.
      return ctx.plantType === 'autoflower' && (ctx.plantHealth === 'stunted' || ctx.plantHealth === 'stressed' || ctx.severity === 'worsening' || ctx.severity === 'severe' || ctx.severity === 'rapid');
    },
    advice: '(1) THE AUTO REALITY: Fixed 60-90 day lifecycle. Every day of stress = permanent yield loss you cannot recover. (2) TRIAGE BY WEEK: Week 1-2 = full recovery possible, act aggressively. Week 3-4 = moderate recovery, fix immediately. Week 5+ = focus on quality not recovery. (3) PRIORITY ORDER: Check roots first (overwatering = #1 auto killer), then pH, then light, then nutrients. (4) STUNTED AUTOS: Do NOT top or heavy-defoliate. LST only. 20/4 light schedule for max DLI. (5) Week 5+: Accept current size. Optimize for quality: 21-24C days, 17-20C nights, 40-50% RH. (6) WHEN TO CUT LOSSES: Under 15cm at week 4+ = negligible yield. Consider starting fresh. (7) Never transplant an auto during flower. Start in final container.'
  },
  {
    id: 'mother-plant-maintenance',
    priority: 7,
    condition: function(ctx, diagId) {
      // Only fire when there is a diagnosed issue — the maintenance protocol
      // is noise when the mother is healthy and the user is asking about
      // something specific like a deficiency or pest.  Also requires that a
      // diagnosis ID is present (not just any mention of "mother plant").
      return ctx.plantType === 'mother' && diagId;
    },
    advice: '(1) LIGHT: 18/6 or 16/8 perpetual veg. Only 300-500 PPFD needed -- no intense flower light. 100-150W LED is ideal. (2) NUTRITION: High N demand. Top-dress 1-2 cups worm castings per 5-gal every 3-4 weeks. Kelp extract 5 ml/L biweekly. CalMag at every watering under LED. (3) ROOT PRUNING every 6-12 months: Remove plant, slice off 20-25% of outer/bottom root ball, repot in same container with fresh soil. Inoculate with mycorrhizae. Reduce light 1-2 weeks during recovery. (4) PRUNING: Take cuttings regularly (this IS your pruning). Remove crossing/weak growth. Goal: open, bushy, 6-10 main branches. (5) PEST PREVENTION: Weekly loupe inspection. Preventive neem every 2-3 weeks in veg. (6) ALWAYS keep 2+ backup clones as genetic insurance.'
  },
  {
    id: 'post-topping-recovery',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'topping';
    },
    advice: '(1) DAY 0-1: Some drooping is normal -- you removed the apical meristem. Plant is redistributing auxin. Do nothing. (2) DAY 1-3: Growth pauses. Continue normal water/feed. (3) DAY 3-7: Two new growth tips emerge. If no growth by day 7, check for infection at cut site. (4) Keep VPD 0.8-1.2 kPa during recovery. (5) Do NOT top again until new branches have 3-4 nodes (10-14 days). (6) CRACKED STEM during LST: Wrap immediately with plant tape. 90%+ survive and form a stronger knuckle. (7) Best time to top: veg week 3-4, at node 5-6. Never top after flip to flower.'
  },
  {
    id: 'post-defoliation-light-adjustment',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'defoliation' && (diagId === 'r-light-burn' || diagId === 'r-heat-stress' || diagId === 'r-heat-light');
    },
    advice: '(1) Removed leaves were shading lower growth. Now-exposed tissue adapted to SHADE conditions. Direct full-intensity LED causes photobleaching. (2) IMMEDIATE: Reduce LED to 75-80% OR raise 10-15cm for 3-5 days. (3) Gradual ramp: Day 5 = 85%. Day 7 = 100%. (4) RULE: Never remove >20-25% of canopy at once under moderate light (400-600 PPFD). (5) Best defoliation time: early in the light cycle, not before lights-off. (6) Do NOT defoliate AND train on the same day.'
  },
  {
    id: 'flower-stretch-management',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.recentEvent === 'flip' && diagId === 'r-stretching';
    },
    advice: '(1) Cannabis typically doubles in height weeks 1-3 after flip. Sativa-dom can TRIPLE. This is normal. (2) ASSESS: Measure from canopy top to lowest LED position minus 30-45cm for distance. That is your stretch budget. (3) SUPERCROP: Squeeze stem gently until inner fibers crush, bend 90 degrees, tie horizontal. Growth tip turns up in 24-48h but height is reduced. (4) LST: Tie tall branches outward and down. Check ties daily -- stretch can break them in 2 days. (5) TEMPERATURE DIF: Run 25-26C day, 18-20C night (5-8C DIF) for shorter internodes. (6) If plant hits the light: emergency supercrop all tall branches. Dim LED if needed. (7) PREVENTION: Flip when plant is 40-50% of total height budget.'
  },
  {
    id: 'late-flower-fade-decision',
    priority: 8,
    condition: function(ctx, diagId) {
      return diagId === 'r-natural-fade';
    },
    advice: '(1) THREE VARIABLES: timing, speed, trichome state. (2) CHECK TRICHOMES on calyxes with 60x loupe. Mostly cloudy + some amber = natural fade, LEAVE IT. Still mostly clear = possible real deficiency. (3) NORMAL FADE: Starts at very bottom leaves, progresses slowly upward over 2-3 weeks. Buds still developing. Top canopy green. (4) PROBLEM: Rapid yellowing climbing plant in 3-5 days. Yellowing with spots (pH/Ca/K issue). Yellowing reaching mid-canopy while trichomes still clear. (5) IF PROBLEM: Check runoff pH 6.2-6.8. Light PK boost at 50% strength. (6) IF NATURAL: Leave alone. Plant is mobilizing stored nutrients into buds. This is desirable. Beautiful fades = quality. (7) Plain water final 3-7 days when trichomes are 70-80% cloudy + 10-20% amber.'
  },
  {
    id: 'organic-thrips-treatment',
    priority: 9,
    condition: function(ctx, diagId) {
      return diagId === 'r-thrips' && (ctx.medium === 'soil' || ctx.medium === 'living-soil');
    },
    advice: '(1) Confirm: silver/bronze leaf scarring, tiny 1-2mm insects, black frass dots. Use 30x loupe. (2) TWO-FRONT ATTACK essential: adults/larvae on leaves + pupae in soil. Foliar-only treatment FAILS because soil stage rebounds. (3) FOLIAR: Spinosad (Captain Jack\'s) 2-4 ml/L, all surfaces, lights-off. (4) SOIL DRENCH: Same spinosad solution, 200-500ml per 5-gal pot. (5) SCHEDULE: Every 5-7 days for 3 applications (15-21 days). Catches all lifecycle stages. (6) Blue sticky traps at canopy level for monitoring. (7) Biological: Amblyseius cucumeris predatory mites, 1 sachet per plant. (8) FLOWER after week 3: NO foliar sprays. Soil drench + predatory mites + traps only. (9) Leaf scarring is permanent. Clean new growth = success.'
  },
  {
    id: 'broad-mites-detailed',
    priority: 10,
    condition: function(ctx, diagId) {
      return diagId === 'r-broad-mites';
    },
    advice: '(1) MICROSCOPIC: Cannot see with naked eye. Need 60x-100x loupe. Look on UNDERSIDES of youngest leaves near growing tips. Translucent/clear oval mites, ~0.2mm. (2) SYMPTOM-BASED ID: Twisted, distorted, glossy/wet-looking new growth. Leaves curl down at edges. Tips appear waxy/glassy. Often misdiagnosed as Ca def or heat stress. (3) URGENCY: Population doubles every week. Untreated = destroyed grow in 2-3 weeks. (4) TREATMENT: Avid (abamectin) 0.5-1 ml/L foliar, all surfaces, lights-off. Repeat in 5-7 days. Two applications usually eliminates. (5) Alternative: Forbid (spiromesifen) at label rate, longer residual. (6) Organic (less effective): Suffoil-X 1-2%, every 3-5 days x4. Neem is USELESS against broad mites. (7) IN FLOWER: Predatory mites (Amblyseius swirskii) 25/sq ft, the only safe option. (8) PREVENTION: Quarantine new clones 7-10 days. Dip in Avid or hot water 43-45C for 15min.'
  },
  {
    id: 'organic-pm-treatment',
    priority: 9,
    condition: function(ctx, diagId) {
      return (diagId === 'r-pm' || diagId === 'r-wpm-early') && (ctx.medium === 'soil' || ctx.medium === 'living-soil');
    },
    advice: '(1) Confirm: white powdery coating on leaf surfaces (not undersides). Wipes off with wet finger. Circular patches. (2) ISOLATE affected plant. PM spores are highly airborne. (3) ENVIRONMENT (50% of the fix): Drop RH below 50%. Increase airflow dramatically. PM hates temps above 27C. (4) SPRAY (veg): Potassium bicarbonate 1 tbsp/gal + 1/2 tsp castile soap. All leaf surfaces until dripping. Every 3-5 days x3. (5) COMPLEMENTARY: Dilute milk spray 1:9 milk:water. Alternating with bicarb disrupts PM adaptation. (6) For living soil: AVOID copper sulfate and sulfur sprays -- harm soil biology. Stick to bicarb + milk + Bacillus subtilis (Serenade). (7) IN FLOWER after week 3: NO spraying buds. Increase airflow, reduce RH, consider early harvest if PM reaches buds. (8) Bud wash at harvest if PM was present: H2O2 + water rinse.'
  },
  {
    id: 'nute-burn-after-increase',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.previousTreatment === 'increased-nutes' && (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe');
    },
    advice: '(1) REDUCE immediately to 70% of the dose that caused burn. (2) Check runoff EC: >3.0 = flush needed. 2.0-3.0 = reduce dose, no flush. <2.0 = reconsider diagnosis. (3) MILD (tips only, EC 2-3): Reduce nutrient strength 50% for 2-3 waterings. Tips stop browning in 48-72h. (4) SEVERE (EC >3, multiple leaves): Flush 2-3x pot volume at pH 6.0-6.5. Wait 24-48h. Resume at 25% strength, ramp 25% every 2 feedings. (5) GOLDEN RULE: Never increase nutrients more than 10-15% at a time. Wait 5-7 days between increases. (6) Mild tip burn on a vigorous plant = you are close to optimal. Reduce 10% and ride there. (7) In organic soil: hot soil can NOT be easily flushed. Consider transplanting to lighter mix. (8) Burned tips are PERMANENT. Success = new growth with clean tips.'
  },
  {
    id: 'high-vpd-balance-protocol',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.rh !== null && parseFloat(ctx.rh) < 40;
    },
    advice: '(1) At 30C/35% RH with LED (leaf temp ~27C), VPD is ~2.2 kPa -- far above ideal 1.0-1.4 for flower. Plant is losing water faster than roots supply. (2) SYMPTOMS: Taco/cupping leaves, drooping despite moist soil, increased watering demand, Ca deficiency from overwhelmed transpiration. (3) THE BALANCING ACT: Exhaust removes humidity (bad) but removes heat (good). Humidifier adds moisture (good) but exhaust removes it. (4) STEPS: A) Reduce exhaust to minimum that maintains negative pressure. B) Add humidifier OUTSIDE tent, mist into intake. For 4x4 tent: min 3L capacity ultrasonic. C) Dim LED to 75-80%. D) Run lights during coolest hours. (5) TARGETS: 26-28C air, 45-55% RH in flower (55-65% veg). (6) Emergency: mist tent WALLS (not plants), wet towels over intake. (7) Taco flattens in 6-12h after VPD correction.'
  },
  {
    id: 'led-low-vpd-cold-leaf',
    priority: 8,
    condition: function(ctx, diagId) {
      return ctx.lighting === 'led' && ctx.rh !== null && parseFloat(ctx.rh) > 65;
    },
    advice: '(1) Under LED, leaf temp runs 2-3C BELOW air temp (no infrared). HPS-era VPD charts are WRONG for LED -- you must use LEAF temperature. (2) Measure leaf surface with IR thermometer. A room at 24C with LED has leaf temp ~21-22C. VPD calculated from 24C overestimates actual VPD. (3) Low VPD symptoms: slow growth, puffy edematous leaves, guttation (water droplets on leaf tips), PM/mold risk. (4) FIX: Raise air temp 2-4C (to 26-28C). Reduce RH 5-10%. Increase canopy airflow. (5) VPD TARGETS (leaf temp): Seedling 0.4-0.8, Veg 0.8-1.2, Early flower 1.0-1.4, Late flower 1.2-1.6 kPa. (6) Running LED at 24C (HPS temp) = chronically low VPD = slow growth + Ca/Mg problems + mold risk. Run LED rooms 26-28C. (7) VPD correction effects visible within hours. Growth rate improvement in 3-5 days.'
  }

];


/* ==========================================================================
   SECTION 3: SCORE_ADJUSTMENTS
   Array of adjustment objects. Each has:
     id          {string}   — unique identifier
     condition   {Function} — function(ctx) returns boolean
     adjustments {Object}   — map of diagId -> score delta (positive or negative float)
     reason      {string}   — human-readable explanation of the adjustment
   ========================================================================== */

var SCORE_ADJUSTMENTS = [

  /* ── Scope Adjustments ── */
  {
    id: 'sa-scope-single-plant',
    reason: 'Single plant affected: increases likelihood of localized pests or disease over systemic deficiency',
    condition: function(ctx) { return ctx.scope === 'single-plant'; },
    adjustments: {
      'r-pest-mites': 0.12,
      'r-broad-mites': 0.12,
      'r-thrips': 0.08,
      'r-fungus-gnats': 0.06,
      'r-root-rot': 0.08,
      'r-transplant': 0.08,
      'r-n-def': -0.06,
      'r-ph-lockout': -0.04
    }
  },
  {
    id: 'sa-scope-all-plants',
    reason: 'All plants affected: increases likelihood of environmental or systemic cause over individual pest/disease',
    condition: function(ctx) { return ctx.scope === 'all-plants'; },
    adjustments: {
      'r-ph-lockout': 0.12,
      'r-n-def': 0.08,
      'r-overwater': 0.10,
      'r-heat-stress': 0.10,
      'r-ca-def': 0.06,
      'r-mg-def': 0.06,
      'r-n-tox': 0.08,
      'r-pest-mites': -0.08,
      'r-broad-mites': -0.08
    }
  },
  {
    id: 'sa-scope-spreading',
    reason: 'Symptoms spreading: increases likelihood of contagious pest or fungal disease',
    condition: function(ctx) { return ctx.scope === 'spreading'; },
    adjustments: {
      'r-pest-mites': 0.15,
      'r-broad-mites': 0.12,
      'r-thrips': 0.12,
      'r-pm': 0.12,
      'r-fungal': 0.10,
      'r-bud-rot': 0.10,
      'r-root-rot': 0.08
    }
  },

  /* ── Plant Type Adjustments ── */
  {
    id: 'sa-plant-clone',
    reason: 'Clone: underdeveloped root system elevates Ca/Mg deficiency and transplant shock probability',
    condition: function(ctx) { return ctx.plantType === 'clone'; },
    adjustments: {
      'r-ca-def': 0.12,
      'r-ca-def-new': 0.12,
      'r-ca-mg': 0.10,
      'r-mg-def': 0.10,
      'r-transplant': 0.15,
      'r-damping-off': 0.08,
      'r-n-tox': -0.10,
      'r-nute-burn-severe': -0.08
    }
  },
  {
    id: 'sa-plant-seedling',
    reason: 'Seedling: high sensitivity to overwatering, nutrient burn, and heat; flower-stage diagnoses not applicable',
    condition: function(ctx) { return ctx.plantType === 'seedling'; },
    adjustments: {
      'r-seedling-overwater': 0.18,
      'r-damping-off': 0.15,
      'r-seedling-nute': 0.15,
      'r-stretching': 0.12,
      'r-heat-stress': 0.10,
      'r-bud-rot': -0.20,
      'r-hermie-stress': -0.15,
      'r-natural-fade': -0.20,
      'r-n-tox': -0.12
    }
  },
  {
    id: 'sa-plant-autoflower',
    reason: 'Autoflower: compressed lifecycle increases hermie and stunting risk; more sensitive to environment',
    condition: function(ctx) { return ctx.plantType === 'autoflower'; },
    adjustments: {
      'r-hermie-stress': 0.10,
      'r-stunted': 0.08,
      'r-overwater': 0.08,
      'r-n-def': 0.06,
      'r-transplant': 0.06
    }
  },
  {
    id: 'sa-plant-bagseed',
    reason: 'Bag seed: elevated genetic hermaphroditism and instability risk',
    condition: function(ctx) { return ctx.plantType === 'bagseed'; },
    adjustments: {
      'r-hermie-genetic': 0.18,
      'r-hermie-stress': 0.10,
      'r-n-def': 0.06
    }
  },

  /* ── Medium Adjustments ── */
  {
    id: 'sa-medium-coco',
    reason: 'Coco coir: mandatory calcium demand and no pH buffering make Ca/Mg lockout most likely deficiency',
    condition: function(ctx) { return ctx.medium === 'coco'; },
    adjustments: {
      'r-ca-def': 0.15,
      'r-ca-def-new': 0.15,
      'r-ca-mg': 0.15,
      'r-mg-def': 0.12,
      'r-ph-lockout': 0.10,
      'r-overwater': -0.12
    }
  },
  {
    id: 'sa-medium-hydro',
    reason: 'Hydro system: reservoir conditions make root rot and pH drift primary concerns',
    condition: function(ctx) { return ctx.medium === 'hydro'; },
    adjustments: {
      'r-root-rot': 0.15,
      'r-ph-drift': 0.15,
      'r-ph-lockout': 0.12,
      'r-overwater': -0.15,
      'r-fungus-gnats': -0.10,
      'r-transplant': -0.10
    }
  },
  {
    id: 'sa-medium-living-soil',
    reason: 'Living soil: microbial buffering makes nutrient burn and acute lockout less likely; organic N deficiency more likely',
    condition: function(ctx) { return ctx.medium === 'living-soil'; },
    adjustments: {
      'r-n-def': 0.08,
      'r-nute-burn-mild': -0.12,
      'r-nute-burn-severe': -0.15,
      'r-ph-lockout': -0.10,
      'r-fungus-gnats': 0.10
    }
  },

  /* ── Lighting Adjustments ── */
  {
    id: 'sa-lighting-led',
    reason: 'LED: reduced IR increases Ca/Mg deficiency and light burn probability; lower leaf temps require different VPD management',
    condition: function(ctx) { return ctx.lighting === 'led'; },
    adjustments: {
      'r-ca-def': 0.12,
      'r-ca-def-new': 0.12,
      'r-mg-def': 0.10,
      'r-ca-mg': 0.10,
      'r-light-burn': 0.12
    }
  },
  {
    id: 'sa-lighting-hps',
    reason: 'HPS: high radiant heat increases heat stress and transpiration-related issues',
    condition: function(ctx) { return ctx.lighting === 'hps'; },
    adjustments: {
      'r-heat-stress': 0.12,
      'r-heat-light': 0.12,
      'r-light-burn': -0.08
    }
  },
  {
    id: 'sa-lighting-cfl',
    reason: 'CFL/T5: low intensity makes light burn impossible but stretching very likely',
    condition: function(ctx) { return ctx.lighting === 'cfl'; },
    adjustments: {
      'r-stretching': 0.18,
      'r-light-distance': 0.15,
      'r-light-burn': -0.20,
      'r-heat-light': -0.15
    }
  },

  /* ── Water Type Adjustments ── */
  {
    id: 'sa-water-ro',
    reason: 'RO water: zero baseline minerals makes Ca/Mg and trace mineral deficiencies highly likely without supplementation',
    condition: function(ctx) { return ctx.waterType === 'ro'; },
    adjustments: {
      'r-ca-def': 0.15,
      'r-ca-def-new': 0.15,
      'r-mg-def': 0.15,
      'r-ca-mg': 0.15,
      'r-fe-def': 0.08,
      'r-mn-def': 0.08,
      'r-zn-def': 0.08,
      'r-s-def': 0.06
    }
  },

  /* ── Environmental Event Adjustments ── */
  {
    id: 'sa-event-power-outage',
    reason: 'Power outage: interrupted dark period is a direct hermaphroditism trigger',
    condition: function(ctx) { return ctx.envEvent === 'power-outage'; },
    adjustments: {
      'r-hermie-stress': 0.25,
      'r-pm': 0.08,
      'r-bud-rot': 0.08
    }
  },
  {
    id: 'sa-event-light-leak',
    reason: 'Light leak: the single most common cause of stress hermaphroditism in indoor flowering plants',
    condition: function(ctx) { return ctx.envEvent === 'light-leak'; },
    adjustments: {
      'r-hermie-stress': 0.30,
      'r-hermie-genetic': 0.10
    }
  },
  {
    id: 'sa-event-timer-issue',
    reason: 'Timer failure: schedule disruption during dark period triggers stress hermaphroditism',
    condition: function(ctx) { return ctx.envEvent === 'timer-issue'; },
    adjustments: {
      'r-hermie-stress': 0.22,
      'r-stretching': 0.10
    }
  },
  {
    id: 'sa-event-heatwave',
    reason: 'Heatwave: elevated temperatures drive heat stress and increase spider mite population explosively',
    condition: function(ctx) { return ctx.envEvent === 'heatwave'; },
    adjustments: {
      'r-heat-stress': 0.20,
      'r-heat-light': 0.15,
      'r-pest-mites': 0.12,
      'r-n-tox': -0.05
    }
  },
  {
    id: 'sa-event-cold-snap',
    reason: 'Cold snap: low temperatures cause phosphorus transport failure, leading to P and cold-purple expression',
    condition: function(ctx) { return ctx.envEvent === 'cold-snap'; },
    adjustments: {
      'r-p-def': 0.20,
      'r-cold-purple': 0.20,
      'r-root-rot': 0.08,
      'r-heat-stress': -0.15
    }
  },
  {
    id: 'sa-event-foul-smell',
    reason: 'Foul smell reported: strongly indicates anaerobic conditions from root rot or stagnant water',
    condition: function(ctx) { return ctx.envEvent === 'foul-smell'; },
    adjustments: {
      'r-root-rot': 0.25,
      'r-overwater': 0.12,
      'r-fungus-gnats': 0.10
    }
  },

  /* ── Root Condition Adjustments ── */
  {
    id: 'sa-root-brown-slimy',
    reason: 'Brown or slimy roots directly indicate root rot; this is pathognomonic evidence',
    condition: function(ctx) { return ctx.rootHealth === 'brown-roots' || ctx.rootHealth === 'slimy-roots'; },
    adjustments: {
      'r-root-rot': 0.30,
      'r-overwater': 0.12,
      'r-n-def': -0.08,
      'r-ca-def': -0.08,
      'r-ph-lockout': -0.06
    }
  },
  {
    id: 'sa-root-healthy',
    reason: 'Healthy white roots significantly reduce probability of root-zone disease diagnoses',
    condition: function(ctx) { return ctx.rootHealth === 'healthy-roots'; },
    adjustments: {
      'r-root-rot': -0.20,
      'r-overwater': -0.12,
      'r-n-def': 0.05,
      'r-ca-def': 0.05,
      'r-ph-lockout': 0.05
    }
  },
  {
    id: 'sa-root-bound',
    reason: 'Rootbound plants have diminished water uptake causing apparent underwatering and nutrient stress',
    condition: function(ctx) { return ctx.rootHealth === 'root-bound'; },
    adjustments: {
      'r-underwater': 0.15,
      'r-n-def': 0.08,
      'r-ca-def': 0.08,
      'r-ph-lockout': 0.06,
      'r-overwater': -0.08
    }
  },

  /* ── Recent Event Adjustments ── */
  {
    id: 'sa-event-transplant',
    reason: 'Recent transplant makes transplant shock the primary explanation for drooping and stress symptoms',
    condition: function(ctx) { return ctx.recentEvent === 'transplant'; },
    adjustments: {
      'r-transplant': 0.25,
      'r-overwater': 0.10,
      'r-n-def': -0.08,
      'r-root-rot': -0.05
    }
  },
  {
    id: 'sa-event-flip',
    reason: 'Recent flip to flower changes nutrient demands, causing stretch, N-tox from veg feed, or early flower stress',
    condition: function(ctx) { return ctx.recentEvent === 'flip'; },
    adjustments: {
      'r-stretching': 0.18,
      'r-n-tox': 0.15,
      'r-hermie-stress': 0.08,
      'r-natural-fade': -0.15
    }
  },
  {
    id: 'sa-event-defoliation',
    reason: 'Post-defoliation: newly exposed leaves now receive higher light intensity, making light burn more likely',
    condition: function(ctx) { return ctx.recentEvent === 'defoliation'; },
    adjustments: {
      'r-light-burn': 0.12,
      'r-heat-stress': 0.08,
      'r-n-def': -0.05
    }
  },
  {
    id: 'sa-event-topping',
    reason: 'Recent topping: temporary growth arrest that can mimic transplant shock symptoms',
    condition: function(ctx) { return ctx.recentEvent === 'topping'; },
    adjustments: {
      'r-transplant': 0.10,
      'r-stretching': -0.10,
      'r-n-def': -0.05
    }
  },

  /* ── Treatment Adjustments ── */
  {
    id: 'sa-treatment-calmag',
    reason: 'CalMag already applied: if Ca/Mg symptoms persist, pH lockout preventing uptake becomes the primary suspect',
    condition: function(ctx) { return ctx.previousTreatment === 'calmag'; },
    adjustments: {
      'r-ph-lockout': 0.15,
      'r-ph-lockout-feed': 0.10,
      'r-ca-def': -0.06,
      'r-mg-def': -0.06
    }
  },
  {
    id: 'sa-treatment-flushed',
    reason: 'Recently flushed: reduced EC in medium makes deficiencies more likely; burn less likely temporarily',
    condition: function(ctx) { return ctx.previousTreatment === 'flush'; },
    adjustments: {
      'r-n-def': 0.10,
      'r-ca-def': 0.08,
      'r-mg-def': 0.08,
      'r-ph-drift': 0.06,
      'r-nute-burn-mild': -0.10,
      'r-nute-burn-severe': -0.10
    }
  },
  {
    id: 'sa-treatment-increased-nutes',
    reason: 'Recently increased nutrients: nute burn or lockout from elevated EC is the most likely cause of new symptoms',
    condition: function(ctx) { return ctx.previousTreatment === 'increased-nutes'; },
    adjustments: {
      'r-nute-burn-mild': 0.15,
      'r-nute-burn-severe': 0.12,
      'r-n-tox': 0.10,
      'r-ph-lockout-feed': 0.08,
      'r-n-def': -0.12,
      'r-ca-def': -0.08
    }
  },

  /* ── Timeline Adjustments ── */
  {
    id: 'sa-timeline-sudden',
    reason: 'Sudden onset makes slow nutrient deficiencies statistically unlikely; acute events are more probable',
    condition: function(ctx) {
      return ctx.timeline === 'recent' && (ctx.severity === 'rapid' || ctx.timelineDays !== null && ctx.timelineDays <= 1);
    },
    adjustments: {
      'r-heat-stress': 0.12,
      'r-overwater': 0.10,
      'r-transplant': 0.08,
      'r-hermie-stress': 0.08,
      'r-n-def': -0.10,
      'r-ca-def': -0.08,
      'r-mg-def': -0.08,
      'r-p-def': -0.08,
      'r-ph-drift': -0.06
    }
  },
  {
    id: 'sa-timeline-chronic',
    reason: 'Chronic multi-week problem: slow drift conditions (pH, root-bound, slow deficiency) are most consistent',
    condition: function(ctx) { return ctx.timeline === 'chronic'; },
    adjustments: {
      'r-ph-drift': 0.15,
      'r-ph-lockout': 0.10,
      'r-root-rot': 0.08,
      'r-n-def': 0.08,
      'r-heat-stress': -0.08,
      'r-transplant': -0.10
    }
  },

  /* ── pH Numeric Adjustments ── */
  {
    id: 'sa-ph-high',
    reason: 'pH above 7.0 causes iron, manganese, and zinc lockout as these micronutrients precipitate at high pH',
    condition: function(ctx) { return ctx.ph !== null && ctx.ph > 7.0; },
    adjustments: {
      'r-fe-def': 0.22,
      'r-mn-def': 0.22,
      'r-zn-def': 0.18,
      'r-ph-lockout': 0.15,
      'r-ca-def': 0.08,
      'r-n-def': -0.08
    }
  },
  {
    id: 'sa-ph-low',
    reason: 'pH below 5.5 causes calcium, magnesium, and phosphorus lockout as these become insoluble at low pH',
    condition: function(ctx) { return ctx.ph !== null && ctx.ph < 5.5; },
    adjustments: {
      'r-ca-def': 0.20,
      'r-mg-def': 0.20,
      'r-p-def': 0.18,
      'r-ca-mg': 0.18,
      'r-ph-lockout': 0.15,
      'r-fe-def': -0.08
    }
  },

  /* ── Humidity Adjustments ── */
  {
    id: 'sa-rh-high',
    reason: 'RH above 65% creates prime conditions for Botrytis, powdery mildew, and other fungal pathogens',
    condition: function(ctx) { return ctx.rh !== null && ctx.rh > 65; },
    adjustments: {
      'r-bud-rot': 0.25,
      'r-pm': 0.20,
      'r-wpm-early': 0.18,
      'r-fungal': 0.15,
      'r-root-rot': 0.08,
      'r-heat-stress': -0.05
    }
  },

  /* ── Self-Reported Watering ── */
  {
    id: 'sa-watering-overwatered',
    reason: 'Grower self-reports overwatering: increases probability of overwater and root rot diagnoses',
    condition: function(ctx) { return ctx.wateringPattern === 'overwatered'; },
    adjustments: {
      'r-overwater': 0.20,
      'r-overwater-yellow': 0.15,
      'r-root-rot': 0.12,
      'r-seedling-overwater': 0.12,
      'r-n-def': -0.08,
      'r-ca-def': -0.06
    }
  }

];
