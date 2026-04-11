// GrowDoc Companion — Timeline Stage Content
// Practitioner copy for stage/milestone detail panels in the Timeline tab.
// Keys match STAGES[].id and milestones[].id from ./stage-rules.js.
// Voice: Franco — concrete, numbers over platitudes. Soil + LED indoor default.

export const STAGE_CONTENT = {
  'germination': {
    whatsHappening: 'The seed is imbibing water, breaking dormancy, and pushing a taproot down before anything green appears. All energy comes from the cotyledons — no photosynthesis yet. Root direction and moisture are the only things that matter.',
    whatToDo: [
      'Paper towel or direct-to-soil in a 0.3L starter — both work, pick one.',
      'Medium temp 22-25C, RH 70-80%, no direct light until cracked.',
      'Plant taproot down, 1-1.5cm deep, cover lightly, do not pack.',
      'Mist surface, never soak — saturated medium drowns the taproot.',
      'Dome on, vents cracked, one weak CFL or LED at 30% is plenty.',
      'No nutrients, no pH meter theatre — plain dechlorinated water.',
    ],
    whatToWatch: [
      'No sprout by day 7 = likely rotted or dried out, not dormant.',
      'White fuzzy mould on medium = dome humidity too high, vent more.',
      'Helmet head (shell stuck on cotyledons) = mist and peel gently after 1h.',
      'Stem leaning horizontal on emergence = light too far, drop it closer.',
    ],
    commonMistakes: [
      'Soaking seeds longer than 18h — drowns the embryo.',
      'Starting in a 11L final pot — medium stays wet, root rots.',
      'Feeding nutrients to a seed — there is nothing to feed yet.',
      'Opening the paper towel every two hours to check.',
      'Scuffing seeds with sandpaper — unnecessary for fresh genetics.',
    ],
    readyToAdvance: 'Cotyledons fully open above the soil line and stem stands upright on its own.',
    milestones: {
      'taproot': {
        detail: 'Taproot visible means the radicle has broken the shell and is hunting down. In paper towel, transplant when the tail is 3-8mm — longer and you risk snapping it. In soil you never see this, you just wait for the surface to crack.',
        tip: 'Handle the seed by the shell, never the taproot — one touch on the growing tip and it aborts.',
      },
    },
  },

  'seedling': {
    whatsHappening: 'Root mass is expanding fast while the shoot is still tiny — the plant is building infrastructure before it commits to leaves. Cotyledons are feeding everything until the first true leaves can photosynthesize. Overwatering now is the single biggest killer.',
    whatToDo: [
      'Light at 150-250 PPFD, ~50-60cm above canopy for most LEDs.',
      'VPD 0.6-0.9 kPa, air temp 22-26C, RH 65-70%.',
      'Water in a 5-10cm ring around the stem, not on the stem.',
      'Let the starter pot lose real weight before the next watering.',
      'No nutrients for the first 10-14 days in a peat-based mix.',
      'Gentle airflow across (not at) the seedling — stems need the signal.',
    ],
    whatToWatch: [
      'Droopy, dark, shiny leaves = overwatered, back off 2-3 days.',
      'Purple stems with healthy leaves = cold roots, not deficiency.',
      'Stretchy, leggy stem = light too far, drop 10cm and bury stem on transplant.',
      'Yellow cotyledons after true leaves form = normal, ignore.',
      'Pale new growth with green veins = pH drifting high, check runoff.',
    ],
    commonMistakes: [
      'Feeding full-strength nutes at day 7 — burns the root tips.',
      'Humidity dome left on past true leaves — invites damping off.',
      'Watering on a 2-day schedule regardless of pot weight.',
      'Running LED at 80% thinking more light = faster seedling.',
      'Transplanting into a 11L pot before roots fill the starter.',
    ],
    readyToAdvance: 'Three to four sets of true leaves, visible side-branching at lower nodes, and the starter pot feels light within 2 days of watering.',
    milestones: {
      'first-true-leaves': {
        detail: 'First true leaves (serrated, single-blade) mean photosynthesis is now driving growth, not the cotyledons. From here the plant can handle a weak feed (1/4 strength) and slightly higher light. Still not the time to top, train, or transplant aggressively.',
        tip: 'If the first true leaves are smaller than the cotyledons by day 10, check root zone temp — cold roots stall everything.',
      },
    },
  },

  'early-veg': {
    whatsHappening: 'Root-to-shoot ratio is catching up and the plant starts stacking nodes predictably. Internodes are short, leaves are expanding daily, and the plant is prioritizing canopy architecture over mass. This is where training decisions set the ceiling for final yield.',
    whatToDo: [
      'Water when top 2-3cm of soil is dry — finger test beats schedules.',
      'VPD 0.8-1.2 kPa, lean dry side, air temp 23-27C day.',
      'Light 300-450 PPFD, raise when newest leaves show faint light stress.',
      'Quarter to half-strength veg feed if medium is not pre-charged.',
      'Start LST with soft wire once the stem is pliable (not woody).',
      'Transplant into final pot once roots reach the starter wall.',
    ],
    whatToWatch: [
      'Claw tips (downward curl) = nitrogen too high, cut feed 30%.',
      'Yellowing bottom leaves with green veins = Mg/CalMag, not N.',
      'Slow node stacking = light too low or root zone too cold.',
      'Leaves praying hard upward = heat stress, raise light or lower temp.',
      'Dry top, wet bottom on lift test = pot too big for current root mass.',
    ],
    commonMistakes: [
      'Topping before 4-5 true node pairs — stresses without upside.',
      'Defoliating fan leaves to "let light in" at this stage.',
      'Feeding bloom nutes because the label says "veg and bloom".',
      'Running 24/0 lights thinking no dark = more growth.',
      'Upping CO2 at 300 PPFD — waste of gas and money.',
    ],
    readyToAdvance: 'Canopy is filling its footprint, side branches at nodes 3-4 are catching up to the main, and the plant is drinking its water reserve within 2 days.',
    milestones: {
      'topping-window': {
        detail: 'Topping between the 4th and 5th node pair gives you two equal-strength main colas and a clean platform for LST or ScrOG. Earlier is shock without benefit; later means longer recovery. Cut cleanly above the node with sterile snips, no sealing needed.',
        tip: 'Top in the morning, not before lights-off — the plant needs daylight hours to seal and redirect auxins.',
      },
    },
  },

  'late-veg': {
    whatsHappening: 'The plant is laying down the mainframe that will carry flower weight. Stems thicken, internodes widen, and lateral branches demand equal light exposure. Every cm of stretch room you save now is a cm you do not lose to the ceiling in transition.',
    whatToDo: [
      'Light 450-600 PPFD, VPD 1.0-1.3 kPa, day 24-27C.',
      'Full veg feed strength, watch runoff EC weekly in coco.',
      'Weave branches under ScrOG or tie down any tip >2cm above the rest.',
      'Flush once with plain pH-adjusted water if EC climbs above 2.2.',
      'Last heavy defoliation (<20% of fan leaves) 3-5 days before flip.',
      'Stop all foliar sprays 7 days before the 12/12 flip.',
    ],
    whatToWatch: [
      'Dominant apex racing ahead = tie it down, not top it again this late.',
      'Rust-brown spots on mid leaves = Ca lockout, check pH runoff.',
      'Leaves taco-ing midday = VPD too high, bump RH up 5-10%.',
      'Interveinal yellow on new growth = Fe lock at pH >6.8.',
      'Roots circling the surface of the pot = already rootbound, flip now.',
    ],
    commonMistakes: [
      'Flipping before the canopy fills the footprint — wasted light in flower.',
      'Waiting for perfect canopy and stretching into the ceiling.',
      'Heavy defoliation the same day as the flip — double stress.',
      'Switching to bloom nutes 5 days before flip — plant is still in veg.',
      'Transplanting into final pot less than 10 days before flip.',
    ],
    readyToAdvance: 'Canopy fills 90% of the tent footprint, side branches reach within 5cm of the main tops, and the strain has hit its target veg size allowing for 50-100% stretch.',
    milestones: {
      'lst-start': {
        detail: 'If you did not LST in early veg, now is the last clean window. Bend the main down and out to expose lower nodes to direct light. Use soft wire or plant ties, never string through the stem. Expect the branch to curl back up within 24h — retie if needed.',
        tip: 'Bend in the late afternoon when the stem is most pliable — cold morning stems snap.',
      },
      'canopy-fill': {
        detail: 'Canopy filling means all tops are within a 5cm horizontal band and no fan leaf is shading another dominant site. This is the payoff of training: every cola gets equal PPFD in flower. If a hole exists, weave a branch in now, not post-flip.',
        tip: 'Stand directly above the tent and shoot a phone photo — holes jump out that you miss at eye level.',
      },
    },
  },

  'transition': {
    whatsHappening: 'The photoperiod shift triggers a hormonal switch, but the plant still reads as vegetative for 7-14 days. Internodes extend 50-200% depending on genetics (the "stretch"), and the plant doubles down on vertical reach before committing to flowers. Training tolerance drops by the day.',
    whatToDo: [
      'Flip lights to 12/12 with hard dark — zero leaks during dark hours.',
      'Raise the LED to recover target PPFD at the new tallest tip.',
      'Keep veg feed for the first week, then blend toward bloom ratios.',
      'Light supercrop or tie down any runaway cola in the first 7 days.',
      'VPD 1.0-1.3 kPa, drop night temps 3-5C below day.',
      'Add support stakes or netting — stretched stems will flop later.',
    ],
    whatToWatch: [
      'Stretch hitting the light in under a week = sativa-dom, raise light now.',
      'Single banana (nanner) at bud sites = light leak or stress, audit dark period.',
      'Pale new growth = N demand spiked with stretch, bump feed 10%.',
      'One branch towering 10cm above the rest = tie it down today.',
      'No stretch at all by day 7 = check photoperiod timer and dark integrity.',
    ],
    commonMistakes: [
      'Switching to full bloom nutes on flip day — starves the stretch.',
      'Topping or heavy defoliation during stretch — hermie risk spikes.',
      'Leaving the LED at the veg height and cooking the new tops.',
      'Ignoring dark-period leaks from power LEDs or phone screens.',
      'Supercropping after day 10 — stems are lignifying and snap clean.',
    ],
    readyToAdvance: 'Stretch has visibly slowed to under 1cm per day, first white pistils are forming at inter-nodes, and the canopy has stabilized at its final height.',
    milestones: {
      'flip-12-12': {
        detail: 'Flipping to 12/12 is a commitment — the plant will stretch whatever size it is today. Set the timer, verify with a phone stopwatch, and walk the tent in the dark looking for any glow. A single dim LED indicator is enough to cause hermies in sensitive strains.',
        tip: 'Flip at a time when lights-off coincides with your sleep — you will not be tempted to open the tent during dark.',
      },
      'stretch-peak': {
        detail: 'Stretch peak is roughly day 5-10 after flip depending on genetics. Growth rates of 2-4cm/day are normal. This is the last window for tie-downs and supercropping. After peak, stems lignify and breaking them invites infection and hermie pressure.',
        tip: 'Measure the tallest cola to the light daily — if you lose more than 5cm of headroom, it is time to bend, not wait.',
      },
    },
  },

  'early-flower': {
    whatsHappening: 'Stretch is tapering, pistils are multiplying, and the plant is committing energy to bud site architecture. Flower clusters are small but forming in every terminal and node. Nutrient demand is shifting — phosphorus and potassium move up, nitrogen moves down but does not disappear.',
    whatToDo: [
      'Transition to bloom feed over 5-7 days, not cold-turkey.',
      'Light 600-800 PPFD at canopy, VPD 1.0-1.3 kPa.',
      'Defoliate lower larf and fan leaves blocking bud sites.',
      'Install support netting or tomato cages before buds get heavy.',
      'Day temp 24-26C, night 19-21C, RH 50-55%.',
      'Flush lightly if EC creeps above 2.0 in coco runoff.',
    ],
    whatToWatch: [
      'Pistils browning within 5 days of forming = heat stress at the tops.',
      'Yellowing upper fan leaves (not lower) = Mg or CalMag under LED.',
      'Sugar leaves with purple petioles only = cosmetic, ignore.',
      'White powdery dust on fan leaves = PM, drop RH and treat now.',
      'Stretchy bud sites with long internodes = light too low or strain showing sativa lean.',
    ],
    commonMistakes: [
      'Schwazzing (heavy defoliation) under 600 PPFD — starves the plant.',
      'Dropping N completely on day 1 of flower — yellows the canopy early.',
      'Spraying anything on buds — even water invites bud rot.',
      'Raising RH for "better growth" — invites PM and botrytis.',
      'Topping or FIMing now — it is a hermie invitation.',
    ],
    readyToAdvance: 'Every bud site has dense pistil clusters, lower larf has been cleaned, and buds are visibly thickening rather than just lengthening.',
    milestones: {
      'first-pistils': {
        detail: 'First pistils are the confirmation that the photoperiod switch worked and the plant is committed. In feminized seeds you now have 100% certainty of sex. Count days from first visible pistils as "day 1 of flower" for strain-specific flower time tracking.',
        tip: 'If you also see tiny green balls (not pistils) at the same nodes, that is male/hermie — inspect with a loupe before reacting.',
      },
      'bud-sites': {
        detail: 'Bud site formation means terminal and axillary clusters have thickened from individual pistils into visible flower structures. This is the moment to finalize defoliation and netting. Every leaf shading a bud site now costs you weight at harvest.',
        tip: 'Work around the plant slowly with scissors and a head torch — one sweep per plant, stop when you have removed around 15% of fan leaves.',
      },
    },
  },

  'mid-flower': {
    whatsHappening: 'Buds are gaining mass, not size. Trichome production ramps up, stems lignify hard, and water uptake peaks. The plant is running at its metabolic ceiling — any environmental slip now shows up as stalled swelling or reduced terpene loadout.',
    whatToDo: [
      'Light 700-900 PPFD, VPD 1.2-1.5 kPa, day 23-26C.',
      'Full bloom feed, monitor runoff EC weekly, flush if >2.5.',
      'Drop night temp 5-8C below day to tighten internodes and push color.',
      'Second defoliation (day ~21 from flip) if canopy is crowded.',
      'Check every watering — demand spikes 20-40% over early flower.',
      'Start daily canopy and underside leaf checks for PM and mites.',
    ],
    whatToWatch: [
      'Fox-tailing tops = heat or light too close, back off immediately.',
      'Mid-canopy fan leaves yellowing symmetrically = normal N remobilization.',
      'Brown pistils on day 30 without swelling = heat-stressed hermie risk.',
      'Cobweb strands between leaves = spider mites, treat now.',
      'Stalled bud swell with healthy leaves = EC too low, bump feed 10-15%.',
    ],
    commonMistakes: [
      'Chasing ppm numbers while ignoring lift-test watering cadence.',
      'Defoliating every day in small passes — cumulative stress.',
      'Adding bloom boosters (PK spikes) without EC tracking.',
      'Letting RH drift above 60% as buds thicken — bud rot seeded here.',
      'Skipping the underside leaf check because "the tops look fine".',
    ],
    readyToAdvance: 'Buds have filled out between internodes, pistils are 50%+ browning and retracting, and the plant is drinking at full rate without yellowing top leaves prematurely.',
    milestones: {
      'bud-swell': {
        detail: 'Bud swell is when flowers transition from elongating clusters to dense, stacking calyxes. Water demand jumps, and stem lignification peaks. Any branch that needs support must be tied now — waiting until late flower means snapping a cola by accident.',
        tip: 'Bend a branch gently — if it creaks but does not flex, add a tie before it holds 200g of bud.',
      },
      'defol-day21': {
        detail: 'Day 21 defoliation is optional and only appropriate on healthy, leafy, high-light canopies. Target fan leaves blocking bud sites and dead inner larf. Never exceed 20% of fan leaves in one pass. Skip entirely if the plant looks stressed or under 600 PPFD.',
        tip: 'Do it in one sitting, not drip-feed over a week — plants recover better from one clean event than continuous small insults.',
      },
    },
  },

  'late-flower': {
    whatsHappening: 'Bud mass is locking in and secondary metabolites (cannabinoids and terpenes) are stacking. Pistil browning accelerates, calyxes swell, and trichomes shift from clear to cloudy. The plant stops building new infrastructure and runs on stored reserves plus incoming feed.',
    whatToDo: [
      'Drop day temp to 21-24C, nights to 17-19C for terpene expression.',
      'Hold RH at 45-50% — bud rot risk is now at its maximum.',
      'Keep VPD 1.3-1.6 kPa, light at 700-900 PPFD.',
      'Reduce N feed, hold P/K, watch for signs the plant wants to fade.',
      'Inspect every dense cola daily for botrytis browning from inside.',
      'Start weekly trichome checks with a 60x loupe or USB scope.',
    ],
    whatToWatch: [
      'Grey/brown strands deep inside a fat cola = bud rot, cut that cola out now.',
      'Fan leaves fading uniformly = healthy senescence, not deficiency.',
      'Sudden claw on top leaves = N spike from runoff concentration.',
      'Amber dust on sugar leaves = could be early pollen, audit for nanners.',
      'Flat, non-swelling buds despite brown pistils = premature stall, check root zone.',
    ],
    commonMistakes: [
      'Panic-feeding a fading plant back to green — locks in harsh smoke.',
      'Raising RH to "soften" the plant — guarantees bud rot.',
      'Pulling fan leaves off "to help ripening" — they are feeding the buds.',
      'Ignoring daily bud inspection because the canopy looks perfect.',
      'Treating flush claims as science — 3-5 days plain water is plenty.',
    ],
    readyToAdvance: '70% of pistils are browned and retracted, buds are fully swollen, and trichomes are trending from cloudy toward the first amber heads.',
    milestones: {
      'trichome-check': {
        detail: 'Trichome check starts when pistils are 50-60% browned. Use a 60x loupe or USB microscope on a calyx (not a sugar leaf — sugar leaves amber first and lie). Check 3-4 spots per plant, top and mid-canopy, because ripening is not uniform.',
        tip: 'Check at the same time of day each session — trichome colour reads slightly differently under different light.',
      },
      'final-feeding-adjust': {
        detail: 'Pre-harvest flushing shows no proven benefit for cannabinoid or ash content in controlled studies. A reduced feed or plain water in the final 3-5 days is common and harmless. Going 2+ weeks without feed just starves the plant and hurts terpenes.',
        tip: 'If the plant is already fading naturally, do nothing — forcing a flush on a fading plant just accelerates yellow leaf drop.',
      },
    },
  },

  'ripening': {
    whatsHappening: 'Secondary metabolism is at its peak and the plant is converting stored energy into final cannabinoid and terpene load. Trichomes mature from clear to cloudy to amber. Every day now trades a small amount of THC for more CBN and heavier body effect.',
    whatToDo: [
      'Trichome check every 24-48h, same spots, same light.',
      'Hold day temp 20-23C, night 16-19C, RH 45-50%.',
      'Plain water or very light feed only — roots are winding down.',
      'Keep light at full PPFD — do not drop intensity.',
      'Plan the chop: drying space, jars, trimming station, carbon filter.',
      'Photograph colas daily for the logbook — you will want the reference.',
    ],
    whatToWatch: [
      'Calyxes still swelling visibly = wait, not ready regardless of pistil colour.',
      'All-clear trichomes on day 60+ from flip = scope is dirty or strain is late.',
      'Rapid amber shift in 24h = heat spike or end-of-life, harvest now.',
      'Fan leaves suddenly all crispy = root zone dried out, rehydrate carefully.',
      'Musty smell from inside a cola = bud rot, emergency harvest that plant.',
    ],
    commonMistakes: [
      'Harvesting on pistil colour alone without scoping trichomes.',
      'Waiting for 100% amber — you lost the head high two weeks ago.',
      'Chopping in the middle of the light cycle — terpenes are volatilized.',
      'Doing a 48h dark "flush" — unreplicated study, real mould risk.',
      'Hosing the plant with ice water — hermie and lockout risk, zero upside.',
    ],
    readyToAdvance: 'Trichomes show your target ratio (70-80% cloudy, 20-30% amber for balanced effect) and no more calyx swelling over 48h.',
    milestones: {
      'amber-assessment': {
        detail: 'Clear = underripe, harshness and headache. Cloudy = peak THC, head-dominant. Amber = degraded THC to CBN, body-dominant. Aim for 70-80% cloudy with 20-30% amber for balance. Sativa lovers harvest earlier cloudy; indica lovers push more amber.',
        tip: 'Check three different colas (top, mid, lower) — the bottom buds are usually a week behind the canopy.',
      },
      'harvest-decision': {
        detail: 'Once your target trichome ratio is hit, plan to chop within 48h. Harvest just before lights-on for peak terpene and starch retention. Stagger: take the tops first, leave lower buds under light for 5-7 more days to pick up 10-15% additional weight.',
        tip: 'Do not chop, trim, and jar in one day — dry-trim after a full slow dry gives cleaner terpenes every time.',
      },
    },
  },

  'drying': {
    whatsHappening: 'The plant is dead but the chemistry is not. Chlorophyll breaks down, starches convert, and volatile terpenes escape at a rate directly tied to temperature and airflow. Moisture moves from the inside of the bud to the outside — too fast and it locks in hay, too slow and it moulds.',
    whatToDo: [
      'Target 15-18C, 55-65% RH, complete darkness, gentle indirect airflow.',
      'Hang whole branches or small plants upside down; no fan pointed at buds.',
      'Carbon filter running 24/7 — drying smells louder than growing.',
      'Do not trim wet unless you have no choice — dry trim preserves terps.',
      'Plan for 10-14 days — rushing below 7 days is always detectable in smoke.',
      'Weigh one marker branch daily to track moisture loss curve.',
    ],
    whatToWatch: [
      'Outer buds crispy but stems still bendy = humidity too low, raise RH.',
      'Ammonia smell on day 5 = RH too high, increase airflow immediately.',
      'Mould spots on dense colas = too wet and still, chop affected and vent.',
      'Brown, hay-like buds after 7 days = dried too fast or too warm.',
      'Stems still fully flexible at day 12 = slow down and add a week.',
    ],
    commonMistakes: [
      'Drying in a warm, dry attic — done in 3 days, smells like lawn.',
      'Fan pointed directly at hanging buds — dries the outside only.',
      'Light leaks into the dry space — degrades cannabinoids.',
      'Skipping carbon filter thinking the grow is "done" — neighbors disagree.',
      'Jarring before the stems truly snap — classic ammonia cure.',
    ],
    readyToAdvance: 'Small branches snap cleanly instead of folding, outer buds feel dry but not brittle, and daily weight loss has slowed to under 2% per day.',
    milestones: {
      'daily-weight': {
        detail: 'Weigh the same tagged branch daily. In the first 3-4 days you will see 15-25% water loss per day, then it slows. When daily loss drops below 2-3% and stems snap, drying is done. This objective curve beats guessing by feel.',
        tip: 'Use a 0.1g kitchen scale and a taped reference number — do not trust memory between days.',
      },
      'snap-test': {
        detail: 'The snap test: bend a small branch the thickness of a pencil. A clean audible snap means the inside is dry enough to jar; a folding bend means more time. Check 3-4 branches at different canopy positions — density matters.',
        tip: 'Test at the same time each day, out of the drying space, so ambient RH does not fool you.',
      },
    },
  },

  'curing': {
    whatsHappening: 'Inside a sealed jar, residual moisture redistributes from stem to calyx, enzymes finish breaking down chlorophyll and simple sugars, and terpene profile complexity deepens measurably. The first 2-3 weeks do 80% of the transformation; past 8 weeks returns diminish.',
    whatToDo: [
      'Glass mason jars, 70-75% full, one strain per jar, label everything.',
      'Target 58-62% jar RH — 62% Boveda packs are cheap insurance.',
      'Week 1: burp 3x daily for 10 minutes each.',
      'Week 2: burp 1x daily.',
      'Weeks 3-4: burp every 2-3 days.',
      'Store dark, 15-20C, not in the fridge (condensation kills flavor).',
    ],
    whatToWatch: [
      'Ammonia on opening jar = too wet, leave lid off 2-4h and reburp schedule.',
      'Hay smell past week 3 = just patience, keep curing 2-4 more weeks.',
      'Jar RH climbing back to 68%+ after burp = re-dry briefly on parchment.',
      'Jar RH crashing under 55% = overdried, add a 62% pack and reseal.',
      'Visible fuzz on a bud = mould, pull that jar immediately and inspect rest.',
    ],
    commonMistakes: [
      'Stuffing jars 95% full — no air volume for moisture exchange.',
      'Burping for 30 seconds — not long enough for real gas exchange.',
      'Opening a jar in a humid kitchen and sucking in RH.',
      'Calling it "cured" at 14 days — the best weeks are 3-8.',
      'Storing in plastic bags or containers — terpenes leach into plastic.',
    ],
    readyToAdvance: 'Cure quality check at 4 weeks: smell is complex and sweet (not grassy or hay), smoke is smooth, ash is light grey, and jar RH holds steady at 58-62% between burps.',
    milestones: {
      'burp-reduce-1': {
        detail: 'By day 7 the bulk of moisture redistribution is done. Reduce to one burp per day for 5-10 minutes. If ammonia returns at this point, drying was rushed — leave lids cracked for an hour and consider re-drying briefly on parchment.',
        tip: 'Burp at roughly the same time each day so the jar RH reading at the next burp is actually comparable.',
      },
      'burp-reduce-2': {
        detail: 'At day 14, the cure is working on terpene complexity more than moisture. Burp every 2-3 days. Jar RH should be stable at 58-62% between burps. Any spike above 65% means moisture is still hiding inside dense buds.',
        tip: 'Give jars a gentle shake to rotate buds before closing — prevents flat spots on stack-bottom flowers.',
      },
      'cure-check': {
        detail: 'Day 28 is the honest "is it done?" checkpoint. Grind a small sample, roll or pack it, smoke it. Smooth draw, light grey ash, and a complex aroma mean the cure has landed. Harsh, dark ash means more time — cure can run to 8 weeks.',
        tip: 'Write a one-line tasting note in the log each time you sample — future you will use it to calibrate harvest timing on the next run.',
      },
    },
  },

  'done': {
    whatsHappening: 'The run is finished. Task generation is off. This is the window to close the log properly while the details are fresh, so the next grow starts smarter than this one did.',
    whatToDo: [
      'Log final dry weight per plant and per strain.',
      'Tasting note: aroma, smoke smoothness, effect profile, duration.',
      'Photograph the finished cured flower for the strain record.',
      'Write down one thing that worked and one thing to change next run.',
      'Record total days per stage — feed the next grow\'s schedule.',
      'Store remaining flower in sealed jars with 62% packs, dark and cool.',
    ],
    whatToWatch: [
      'Flavor drift after month 2 = storage RH too high or light leak.',
      'Harsh smoke that was smooth at week 4 = jar contamination or re-hydrated.',
      'Color fade on the buds = UV exposure, move to dark storage.',
    ],
    commonMistakes: [
      'Closing the log without writing the post-mortem — lessons evaporate.',
      'Tossing remaining seeds or clones without labeling the mother.',
      'Forgetting to record final yield per watt and per square meter.',
    ],
    readyToAdvance: 'Nothing to advance — this is the terminal state. Start the next run when tent and genetics are ready.',
    milestones: {},
  },
};

/**
 * Lookup helper: get content block for a stage.
 */
export function getStageContent(stageId) {
  return STAGE_CONTENT[stageId] || null;
}

/**
 * Lookup helper: get content for a single milestone inside a stage.
 */
export function getMilestoneContent(stageId, milestoneId) {
  const stage = STAGE_CONTENT[stageId];
  if (!stage || !stage.milestones) return null;
  return stage.milestones[milestoneId] || null;
}
