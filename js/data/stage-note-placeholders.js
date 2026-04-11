// GrowDoc Companion — Timeline "Add note" ghost-text prompts
// Rotating example placeholders that show the grower what a good
// observation note looks like at the current stage (and milestone,
// when one is active). Voice: Franco — terse, concrete, real.
// Keys match STAGES[].id and milestones[].id from ./stage-rules.js.

export const STAGE_NOTE_PLACEHOLDERS = {
  germination: {
    stage: [
      'e.g. soaked 18h in tap water, two seeds cracked, one still hard',
      'e.g. paper towel 24C, checked this morning, taproot 3mm on #1',
      'e.g. planted 5mm deep in moist coco, dome on, no light yet',
      'e.g. day 3, still nothing visible, keeping medium just damp',
      'e.g. helmet head on #2, misted the shell, leaving it alone',
    ],
    milestones: {
      taproot: [
        'e.g. taproot 1cm, planted pointing down, covered lightly',
        'e.g. taproot curled, used tweezers to flip, back in paper towel',
        'e.g. both seeds popped day 2, transferred to 1L pots',
      ],
    },
  },

  seedling: {
    stage: [
      'e.g. first cotyledons open, light at 60cm, no stretch yet',
      'e.g. misted dome twice today, 24C under the canopy, soil still wet',
      'e.g. removed dome this morning, RH in tent holding 65%',
      'e.g. leaves slightly curled down, backed light off another 10cm',
      'e.g. second node forming, watered 50ml ring around stem',
      'e.g. tiny purple on cotyledon edges, temps dropped to 19C last night',
    ],
    milestones: {
      'first-true-leaves': [
        'e.g. first serrated leaves out, 3-finger, healthy dark green',
        'e.g. true leaves showing, started 1/4 strength veg feed',
        'e.g. true leaves small but symmetric, dome off for good',
      ],
    },
  },

  'early-veg': {
    stage: [
      'e.g. topped today above 5th node, clean cut, plant looks happy',
      'e.g. watered 500ml runoff EC 1.4 pH 6.3, soil was light',
      'e.g. moved LED up 5cm, tips were reaching a bit yesterday',
      'e.g. praying leaves all morning, VPD 1.0, no complaints',
      'e.g. lower fan leaves slightly pale, added CalMag to next feed',
      'e.g. 4 nodes, stem still soft, holding off on topping one more week',
    ],
    milestones: {
      'topping-window': [
        'e.g. topped at 5th node pair, two clean scissors, rubbing alcohol first',
        'e.g. waiting one more week, only at 4 nodes, stem too soft',
        'e.g. fimmed instead of topped, aiming for 4 mains not 2',
      ],
    },
  },

  'late-veg': {
    stage: [
      'e.g. LST started, main stem tied at 45 degrees, side shoots waking up',
      'e.g. defoliated 15% of fan leaves, mostly inner shade leaves',
      'e.g. feed EC 1.8 pH 6.4, runoff 1.5, drink cycle every 2 days now',
      'e.g. canopy 30cm wide, filling the 60x60 well, 4 mains even',
      'e.g. transplanted from 5L to 15L fabric, no droop after 4h',
      'e.g. slight tip burn on fastest plant, dropped EC 0.2 next feed',
    ],
    milestones: {
      'lst-start': [
        'e.g. main tied down today, soft wire through pot rim, no cracks',
        'e.g. bent 4 side branches outward, pipe cleaners, nothing snapped',
        'e.g. LST on day 7, already seeing new top growth chase the light',
      ],
      'canopy-fill': [
        'e.g. canopy 80% full, 8 main tops at same height, ready to flip',
        'e.g. one plant lagging behind, moved it closer to center',
        'e.g. tucked fan leaves under, opened up 3 bud sites per branch',
      ],
    },
  },

  transition: {
    stage: [
      'e.g. flipped to 12/12 last night, raised light to 40cm, defolled lightly',
      'e.g. day 5 of stretch, main cola already 10cm taller, no pistils yet',
      'e.g. bumped EC to 2.0, added more P/K, stretch is hungry',
      'e.g. temps 24 day 20 night, VPD 1.2, canopy spreading well',
      'e.g. supercropped two tall branches, knuckled them flat in 48h',
      'e.g. first preflowers at node junctions, female confirmed on both',
    ],
    milestones: {
      'flip-12-12': [
        'e.g. flipped tonight, light off 8pm to 8am, taped up any leaks',
        'e.g. 12/12 day 1, last defol done, moved to bloom feed schedule',
        'e.g. flipped, checked tent for light leaks with phone, all dark',
      ],
      'stretch-peak': [
        'e.g. stretch peaking day 8, 25cm gain so far, light up another 5cm',
        'e.g. tallest cola bent and tied, kept canopy even within 5cm',
        'e.g. stretch slowing, new growth getting tighter, pistils starting',
      ],
    },
  },

  'early-flower': {
    stage: [
      'e.g. pistils everywhere, white and fresh, no pollen sacs spotted',
      'e.g. dropped night temp to 20C, targeting 1.3 VPD at canopy',
      'e.g. runoff EC 1.8 pH 6.5, reading clean, no lockout signs',
      'e.g. defolled inner shade leaves, opened up 12 bud sites',
      'e.g. slight yellowing on oldest fans, expected, not chasing it',
      'e.g. first trichomes on sugar leaves already, resin smell starting',
    ],
    milestones: {
      'first-pistils': [
        'e.g. white pistils at every node, 100% female confirmed',
        'e.g. pistils day 4, counted 14 bud sites on main cola alone',
        'e.g. first pistils showing, smell already shifting from green to sweet',
      ],
      'bud-sites': [
        'e.g. bud sites swelling at every node, no stretch left',
        'e.g. defolled around forming buds, airflow improved',
        'e.g. 20+ bud sites per plant, happy with canopy work',
      ],
    },
  },

  'mid-flower': {
    stage: [
      'e.g. buds swelling fast, main colas fattening, side nugs catching up',
      'e.g. feed EC 2.1 pH 6.4, smaller pours, soil drying in 2 days now',
      'e.g. trichome heads forming on calyxes, still clear, 0% milky',
      'e.g. smell got loud this week, AKF to max, carbon filter still holding',
      'e.g. schwazz day 21, pulled 20% fans, canopy breathing again',
      'e.g. one plant running hotter terps than sibling, tagging as keeper',
    ],
    milestones: {
      'bud-swell': [
        'e.g. day 7 of bud swell, calyxes stacking, colas getting heavy',
        'e.g. supports added under top colas, no bend yet but close',
        'e.g. swell kicking in, dropped N slightly, pushing P/K',
      ],
      'defol-day21': [
        'e.g. defolled ~20% fans, kept sun leaves on the colas themselves',
        'e.g. skipped the schwazz, canopy already open enough',
        'e.g. pulled only inner shade leaves, 10% max, light penetration better',
      ],
    },
  },

  'late-flower': {
    stage: [
      'e.g. 50% milky, 0% amber, still 7-10 days off peak',
      'e.g. fade starting on lowest fans, color working up the plant',
      'e.g. terps peaking, cracking jar smell through the filter',
      'e.g. runoff EC 1.4, dropped feed strength, plain water next',
      'e.g. temps 21 day 17 night, pushing anthocyanin in the purple pheno',
      'e.g. loupe check: mostly milky, hunting for first amber on calyxes',
    ],
    milestones: {
      'trichome-check': [
        'e.g. loupe at 60x, 70% milky 5% amber, another 5 days',
        'e.g. checked 3 spots per cola, consistent milky, no amber yet',
        'e.g. trichomes cloudy on calyxes, sugar leaves already ambering',
      ],
      'final-feeding-adjust': [
        'e.g. dropped to plain water 3 days out, not a real flush',
        'e.g. kept feeding to the end, no evidence flushing helps',
        'e.g. EC 1.0 light feed, soil still has plenty, not starving it',
      ],
    },
  },

  ripening: {
    stage: [
      'e.g. 75% milky 15% amber on main cola, lowers a few days behind',
      'e.g. harvested top third today, lowers get 5 more days',
      'e.g. smell is peak, thick and resinous, no hay notes at all',
      'e.g. loupe check morning and evening, amber moving slowly',
      'e.g. cut light hours by 1h, pushing final ripening',
    ],
    milestones: {
      'amber-assessment': [
        'e.g. calyxes 70% milky 20% amber, sugar leaves 40% amber',
        'e.g. checked 5 colas, range 60-80% milky, staggered harvest plan',
        'e.g. mostly cloudy with scattered amber, peak window now',
      ],
      'harvest-decision': [
        'e.g. chopping tops tomorrow lights-on, lowers get another week',
        'e.g. full plant harvest at dawn, drying tent already prepped',
        'e.g. waiting 3 more days, want 25% amber before the chop',
      ],
    },
  },

  drying: {
    stage: [
      'e.g. hung whole branches, 18C 60% RH, dim light, gentle airflow',
      'e.g. day 3, outer leaves crisp but stems still flex, smell turning',
      'e.g. RH climbing to 65%, cracked the tent zip 5cm, back to 60',
      'e.g. day 6, some small buds ready, main colas need 4 more days',
      'e.g. no hay smell, still dank, slow dry working',
    ],
    milestones: {
      'daily-weight': [
        'e.g. weighed one reference branch, 12% loss day 1 to day 2',
        'e.g. tracking day-over-day, looking for curve to flatten near day 10',
        'e.g. weight down 40% from wet, on track for day 11 jar',
      ],
      'snap-test': [
        'e.g. small stem snaps clean, thicker still bends, 1-2 more days',
        'e.g. snap test passed on medium stems, jarring tomorrow',
        'e.g. snaps but fibrous, borderline, giving it 24h more',
      ],
    },
  },

  curing: {
    stage: [
      'e.g. jars 75% full, hygro at 63%, burped 10min this morning',
      'e.g. week 1 day 4, burping 3x, smell deepening, no ammonia',
      'e.g. one jar at 66% RH, left lid off 30min to drop moisture',
      'e.g. week 3, smell fully dank, chlorophyll gone, properly cured',
      'e.g. dropped Boveda 62 in long-term jar, sealed, stored dark',
    ],
    milestones: {
      'burp-reduce-1': [
        'e.g. week 2, down to 1 burp per day, RH steady 61%',
        'e.g. burping once in the evening now, 5min lid off',
        'e.g. hygros all reading 60-62, cutting to daily burps',
      ],
      'burp-reduce-2': [
        'e.g. every 2 days now, RH locked 61%, smell still improving',
        'e.g. week 3, burps every third day, nothing to adjust',
        'e.g. quick lid pop every 2 days, back in the dark cupboard',
      ],
      'cure-check': [
        'e.g. day 28 taste test, smooth, no crackle, ash light grey',
        'e.g. 4 week check, terps loud, no harshness, calling it done',
        'e.g. cure locked in, moving to long-term storage with Boveda',
      ],
    },
  },
};

/**
 * Return one random placeholder string for the given stage/milestone.
 * Falls back to stage-level suggestions when milestone has no list.
 * Returns empty string if the stage is unknown.
 *
 * @param {string} stageId   - One of the STAGES[].id values.
 * @param {string|null} [milestoneId=null] - Optional milestone id.
 * @returns {string}
 */
export function getRandomPlaceholder(stageId, milestoneId = null) {
  const entry = STAGE_NOTE_PLACEHOLDERS[stageId];
  if (!entry) return '';

  let pool = null;
  if (milestoneId && entry.milestones && Array.isArray(entry.milestones[milestoneId])) {
    const list = entry.milestones[milestoneId];
    if (list.length > 0) pool = list;
  }
  if (!pool) pool = entry.stage;
  if (!Array.isArray(pool) || pool.length === 0) return '';

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
