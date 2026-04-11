// GrowDoc Companion — Advisor Microcopy
// Franco-voiced short strings displayed by the task engine and plant doctor
// when guardrail rules fire. IDs are stable and referenced by the rule layer
// in the next wave of edge-case logic. Copy rules:
//   - severity: 'info' | 'warning' | 'urgent'
//   - title <= 35 chars, imperative
//   - body  <= 130 chars, concrete, numbers over adjectives
//   - action <= 50 chars, button label or app instruction
// No emojis, no exclamation marks.

export const ADVISOR_MICROCOPY = Object.freeze({
  // Post-stress warnings
  'post-transplant-nofeed': {
    severity: 'warning',
    title: 'Hold the feed',
    body: 'Roots need 5-7 days to rebuild feeder hairs after transplant. Plain pH-water only until new growth shows.',
    action: 'Skip nutrient task for 5 days',
  },
  'post-topping-notrain': {
    severity: 'warning',
    title: 'No training for 48h',
    body: 'Topped plants are running on stored auxins. Bending or tying now compounds the stall — wait for the first new node.',
    action: 'Defer LST task by 2 days',
  },
  'heat-stress-nofeed': {
    severity: 'warning',
    title: 'Cool before you feed',
    body: 'Leaf temp over 30C shuts stomata and stalls uptake. Drop tent to 24C for 24h before the next feed, or you will burn tips.',
    action: 'Pause feed, log tent temp',
  },
  'recovery-hold-training': {
    severity: 'warning',
    title: 'Recovery mode — no stress',
    body: 'Plant is still catching up from the last event. One stress at a time, or the stall doubles. Training waits.',
    action: 'Block training tasks 3 days',
  },
  'post-defol-light-feed': {
    severity: 'info',
    title: 'Lean feed after defol',
    body: 'You removed 20% of the canopy — transpiration just dropped. Cut EC by 0.3 for two feeds or tips will crisp.',
    action: 'Reduce EC for next 2 feeds',
  },

  // Environmental collisions
  'rh-creep-flower-budrot': {
    severity: 'urgent',
    title: 'RH above 55 in late flower',
    body: 'Dense colas plus warm humid air is how botrytis starts inside the bud. Pull RH to 45-50 and bump extraction one notch.',
    action: 'Adjust dehumidifier setpoint',
  },
  'vpd-drift-hot-night': {
    severity: 'warning',
    title: 'Night VPD too high',
    body: 'Lights-off temp is tracking day temp. DIF under 4C flattens stems and kills anthocyanin expression in the last 2 weeks.',
    action: 'Log night temp, review HVAC',
  },
  'airflow-stalled-trichome': {
    severity: 'warning',
    title: 'Stagnant air in canopy',
    body: 'No leaf movement at bud height means no boundary-layer exchange. Mould and spider mites both love it. Add a clip fan.',
    action: 'Add canopy fan',
  },
  'cold-roots-warm-air': {
    severity: 'warning',
    title: 'Root zone under 18C',
    body: 'Air at 24C but pot is cold — uptake stalls and purple stems show. Lift pots off tile or drop a mat under them.',
    action: 'Insulate pot base',
  },

  // Diagnostic suppression
  'ph-lockout-mimics-deficiency': {
    severity: 'info',
    title: 'Check pH before dosing',
    body: 'Symptoms look like Mg or Fe shortage, but runoff pH is drifting. Dosing now chases a ghost. Fix pH, wait 3 days, re-read.',
    action: 'Run pH test, defer feed',
  },
  'senescence-mimics-n-defic': {
    severity: 'info',
    title: 'Yellowing is on schedule',
    body: 'Week 7+ fade on fan leaves is the plant mobilising N into flower. Feeding now pushes leafy regrowth and dulls terpenes.',
    action: 'Dismiss deficiency flag',
  },
  'light-burn-mimics-nute-burn': {
    severity: 'info',
    title: 'Tips burning from light',
    body: 'Only the top colas show crispy tips and newest leaves taco up. That is PPFD, not EC. Raise the light 5cm before cutting feed.',
    action: 'Adjust light height',
  },
  'cold-purple-mimics-p-defic': {
    severity: 'info',
    title: 'Purple from cold, not P',
    body: 'Stems and petioles purple but leaves stay green — that is anthocyanin from sub-18C nights. Warm the room, skip P boost.',
    action: 'Dismiss P deficiency flag',
  },

  // Stage-advance blockers
  'hermie-signs-no-advance': {
    severity: 'urgent',
    title: 'Hold — hermie signs present',
    body: 'Banana sacs reported in bud sites. Do not advance stage, do not ignore. Inspect every bud site under 10x before any next step.',
    action: 'Block stage advance',
  },
  'recovery-block-advance': {
    severity: 'warning',
    title: 'Plant not ready to flip',
    body: 'You logged stress inside the last 5 days. Flipping now locks in a weak stretch and crooked colas. Give it one more week.',
    action: 'Delay flip 7 days',
  },
  'immaturity-block-flip': {
    severity: 'warning',
    title: 'Too few nodes to flip',
    body: 'Under 5 true nodes means the plant cannot hold its own flower weight. Veg until node 6-7 before 12/12.',
    action: 'Block flip task',
  },
  'undersized-block-transplant': {
    severity: 'info',
    title: 'Roots have not filled pot',
    body: 'Starter still feels heavy two days after watering. Transplanting into wet fresh soil drowns the new root tips.',
    action: 'Defer transplant',
  },

  // Feed / EC corrections
  'overfeed-claw-tips': {
    severity: 'warning',
    title: 'Back off the feed',
    body: 'Dark green clawing leaves plus burnt tips is classic N overshoot. Drop EC 30% and run one plain pH-water between feeds.',
    action: 'Cut EC by 0.3',
  },
  'underfeed-pale-uniform': {
    severity: 'info',
    title: 'Feed is too lean',
    body: 'Uniform pale from bottom up with healthy new growth means the tank is empty. Raise EC by 0.2 and watch for 3 days.',
    action: 'Raise EC by 0.2',
  },
  'ec-crash-runoff-low': {
    severity: 'warning',
    title: 'Runoff EC has collapsed',
    body: 'Runoff reading under 0.8 while input is 1.6 means the medium is stripped. Go to full-strength feed until runoff climbs.',
    action: 'Increase feed strength',
  },
  'ec-stack-runoff-high': {
    severity: 'warning',
    title: 'Salts are stacking',
    body: 'Runoff EC above input by 0.8 — unused salts building in the root zone. Flush 1.5x pot volume with pH 6.3 plain water.',
    action: 'Run flush, then half feed',
  },

  // Pest early-warnings
  'white-dust-pm-early': {
    severity: 'urgent',
    title: 'Powdery mildew spotted',
    body: 'White dust on fan leaves spreads fast when RH creeps. Remove affected leaves in a bag, drop RH to 50, boost airflow today.',
    action: 'Open IPM checklist',
  },
  'webbing-spider-mite': {
    severity: 'urgent',
    title: 'Webbing under leaves',
    body: 'Fine silk at the leaf axils is spider mite, not dust. They double every 3 days at 27C. Isolate, wipe undersides, predators by tomorrow.',
    action: 'Start mite protocol',
  },
  'fungus-gnat-topsoil': {
    severity: 'warning',
    title: 'Gnats at the soil line',
    body: 'Adults flying up when you water means larvae are already chewing feeder roots. Let the top 3cm dry hard, add yellow stickies.',
    action: 'Set sticky traps',
  },
  'leaf-underside-check': {
    severity: 'info',
    title: 'Flip a leaf, then feed',
    body: 'You have not logged an underside inspection in 5 days. Most infestations start there and stay invisible on the topside.',
    action: 'Log pest scout',
  },

  // Hermie watch
  'hermie-post-stress-watch': {
    severity: 'warning',
    title: 'Watch for nanners 7 days',
    body: 'Heat or light-leak stress this week can surface banana sacs by day 7. Inspect every 48h under magnification, especially lower bud sites.',
    action: 'Schedule hermie scout',
  },
  'light-leak-dark-period': {
    severity: 'urgent',
    title: 'Light bleed during dark',
    body: 'Any glow inside the tent at lights-off can trigger intersex in late flower. Kill the source tonight, not tomorrow.',
    action: 'Fix light leak',
  },
  'late-flower-stress-hermie': {
    severity: 'warning',
    title: 'Stress in week 7 risks nanners',
    body: 'Cookie and Chem lineages throw bananas when stressed past day 50. No defoliation, no transplant, no heat spikes from here.',
    action: 'Minimise handling',
  },

  // Cure / dry gotchas
  'cure-ammonia-too-wet': {
    severity: 'urgent',
    title: 'Ammonia in the jar',
    body: 'Sharp ammonia smell means anaerobic bacteria — buds went into the jar too wet. Lids off 12h, re-seal, burp every 6h for 2 days.',
    action: 'Open jars now',
  },
  'cure-hay-smell-patience': {
    severity: 'info',
    title: 'Hay smell — keep curing',
    body: 'Fresh chlorophyll reads as hay for the first 10-14 days. Do not panic-dry. Burp daily and give it the full 4 weeks.',
    action: 'Continue cure',
  },
  'dry-too-fast-crispy': {
    severity: 'warning',
    title: 'Drying too fast',
    body: 'Stems snap on day 5 means terpenes flashed off. Slow it down — raise RH to 62, drop airflow, or the smoke will be harsh.',
    action: 'Raise dry-room RH',
  },
  'jar-rewet-after-seal': {
    severity: 'warning',
    title: 'Jar rewet — stems bent back',
    body: 'Internal moisture migrated out and buds feel spongy again. Lids off 2-4h, close, re-check in 12h. Do not skip the burp.',
    action: 'Burp jars now',
  },
});

/**
 * Lookup helper. Returns the microcopy entry for a given rule id, or
 * undefined if no entry exists. Safe to call with unknown ids.
 *
 * @param {string} id kebab-case rule identifier
 * @returns {{severity: string, title: string, body: string, action: string}|undefined}
 */
export function getMicrocopy(id) {
  if (typeof id !== 'string' || id.length === 0) return undefined;
  return ADVISOR_MICROCOPY[id];
}
