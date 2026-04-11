// GrowDoc Companion — Strain Class Adjustments
// Layered overrides applied on top of STAGE_CONTENT (stage-content.js) when a
// plant has a specific strain classification. Default stage content assumes a
// balanced indoor photoperiod hybrid on soil under LED. These adjustments
// correct the advice only for the stages where a class materially deviates.
//
// Voice: Franco — concrete numbers, no "usually" or "might".
//
// Shape per class:
//   label:       human-readable
//   overrides:   { [stageId]: { replaceWhatToDo?, addWhatToWatch?, hardWarnings?, skipStage?, skipReason? } }
//   globalNotes: class-wide rules that apply outside any single stage

export const STRAIN_CLASS_ADJUSTMENTS = {

  'autoflower': {
    label: 'Autoflower',
    overrides: {
      'germination': {
        replaceWhatToDo: [
          'Germinate directly in the final 7-11L fabric pot, no starter cup.',
          'Plant taproot down 1-1.5cm, cover lightly, do not pack the surface.',
          'Medium temp 22-25C, RH 70-80%, one weak LED at 30% over the spot.',
          'Mist the planting site only, keep the rest of the pot bone dry.',
          'Dome a clear cup over the spot for 3-5 days, vents cracked.',
          'Plain pH 6.3-6.5 water, zero nutrients, zero root stimulants.',
        ],
        hardWarnings: [
          'Never transplant an autoflower — every day in a starter costs yield.',
        ],
      },
      'seedling': {
        replaceWhatToDo: [
          'Light 150-250 PPFD at 50-60cm, 18/6 or 20/4 for the whole run.',
          'Water a 5-10cm ring around the stem only — the outer pot stays dry.',
          'VPD 0.6-0.9 kPa, air temp 22-26C, RH 65-70%.',
          'No nutrients for the first 14-18 days in peat-based mix.',
          'Gentle airflow across the plant, never directly at the seedling.',
          'Zero training, zero topping, zero defoliation before node 5.',
        ],
        addWhatToWatch: [
          'Slow growth before day 21 is normal — do not increase feed to fix it.',
          'Any stunting at this age is permanent — autos do not re-veg.',
        ],
        hardWarnings: [
          'Never top an autoflower before the 5th node — it will not recover in time.',
          'Never transplant — root disturbance is an auto yield killer.',
        ],
      },
      'early-veg': {
        replaceWhatToDo: [
          'Water when top 2-3cm is dry, lift-test the pot before every pour.',
          'VPD 0.8-1.2 kPa, air temp 23-26C, light 300-450 PPFD.',
          'Feed at 30-50% of photoperiod veg strength — autos burn easily.',
          'Start soft LST the moment the main stem bends without creaking.',
          'No topping. Tie the main down instead and expose lower nodes.',
          'Do not repot. Do not up-pot. The pot you germinated in is final.',
        ],
        addWhatToWatch: [
          'First pistils can appear as early as day 21 — watch for them.',
          'Yellowing bottom leaves before day 30 = overfeed, not underfeed.',
        ],
        hardWarnings: [
          'Never top or FIM — recovery time does not exist in an auto timeline.',
          'Never transplant — stalls the plant straight into pre-flower.',
        ],
      },
      'late-veg': {
        skipStage: true,
        skipReason: 'Autoflowers do not have a distinct late-veg phase — they enter pre-flower on an internal clock around day 25-35 from germination.',
      },
      'transition': {
        skipStage: true,
        skipReason: 'Autoflowers flower on an internal clock, not a photoperiod flip. There is no 12/12 transition.',
      },
      'early-flower': {
        replaceWhatToDo: [
          'Keep lights on 18/6 or 20/4 — do not drop to 12/12 ever.',
          'Bloom feed at 40-60% of photoperiod strength, ramp over 7 days.',
          'Light 500-700 PPFD at canopy, VPD 1.0-1.3 kPa.',
          'Defoliate only larf shading bud sites, max 10% of fan leaves.',
          'Day temp 24-26C, night 19-21C, RH 50-55%.',
          'Support weak branches now — auto stems are thinner than photo.',
        ],
        addWhatToWatch: [
          'Pistils may appear mid-veg — that is normal, not early flower proper.',
          'Any claw or tip burn = cut feed 30% immediately, autos do not forgive.',
        ],
        hardWarnings: [
          'Never flip to 12/12 — you will cut yield by 30-50% for zero gain.',
        ],
      },
    },
    globalNotes: [
      'Autoflowers cannot re-veg. Every stress is permanent and compounds in final weight.',
      'Feed schedule runs 30-50% lighter than photoperiod for the entire life cycle.',
      'Photoperiod stays 18/6 or 20/4 from seed to chop — never 12/12.',
      'Total life cycle 65-90 days from germination, set expectations accordingly.',
      'Final pot from day one — root disturbance is the #1 auto yield killer.',
    ],
  },

  'haze-sativa': {
    label: 'Haze Sativa',
    overrides: {
      'late-veg': {
        replaceWhatToDo: [
          'Flip 10-14 days earlier than a hybrid — haze stretches 200-300%.',
          'Light 450-600 PPFD, VPD 1.0-1.3 kPa, day 24-28C.',
          'Full veg feed, watch runoff EC weekly, hazes are heavy eaters.',
          'Aggressive LST or ScrOG — flatten the canopy before the flip.',
          'Top 2-3 times to slow vertical and force lateral branching.',
          'Budget headroom for a 3x height gain post-flip, not 1.5x.',
        ],
        addWhatToWatch: [
          'Any cola 3cm above the net = tie down today, not tomorrow.',
          'Spindly internodes are genetic, not light — do not chase with PPFD.',
        ],
        hardWarnings: [
          'Never flip a haze at 50% canopy fill — it will hit the ceiling by day 14 of stretch.',
        ],
      },
      'transition': {
        replaceWhatToDo: [
          'Flip to 12/12 with hard dark, expect 14-21 days of stretch not 10.',
          'Raise LED aggressively as tops climb — 2-4cm/day is normal.',
          'Hold veg feed for the full stretch, do not shift to bloom early.',
          'Supercrop or tie down runaways daily, not weekly.',
          'VPD 1.0-1.3 kPa, drop night temps 3-5C below day.',
          'Add netting now or stretched stems will flop under bud weight.',
        ],
        addWhatToWatch: [
          'Stretch running past day 21 = normal for pure haze, do not panic.',
          'Whispy, airy initial bud sites = genetic, will fill in mid flower.',
        ],
        hardWarnings: [
          'Never supercrop after stretch day 14 — lignified haze stems shatter.',
        ],
      },
      'mid-flower': {
        replaceWhatToDo: [
          'Light 800-1000 PPFD — hazes take more light than any other class.',
          'Full bloom feed at 110-120% of hybrid strength, monitor runoff EC.',
          'Day 25-27C, night 20-22C — haze tolerates heat better than indica.',
          'VPD 1.2-1.5 kPa, keep airflow high through the open structure.',
          'Skip the day-21 defoliation — haze canopies self-prune.',
          'Expect bud density to lag hybrid schedule by 2-3 weeks.',
        ],
        addWhatToWatch: [
          'Airy, fluffy buds through week 6 are normal — density comes late.',
          'Fox-tailing under 1000 PPFD is strain expression, not stress.',
        ],
      },
      'late-flower': {
        replaceWhatToDo: [
          'Hold full bloom feed — do not taper, haze finishes on full fuel.',
          'Day 22-25C, night 18-20C, RH 45-50%.',
          'VPD 1.3-1.6 kPa, light 800-1000 PPFD unchanged.',
          'Inspect for bud rot weekly — long flower windows compound risk.',
          'Trichome checks start week 10 from flip, not week 7.',
          'Budget 12-16 weeks total flower time, not 8-10.',
        ],
        addWhatToWatch: [
          'Fade at week 9 is premature — bump feed 10-15%, do not flush.',
          'Pistils cycling (browning then re-pushing white) is normal haze behavior.',
        ],
      },
      'ripening': {
        replaceWhatToDo: [
          'Trichome checks every 48h from week 11 — haze ripens unevenly.',
          'Hold day temp 20-23C, night 16-19C, RH 45-50%.',
          'Plain water or very light feed in the final 5-7 days.',
          'Keep light at full PPFD — haze needs photons to the last day.',
          'Stagger harvest: tops first, lowers 7-14 days later.',
          'Expect clear-to-cloudy transition to take 10+ days, not 3.',
        ],
        addWhatToWatch: [
          'Persistent clear trichomes past week 13 = normal, keep waiting.',
          'Amber rushing in 24h = heat spike, check room temps immediately.',
        ],
      },
    },
    globalNotes: [
      'Total flower time 12-16 weeks — ignore any breeder claim under 10.',
      'Stretch hits 200-300% of veg height, plan ceiling accordingly.',
      'Heaviest feeders in the catalogue — run 110-120% of hybrid EC.',
      'Heat tolerance is high (28C day is fine), cold tolerance is low.',
      'Hazes reward patience — early harvest loses the cerebral profile entirely.',
    ],
  },

  'indica-heavy': {
    label: 'Indica Heavy',
    overrides: {
      'late-veg': {
        replaceWhatToDo: [
          'Flip 5-7 days later than a hybrid — indicas stretch only 50-100%.',
          'Light 500-650 PPFD, VPD 1.0-1.3 kPa, day 23-26C.',
          'Veg feed at 85-95% of hybrid strength — indicas eat less.',
          'Skip topping if already bushy, LST instead to open centers.',
          'Defoliate dense inner fans 5 days before flip — airflow matters.',
          'Budget only 30-60cm of post-flip stretch, not 60-120cm.',
        ],
        addWhatToWatch: [
          'Dense apical cluster blocking its own light = defoliate the center.',
          'Short internodes and overlapping fans = spread branches laterally.',
        ],
      },
      'early-flower': {
        replaceWhatToDo: [
          'Transition to bloom feed over 5-7 days, cap at 90% hybrid strength.',
          'Light 600-800 PPFD at canopy, VPD 1.0-1.3 kPa.',
          'Aggressive lower larf removal — dense indica canopies trap humidity.',
          'Install netting or cages before bud weight — branches are short and flop.',
          'Day temp 23-25C, night 18-20C, RH 45-50%.',
          'Schedule a day-14 defoliation on the lower third of the plant.',
        ],
        addWhatToWatch: [
          'Humidity pockets inside the canopy = bud rot seeded here.',
          'Tight node spacing trapping old leaves = pluck them now.',
        ],
        hardWarnings: [
          'Never let RH climb above 55% on dense indica canopies — bud rot is the #1 killer.',
        ],
      },
      'mid-flower': {
        replaceWhatToDo: [
          'Light 700-900 PPFD, VPD 1.2-1.5 kPa, day 22-25C.',
          'Bloom feed at 90% hybrid strength, monitor runoff EC weekly.',
          'Drop night temp 6-10C below day — indicas color hard on DIF.',
          'Second defoliation day 21 — target dense inner cores aggressively.',
          'Daily bud inspection from inside the cola outward.',
          'Support every cola — indica flowers go dense and heavy fast.',
        ],
        addWhatToWatch: [
          'Dense, rock-hard tops are the bud rot risk zone — scout daily.',
          'Purple expression in cool nights is cosmetic, not a deficiency.',
        ],
        hardWarnings: [
          'Never let a dense indica cola sit untouched — rot starts invisible.',
        ],
      },
      'late-flower': {
        replaceWhatToDo: [
          'Drop day temp to 20-23C, nights to 16-19C for color and density.',
          'Hold RH at 40-45% — indica density makes rot certain above 55%.',
          'VPD 1.3-1.6 kPa, light 700-900 PPFD.',
          'Reduce N feed, maintain P/K, allow natural fade.',
          'Cut any cola showing internal browning immediately, do not wait.',
          'Weekly trichome checks — indicas ripen fast in the final 10 days.',
        ],
        addWhatToWatch: [
          'Rot hides under the densest calyxes — probe gently with a fingernail.',
          'Fast pistil browning in final week = strain behavior, not premature.',
        ],
        hardWarnings: [
          'Never raise RH to "soften" flowers — indica density turns that into rot in 48h.',
        ],
      },
    },
    globalNotes: [
      'Total flower time 7-9 weeks — fastest class after fast-flower.',
      'Dense canopy geometry makes bud rot the single biggest failure mode.',
      'Feed at 85-95% of hybrid strength — indicas do not need more.',
      'Cold night temps (16-18C) unlock color and density, not stress.',
      'Short stretch (50-100%) means you can veg 5-7 days longer safely.',
    ],
  },

  'fast-flower': {
    label: 'Fast Flower',
    overrides: {
      'late-veg': {
        replaceWhatToDo: [
          'Flip at 75-80% canopy fill — 7-week finishers stretch less.',
          'Light 450-600 PPFD, VPD 1.0-1.3 kPa, day 23-26C.',
          'Full veg feed, last top or defol 7+ days before flip.',
          'LST only at this stage — no topping closer than 10 days to flip.',
          'Transplant complete 14+ days before flip, not less.',
          'Budget 50-80% stretch, slightly under hybrid average.',
        ],
        addWhatToWatch: [
          'Any stress in the final 10 days of veg costs 3-5 days off yield.',
        ],
      },
      'early-flower': {
        replaceWhatToDo: [
          'Shift to bloom feed over 3-5 days, not 7 — timeline is compressed.',
          'Light 600-800 PPFD at canopy, VPD 1.0-1.3 kPa.',
          'Defoliate lower larf by day 10 — no second chance later.',
          'Install netting before first pistils appear.',
          'Day temp 24-26C, night 19-21C, RH 50-55%.',
          'First pistils usually day 5-7 from flip, not 10-14.',
        ],
        addWhatToWatch: [
          'Pistils showing on day 3-4 = the clock is already running hot.',
        ],
        hardWarnings: [
          'Never defoliate after day 14 of flower — recovery eats your harvest window.',
        ],
      },
      'mid-flower': {
        replaceWhatToDo: [
          'Light 700-900 PPFD, VPD 1.2-1.5 kPa, day 23-26C.',
          'Full bloom feed, peak EC by day 21 from flip.',
          'Drop night temp 5-8C for color and terps.',
          'Skip the day-21 defoliation — there is no recovery budget.',
          'Check water demand every 24h, it spikes fast in fast-flower.',
          'Start trichome checks at week 5 from flip, not week 7.',
        ],
        addWhatToWatch: [
          'Bud swell starts 5-7 days earlier than hybrid schedule.',
        ],
      },
      'late-flower': {
        replaceWhatToDo: [
          'Drop day temp to 21-24C, nights to 17-19C by week 5 from flip.',
          'Hold RH at 45-50%, watch for rot as buds densify fast.',
          'VPD 1.3-1.6 kPa, light 700-900 PPFD.',
          'Taper N slightly, hold P/K, plan harvest by week 7 from flip.',
          'Daily trichome checks from week 6 onward.',
          'Prep dry room and jars — chop window closes fast.',
        ],
        addWhatToWatch: [
          'Week 7 and still milky? You are on schedule, not late.',
        ],
      },
      'ripening': {
        replaceWhatToDo: [
          'Trichome check every 24h from day 45 of flower.',
          'Hold day temp 20-23C, night 16-19C, RH 45-50%.',
          'Plain water or very light feed in the final 3-5 days.',
          'Do not stagger harvest long — whole plant in 48-72h window.',
          'Chop just before lights-on for peak terpene load.',
          'Target 70-80% cloudy, 20-30% amber — same as hybrid.',
        ],
        addWhatToWatch: [
          'Rapid amber shift after day 50 = finish now, window is 24h.',
        ],
      },
    },
    globalNotes: [
      'Total flower time 7-8 weeks — no breeder claim of 6 weeks is real.',
      'No recovery budget — any stress in flower locks into final weight.',
      'Compress every defoliation and training decision into the veg window.',
      'Stretch runs 50-80%, below hybrid average.',
      'The clock is the enemy — decisions made on schedule, not instinct.',
    ],
  },

  'high-cbd': {
    label: 'High CBD',
    overrides: {
      'early-veg': {
        replaceWhatToDo: [
          'Water when top 2-3cm is dry, lean dry side — CBD plants drink less.',
          'VPD 0.8-1.2 kPa, day 22-25C, light 300-400 PPFD.',
          'Quarter-strength feed — high-CBD genetics burn easily.',
          'Soft LST only, no topping — apical dominance is weak already.',
          'Transplant on time, do not delay into a rootbound pot.',
          'Skip ScrOG — CBD plants rarely justify the complexity.',
        ],
        addWhatToWatch: [
          'Yellow tips at 50% feed strength = cut to 30%, CBD lines are sensitive.',
          'Slow stacking is strain expression, not a deficiency.',
        ],
        hardWarnings: [
          'Never top a high-CBD plant — main cola is already weak, topping loses it entirely.',
        ],
      },
      'late-veg': {
        replaceWhatToDo: [
          'Flip at hybrid timing, 75-85% canopy fill.',
          'Light 450-550 PPFD, VPD 1.0-1.3 kPa, day 23-26C.',
          'Veg feed at 60-75% hybrid strength, track runoff EC.',
          'LST to open the center, no heavy defoliation.',
          'Support weak branches pre-flip — CBD stems are thinner.',
          'Budget 75-125% stretch depending on CBD:THC ratio.',
        ],
        addWhatToWatch: [
          'Floppy branches before flower = stake them now.',
        ],
      },
      'late-flower': {
        replaceWhatToDo: [
          'Drop day temp to 21-24C, nights to 17-19C.',
          'Hold RH at 45-50%, VPD 1.3-1.6 kPa.',
          'Light 600-800 PPFD — CBD strains do not gain above 900.',
          'Feed at 70% hybrid strength, no bloom boosters.',
          'Daily bud rot inspection — some CBD lines are mold-prone.',
          'Harvest window driven by CBD peak, not THC — check lab data if available.',
        ],
        addWhatToWatch: [
          'Pistils browning early = normal, CBD expression peaks before THC.',
        ],
      },
      'ripening': {
        replaceWhatToDo: [
          'Harvest at 60-70% cloudy, 10% amber max — CBD degrades to CBN too.',
          'Day temp 20-23C, night 16-19C, RH 45-50%.',
          'Plain water only in final 5 days.',
          'Keep light at full PPFD through harvest day.',
          'Chop just before lights-on for peak terpene retention.',
          'Log CBD:THC ratio from any lab test for next-run harvest timing.',
        ],
        addWhatToWatch: [
          'Waiting for heavy amber on a CBD plant degrades both cannabinoids.',
        ],
        hardWarnings: [
          'Never push past 20% amber — CBD drops harder than THC past peak.',
        ],
      },
    },
    globalNotes: [
      'High-CBD genetics feed at 60-75% of hybrid THC strength.',
      'Training ceiling is lower — skip topping, minimize defoliation.',
      'Harvest window is earlier and narrower than THC-dominant strains.',
      'Structure is often weak, stake and support from late veg onward.',
      'Lab testing for CBD:THC ratio is the only reliable harvest indicator.',
    ],
  },

  'landrace-sativa': {
    label: 'Landrace Sativa',
    overrides: {
      'early-veg': {
        replaceWhatToDo: [
          'Water when top 3-4cm is dry, landraces prefer real dry-back.',
          'VPD 0.9-1.3 kPa, day 24-28C, light 300-400 PPFD.',
          'Feed at 40-60% hybrid strength — landraces are lean feeders.',
          'Top once at node 5-6 to fight extreme apical dominance.',
          'LST hard and early — natural structure is rangy and vertical.',
          'Plain pH 6.3-6.8 soil, skip aggressive amendments.',
        ],
        addWhatToWatch: [
          'Leaves 2-3x longer than hybrid siblings = normal sativa morphology.',
          'Pale green baseline is genetic, not a nitrogen deficiency.',
        ],
      },
      'late-veg': {
        replaceWhatToDo: [
          'Flip 14-21 days earlier than hybrid — stretch hits 250-400%.',
          'Light 400-550 PPFD, VPD 1.0-1.3 kPa, day 24-28C.',
          'Veg feed at 50-70% hybrid strength, runoff EC under 1.5.',
          'Multiple tops and aggressive ScrOG — flatten relentlessly.',
          'Transplant complete 14+ days pre-flip, final pot 15L+.',
          'Budget 3-4x vertical height, not 2x — measure ceiling honestly.',
        ],
        addWhatToWatch: [
          'Growth that looks "out of control" is baseline for the class.',
        ],
        hardWarnings: [
          'Never flip a landrace sativa in a tent under 180cm — they will break the light.',
        ],
      },
      'transition': {
        replaceWhatToDo: [
          'Flip to 12/12 with hard dark, expect 21-28 days of stretch.',
          'Raise LED daily — 3-5cm/day of vertical is normal.',
          'Hold veg feed at 60% strength through entire stretch.',
          'Tie down or supercrop runaway colas every 48h.',
          'VPD 1.0-1.3 kPa, night temps 4-6C below day.',
          'Netting is mandatory — unsupported colas will snap under own weight.',
        ],
        addWhatToWatch: [
          'Stretch continuing past day 21 is the class average.',
          'Airy, whispy initial structure is genetic and fills slowly.',
        ],
        hardWarnings: [
          'Never supercrop after stretch day 14 — stems lignify fast.',
        ],
      },
      'mid-flower': {
        replaceWhatToDo: [
          'Light 700-900 PPFD, VPD 1.2-1.5 kPa, day 24-27C.',
          'Bloom feed at 60-75% hybrid strength — landraces do not eat hard.',
          'Skip day-21 defoliation — landrace canopies stay open naturally.',
          'Night temp 18-22C, avoid cold dips below 16C.',
          'Check water demand every 48h, lower than hybrid.',
          'Expect bud density 60-70% of hybrid even at peak.',
        ],
        addWhatToWatch: [
          'Low EC runoff is correct — do not chase hybrid numbers.',
          'Airy buds at week 6 are permanent, not a density lag.',
        ],
      },
      'late-flower': {
        replaceWhatToDo: [
          'Day 22-26C, night 18-22C — tropical lines hate cold nights.',
          'RH 45-55%, VPD 1.3-1.6 kPa.',
          'Light 700-900 PPFD, hold to the end.',
          'Feed at 60% hybrid strength, no boosters, no flushing theatre.',
          'Trichome checks start week 10-12 from flip, not week 7.',
          'Budget 14-18 weeks total flower, confirm from landrace source notes.',
        ],
        addWhatToWatch: [
          'Premature fade = bump feed 10%, landraces dislike running empty.',
          'Persistent clear trichomes past week 12 is strain behavior.',
        ],
      },
      'ripening': {
        replaceWhatToDo: [
          'Trichome checks every 48h from week 12 from flip.',
          'Day 20-23C, night 17-20C, RH 45-55%.',
          'Plain water in final 5-7 days, no feed drops earlier.',
          'Keep light at full PPFD — landraces photosynthesize to the end.',
          'Stagger harvest over 10-14 days — ripening is uneven by design.',
          'Target 60-70% cloudy with minimal amber for cerebral profile.',
        ],
        addWhatToWatch: [
          'Amber arrives slow — do not rush, landraces reward patience.',
        ],
      },
    },
    globalNotes: [
      'Total flower time 14-18 weeks — any source under 12 is not true landrace.',
      'Stretch hits 250-400%, the most extreme of any class.',
      'Feed at 50-70% hybrid strength for the entire run.',
      'Cold nights (<16C) hurt tropical lines, unlike indicas.',
      'Preserve genetics: save pollen or clones, landraces are irreplaceable.',
      'Buds stay airy by design — judge on aroma and effect, not density.',
    ],
  },

};

/**
 * Lookup helper: get the adjustment block for a specific class + stage.
 * Returns null when the class does not override that stage (caller should
 * fall back to default STAGE_CONTENT).
 *
 * @param {string} strainClass - one of STRAIN_CLASS_ADJUSTMENTS keys
 * @param {string} stageId     - one of STAGES[].id from stage-rules.js
 * @returns {object|null}
 */
export function getStrainClassAdjustments(strainClass, stageId) {
  if (!strainClass || !stageId) return null;
  const entry = STRAIN_CLASS_ADJUSTMENTS[strainClass];
  if (!entry || !entry.overrides) return null;
  return entry.overrides[stageId] || null;
}

/**
 * Lookup helper: get the full class entry (label, overrides map, globalNotes).
 *
 * @param {string} strainClass
 * @returns {object|null}
 */
export function getStrainClass(strainClass) {
  return STRAIN_CLASS_ADJUSTMENTS[strainClass] || null;
}
