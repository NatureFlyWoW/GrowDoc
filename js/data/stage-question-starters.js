// GrowDoc Companion — Stage Question Starters
//
// Tap-to-fill question suggestions shown in the Timeline panel "Ask question"
// input. Each entry carries 1-3 taxonomy keywords (drawn from
// note-contextualizer/rules-keywords.js where possible) so the advice engine
// can pre-filter relevant rules when the grower taps a starter.
//
// Stage IDs and milestone IDs are kept in sync with `stage-rules.js`.
// Voice: Franco — the questions a real grower types at 11pm staring at the
// tent. Conversational but specific. No FAQ clichés.

export const STAGE_QUESTION_STARTERS = {
  germination: {
    stage: [
      { text: 'Taproot still not showing after 4 days — is it dead?', keywords: ['timeline', 'diagnosis'] },
      { text: 'Should I plant the seed taproot up or down?', keywords: ['seed', 'technique'] },
      { text: 'How wet should the paper towel actually be?', keywords: ['watering', 'technique'] },
      { text: 'Is it safe to crack a stubborn shell by hand?', keywords: ['seed', 'intervention'] },
      { text: 'Humidity dome on or off right now?', keywords: ['environment', 'rh'] },
    ],
    milestones: {
      taproot: [
        { text: 'Taproot is out — how deep do I plant it?', keywords: ['seed', 'technique'] },
        { text: 'Should I pre-water the soil before dropping it in?', keywords: ['watering', 'technique'] },
        { text: 'Roots look brown already — normal or rot?', keywords: ['root', 'diagnosis'] },
      ],
    },
  },

  seedling: {
    stage: [
      { text: 'Stem is long and leaning — is this stretch or a problem?', keywords: ['environment', 'phenotype'] },
      { text: 'Cotyledons yellowing at day 8 — should I worry?', keywords: ['diagnosis', 'health'] },
      { text: 'How close can my LED actually be right now?', keywords: ['environment', 'lighting'] },
      { text: 'Dome off yet or leave it another few days?', keywords: ['environment', 'rh'] },
      { text: 'First feed — when and how weak?', keywords: ['nutrients', 'timeline'] },
      { text: 'Leaf tips curling down on a seedling — why?', keywords: ['diagnosis', 'health'] },
    ],
    milestones: {
      'first-true-leaves': [
        { text: 'First true leaves are in — time to raise the light?', keywords: ['environment', 'lighting'] },
        { text: 'Can I start a very light feed now?', keywords: ['nutrients', 'timing'] },
        { text: 'Should I transplant up or wait for more nodes?', keywords: ['transplant', 'timing'] },
      ],
    },
  },

  'early-veg': {
    stage: [
      { text: 'When should I top this plant?', keywords: ['topping', 'training-decision'] },
      { text: 'Is this yellowing normal or a deficiency?', keywords: ['health', 'diagnosis'] },
      { text: 'Can I transplant now or should I wait?', keywords: ['transplant', 'timing'] },
      { text: 'Leaves clawing down — nitrogen toxicity?', keywords: ['diagnosis', 'nutrients'] },
      { text: 'How do I read runoff pH for the first time?', keywords: ['ph', 'diagnosis'] },
      { text: 'Internodes too long — is my light too weak?', keywords: ['environment', 'lighting'] },
    ],
    milestones: {
      'topping-window': [
        { text: 'Am I at the right node count to top?', keywords: ['topping'] },
        { text: 'Should I FIM instead of topping here?', keywords: ['topping', 'fim'] },
        { text: 'Top once or go straight to mainline?', keywords: ['topping', 'training-decision'] },
      ],
    },
  },

  'late-veg': {
    stage: [
      { text: 'How long until she is ready to flip?', keywords: ['timeline', 'flip'] },
      { text: 'Canopy is uneven — LST or defoliate first?', keywords: ['training-decision', 'defoliation'] },
      { text: 'Is my feed strength right for late veg?', keywords: ['nutrients', 'ec'] },
      { text: 'Should I flush before flipping to 12/12?', keywords: ['watering', 'flip'] },
      { text: 'How many bud sites do I actually need before flip?', keywords: ['training-decision', 'flip'] },
      { text: 'Spots on older fan leaves — cal-mag or pH?', keywords: ['diagnosis', 'nutrients'] },
    ],
    milestones: {
      'lst-start': [
        { text: 'Stems feel stiff — am I too late to bend?', keywords: ['training-decision', 'lst'] },
        { text: 'How hard can I bend without snapping the main?', keywords: ['lst', 'technique'] },
        { text: 'Tie-downs or soft wire — what holds better?', keywords: ['lst', 'technique'] },
      ],
      'canopy-fill': [
        { text: 'Canopy is full — flip now or give it a week?', keywords: ['flip', 'timing'] },
        { text: 'Should I defoliate before the flip?', keywords: ['defoliation', 'flip'] },
        { text: 'Is a ScrOG still worth installing this late?', keywords: ['training-decision', 'scrog'] },
      ],
    },
  },

  transition: {
    stage: [
      { text: 'How much stretch should I expect from this strain?', keywords: ['phenotype', 'timeline'] },
      { text: 'Light up or leave it during the stretch?', keywords: ['lighting', 'environment'] },
      { text: 'Should I still be feeding veg nutes right now?', keywords: ['nutrients', 'flip'] },
      { text: 'VPD target for the stretch — same as veg?', keywords: ['environment', 'vpd'] },
      { text: 'Can I still bend branches during transition?', keywords: ['lst', 'training-decision'] },
    ],
    milestones: {
      'flip-12-12': [
        { text: 'Just flipped — when will I see the first pistils?', keywords: ['timeline', 'flower'] },
        { text: 'Do I switch to bloom nutes immediately?', keywords: ['nutrients', 'flip'] },
        { text: 'Dark period — how strict does it need to be?', keywords: ['environment', 'light-leak'] },
      ],
      'stretch-peak': [
        { text: 'How much more vertical growth should I plan for?', keywords: ['phenotype', 'timeline'] },
        { text: 'Tallest cola is 10cm from the light — raise or tie down?', keywords: ['lighting', 'lst'] },
        { text: 'Is it too late to super-crop a runaway branch?', keywords: ['training-decision', 'super-crop'] },
      ],
    },
  },

  'early-flower': {
    stage: [
      { text: 'Are these pistils normal for week 2?', keywords: ['flower', 'diagnosis'] },
      { text: 'Defoliate now or wait for mid-flower?', keywords: ['defoliation', 'timing'] },
      { text: 'Feed schedule for early flower — bump P and K yet?', keywords: ['nutrients', 'flower'] },
      { text: 'How do I spot an early hermie in bud sites?', keywords: ['hermie', 'diagnosis'] },
      { text: 'Tips are burning — too hot a feed for bloom?', keywords: ['nutrients', 'diagnosis'] },
      { text: 'RH is still veg-high — drop it now?', keywords: ['environment', 'rh'] },
    ],
    milestones: {
      'first-pistils': [
        { text: 'Pistils showing — is that the real flower day 1?', keywords: ['flower', 'timeline'] },
        { text: 'Still getting vertical stretch — normal at this point?', keywords: ['phenotype', 'timeline'] },
        { text: 'Switch to bloom feed now or give it a few more days?', keywords: ['nutrients', 'flower'] },
      ],
      'bud-sites': [
        { text: 'Bud sites look sparse — too many fan leaves?', keywords: ['defoliation', 'diagnosis'] },
        { text: 'Should I lollipop the bottom growth now?', keywords: ['defoliation', 'lollipop'] },
        { text: 'Is one pistil site always going to be a main cola?', keywords: ['flower', 'phenotype'] },
      ],
    },
  },

  'mid-flower': {
    stage: [
      { text: 'Day-21 defoliation — how aggressive should I go?', keywords: ['defoliation', 'technique'] },
      { text: 'Buds feel airy — is it heat or genetics?', keywords: ['airy-buds', 'diagnosis'] },
      { text: 'Fan leaves yellowing mid-canopy — cal-mag again?', keywords: ['diagnosis', 'nutrients'] },
      { text: 'Can I raise the light now that stretch is done?', keywords: ['lighting', 'environment'] },
      { text: 'Weekly EC bump or hold steady through bulk?', keywords: ['nutrients', 'ec'] },
      { text: 'Smelling foxtails starting — stress or strain?', keywords: ['foxtail', 'diagnosis'] },
    ],
    milestones: {
      'bud-swell': [
        { text: 'Buds are swelling — what feed pushes size without burn?', keywords: ['nutrients', 'flower'] },
        { text: 'Defoliate again to open up the lowers?', keywords: ['defoliation', 'timing'] },
        { text: 'Drop night temps for density — how much?', keywords: ['environment', 'temperature'] },
      ],
      'defol-day21': [
        { text: 'How many fan leaves can I actually pull today?', keywords: ['defoliation', 'technique'] },
        { text: 'Leave the sugar-covered stuff or strip it too?', keywords: ['defoliation', 'technique'] },
        { text: 'Is my light strong enough for a heavy schwazz?', keywords: ['defoliation', 'lighting'] },
      ],
    },
  },

  'late-flower': {
    stage: [
      { text: 'Am I seeing amber already or is that dead pistil?', keywords: ['trichome', 'diagnosis'] },
      { text: 'How many weeks of feed do I have left?', keywords: ['nutrients', 'timeline'] },
      { text: 'Dropping night temps for color — worth the risk?', keywords: ['environment', 'temperature'] },
      { text: 'Lower buds are tiny — cut them loose or let them finish?', keywords: ['harvest-decision', 'airy-buds'] },
      { text: 'RH creeping up — bud rot risk this late?', keywords: ['environment', 'mold'] },
      { text: 'Best way to boost terps in the final two weeks?', keywords: ['terpenes', 'environment'] },
    ],
    milestones: {
      'trichome-check': [
        { text: 'How do I tell cloudy from clear on my scope?', keywords: ['trichome', 'diagnosis'] },
        { text: 'Should I check calyxes or sugar leaves?', keywords: ['trichome', 'technique'] },
        { text: 'Trichomes are mostly clear at week 7 — behind schedule?', keywords: ['trichome', 'timeline'] },
      ],
      'final-feeding-adjust': [
        { text: 'Plain water the last week or keep feeding light?', keywords: ['nutrients', 'flush'] },
        { text: 'Is a flush actually going to change the smoke?', keywords: ['flush', 'terpenes'] },
        { text: 'Fade is not happening — feeding too hard?', keywords: ['nutrients', 'diagnosis'] },
      ],
    },
  },

  ripening: {
    stage: [
      { text: 'What amber percentage gives me the body effect?', keywords: ['trichome', 'terpenes'] },
      { text: 'Some colas are ahead of others — chop in stages?', keywords: ['harvest-decision', 'technique'] },
      { text: 'How many hours of dark before the chop?', keywords: ['harvest-decision', 'technique'] },
      { text: 'Should I stop all water the day before harvest?', keywords: ['watering', 'harvest-decision'] },
      { text: 'Pistils all brown but trichomes still clear — keep waiting?', keywords: ['trichome', 'diagnosis'] },
    ],
    milestones: {
      'amber-assessment': [
        { text: 'What ratio of milky to amber am I actually aiming for?', keywords: ['trichome', 'harvest-decision'] },
        { text: 'Trichomes foxtailing — heat stress or finishing?', keywords: ['foxtail', 'diagnosis'] },
        { text: 'Scope vs loupe — which reading do I trust?', keywords: ['trichome', 'technique'] },
      ],
      'harvest-decision': [
        { text: 'Chop tops now, lowers next week — how much gain?', keywords: ['harvest-decision', 'technique'] },
        { text: 'Cut just before lights-on — still the rule?', keywords: ['harvest-decision', 'timing'] },
        { text: 'Wet trim or dry trim for this batch?', keywords: ['harvest-decision', 'trim'] },
      ],
    },
  },

  drying: {
    stage: [
      { text: 'Is 18C too cold or am I in the terpene sweet spot?', keywords: ['drying', 'environment'] },
      { text: 'RH sitting at 70% — dial the fan up or leave it?', keywords: ['drying', 'rh'] },
      { text: 'Buds feel dry outside but stems still bend — done?', keywords: ['drying', 'diagnosis'] },
      { text: 'Can I run the carbon filter in the drying space?', keywords: ['stealth', 'drying'] },
      { text: 'Smelling hay on day 4 — did I mess up?', keywords: ['drying', 'diagnosis'] },
    ],
    milestones: {
      'daily-weight': [
        { text: 'Weight dropped 20% on day 2 — too fast?', keywords: ['drying', 'diagnosis'] },
        { text: 'What total weight loss am I aiming for?', keywords: ['drying', 'technique'] },
        { text: 'Weight is stalling — bump temp or wait?', keywords: ['drying', 'environment'] },
      ],
      'snap-test': [
        { text: 'Small stem snapped — do the main stems have to too?', keywords: ['drying', 'technique'] },
        { text: 'Snap is half-and-half — jar now or one more day?', keywords: ['drying', 'harvest-decision'] },
        { text: 'Outside crunchy, inside still wet — how do I fix it?', keywords: ['drying', 'diagnosis'] },
      ],
    },
  },

  curing: {
    stage: [
      { text: 'Still smelling hay at day 5 — is this a bad cure?', keywords: ['curing', 'diagnosis'] },
      { text: 'Jar RH is 68% — leave the lid off how long?', keywords: ['curing', 'rh'] },
      { text: 'Ammonia smell on the first burp — panic or normal?', keywords: ['curing', 'diagnosis'] },
      { text: 'When can I actually trust the smoke test?', keywords: ['curing', 'timing'] },
      { text: 'Boveda packs yet or let it breathe longer?', keywords: ['curing', 'rh'] },
    ],
    milestones: {
      'burp-reduce-1': [
        { text: 'Week 1 done — is once-a-day really enough now?', keywords: ['curing', 'technique'] },
        { text: 'Jar RH 64% — safe to drop to single burps?', keywords: ['curing', 'rh'] },
        { text: 'Smell is still grassy — hold longer at 3x?', keywords: ['curing', 'diagnosis'] },
      ],
      'burp-reduce-2': [
        { text: 'Two weeks in — when does the real terp pop show up?', keywords: ['curing', 'terpenes'] },
        { text: 'Safe to add Boveda now or wait another week?', keywords: ['curing', 'rh'] },
        { text: 'Is every-3-days enough or am I going too slow?', keywords: ['curing', 'technique'] },
      ],
      'cure-check': [
        { text: 'Four weeks done — is this as good as it gets?', keywords: ['curing', 'terpenes'] },
        { text: 'How do I tell a long-cure strain from a done one?', keywords: ['curing', 'phenotype'] },
        { text: 'Best way to store the keepers long-term?', keywords: ['curing', 'storage'] },
      ],
    },
  },
};

/**
 * Get the merged list of question starters for a stage + optional milestone.
 * Milestone-specific questions come first, then stage-level.
 *
 * @param {string} stageId - Stage ID from STAGES (e.g. 'mid-flower')
 * @param {string|null} [milestoneId=null] - Optional milestone ID
 * @returns {Array} merged starters [{text, keywords}]
 */
export function getQuestionStarters(stageId, milestoneId = null) {
  const entry = STAGE_QUESTION_STARTERS[stageId];
  if (!entry) return [];
  const stageQs = Array.isArray(entry.stage) ? entry.stage.slice() : [];
  if (!milestoneId || !entry.milestones) return stageQs;
  const milestoneQs = entry.milestones[milestoneId];
  if (!Array.isArray(milestoneQs)) return stageQs;
  return [...milestoneQs, ...stageQs];
}
