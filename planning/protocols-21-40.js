// TEMPORARY MERGE FILE: protocols-21-40.js
// These are raw ADVICE_RULES array entries (no wrapping declaration).
// Merge into the main note-context-rules.js ADVICE_RULES array.
// Generated: 2026-04-07

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
      return ctx.plantType === 'clone';
    },
    advice: '(1) DAY 0-1: Fresh cut at 45 degrees, dip in Clonex, insert in moist plug. Humidity dome 75-85% RH. Light: 150-200 PPFD max (dim LED or use CFL). Temp 22-25C/72-77F. Heat mat at 24C helps. NO nutrients. (2) DAY 2-3: Drooping is NORMAL -- no roots yet. Mist inside dome 2-3x daily. Vent dome 30 sec 2x daily. Trim largest fan leaves 50% if severe wilt. (3) DAY 4-5: White callus forming at cut site. Maintain 70-80% RH. Reduce misting to 1-2x daily. Still no nutrients. (4) DAY 6-7: Look for white root tips emerging. Once 2-3 roots at 1-2cm = ready for transplant to small pot. (5) If NO roots by day 7: don\'t panic. Some genetics take 10-14 days. (6) Transplant to 0.5-1 gal pot, light soil + 30% perlite, mycorrhizae at root tips. First nutrients at 25% strength after 3-5 days in new pot.'
  },
  {
    id: 'seedling-first-14-days',
    priority: 9,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'seedling';
    },
    advice: '(1) DAY 0-3: Seed 1-2cm deep in moist medium. 22-26C. No light needed until it breaks surface. (2) DAY 3-7 (cotyledons): Light 200-300 PPFD, 18/6. Water a small ring around seedling only -- NOT the whole pot. ZERO nutrients. (3) DAY 7-14 (first true leaves): Increase to 300-400 PPFD. Begin 1/4 strength nutrients (EC 0.2-0.4). pH 6.2-6.5 soil. (4) STRETCHING: Light too far/dim. Lower LED to 35-45cm, add gentle fan. Mound soil around elongated stem. (5) DAMPING OFF (soft brown stem base): Fatal. Sterilize, start over. Prevention: fresh medium, airflow, don\'t overwater. (6) SLOW GROWTH: Check light (too dim?), temp (too cold?), moisture (too wet?). These 3 cause 90% of slow seedlings.'
  },
  {
    id: 'autoflower-emergency-triage',
    priority: 10,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'autoflower';
    },
    advice: '(1) THE AUTO REALITY: Fixed 60-90 day lifecycle. Every day of stress = permanent yield loss you cannot recover. (2) TRIAGE BY WEEK: Week 1-2 = full recovery possible, act aggressively. Week 3-4 = moderate recovery, fix immediately. Week 5+ = focus on quality not recovery. (3) PRIORITY ORDER: Check roots first (overwatering = #1 auto killer), then pH, then light, then nutrients. (4) STUNTED AUTOS: Do NOT top or heavy-defoliate. LST only. 20/4 light schedule for max DLI. (5) Week 5+: Accept current size. Optimize for quality: 21-24C days, 17-20C nights, 40-50% RH. (6) WHEN TO CUT LOSSES: Under 15cm at week 4+ = negligible yield. Consider starting fresh. (7) Never transplant an auto during flower. Start in final container.'
  },
  {
    id: 'mother-plant-maintenance',
    priority: 7,
    condition: function(ctx, diagId) {
      return ctx.plantType === 'mother';
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
      return ctx.treatment === 'increased-nutes' && (diagId === 'r-nute-burn-mild' || diagId === 'r-nute-burn-severe');
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
  },
