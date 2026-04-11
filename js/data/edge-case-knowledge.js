// GrowDoc Companion — Edge-Case Knowledge Base
//
// Guardrail dataset for the advice engine. Each entry describes a grow
// situation where the default "general-case" companion advice is actively
// wrong because of a recent stress event, plant state, or lifecycle trap.
//
// Authored by the Professor subagent (peer-reviewed evidence where it
// exists, practitioner consensus where it does not). Do NOT add myths as
// correct action — flushing, ice water, dark periods, etc. belong in
// `whyGeneralAdviceFails` as triggered-mistake descriptions, never in
// `correctAction`.
//
// Consumer contract: `findEdgeCases({ stage, recentEvents, plantFlags })`
// filters by stage + event window and returns matches sorted by severity
// (critical -> high -> medium). The advisor engine passes the result to the
// action plan renderer which suppresses `blockActions` and promotes
// `recommendActions`.
//
// Trigger keyword IDs reference `rules-keywords.js`. Entries marked
// NEW-KEYWORD in the trigger's recentEvents[] require a new rule to be
// added before the guardrail can fire — see summary at the bottom of this
// module and the companion research notes.
//
// Severity semantics:
//   critical — following the general advice causes plant death or
//              irreversible quality loss (hermie, root rot cascade).
//   high     — causes weeks of stalled growth or significant yield loss.
//   medium   — causes visible damage that recovers within 7-10 days.
//
// Confidence semantics:
//   high     — multiple controlled studies or overwhelming practitioner
//              consensus (>10 years, multiple independent sources).
//   medium   — single strong study OR strong practitioner consensus.
//   low      — mechanistic reasoning + scattered practitioner reports;
//              flagged for research-analyst cross-check.

/**
 * @typedef {Object} EdgeCaseTrigger
 * @property {string[]} stage          STAGE ids this edge case applies to
 * @property {string[]} recentEvents   note-contextualizer keyword ids (or NEW-KEYWORD:* proposals)
 * @property {number}   [withinHours]  time window since the trigger event
 * @property {string[]} [plantFlags]   plant-level flags (plantType, previousProblems, etc.)
 */

/**
 * @typedef {Object} EdgeCase
 * @property {string}           id
 * @property {EdgeCaseTrigger}  trigger
 * @property {string}           generalAdvice
 * @property {string}           whyGeneralAdviceFails
 * @property {string}           correctAction
 * @property {string}           evidence
 * @property {'high'|'medium'|'low'}            confidence
 * @property {'critical'|'high'|'medium'}       severity
 * @property {string[]}         [blockActions]
 * @property {string[]}         [recommendActions]
 */

/** @type {ReadonlyArray<EdgeCase>} */
export const EDGE_CASES = Object.freeze([

  // ═══════════════════════════════════════════════════════════════════
  // 1. POST-TRANSPLANT STRESS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'fresh-transplant-early-veg-no-feed',
    trigger: {
      stage: ['seedling', 'early-veg'],
      recentEvents: ['event-transplant'],
      withinHours: 120,
      plantFlags: [],
    },
    generalAdvice: 'Start quarter-strength veg nutrients once seedling has 3-4 true leaf sets and enters early veg.',
    whyGeneralAdviceFails: 'Transplant shears the outermost root hairs — the only structures that actually absorb ions. Until the plant regrows them (48-120h in soil, 24-72h in coco), dissolved salts sit in the root zone creating osmotic pressure and local pH drift. The plant reads the resulting tip burn as "deficiency" and the reflexive response (more feed) compounds the injury.',
    correctAction: 'Soil: plain pH 6.3-6.5 water only for 5-7 days. Coco: plain pH 5.8 water for 3-5 days. First feed at 1/4 strength ONLY after visible new growth confirms roots have rebuilt.',
    evidence: 'Practitioner consensus (Jorge Cervantes, Ed Rosenthal). Root-hair regeneration kinetics confirmed in tomato (Peterson & Farquhar 1996, Annals of Botany) — no cannabis-specific study.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['feed-nutrients', 'increase-ec', 'top-dress'],
    recommendActions: ['plain-water', 'monitor-new-growth', 'maintain-humidity'],
  },

  {
    id: 'post-transplant-no-training-window',
    trigger: {
      stage: ['early-veg', 'late-veg'],
      recentEvents: ['event-transplant'],
      withinHours: 168,
      plantFlags: [],
    },
    generalAdvice: 'Top at 4-5 nodes; start LST as soon as stems will bend without snapping.',
    whyGeneralAdviceFails: 'Topping and bending are both wound-response stressors that draw on the same carbohydrate reserves the plant is using to rebuild root mass. Stacking two stressors inside a 7-day window doubles recovery time and often produces stalled growth misdiagnosed as nutrient deficiency.',
    correctAction: 'Wait 7 days post-transplant before any training. Let one full new node expand first. Then train the lower of the two currently-growing tips and leave the apex alone for another 48h.',
    evidence: 'Practitioner consensus. Stress-stacking recovery curves documented in ornamental propagation literature (Dole & Wilkins, Floriculture 2005).',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['top-plant', 'fim-plant', 'start-lst', 'defoliate'],
    recommendActions: ['monitor-new-growth', 'hold-training-window'],
  },

  {
    id: 'post-pot-up-reduce-light-intensity',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition'],
      recentEvents: ['event-transplant'],
      withinHours: 72,
      plantFlags: [],
    },
    generalAdvice: 'Maintain 600-800 PPFD in late veg; increase as the plant tolerates.',
    whyGeneralAdviceFails: 'Reduced root uptake post-pot-up cannot meet the transpiration demand a 600+ PPFD canopy pulls. Leaves cavitate their xylem, lock stomata, and the grower sees "wilt" that plain water cannot fix. Dropping PPFD 25-30% for 72h cuts transpiration to a level the recovering roots can supply.',
    correctAction: 'Drop PPFD 25-30% (or raise light 15-20cm) for 48-72h post-transplant. Keep RH 5-10% higher than usual to cut VPD. Restore intensity only after turgor returns.',
    evidence: 'Practitioner consensus. Transpiration-rootmass decoupling well-established in horticultural stress physiology (Kramer & Boyer 1995). No cannabis-specific dose-response.',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['increase-light', 'raise-ec'],
    recommendActions: ['dim-light', 'raise-light-height', 'raise-humidity'],
  },

  {
    id: 'soil-to-coco-transplant-ph-shock',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg'],
      recentEvents: ['event-transplant'],
      withinHours: 120,
      plantFlags: [],
    },
    generalAdvice: 'After transplant to coco, feed at 1/4 strength with balanced nutes at pH 5.8.',
    whyGeneralAdviceFails: 'Plants moved from soil (pH 6.3-6.8) into coco (pH 5.8-6.0) have a rhizosphere calibrated to the old pH. An immediate feed at 5.8 on roots still extending into soil-pocketed coco creates a dual-pH zone that swings between 5.5 and 7.0 locally, triggering Ca/Mg and Fe lockout simultaneously.',
    correctAction: 'First 3 waterings: plain coco-buffered water at pH 5.9-6.0 (intentionally high for coco). Drop to 5.8 on feed #4 once roots have colonised the new medium.',
    evidence: 'Practitioner consensus (coco-specific growers, e.g. CANNA technical team). No published study directly on soil-to-coco transition pH.',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['feed-nutrients', 'lower-ph-target'],
    recommendActions: ['plain-water', 'raise-ph-target-temporarily'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. HEAT STRESS RECOVERY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'heat-stress-hold-feed',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['env-heatwave', 'env-ac-failed'],
      withinHours: 72,
      plantFlags: [],
    },
    generalAdvice: 'Plant looks stressed — bump feed and cal-mag to help recovery.',
    whyGeneralAdviceFails: 'At leaf temperatures above 30-32C, Rubisco efficiency drops and photorespiration climbs. The plant is producing less usable carbon than it is consuming, so pushing more salts through the roots increases osmotic load on a plant that cannot photosynthesise its way out. Result: compounding tip burn interpreted as "nutrient hunger".',
    correctAction: 'Hold feed for 48h post-heat-event. Plain pH-adjusted water only. Drop light intensity 20% for 24h. Add oscillating fan for leaf cooling. Resume feed at 75% of previous EC when new growth resumes.',
    evidence: 'Chandra et al. 2008, Physiology and Molecular Biology of Plants — cannabis photosynthesis falls sharply above 30C leaf temp. Rubisco temperature response documented broadly (Sage & Kubien 2007).',
    confidence: 'high',
    severity: 'high',
    blockActions: ['feed-nutrients', 'increase-ec', 'add-calmag'],
    recommendActions: ['plain-water', 'dim-light', 'increase-airflow', 'lower-air-temp'],
  },

  {
    id: 'heat-stress-dont-cold-shock',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower', 'late-flower'],
      recentEvents: ['env-heatwave', 'env-ac-failed'],
      withinHours: 24,
      plantFlags: [],
    },
    generalAdvice: 'Drop tent temp as fast as possible — get AC back to 22C target immediately.',
    whyGeneralAdviceFails: 'A 10C+ swing in under 30 minutes causes stomatal oscillation — stomata overshoot closed, then reopen erratically, cavitating the xylem. The plant wilts worse AFTER the cool-down than during the heat event. Growers then assume dehydration and water into already-drowning pots.',
    correctAction: 'Target a 2-3C drop per hour until back to normal setpoint. Use airflow and raised RH (to 65-70%) to cut VPD before dropping air temp aggressively. Do not water until soil weight actually calls for it.',
    evidence: 'Practitioner consensus. Stomatal oscillation under rapid thermal shift documented in Buckley 2005, New Phytologist. No cannabis-specific study.',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['ice-water', 'aggressive-cooling', 'feed-nutrients'],
    recommendActions: ['gradual-cooldown', 'raise-humidity', 'check-soil-weight'],
  },

  {
    id: 'heat-foxtail-late-flower',
    trigger: {
      stage: ['mid-flower', 'late-flower', 'ripening'],
      recentEvents: ['env-heatwave', 'env-ac-failed'],
      withinHours: 96,
      plantFlags: [],
    },
    generalAdvice: 'Buds look stretched and producing new pistils — probably reveg, chop early.',
    whyGeneralAdviceFails: 'Heat-induced foxtailing is not reveg. It is terpene-degrading bud stretch from leaf temperatures above 30C during flower. Chopping early sacrifices 1-2 weeks of ripening on buds that will recover chemistry if the environment is fixed. True reveg shows round leaves emerging from calyxes, not foxtails.',
    correctAction: 'Fix root cause (tent temp under 26C lights-on, leaf temp under 28C). Do not chop on foxtail symptoms alone. Continue running to trichome-based harvest decision. Expect a terpene hit but preserve yield.',
    evidence: 'Practitioner consensus (Jorge Cervantes, Kyle Kushman). Heat-induced terpene loss: Ross & ElSohly 1996, Journal of Natural Products — monoterpenes volatilize above 28C.',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['harvest-now', 'chop-plant'],
    recommendActions: ['fix-tent-temp', 'continue-monitoring-trichomes', 'increase-airflow'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. AUTOFLOWER TRAPS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'autoflower-no-topping-late',
    trigger: {
      stage: ['early-veg', 'late-veg'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: ['plantType:autoflower'],
    },
    generalAdvice: 'Top at 4-5 nodes to encourage bushy multi-cola growth.',
    whyGeneralAdviceFails: 'Autoflowers are on a genetically fixed timer (60-90 days seed to harvest). They cannot extend veg to recover from topping stress. Topping after day 21 commonly produces single tiny popcorn buds and 30-50% yield loss because the plant enters flower before secondary branches stack.',
    correctAction: 'For autos: only top before day 21 from seed, and only if the plant shows explosive vigor (4+ nodes by day 18). Default to LST and supercropping instead — lower bend, no wound. If past day 21, do not top at all.',
    evidence: 'Practitioner consensus (Mephisto Genetics, Fast Buds breeder documentation). Day-neutral flowering trigger is hormonal not photoperiodic (Lynch et al. 2016, Scientific Reports — autoflowering linked to Autoflower locus on chromosome 1).',
    confidence: 'high',
    severity: 'high',
    blockActions: ['top-plant', 'fim-plant'],
    recommendActions: ['lst-instead', 'supercrop-instead', 'monitor-day-count'],
  },

  {
    id: 'autoflower-no-flip-rule',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: ['plantType:autoflower'],
    },
    generalAdvice: 'Switch to 12/12 lighting when the plant has filled its space.',
    whyGeneralAdviceFails: 'Autoflowers do not respond to photoperiod change — flowering is hormonally triggered on a timer. Dropping the photoperiod from 18/6 to 12/12 cuts DLI by 33% and slashes yield for zero flowering benefit. Some growers mistakenly apply this from photoperiod habit.',
    correctAction: 'Run 18/6 or 20/4 from germination to harvest. Never flip an auto. If heat is the reason for shortening daylight, reduce PPFD instead of photoperiod.',
    evidence: 'Lynch et al. 2016, Scientific Reports — day-neutral flowering phenotype mapped to Autoflower locus, independent of photoperiod. Practitioner consensus for >10 years.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['flip-12-12', 'reduce-photoperiod'],
    recommendActions: ['maintain-photoperiod', 'reduce-ppfd-if-heat'],
  },

  {
    id: 'autoflower-final-pot-from-start',
    trigger: {
      stage: ['germination', 'seedling'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: ['plantType:autoflower'],
    },
    generalAdvice: 'Start in a small starter pot and pot up as the plant grows.',
    whyGeneralAdviceFails: 'Each transplant costs an autoflower 3-7 days of recovery, which it cannot afford on a fixed timer. Plants potted up twice often end up 30% smaller than direct-sow siblings in the same final pot.',
    correctAction: 'Direct-sow autos into their final pot (11-19L for indoor). Accept slightly slower early growth for materially better yield. If damping-off is a concern, germinate in a rapid rooter and transplant once at day 3-5, never again.',
    evidence: 'Practitioner consensus (Mephisto Genetics published grow logs, Fast Buds grow bible). No peer-reviewed study on transplant cost in autos specifically.',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['transplant-up', 'pot-up'],
    recommendActions: ['direct-sow-final-pot', 'use-rapid-rooter-one-transplant'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. HERMIE RISK WINDOWS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'hermie-nanners-no-stress-advice',
    trigger: {
      stage: ['early-flower', 'mid-flower', 'late-flower', 'ripening'],
      recentEvents: ['NEW-KEYWORD:event-hermie'],
      withinHours: 168,
      plantFlags: [],
    },
    generalAdvice: 'Defoliate, top-dress, increase light, optimise canopy — standard mid-flower tuning.',
    whyGeneralAdviceFails: 'Nanners are a chemical stress-response signal. Every additional stressor — defol, top-dress, light bump, pH swing, training — increases ethylene and GA and produces more male flowers. The general-case "optimise" advice is the worst thing you can do to a plant already broadcasting it is at its stress ceiling.',
    correctAction: 'Stop all training immediately. Pluck visible nanners with tweezers daily. Stabilise environment (no setpoint changes). If in same tent as non-hermie plants, physically isolate within 12h or pollen sacs rupture and seed the entire tent.',
    evidence: 'Practitioner consensus. Ethylene-mediated sex reversal: Mohan Ram & Sett 1982, Zeitschrift fur Pflanzenphysiologie (silver thiosulfate reverses female to male via ethylene pathway). Recent work: Punja et al. 2020, Frontiers in Plant Science on stress-induced hermaphroditism.',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['defoliate', 'top-dress', 'increase-light', 'training', 'transplant', 'ph-adjust'],
    recommendActions: ['pluck-nanners', 'isolate-plant', 'stabilise-environment', 'monitor-daily'],
  },

  {
    id: 'hermie-post-light-leak-suppress-stress',
    trigger: {
      stage: ['early-flower', 'mid-flower', 'late-flower'],
      recentEvents: ['env-light-leak', 'env-timer-issue', 'env-power-outage'],
      withinHours: 96,
      plantFlags: [],
    },
    generalAdvice: 'Light event resolved — resume normal schedule and routine.',
    whyGeneralAdviceFails: 'Photoperiod disruption in flower has a 5-14 day lag before nanners appear. "Routine" during that window (defol, training, feed changes) stacks stress on a plant already committed to a potential sex reversal. Growers often conclude "no damage" at day 3 and then discover nanners at day 10.',
    correctAction: 'Maintain strict dark period for 14 days. No defol, no training, no nutrient changes. Daily visual inspection of calyxes with a loupe for nanner development. Only after day 14 with no sign of male flowers, resume routine.',
    evidence: 'Practitioner consensus + photoperiod/florigen lag documented in Arabidopsis (Corbesier et al. 2007, Science). Cannabis-specific lag is anecdotal.',
    confidence: 'medium',
    severity: 'critical',
    blockActions: ['defoliate', 'training', 'feed-schedule-change'],
    recommendActions: ['maintain-dark-period', 'daily-loupe-check', 'hold-routine'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. pH/EC LOCKOUT CASCADES
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'lockout-dont-chain-flush',
    trigger: {
      stage: ['late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['treatment-flush'],
      withinHours: 96,
      plantFlags: [],
    },
    generalAdvice: 'Symptoms still present after flush — flush again with more water.',
    whyGeneralAdviceFails: 'Repeated flushing strips Ca, Mg, and K faster than N, and strands the medium at the most-mobile-ion profile left behind (usually high Na from tap water or high P from bloom additives). The second flush often produces WORSE cation ratios than the first and destroys the cation exchange capacity of peat-based soils.',
    correctAction: 'One flush only, at 1.5-2x pot volume with pH-corrected water containing 1/4-strength cal-mag. Then wait 72h. Next feed: start at 50% EC and work up over 2 feeds. Never chain-flush.',
    evidence: 'Stemeroff 2017 (University of Guelph, MSc thesis) — controlled flush study showed no benefit and potential harm. Cation exchange destabilization documented in peat research (Puustjarvi 1977).',
    confidence: 'high',
    severity: 'high',
    blockActions: ['flush-again', 'increase-flush-volume'],
    recommendActions: ['wait-72h', 'feed-half-strength', 'add-calmag'],
  },

  {
    id: 'lockout-ec-too-low-add-feed',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: ['treatment-decreased-nutes', 'treatment-flush'],
      withinHours: 168,
      plantFlags: [],
    },
    generalAdvice: 'Leaves yellowing top-down in late flower — reduce feed, plant is eating itself.',
    whyGeneralAdviceFails: 'Top-down yellowing in late flower after a flush or feed reduction is usually deficiency, not natural fade. Fade is bottom-up and gradual. Reducing feed further accelerates cannibalisation of upper leaves and cuts bud weight by 10-20% in the critical swelling phase.',
    correctAction: 'Restore feed to 75% of previous EC with full micros. Read runoff EC and pH — if runoff EC under 0.8, plant is genuinely starved. If lower leaves are still green and only upper leaves yellowing, add nitrogen back via fish emulsion or balanced feed.',
    evidence: 'Bernstein et al. 2019, Industrial Crops and Products — N reduction in late flower cut yield without potency benefit. Caplan 2019 drought study specifically did NOT reduce N.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['reduce-feed-further', 'flush'],
    recommendActions: ['read-runoff-ec', 'restore-feed', 'check-n-deficiency'],
  },

  {
    id: 'lockout-looks-like-def-is-ph',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: [],
    },
    generalAdvice: 'Yellowing between veins on new growth — Fe/Mg deficiency, add cal-mag and iron.',
    whyGeneralAdviceFails: 'Interveinal chlorosis on new growth is more commonly pH lockout than actual deficiency. The nutrient is IN the soil but unavailable. Adding more chelated Fe at pH 7.0+ does nothing — Fe precipitates out above 6.8 regardless of quantity. Growers then add more, compounding EC.',
    correctAction: 'BEFORE supplementing: measure runoff pH. If above 6.5 (soil) or 6.2 (coco), correct pH with next 2-3 feeds at pH 6.0. Symptoms resolve in 5-7 days without any added micronutrients. Only supplement if pH is correct and symptoms persist.',
    evidence: 'Nutrient availability charts (Lucas 1982, Michigan State University — classic soil-pH availability chart) apply directly to cannabis. Bernstein lab confirmed pH-driven micro lockout in cannabis (Shiponi & Bernstein 2021).',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['add-iron', 'add-calmag', 'increase-ec'],
    recommendActions: ['measure-runoff-ph', 'correct-ph', 'hold-supplements-72h'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. FRESH CLONE SPECIFICS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'clone-dome-early-removal',
    trigger: {
      stage: ['seedling'],
      recentEvents: ['NEW-KEYWORD:event-clone-cut', 'NEW-KEYWORD:dome-on'],
      withinHours: 168,
      plantFlags: ['plantType:clone'],
    },
    generalAdvice: 'Remove the humidity dome after 3-4 days to encourage stronger stem.',
    whyGeneralAdviceFails: 'Unrooted clones rely entirely on leaf absorption to stay turgid — no root pressure exists. Dome removal before root initiation (typically day 7-10 for cannabis) collapses turgor and the clone wilts irreversibly. The "3-4 day" general advice is correct for ALREADY-rooted cuttings, not fresh cuts.',
    correctAction: 'Dome stays on until white root tips poke through the rooting medium (10-14 days). Then 2-day weaning: crack vents day 1, lift dome 2h day 2, full removal day 3. Only then does the stem-strengthening advice apply.',
    evidence: 'Caplan 2018 (University of Guelph PhD) — propagation protocol research. Cannabis clones root 50-80% over 10-14 days under dome; removal before rooting halves success rate.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['remove-dome', 'reduce-humidity'],
    recommendActions: ['maintain-dome', 'check-root-development', 'mist-interior'],
  },

  {
    id: 'clone-first-light-too-high',
    trigger: {
      stage: ['seedling', 'early-veg'],
      recentEvents: ['NEW-KEYWORD:event-clone-cut'],
      withinHours: 336,
      plantFlags: ['plantType:clone'],
    },
    generalAdvice: 'Move to main tent under 400-600 PPFD once dome comes off.',
    whyGeneralAdviceFails: 'A freshly-rooted clone transitioning from ~100 PPFD dome light to 400-600 PPFD ambient light cannot ramp carboxylation fast enough — leaves bleach at the margins and the plant stalls for a week. Photosynthetic machinery takes 5-10 days to acclimate to a >3x intensity change.',
    correctAction: 'Step up over 5 days: day 1 at 200 PPFD, day 3 at 300, day 5 at 400+. If moving to a shared tent, position at tent edge for the first week. Light bleaching shows up 24h after exposure, not immediately.',
    evidence: 'Rodriguez-Morrison et al. 2021, Frontiers in Plant Science — cannabis responds linearly to PPFD up to 1,800 but photosynthetic acclimation timescales follow general C3 literature (Murchie & Horton 1997).',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['increase-light', 'move-under-main-light'],
    recommendActions: ['ramp-light-slowly', 'position-tent-edge'],
  },

  {
    id: 'clone-rooting-hormone-dont-feed',
    trigger: {
      stage: ['seedling'],
      recentEvents: ['NEW-KEYWORD:event-clone-cut'],
      withinHours: 240,
      plantFlags: ['plantType:clone'],
    },
    generalAdvice: 'Water with mild nutrient solution to encourage early root development.',
    whyGeneralAdviceFails: 'Rooting hormones (IBA, NAA) work by tricking the cutting into auxin-driven callus formation. Adding N suppresses root initiation — high N promotes shoot growth at the expense of roots. Growers feeding "to help" get slower rooting and worse success rates.',
    correctAction: 'Plain pH 5.8-6.0 water (RO or tap dechlorinated) only until roots appear. First feed is 1/8-1/4 strength grow formula AFTER visible roots, not before.',
    evidence: 'Caplan 2018 — Guelph propagation study confirmed 0.2% IBA gel alone outperforms hormone+nutrient combos. General rooting physiology: Hartmann & Kester, Plant Propagation textbook.',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['feed-nutrients', 'add-rooting-fertilizer'],
    recommendActions: ['plain-water', 'maintain-rooting-hormone'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. DROUGHT / UNDERWATERING RECOVERY
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'drought-rehydrate-gradually',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['watering-underwatered'],
      withinHours: 48,
      plantFlags: [],
    },
    generalAdvice: 'Plant wilted from underwatering — drench immediately to runoff.',
    whyGeneralAdviceFails: 'A pot that has dried below 20% moisture content develops hydrophobic channels — water runs down gaps between root ball and pot wall without rehydrating the medium. A single heavy drench gives misleading runoff, leaves 80% of the root zone dry, and delivers cold water to warm-acclimated roots causing additional shock.',
    correctAction: 'Apply 10-15% of pot volume, wait 20 minutes for wicking, repeat 2-3 times. Target room-temp (20-22C) water. For fabric pots, bottom-soak in a tray for 15 min if channels are severe. Only after even rehydration, resume normal feeding.',
    evidence: 'Practitioner consensus. Peat hydrophobicity on dry-back is documented (Michel 2010, Scientia Horticulturae) — peat-based substrates require progressive rewetting after drought.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['drench-to-runoff', 'cold-water'],
    recommendActions: ['incremental-rehydration', 'bottom-soak', 'room-temp-water'],
  },

  {
    id: 'drought-intentional-late-flower-preserve',
    trigger: {
      stage: ['late-flower'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: [],
    },
    generalAdvice: 'Plant showing mild wilt in late flower — water immediately.',
    whyGeneralAdviceFails: 'Caplan 2019 specifically showed that controlled drought (holding back water until leaf water potential reaches -1.5 MPa) for ~11 days in week 7 of flower increased THCA by 12% and total THCA yield by 43% — with dry weight unchanged. Reflexive rewatering at first wilt forfeits this documented gain.',
    correctAction: 'In late flower week 6-8, if wilt appears in afternoon only and turgor returns by next morning, hold water for another 12-24h. Target leaf tensiometer -1.5 MPa or visible but recoverable wilt. Only water to full drench if morning turgor does not return.',
    evidence: 'Caplan, Dixon & Zheng 2019, HortScience — controlled drought protocol, THCA +12%, CBDA +13%, THCA yield +43%. Replicated in at least one commercial pilot.',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['water-immediately', 'emergency-drench'],
    recommendActions: ['monitor-morning-turgor', 'controlled-drought', 'water-next-afternoon'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. LATE-FLOWER EMERGENCIES
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'bud-rot-defol-contraindicated',
    trigger: {
      stage: ['mid-flower', 'late-flower', 'ripening'],
      recentEvents: ['NEW-KEYWORD:event-bud-rot'],
      withinHours: 48,
      plantFlags: [],
    },
    generalAdvice: 'Increase airflow and defoliate to dry out the canopy.',
    whyGeneralAdviceFails: 'Botrytis cinerea spores are everywhere by the time visible rot appears. Heavy defol during active infection dislodges spores into healthy adjacent buds and spreads the infection. The "open the canopy" advice is CORRECT as PREVENTION in mid-flower but WRONG as active treatment.',
    correctAction: 'Remove infected buds with sharp sterilized scissors, cut 2-3cm into healthy tissue, bag the cuttings immediately without shaking. Drop tent RH to 45-50%. Only remove leaves DIRECTLY touching the cut sites. Full defol only after 5-7 days of no new rot appearance.',
    evidence: 'Punja 2021, Frontiers in Plant Science — Botrytis management in cannabis. Spore dispersal mechanics: Williamson et al. 2007, Molecular Plant Pathology.',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['defoliate', 'shake-canopy', 'spray-foliar'],
    recommendActions: ['remove-infected-buds', 'lower-humidity', 'sterilize-tools'],
  },

  {
    id: 'late-flower-hermie-dont-stress-harvest',
    trigger: {
      stage: ['late-flower', 'ripening'],
      recentEvents: ['NEW-KEYWORD:event-hermie'],
      withinHours: 72,
      plantFlags: [],
    },
    generalAdvice: 'Hermie in late flower — chop immediately to avoid seed production.',
    whyGeneralAdviceFails: 'Pollen viability takes 24-72h after pod dehiscence. Harvesting in panic at first sign of nanners in week 7-8 sacrifices ripening that would otherwise complete before any seeds mature (seed formation takes 14-21 days). Most late-flower hermie plants can finish normally if handled properly.',
    correctAction: 'Identify individual nanners with loupe, pluck with tweezers daily. Isolate the plant (or at minimum the affected cola) from any other flowering females. Continue to trichome-based harvest decision. Expect possibly 1-5 seeds in affected areas, not full seeding.',
    evidence: 'Practitioner consensus. Cannabis pollen viability under humid conditions: Choudhary et al. 2014, Journal of Applied Research on Medicinal and Aromatic Plants.',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['harvest-immediately', 'emergency-chop'],
    recommendActions: ['pluck-nanners', 'isolate-plant', 'continue-monitoring'],
  },

  {
    id: 'late-flower-pest-spray-contraindicated',
    trigger: {
      stage: ['late-flower', 'ripening'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: ['previousProblems:spider-mites', 'previousProblems:thrips'],
    },
    generalAdvice: 'Spray neem or insecticidal soap to knock back pest pressure.',
    whyGeneralAdviceFails: 'Any foliar application within 14 days of harvest deposits residue directly onto trichomes. Neem, soaps, and pyrethrins all leave detectable residues that ruin taste, burn quality, and (for medical users) introduce unwanted compounds. Residue studies show neem half-life on plant tissue is 8-12 days.',
    correctAction: 'No foliar spraying after week 5 of flower. For active pests in late flower: biological controls only (predatory mites, lacewing larvae). Accept cosmetic damage and plan prevention next cycle. If infestation is overwhelming, early harvest of unaffected colas beats sprayed full harvest.',
    evidence: 'Sullivan et al. 2013, Cannabis residue analysis — neem and pyrethrin detectable on smoked cannabis samples. Practitioner consensus on the 14-day harvest interval.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['spray-neem', 'foliar-pesticide', 'insecticidal-soap'],
    recommendActions: ['release-predators', 'accept-damage', 'plan-next-cycle'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. COLD SNAP / ENVIRONMENTAL SHOCK
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'cold-snap-gradual-warming',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg', 'early-flower', 'mid-flower', 'late-flower'],
      recentEvents: ['env-cold-snap'],
      withinHours: 48,
      plantFlags: [],
    },
    generalAdvice: 'Temps dropped overnight — crank the heater to get back to 24C fast.',
    whyGeneralAdviceFails: 'Plants acclimated to 14-16C overnight have downregulated membrane fluidity and enzyme activity. A fast jump to 24C causes membrane stress and cell damage that manifests as leaf bronzing 48-72h later. Growers then diagnose "P deficiency" from the purple discoloration and add P, compounding osmotic stress.',
    correctAction: 'Warm gradually: 2-3C per hour ceiling. Target first stage at 18-19C for 4-6 hours, then 21C, then normal setpoint. Do not feed for 48h. The purple is cold stress; it resolves as enzymes rewarm.',
    evidence: 'Chinnusamy et al. 2007, Trends in Plant Science — cold acclimation and re-warming membrane physiology. Cannabis-specific reference: Chandra et al. 2011 on temperature response.',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['rapid-warming', 'feed-nutrients', 'add-phosphorus'],
    recommendActions: ['gradual-warming', 'hold-feed-48h', 'monitor-recovery'],
  },

  {
    id: 'cold-root-zone-hold-water',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg'],
      recentEvents: ['env-cold-snap'],
      withinHours: 24,
      plantFlags: [],
    },
    generalAdvice: 'Plant looks droopy after cold snap — water to perk it up.',
    whyGeneralAdviceFails: 'Cold roots below 17C have drastically reduced water uptake (aquaporin activity drops sharply). Watering into a cold root zone produces immediate anoxia and root rot starter conditions. The droop is from chilling injury, not dehydration — the medium is usually still wet.',
    correctAction: 'Check pot weight before watering. If medium is not genuinely dry, do NOT water. Raise root-zone temp first (heat mat at 20-21C medium temp) before resuming watering. Root zone temp recovery takes 12-24h.',
    evidence: 'Aroca et al. 2012, Journal of Experimental Botany — aquaporin activity and cold root zone. Well established in hydroponic literature.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['water-plant', 'feed-nutrients'],
    recommendActions: ['check-pot-weight', 'warm-root-zone', 'monitor-12h'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. DEFICIENCY-MIMICKING CONDITIONS
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'overwater-looks-like-n-def',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg'],
      recentEvents: ['watering-overwatered'],
      withinHours: 120,
      plantFlags: [],
    },
    generalAdvice: 'Lower leaves yellowing — classic nitrogen deficiency, increase feed.',
    whyGeneralAdviceFails: 'Waterlogged roots cannot absorb N regardless of how much is present in the medium. The yellow-from-bottom symptom is identical to true N deficiency but the cause is anoxic root zone. Adding N increases salt load on already-compromised roots and accelerates root rot.',
    correctAction: 'Let the medium dry to 30-40% moisture before watering again (check with finger at 5cm depth or use a moisture meter). Do not feed for at least 2 waterings after drying back. Consider adding 1ml/L H2O2 (3%) to the next watering to re-oxygenate the root zone.',
    evidence: 'Classic overwatering symptomology documented in Cervantes Marijuana Grow Bible. Root anoxia and N uptake: Drew 1997, Annual Review of Plant Physiology.',
    confidence: 'high',
    severity: 'high',
    blockActions: ['feed-nutrients', 'increase-n', 'water-plant'],
    recommendActions: ['dry-back', 'check-root-health', 'add-h2o2'],
  },

  {
    id: 'calcium-looks-like-mg',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: [],
    },
    generalAdvice: 'Interveinal yellowing with brown edges — add Epsom salts (Mg).',
    whyGeneralAdviceFails: 'Ca and Mg deficiencies look nearly identical in early stages but have opposite treatments. Adding Mg when the real issue is Ca worsens the Ca lockout (Ca/Mg antagonism). Growers then escalate Mg dose and push the plant into severe Ca deficiency that manifests as new-growth distortion.',
    correctAction: 'Look at WHICH leaves first — Mg starts in lower/older leaves, Ca starts in new growth AND causes twisted or curled new leaves. If new growth is distorted, stop Epsom and add cal-mag or calcium nitrate. If only old leaves, Mg is correct.',
    evidence: 'Classic Ca/Mg antagonism: Marschner Mineral Nutrition of Higher Plants (3rd ed.). Cannabis-specific: Bernstein lab (Saloner et al. 2019).',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['add-epsom', 'add-mg-only'],
    recommendActions: ['identify-affected-leaves', 'add-calmag-or-ca'],
  },

  {
    id: 'p-def-is-cold-roots',
    trigger: {
      stage: ['seedling', 'early-veg'],
      recentEvents: ['env-cold-snap'],
      withinHours: 72,
      plantFlags: [],
    },
    generalAdvice: 'Purple stems and leaf undersides — phosphorus deficiency, add bloom booster.',
    whyGeneralAdviceFails: 'Purple discoloration in young plants is almost always anthocyanin expression from cold root zones, NOT P deficiency. P uptake stops below ~15C root temp regardless of P concentration. Adding P does nothing for uptake and the extra salt load stresses already-chilled roots.',
    correctAction: 'Measure root-zone temperature. If below 18C, the fix is warming (heat mat, raising room temp, insulating pots) NOT phosphorus. Symptoms resolve within 5-7 days of consistent 21-22C root-zone temps without adding any P.',
    evidence: 'Practitioner consensus + general plant physiology. P uptake temperature dependence: Sheldrake & Narayanan 1979, Experimental Agriculture. No cannabis-specific dose-response.',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['add-phosphorus', 'add-bloom-booster'],
    recommendActions: ['measure-root-temp', 'warm-root-zone'],
  },

  {
    id: 'high-ec-looks-like-def',
    trigger: {
      stage: ['late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['treatment-increased-nutes'],
      withinHours: 96,
      plantFlags: [],
    },
    generalAdvice: 'Tips burning and leaves clawing — add cal-mag and flush lightly.',
    whyGeneralAdviceFails: 'Classic nute burn after a feed increase is OVER-fertilization, not deficiency. Cal-mag adds MORE salts to an already-high EC root zone and worsens tip burn. The "light flush" advice is closer to right, but the key is the feed reduction afterward — which growers often skip because symptoms improved post-flush.',
    correctAction: 'One flush at 1.5x pot volume with pH-corrected water. THEN drop feed EC 25-30% for the next 3-4 feeds. Do not add cal-mag. Read runoff EC to confirm it drops below input EC before restoring feed strength.',
    evidence: 'Bernstein lab consistent finding: optimal flowering N 160 mg/L, optimal P 40-80 mg/L — most commercial feed schedules 2-3x too high. Saloner & Bernstein 2020.',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['add-calmag', 'increase-nutrients'],
    recommendActions: ['single-flush', 'reduce-feed-ec', 'read-runoff-ec'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // BONUS: DRYING / CURING EDGE CASES
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'drying-too-fast-extend-not-rehydrate',
    trigger: {
      stage: ['drying'],
      recentEvents: [],
      withinHours: 0,
      plantFlags: [],
    },
    generalAdvice: 'Buds dried too fast (under 5 days) — rehydrate with humidity packs.',
    whyGeneralAdviceFails: 'A 5-day drying on buds produces chlorophyll retention and harsh smoke. Rehydrating with Boveda packs re-plumps the buds but does not drive the chlorophyll/starch degradation that proper cure requires. You end up with moist harsh weed, not cured good weed.',
    correctAction: 'Jar at 62% RH and cure LONGER — 6-8 weeks minimum instead of the standard 2-4. The slow enzymatic process still works at correct moisture, just takes longer. Do not attempt to "reverse" a fast dry.',
    evidence: 'Practitioner consensus. Chlorophyll degradation kinetics: general plant physiology (Hortensteiner 2006, Annual Review of Plant Biology). No controlled cannabis cure study.',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['rehydrate-aggressively'],
    recommendActions: ['extended-cure', 'target-62-rh', 'patience'],
  },
]);

// ═══════════════════════════════════════════════════════════════════
// Helper: findEdgeCases({ stage, recentEvents, plantFlags })
// ═══════════════════════════════════════════════════════════════════

const SEVERITY_RANK = { critical: 3, high: 2, medium: 1 };

/**
 * Filter EDGE_CASES to those matching the current plant context.
 *
 * Matching rules:
 *   - `stage` must appear in edgeCase.trigger.stage[] (exact id match).
 *   - If edgeCase.trigger.recentEvents[] is non-empty, at least one of
 *     its keyword ids must appear in the `recentEvents` input.
 *     An empty trigger.recentEvents[] means "no event required".
 *   - If edgeCase.trigger.plantFlags[] is non-empty, ALL of its entries
 *     must appear in the `plantFlags` input (AND-semantics).
 *   - `withinHours` is currently informational — the advisor engine is
 *     responsible for filtering recentEvents by age before calling in.
 *
 * Results are sorted by severity rank (critical > high > medium).
 * Within the same severity, declaration order is preserved.
 *
 * @param {Object} params
 * @param {string}   params.stage          current stage id
 * @param {string[]} [params.recentEvents] note keyword ids seen recently
 * @param {string[]} [params.plantFlags]   plant-level flag strings
 * @returns {EdgeCase[]}
 */
export function findEdgeCases({ stage, recentEvents = [], plantFlags = [] } = {}) {
  if (!stage) return [];
  const events = new Set(recentEvents);
  const flags = new Set(plantFlags);

  const matches = [];
  for (const ec of EDGE_CASES) {
    const t = ec.trigger;
    if (!t.stage.includes(stage)) continue;

    if (Array.isArray(t.recentEvents) && t.recentEvents.length > 0) {
      let hit = false;
      for (const ev of t.recentEvents) {
        if (events.has(ev)) { hit = true; break; }
      }
      if (!hit) continue;
    }

    if (Array.isArray(t.plantFlags) && t.plantFlags.length > 0) {
      let allPresent = true;
      for (const f of t.plantFlags) {
        if (!flags.has(f)) { allPresent = false; break; }
      }
      if (!allPresent) continue;
    }

    matches.push(ec);
  }

  matches.sort((a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0));
  return matches;
}

/**
 * New keyword rule ids proposed by this module that do NOT yet exist in
 * rules-keywords.js. The advice engine should treat these as no-op until
 * the corresponding KEYWORD_PATTERNS rules are added. Ordered by priority.
 */
export const PROPOSED_NEW_KEYWORDS = Object.freeze([
  {
    id: 'event-hermie',
    pattern: /\b(hermie|herm(ed|ing)?|nanners?|bananas?|male\s+flowers?|pollen\s+sacs?)\b/i,
    field: 'recentEvent',
    value: 'hermie',
    note: 'Already matched by SEVERITY_HEURISTICS for alert level, but no keyword rule id exists so it cannot fire as a trigger.',
  },
  {
    id: 'event-bud-rot',
    pattern: /\b(bud\s*rot|botrytis|grey\s*mould|grey\s*mold|brown\s+bud)\b/i,
    field: 'recentEvent',
    value: 'bud-rot',
    note: 'Critical late-flower emergency — no current keyword id.',
  },
  {
    id: 'event-clone-cut',
    pattern: /\b(took\s+(a\s+)?cut(ting)?|cloned|rooting|in\s+the\s+dome)\b/i,
    field: 'recentEvent',
    value: 'clone-cut',
    note: 'Distinguishes freshly-cut clone from already-rooted clone plantType tag.',
  },
  {
    id: 'dome-on',
    pattern: /\bhumidity\s+dome|dome\s+(on|covered)\b/i,
    field: 'envEvent',
    value: 'dome-on',
    note: 'Pairs with event-clone-cut for dome-removal timing guardrail.',
  },
]);
