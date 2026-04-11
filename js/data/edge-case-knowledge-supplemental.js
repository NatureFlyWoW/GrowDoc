// GrowDoc Companion — Edge Case Knowledge (Supplemental)
// Long-tail edge cases where general GrowDoc advice is wrong or insufficient.
// Covers equipment-context, sensor artifact, multi-factor collision,
// survival-mode, and stage-boundary interactions that the primary
// edge-case-knowledge.js file does not address.
//
// Schema mirrors edge-case-knowledge.js. Categories:
//   'equipment' | 'genetics' | 'multi-factor' | 'environmental'
//   'pest-disease' | 'time-sensitive' | 'sensor-artifact' | 'survival'
//   'stage-boundary'

export const EDGE_CASES_SUPPLEMENTAL = Object.freeze([

  // ── EQUIPMENT CONTEXT ────────────────────────────────────────────────

  {
    id: 'autopot-valve-premature-activation',
    trigger: {
      stage: ['seedling', 'early-veg'],
      recentEvents: ['new-autopot-setup'],
      withinHours: 168,
      plantFlags: ['irrigation:autopot'],
    },
    generalAdvice: 'Fill the reservoir and let the Autopot AQUAvalve deliver water automatically.',
    whyGeneralAdviceFails: 'The AQUAvalve fills the tray to a fixed ~20mm depth the moment the reservoir is connected. A seedling or recently transplanted clone in light media has insufficient root mass to pull that standing water down before anaerobic conditions develop. The tray stays wet for days, drowning the root tips before the plant can establish.',
    correctAction: 'Hand-water exclusively for the first 7-14 days until roots reach the bottom third of the pot and the plant is drinking visibly. Only then open the Autopot valve. Set the valve float height to the minimum position during the first week after activation.',
    evidence: 'practitioner consensus — AutoPot growers forum, THCFarmer',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['activate-autopot-valve-immediately', 'fill-reservoir-at-transplant'],
    recommendActions: ['hand-water-only', 'delay-valve-activation-14-days', 'check-root-emergence-from-pot-base'],
    category: 'equipment',
  },

  {
    id: 'fabric-pot-3gal-mid-flower-desiccation',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['container:fabric', 'pot-size:3L'],
    },
    generalAdvice: 'Water when the pot feels light, targeting 2-3 day intervals in mid-flower.',
    whyGeneralAdviceFails: 'A 3-gallon fabric pot loses moisture through all four sidewalls simultaneously, not just the bottom. A fully canopied plant at peak mid-flower transpiration will drink a 3-gallon fabric pot to dangerous dryness in under 24 hours at 26C. The standard "2-3 day interval" guidance is calibrated for plastic pots or larger fabric sizes.',
    correctAction: 'In mid-flower, treat 3-gallon fabric pots like hydro: check weight twice daily. Expect to water daily and potentially morning-and-evening during peak demand weeks. The pot should never feel "bone light" — catch it at 30-40% of saturated weight, not at zero.',
    evidence: 'practitioner consensus — comparative dryback studies across container types',
    confidence: 'high',
    severity: 'high',
    blockActions: ['follow-2-day-watering-schedule-in-3gal-fabric'],
    recommendActions: ['twice-daily-weight-check', 'increase-watering-frequency', 'consider-upsizing-to-5gal'],
    category: 'equipment',
  },

  {
    id: 'hps-grower-calmag-overcorrection-under-led',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition', 'early-flower'],
      recentEvents: ['switched-to-led'],
      withinHours: 336,
      plantFlags: ['lighting:led', 'previous-lighting:hps'],
    },
    generalAdvice: 'LED grows require CalMag supplementation because LEDs deliver less infrared than HPS.',
    whyGeneralAdviceFails: 'HPS produces significant infrared that drives transpiration-based calcium uptake AND most tap water already contains 50-150 ppm Ca. Supplementing 2-3 ml/L CalMag on top creates excess Ca which competes with Mg and K uptake, producing a de facto Mg deficiency from excess Ca input.',
    correctAction: 'Under HPS with tap water: test baseline water Ca and Mg levels first. If tap Ca is above 80 ppm, CalMag supplementation in soil is likely unnecessary and may cause antagonism. Under LED with RO water: CalMag is essential. Under LED with tap water: 0.5-1 ml/L is usually appropriate.',
    evidence: 'nutrient antagonism — Ca-Mg competition; practitioner consensus for tap-water HPS grows',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['apply-full-calmag-dose-under-hps-with-tap-water'],
    recommendActions: ['test-baseline-water-mineral-content', 'adjust-calmag-by-light-type-and-water-source'],
    category: 'equipment',
  },

  {
    id: 'sealed-room-co2-dropout-during-lights-off',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition', 'early-flower', 'mid-flower'],
      recentEvents: ['co2-supplementation-running'],
      withinHours: null,
      plantFlags: ['grow-type:sealed-room', 'co2:supplemented'],
    },
    generalAdvice: 'Sealed room CO2 at 1200-1500 ppm increases yield 20-30%.',
    whyGeneralAdviceFails: 'A sealed room with a CO2 burner or compressed tank running on a photoperiod timer fills with CO2 during the light period. During the 12-hour dark period plants stop photosynthesising, CO2 builds up, and without active ventilation or a CO2 controller with a dark-period cutoff the next lights-on finds CO2 at 3000-4000 ppm. Plants cannot use CO2 above 1500 ppm and the excess acidifies the stomates.',
    correctAction: 'Use a dedicated CO2 controller that cuts CO2 injection during the dark period entirely. Set a separate timer to purge the room to 1000-1200 ppm before lights-on each morning. If using a propane/natural gas burner, account for combustion heat output in your cooling calculations.',
    evidence: 'controlled environment agriculture — CO2 controller specification guides; Quest Climate dehumidification guide',
    confidence: 'high',
    severity: 'high',
    blockActions: ['run-co2-on-same-timer-as-lights', 'ignore-dark-period-co2-buildup'],
    recommendActions: ['install-co2-controller-with-dark-cutoff', 'monitor-dark-period-temps-separately'],
    category: 'equipment',
  },

  {
    id: 'dehumidifier-heat-load-vpd-conflict-lights-off',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['grow-type:tent-or-room', 'equipment:dehumidifier-inside-space'],
    },
    generalAdvice: 'Place a dehumidifier inside the grow space to manage humidity in late flower.',
    whyGeneralAdviceFails: 'Dehumidifiers dump heat as a byproduct. A dehumidifier positioned inside a sealed tent or small room raises ambient temperature 2-4C. During lights-off when the goal is to lower temp to achieve a 5-8C day/night differential, the dehumidifier can eliminate the entire differential and raise VPD well above the late-flower target.',
    correctAction: 'Position the dehumidifier outside the tent with ducting pulling humid tent air through it and returning dry air. If placing inside is unavoidable, run it only during lights-on. Use a separate temperature controller to cut dehumidifier power at lights-off. Check actual tent temp at lights-off to confirm the 5C+ differential is being achieved.',
    evidence: 'environmental physics — dehumidifier heat of rejection; Quest Climate dehumidification 101',
    confidence: 'high',
    severity: 'high',
    blockActions: ['place-dehumidifier-inside-tent-without-temp-compensation'],
    recommendActions: ['dehumidifier-outside-with-ducting', 'measure-lights-off-temp-separately', 'schedule-dehumidifier-lights-on-only'],
    category: 'equipment',
  },

  {
    id: 'plastic-pot-rootbound-pre-flip-transplant-damage',
    trigger: {
      stage: ['late-veg', 'transition'],
      recentEvents: ['rootbound-observed'],
      withinHours: 168,
      plantFlags: ['container:plastic', 'days-to-flip:<7'],
    },
    generalAdvice: 'If roots are circling the pot surface, transplant immediately into a larger container.',
    whyGeneralAdviceFails: 'Transplanting within 7 days of a planned light flip is double-jeopardy stress. The plant enters stretch already in transplant recovery mode, triggering delayed and uneven stretch that throws off training. In practice, growers commonly report hermie pressure, uneven stretch, and failed canopy fill in these scenarios.',
    correctAction: 'If the plant is within 7 days of flip and is rootbound in a plastic pot: flip on schedule without transplanting. The rootbound plant will stretch and complete flower in the bound state — yield loss from root restriction is 10-15% at most. If you have more than 10 days before flip, transplant and wait the extra time.',
    evidence: 'practitioner consensus — transplant timing literature',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['transplant-within-7-days-of-planned-flip'],
    recommendActions: ['complete-current-flip-in-bound-state', 'delay-flip-10+-days-if-transplanting'],
    category: 'equipment',
  },

  {
    id: 'passive-wicking-blumat-living-soil-salt-accumulation',
    trigger: {
      stage: ['late-veg', 'transition', 'early-flower', 'mid-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['irrigation:blumat', 'medium:living-soil'],
    },
    generalAdvice: 'Blumat or passive wicking systems maintain consistent moisture ideal for living soil.',
    whyGeneralAdviceFails: 'Passive wicking systems deliver water exactly as fast as the plant transpires — meaning there is minimal flush of fresh water through the soil profile. In hand-watered living soil, the occasional oversaturation and runoff flushes accumulated mineral deposits. In a sealed wicking system these salts accumulate in the root zone over weeks.',
    correctAction: 'In passive wicking or Blumat setups with living soil, use plain pH-adjusted water in the reservoir for at least every third fill. If organic liquid feeds are used, reduce to 25% of normal liquid-feed rate. Check root zone EC periodically by squeezing a small amount of medium moisture onto an EC meter — target below 2.0 in mid-veg.',
    evidence: 'practitioner consensus — Blumat forum, BuildASoil resources',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['feed-full-strength-nutrients-into-passive-wicking-system'],
    recommendActions: ['plain-water-every-third-fill', 'reduce-liquid-feed-to-25pct', 'periodic-rootzone-ec-check'],
    category: 'equipment',
  },

  // ── GENETICS ─────────────────────────────────────────────────────────

  {
    id: 'haze-genetics-extreme-stretch-ceiling-collision',
    trigger: {
      stage: ['late-veg', 'transition'],
      recentEvents: ['flip-12-12'],
      withinHours: 168,
      plantFlags: ['genetics:haze-dominant', 'stretch-level:high'],
    },
    generalAdvice: 'Let the canopy fill 90% of the tent footprint before flipping. Expect 50-100% stretch.',
    whyGeneralAdviceFails: 'Haze-dominant and Amnesia Haze phenotypes regularly stretch 200-300% from flip height, not 50-100%. A plant at 60 cm when flipped will reach 180 cm in three weeks in a 2.4m tent with 60cm of pots and lights consuming 50cm. The "let it fill" advice borrowed from indica-dominant grows is directly responsible for ceiling crashes with sativa-dominant genetics.',
    correctAction: 'For confirmed haze, amnesia, or long-flowering sativa-dominant genetics: flip at 30-40% of your maximum allowable plant height, not 90% canopy fill. Assume 200-250% stretch as a planning baseline. Begin heavy supercropping and LST from day 1 of stretch to manage height.',
    evidence: 'practitioner consensus — Haze growers data; stretch multiplier data for Amnesia Haze (average 3x documented)',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['flip-at-90pct-canopy-fill-with-haze-genetics', 'assume-100pct-stretch-for-sativa-dominant'],
    recommendActions: ['flip-at-40pct-max-height', 'supercrop-from-day-1-of-stretch', 'plan-for-200pct-minimum'],
    category: 'genetics',
  },

  {
    id: 'autoflower-lst-timing-window-week-3',
    trigger: {
      stage: ['early-veg'],
      recentEvents: ['action-taken:lst-applied'],
      withinHours: 72,
      plantFlags: ['plant-type:autoflower', 'veg-day:>21'],
    },
    generalAdvice: 'LST is the recommended training technique for autoflowers — bend the main stem down from node 4 onward.',
    whyGeneralAdviceFails: 'Autoflowers begin pre-flower development internally at 18-25 days from germination regardless of visible signs. LST applied at day 21-28 is being applied 0-7 days before the plant begins committing resources to flower initiation. A hard bend at this point causes a recovery delay of 3-5 days which overlaps the flowering transition.',
    correctAction: 'Begin LST on autoflowers between day 10 and day 18 from germination — when the stem is still flexible and genuinely vegetative. By day 21 many phenotypes are already pre-flowering internally. Use gentle, progressive bending in multiple sessions rather than a single 90-degree fold. After day 25, limit to gentle repositioning of branches already in the ties.',
    evidence: 'Cannabis Business Times — autoflower transplant research; Royal Queen Seeds LST guide',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['heavy-lst-on-autoflower-after-day-21'],
    recommendActions: ['begin-lst-day-10-to-18', 'gentle-repositioning-only-after-day-25'],
    category: 'genetics',
  },

  {
    id: 'high-cbd-strain-pk-ratio-toxicity',
    trigger: {
      stage: ['early-flower', 'mid-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['genetics:high-cbd', 'feed-type:synthetic'],
    },
    generalAdvice: 'Transition to bloom nutrients with elevated PK in flower. Target EC 1.6-2.2 in mid-flower.',
    whyGeneralAdviceFails: 'High-CBD strains (CBD:THC ratio > 5:1) and hemp-adjacent genetics have significantly lower nutrient tolerance than THC-dominant cultivars. Their compact internodes and smaller leaf surface area mean EC targets appropriate for high-THC photoperiod will cause tip burn, chlorosis, and stunted bud development at EC 1.6+.',
    correctAction: 'Cap EC at 1.2-1.4 for high-CBD genetics throughout flower. PK boosters should be limited to 50% of the dosage used for THC-dominant strains. Use base nutrients only — no separate PK spikes. Monitor for magnesium and calcium lockout signs at any EC above 1.0.',
    evidence: 'Cannabis Business Times — hemp autoflower fertiliser sensitivity research (2024); practitioner consensus',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['apply-standard-bloom-pk-dosage-to-high-cbd-strain', 'target-ec-above-1.4-for-cbd-genetics'],
    recommendActions: ['cap-ec-1.2-to-1.4-for-cbd-strains', 'no-separate-pk-boosters', 'monitor-micronutrient-lockout-earlier'],
    category: 'genetics',
  },

  {
    id: 'fast-flower-strain-standard-harvest-timing-miss',
    trigger: {
      stage: ['late-flower', 'ripening'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['genetics:fast-flower', 'flower-weeks:<7'],
    },
    generalAdvice: 'Harvest when trichomes show 70-80% cloudy with 20-30% amber. Standard photoperiod runs 8-10 weeks from flip.',
    whyGeneralAdviceFails: 'Fast Flower photoperiod varieties (Fastbuds, Quick One, 6-week strains) complete trichome development 2-3 weeks faster than standard photoperiods. Growers using the standard 8-week trichome check schedule start looking when these strains are already past peak, finding all-amber trichomes and wondering why potency is low.',
    correctAction: 'For any strain with breeder-listed flower time under 7 weeks, begin trichome checks from pistil day 25 (not day 40). Expect peak harvest window at 5-6 weeks from first pistils, not 8. If trichomes show >50% amber at your first check, harvest immediately.',
    evidence: 'Fast-flower breeder documentation — Royal Queen Seeds Fast Version guide; practitioner forum data',
    confidence: 'high',
    severity: 'high',
    blockActions: ['start-trichome-checks-at-standard-40-days-for-fast-flower-strains'],
    recommendActions: ['begin-trichome-checks-at-day-25-from-first-pistils', 'harvest-at-5-to-6-weeks-for-sub-7-week-strains'],
    category: 'genetics',
  },

  // ── MULTI-FACTOR ─────────────────────────────────────────────────────

  {
    id: 'defoliation-ph-swing-same-session',
    trigger: {
      stage: ['early-flower', 'mid-flower'],
      recentEvents: ['action-taken:defoliation', 'ph-imbalance-diagnosed'],
      withinHours: 24,
      plantFlags: [],
    },
    generalAdvice: 'Defoliate to improve light penetration and airflow. Correct pH issues promptly.',
    whyGeneralAdviceFails: 'Defoliation is a mechanical stress that temporarily suppresses stomatal conductance and photosynthetic rate as the plant diverts resources to healing open wounds. Running a pH-correction flush during the same 24-hour window overloads the root zone simultaneously with aerial stress. The combined event reliably produces a 4-7 day growth stall that looks like a deficiency.',
    correctAction: 'Separate defoliation and pH corrections by a minimum of 48 hours. Defoliate first, let the plant stabilise for 2 days with plain correctly-pH-adjusted water, then address EC or salt issues in a second session. If both issues are urgent, address the pH first.',
    evidence: 'plant stress physiology — concurrent mechanical and chemical stress interactions; practitioner consensus',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['defoliate-and-flush-same-day'],
    recommendActions: ['48h-separation-between-interventions', 'ph-correction-first-if-both-urgent'],
    category: 'multi-factor',
  },

  {
    id: 'topping-and-transplant-same-day',
    trigger: {
      stage: ['early-veg'],
      recentEvents: ['action-taken:transplanted', 'action-taken:topped'],
      withinHours: 24,
      plantFlags: [],
    },
    generalAdvice: 'Top at 4-5 nodes for best results. Transplant when roots fill the current container.',
    whyGeneralAdviceFails: 'Both topping and transplanting individually are mild stresses with 1-3 day recovery windows. Performed the same day, the compounded stress overwhelms the plant auxin redistribution and root regeneration simultaneously. The plant cannot heal the top cut while simultaneously rebuilding root-to-tip water delivery in a new, larger, alien medium.',
    correctAction: 'Never top and transplant on the same day. A minimum 5-day separation is required. Standard order: transplant, wait until the plant shows new growth (3-5 days), then top. Alternatively: top at least 5 days before the planned transplant date.',
    evidence: 'practitioner consensus — Royal Queen Seeds and FloraFlex transplant shock guides',
    confidence: 'high',
    severity: 'high',
    blockActions: ['top-and-transplant-same-day'],
    recommendActions: ['minimum-5-day-separation', 'transplant-first-wait-for-new-growth-then-top'],
    category: 'multi-factor',
  },

  {
    id: 'co2-supplementation-below-ppfd-threshold',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['co2-supplementation-started'],
      withinHours: 168,
      plantFlags: ['co2:supplemented', 'ppfd:<800'],
    },
    generalAdvice: 'CO2 at 1200-1500 ppm can increase yield by 20-30%.',
    whyGeneralAdviceFails: 'CO2 only helps above 800 PPFD. At low PPFD plants are already carbon-saturated relative to their photosynthetic rate. Adding CO2 does not help — but slightly elevated CO2 concentration can actually increase stomatal resistance as a CO2 feedback response, mildly reducing transpiration and therefore calcium uptake.',
    correctAction: 'Do not supplement CO2 below 800 PPFD at canopy. Verify with a PAR meter before committing to CO2. The upgrade order is: dial in VPD and DLI first, add CO2 only when light is truly the last limiting factor.',
    evidence: 'Bugbee et al. — photosynthesis co-limitation by light and CO2',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['run-co2-at-ppfd-below-800'],
    recommendActions: ['verify-ppfd-at-800-plus-before-co2', 'upgrade-light-before-co2'],
    category: 'multi-factor',
  },

  {
    id: 'lights-off-rh-spike-medium-surface-drying-mismatch',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['grow-type:tent', 'vpd-tracking:lights-off'],
    },
    generalAdvice: 'Monitor VPD and RH to stay within target ranges across the 24-hour cycle.',
    whyGeneralAdviceFails: 'When lights turn off, tent temperature drops 5-8C and relative humidity spikes — often from 50% to 65-75% in a 60x60 tent within 30 minutes. Growers who monitor RH during lights-on do not see this spike. The elevated RH during the 12-hour dark period is the actual threat window for botrytis and PM.',
    correctAction: 'Install a min/max or data-logging hygrometer that records overnight conditions. Target RH below 55% at lights-off using a dehumidifier on a timer that activates 30 minutes before lights-off. If RH spikes remain above 60% during dark, increase extraction fan speed during the dark period only.',
    evidence: 'ILGM VPD forum — lights-off RH control discussion; Quest Climate VPD stage 3',
    confidence: 'high',
    severity: 'high',
    blockActions: ['only-monitor-rh-during-lights-on', 'assume-good-lights-on-rh-applies-overnight'],
    recommendActions: ['install-min-max-hygrometer', 'dehumidifier-timer-30min-before-lights-off', 'increase-extraction-at-lights-off'],
    category: 'multi-factor',
  },

  // ── ENVIRONMENTAL ────────────────────────────────────────────────────

  {
    id: 'micro-tent-lights-off-rh-saturation-cascade',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['tent-size:60x60', 'stage:mid-flower-or-later'],
    },
    generalAdvice: 'Keep RH below 50% in flower to prevent botrytis.',
    whyGeneralAdviceFails: 'A 60x60 cm tent has roughly 90 litres of air volume. A single plant transpiring 0.3-0.5 L per day releases that water primarily during lights-on, but residual evaporation continues all night. With no active dehumidification, the dark-period air of a 60x60 tent can saturate to 80-90% RH in under 2 hours of lights-off. The small air volume has zero buffer capacity.',
    correctAction: 'In a 60x60 tent in mid-flower onward: run the extraction fan at 100% during dark hours specifically. Consider a small battery-powered or USB dehumidifier inside the tent triggered by a humidity controller at lights-off. Reduce watering volume (not frequency) in late flower.',
    evidence: 'environmental physics — air volume to moisture ratio; practitioner consensus from micro-tent growers',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['reduce-extraction-at-lights-off-in-micro-tent', 'assume-good-daytime-rh-carries-overnight-in-60x60'],
    recommendActions: ['full-extraction-during-dark-hours', 'add-humidity-controller', 'reduce-watering-volume-not-frequency'],
    category: 'environmental',
  },

  {
    id: 'cold-basement-root-zone-temp-p-lockout-misdiagnosis',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['grow-location:basement', 'season:winter'],
    },
    generalAdvice: 'Phosphorus deficiency shows as purple stems and dark leaves — correct with a bloom-biased feed or phosphorous supplement.',
    whyGeneralAdviceFails: 'Phosphorus uptake becomes severely impaired below 16C. In a cold basement where the grow medium sits on a concrete slab, root zone temperature can be 8-12C even when the air reads 22C. The plant shows all the classic P deficiency symptoms despite having adequate phosphorus in solution — it simply cannot absorb it. Adding more phosphorus does nothing.',
    correctAction: 'Before diagnosing P deficiency in any cold-weather or basement grow: measure medium temperature specifically with a probe thermometer 5cm below the surface. If below 18C, warm the root zone first. Use seedling heat mats under pots, raise pots off the floor with timber, or use a grow-tent floor insulation pad.',
    evidence: 'Phosphorus uptake temperature relationship — Jones (2013) Mineral Nutrition of Plants; Penn State Extension',
    confidence: 'high',
    severity: 'high',
    blockActions: ['add-phosphorus-supplement-before-checking-root-zone-temp-in-cold-room'],
    recommendActions: ['measure-medium-temp-at-5cm-depth', 'use-heat-mat-under-pots', 'raise-pots-off-cold-floor'],
    category: 'environmental',
  },

  {
    id: 'sealed-room-temp-overshoot-dehumidifier-heat-accounting',
    trigger: {
      stage: ['early-flower', 'mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['grow-type:sealed-room', 'equipment:dehumidifier-inside-space'],
    },
    generalAdvice: 'Size your air conditioning to handle your light wattage heat output.',
    whyGeneralAdviceFails: 'Commercial dehumidifier BTU ratings are often stated as their extraction capacity, not their waste-heat output. A 30-pint dehumidifier running continuously can add 800-1200 watts of heat to a room — equivalent to running an additional 800W HPS. Growers who carefully calculated AC needs based on light wattage alone find their sealed room overheating.',
    correctAction: 'When sizing sealed room climate control, sum all electrical loads inside the space: lights + dehumidifier + CO2 burners + pumps + fans. Every 1 kW of electrical load = 3,412 BTU/hour of heat requiring AC capacity. A 600W LED + 500W dehumidifier + 200W misc = 1.3 kW = 4,400 BTU minimum.',
    evidence: 'HVAC engineering fundamentals — electrical load to BTU conversion',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['size-ac-to-light-wattage-only-in-sealed-room'],
    recommendActions: ['sum-all-electrical-loads-as-heat-sources', 'calculate-btu-at-3412-per-kw'],
    category: 'environmental',
  },

  // ── PEST/DISEASE ─────────────────────────────────────────────────────

  {
    id: 'raise-rh-for-mites-in-flower-botrytis-trade',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: ['spider-mites-diagnosed'],
      withinHours: 48,
      plantFlags: [],
    },
    generalAdvice: 'Raise humidity above 50% to stop spider mite reproduction.',
    whyGeneralAdviceFails: 'This is the most dangerous direct contradiction in the knowledge base. Raising RH to 50-60% in week 4+ of flower to fight mites will predictably set up botrytis conditions within 5-7 days — grey mould grows faster than mites reproduce. A mite infestation in late flower is bad; a full botrytis infection is a total crop loss.',
    correctAction: 'Never raise RH to fight mites in mid-flower or later. In flower, use alternative mite controls only: (1) predatory mites (Phytoseiulus persimilis or Neoseiulus californicus). (2) Potassium silicate foliar spray on bud-free zones. (3) Reduce dust and airborne debris. Accept that full eradication may not be possible — focus on containment.',
    evidence: 'Direct contradiction of the default mites-raise-rh advice with botrytis prevention knowledge',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['raise-rh-above-50pct-to-fight-mites-in-mid-late-flower'],
    recommendActions: ['introduce-predatory-mites', 'potassium-silicate-foliar-on-bud-free-zones', 'maintain-rh-below-50pct'],
    category: 'pest-disease',
  },

  {
    id: 'defoliation-spreading-russet-mites-on-tools',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition', 'early-flower'],
      recentEvents: ['action-taken:defoliation'],
      withinHours: 48,
      plantFlags: ['pest:russet-mites-suspected'],
    },
    generalAdvice: 'Remove damaged leaves to reduce pest habitat and improve airflow through the canopy.',
    whyGeneralAdviceFails: 'Hemp russet mites (Aculops cannabicola) are microscopic (0.2mm) and invisible to the naked eye. They move between plants primarily by transfer on surfaces — clipping tools, hands, clothing. A defoliation session on a russet-mite-infested plant without tool sterilisation between plants is the most efficient possible vector for spreading the infestation.',
    correctAction: 'Before any defoliation on plants showing unexplained bronzing, leaf curl, or "wind burn that wont stop": inspect under a 60x+ loupe specifically for russet mites at the growing tip and upper petioles. Sterilise scissors between every plant using 70% isopropyl spray. If any plant shows russet mite symptoms, defoliate it last and quarantine tools.',
    evidence: 'GrowWeedEasy russet mite guide; Natural Enemies pest management',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['defoliate-across-multiple-plants-with-unsanitised-tools-when-russet-mites-possible'],
    recommendActions: ['60x-loupe-inspection-before-defoliation', 'sterilise-tools-between-plants', 'quarantine-suspect-plants-before-defoliating'],
    category: 'pest-disease',
  },

  {
    id: 'neem-foliar-transition-stretch-hermie-trigger',
    trigger: {
      stage: ['transition'],
      recentEvents: ['action-taken:foliar-spray', 'neem-oil-applied'],
      withinHours: 72,
      plantFlags: ['genetics:stress-sensitive'],
    },
    generalAdvice: 'Neem oil is an effective preventive spray — apply at lights-off in veg. Stop using in flower.',
    whyGeneralAdviceFails: 'The standard guidance says "stop neem in flower." However, the transition stretch period (days 1-10 after flip) is when the plant is most hormonally volatile and most susceptible to hermaphroditism. Neem contains azadirachtin which has demonstrated phytohormone-disrupting properties — it suppresses gibberellin synthesis, the same hormone regulating the stretch response.',
    correctAction: 'The last safe window for neem application is 7 days before the planned flip date, not after. During transition, switch to predatory insects, potassium silicate, or hydrogen peroxide sprays if pest pressure requires treatment.',
    evidence: 'Azadirachtin phytohormone interactions — Isman (2006) Annual Review of Entomology',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['apply-neem-during-transition-stretch-days-1-to-10'],
    recommendActions: ['last-neem-application-7-days-before-flip', 'switch-to-potassium-silicate-in-transition', 'use-predatory-insects-for-pest-control-post-flip'],
    category: 'pest-disease',
  },

  // ── TIME-SENSITIVE ───────────────────────────────────────────────────

  {
    id: 'epsom-foliar-lights-on-vs-lights-off-absorption',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower', 'mid-flower'],
      recentEvents: ['action-taken:foliar-spray', 'epsom-applied'],
      withinHours: 24,
      plantFlags: ['symptom:interveinal-yellowing'],
    },
    generalAdvice: 'Foliar spray Epsom salt at lights-off to prevent burning.',
    whyGeneralAdviceFails: 'Mg foliar absorption requires active stomatal opening — stomata close in the dark as part of the circadian CO2-conserving response. Magnesium delivered to closed stomata largely sits on the leaf surface and is lost to evaporation. Applying Mg-rich foliar at lights-off reduces absorption efficiency by 40-60% compared to application 30 minutes before lights-on.',
    correctAction: 'For Mg foliar correction specifically: apply 30-45 minutes before lights-on or in the first 2 hours of the light period when stomata are maximally open. Use 0.5-1% solution (5-10g per litre) to stay below burn threshold. Avoid foliar in late flower entirely due to mould risk.',
    evidence: 'Plant stomatal biology — stomatal aperture and light-driven transpiration',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['always-apply-mg-foliar-at-lights-off'],
    recommendActions: ['apply-epsom-foliar-30min-before-lights-on', 'use-0.5-to-1pct-epsom-solution'],
    category: 'time-sensitive',
  },

  {
    id: 'tap-water-high-hardness-calmag-mg-lockout',
    trigger: {
      stage: ['early-veg', 'late-veg', 'early-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['water-source:tap', 'water-hardness:>200ppm'],
    },
    generalAdvice: 'Under LED, supplement CalMag at 0.5-1 ml/L at every feeding.',
    whyGeneralAdviceFails: 'Many municipal tap water supplies in limestone geology areas carry 150-300 ppm Ca as hardness. Adding a CalMag supplement on top creates excess Ca relative to Mg. Calcium and magnesium compete for uptake — excess Ca at 250+ ppm total solution Ca actively suppresses Mg absorption. The grower sees interveinal yellowing that looks exactly like Mg deficiency — caused by their CalMag supplementation.',
    correctAction: 'If using tap water with hardness above 150 ppm Ca: skip CalMag supplementation in soil under LED unless runoff pH and trichome inspection confirm actual Ca deficiency. Test your tap water Ca/Mg baseline with a basic water hardness test. Use RO water or pure Mg supplement (Epsom salt) rather than CalMag in high-hardness tap-water grows.',
    evidence: 'Ion antagonism — Ca/Mg competition documented in Epstein & Bloom mineral nutrition',
    confidence: 'high',
    severity: 'high',
    blockActions: ['supplement-full-calmag-dose-with-high-hardness-tap-water'],
    recommendActions: ['test-tap-water-ca-mg-baseline', 'skip-calmag-if-tap-ca-above-150ppm', 'use-epsom-only-for-mg-correction'],
    category: 'time-sensitive',
  },

  // ── STAGE-BOUNDARY ────────────────────────────────────────────────────

  {
    id: 'defoliation-2-days-before-flip-vs-after-outcome-difference',
    trigger: {
      stage: ['late-veg', 'transition'],
      recentEvents: ['action-taken:defoliation', 'flip-12-12-imminent'],
      withinHours: 96,
      plantFlags: [],
    },
    generalAdvice: 'Final defoliation 3-5 days before the flip opens the canopy for flower.',
    whyGeneralAdviceFails: 'Two days before flip: the plant heals, new growth adapts to the open canopy in veg hormonal mode. Two days after flip: the plant simultaneously diverts resources to flower initiation AND heals defoliation wounds. The double hormonal demand reliably produces 5-7 day delays in stretch initiation and increases the probability of uneven stretch across tops.',
    correctAction: 'Pre-flip defoliation: do it at least 5 days before the flip, ideally 7. If you are within 3 days of flip and have not defoliated yet: flip on schedule and do the defoliation 5-7 days into transition when the plant is in active hormonal transition and the defoliation is less disruptive.',
    evidence: 'practitioner consensus — stage-boundary defoliation timing data from multiple grower journals',
    confidence: 'medium',
    severity: 'medium',
    blockActions: ['defoliate-2-to-3-days-before-planned-flip'],
    recommendActions: ['defoliate-5-to-7-days-before-flip', 'if-missed-wait-until-day-5-7-of-stretch'],
    category: 'stage-boundary',
  },

  {
    id: 'transplant-within-7-days-of-late-veg-flip',
    trigger: {
      stage: ['late-veg'],
      recentEvents: ['action-taken:transplanted'],
      withinHours: 168,
      plantFlags: ['days-to-planned-flip:<7'],
    },
    generalAdvice: 'Transplant into the final pot when roots fill the current container.',
    whyGeneralAdviceFails: 'Transplanting within 7 days of a flip creates a specific failure mode: the plant enters the 12/12 light regime with a partially disrupted root system that cannot yet fully exploit the new medium. Instead of using the stretch period to extend roots into the new container, the plant is using energy to recover from root disturbance. The stretch becomes stunted.',
    correctAction: 'Target transplant at least 10 days before planned flip date, and preferably 14. If the plant is ready to transplant but you are within 7 days of flip: either delay the flip by 7-10 days post-transplant, or delay the transplant until after the stretch completes.',
    evidence: 'practitioner consensus on flip-window transplanting; transplant recovery biology',
    confidence: 'high',
    severity: 'high',
    blockActions: ['transplant-within-7-days-of-planned-flip'],
    recommendActions: ['transplant-minimum-10-days-before-flip', 'delay-flip-to-accommodate-transplant-recovery'],
    category: 'stage-boundary',
  },

  // ── SENSOR-ARTIFACT ──────────────────────────────────────────────────

  {
    id: 'ph-meter-distilled-water-storage-junction-clog',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg', 'transition', 'early-flower', 'mid-flower'],
      recentEvents: ['ph-readings-inconsistent'],
      withinHours: null,
      plantFlags: ['equipment:budget-ph-meter'],
    },
    generalAdvice: 'Check your pH at every feeding. Keep the electrode wet when storing.',
    whyGeneralAdviceFails: 'The instruction to "keep the electrode wet" is misapplied by growers who store the pH probe in distilled water. Distilled water has essentially no ionic content, causing the KCl reference junction to leach electrolyte outward by osmosis, contaminating the junction. After several weeks of distilled storage the reference junction becomes partially clogged, producing systematic drift that typically reads 0.3-0.8 pH units too high.',
    correctAction: 'Store pH meters in pH 4.0 calibration buffer solution, pH 7.0 buffer, or dedicated probe storage solution (KCl-based). Never in distilled or RO water. If the meter has been stored in distilled for weeks: soak the probe tip in pH 4.0 buffer for 30 minutes, then recalibrate with fresh buffers.',
    evidence: 'electrode chemistry — KCl reference junction electrolyte management',
    confidence: 'high',
    severity: 'high',
    blockActions: ['store-ph-probe-in-distilled-water'],
    recommendActions: ['store-in-ph4-buffer-or-kCl-storage-solution', 'recalibrate-with-fresh-buffers-before-each-use', 'replace-probe-if-junction-contamination-suspected'],
    category: 'sensor-artifact',
  },

  {
    id: 'budget-rh-sensor-systematic-low-bias-late-flower',
    trigger: {
      stage: ['mid-flower', 'late-flower'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['equipment:budget-hygrometer'],
    },
    generalAdvice: 'Monitor RH at canopy level and keep below 50% in flower to prevent botrytis.',
    whyGeneralAdviceFails: 'Budget capacitive humidity sensors (under $15) have a systematic low-reading bias of 5-12% in the 55-75% RH range — the exact range where botrytis risk becomes significant. A grower reading 48% RH on a budget sensor may actually be at 56-60% — well into the danger zone. Symptom: growers who run what they believe is a tight 45-50% RH regime still see botrytis.',
    correctAction: 'Calibrate your RH sensor against a 75% RH calibration sachet ($5 at Amazon). If your budget sensor reads lower, apply the offset to all future readings. In late flower, target displayed 40-42% on a budget sensor if you suspect 8-10% low bias. For critical late-flower botrytis prevention, a $30 AcuRite Pro or $50 Inkbird IBS-TH3 is worthwhile.',
    evidence: 'Capacitive humidity sensor calibration literature',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['trust-budget-hygrometer-reading-as-accurate-in-high-rh-conditions'],
    recommendActions: ['calibrate-rh-sensor-against-reference', 'apply-offset-to-displayed-reading', 'target-40-42pct-displayed-if-sensor-reads-low'],
    category: 'sensor-artifact',
  },

  {
    id: 'ec-meter-cold-room-no-temperature-compensation',
    trigger: {
      stage: ['seedling', 'early-veg', 'late-veg'],
      recentEvents: [],
      withinHours: null,
      plantFlags: ['grow-location:basement', 'season:winter'],
    },
    generalAdvice: 'Check runoff EC and keep below target ranges to prevent salt accumulation.',
    whyGeneralAdviceFails: 'EC meters measure electrical conductivity, which is directly proportional to temperature. Most budget EC meters assume a standard solution temperature of 25C. In a cold basement where feed solution is 14-17C, the meter reads approximately 2-3% lower per degree below 25C — a solution actually at EC 1.5 reads as EC 1.2 on a budget meter in cold conditions.',
    correctAction: 'Use an EC meter with automatic temperature compensation (ATC) — standard on Bluelab Truncheon, Apera EC60. If using a budget meter without ATC: bring all solutions to room temperature (~22-25C) before measuring. Apply the manual correction: add approximately 2% EC per C below 25C to the displayed reading.',
    evidence: 'Bluelab temperature compensation documentation; EC meter calibration science',
    confidence: 'high',
    severity: 'medium',
    blockActions: ['read-ec-from-cold-solution-on-budget-meter-without-temperature-correction'],
    recommendActions: ['use-ec-meter-with-atc', 'bring-solutions-to-room-temp-before-measuring', 'apply-2pct-per-degree-correction'],
    category: 'sensor-artifact',
  },

  // ── SURVIVAL MODE ────────────────────────────────────────────────────

  {
    id: 'aggressive-flush-living-soil-stressed-plant-microbiome-collapse',
    trigger: {
      stage: ['early-veg', 'late-veg', 'transition'],
      recentEvents: ['plant-health:behind-schedule', 'action-taken:flush'],
      withinHours: 48,
      plantFlags: ['medium:living-soil', 'plant-health:stressed'],
    },
    generalAdvice: 'If EC is elevated or nutrients are accumulating, flush with 1.5x pot volume of pH-corrected water.',
    whyGeneralAdviceFails: 'The standard flush recommendation is calibrated for synthetic/coco/hydro systems. In living soil the nutrient delivery is primarily biological — bacteria and fungi process organic matter. These microorganisms are sensitive to sudden osmotic shock. A 1.5x flush in living soil effectively pasteurises the top layer of the microbial community at the worst moment.',
    correctAction: 'In living soil, never flush more than 0.5x pot volume at one time — use "mini-flushes" of plain pH 6.5 water to reduce EC gradually over 2-3 waterings. If the plant is already stressed, prioritise restoring biological activity: aerate the medium, add compost tea or worm casting extract to re-inoculate, reduce light intensity to 60%.',
    evidence: 'BuildASoil living soil watering guide; organic soil biology',
    confidence: 'medium',
    severity: 'high',
    blockActions: ['flush-1.5x-volume-in-living-soil-when-plant-is-stressed'],
    recommendActions: ['mini-flush-max-0.5x-volume', 'add-compost-tea-to-restore-microbial-activity', 'reduce-light-intensity-60pct-during-recovery'],
    category: 'survival',
  },

  {
    id: 'rootbound-mid-flower-do-not-transplant',
    trigger: {
      stage: ['mid-flower'],
      recentEvents: ['rootbound-observed'],
      withinHours: 72,
      plantFlags: [],
    },
    generalAdvice: 'Roots circling the pot is a sign of rootbound stress — transplant into a larger container.',
    whyGeneralAdviceFails: 'Transplanting any plant in mid-flower (weeks 3-6 from flip) is virtually always more damaging than completing the grow in the rootbound state. At mid-flower, the plant is at peak metabolic demand and has all its bud sites actively developing. The 5-10 day transplant recovery period translates directly to reduced bud density.',
    correctAction: 'If rootbound is discovered in mid-flower: do not transplant. Instead: increase watering frequency dramatically (check daily or twice daily), reduce EC by 15-20% to lower the osmotic burden on stressed roots, and consider a single gentle top-dress of worm castings. Complete the grow in the bound state.',
    evidence: 'Transplant shock physiology — practitioner consensus',
    confidence: 'high',
    severity: 'critical',
    blockActions: ['transplant-in-mid-flower'],
    recommendActions: ['complete-grow-in-bound-state', 'increase-watering-frequency', 'reduce-ec-15pct', 'top-dress-worm-castings'],
    category: 'survival',
  },

]);

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * findSupplementalEdgeCases — filter EDGE_CASES_SUPPLEMENTAL by grow context.
 *
 * @param {Object} opts
 * @param {string}   [opts.stage]        current plant stage id
 * @param {string[]} [opts.recentEvents] array of recent event strings
 * @param {string[]} [opts.plantFlags]   array of plant flag strings
 * @param {string}   [opts.category]     filter to a single category
 * @returns {Array} matching edge-case objects, sorted by severity (critical first)
 */
export function findSupplementalEdgeCases({ stage, recentEvents = [], plantFlags = [], category } = {}) {
  const results = EDGE_CASES_SUPPLEMENTAL.filter(ec => {
    if (category && ec.category !== category) return false;

    const stageMatch = !stage || !ec.trigger.stage.length || ec.trigger.stage.includes(stage);
    if (!stageMatch) return false;

    if (ec.trigger.recentEvents && ec.trigger.recentEvents.length > 0) {
      const hasEvent = ec.trigger.recentEvents.some(e => recentEvents.includes(e));
      if (!hasEvent) return false;
    }

    if (ec.trigger.plantFlags && ec.trigger.plantFlags.length > 0) {
      const hasFlag = ec.trigger.plantFlags.some(f => plantFlags.includes(f));
      if (!hasFlag) return false;
    }

    return true;
  });

  results.sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 3;
    const sb = SEVERITY_ORDER[b.severity] ?? 3;
    return sa - sb;
  });

  return results;
}
