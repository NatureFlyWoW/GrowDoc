// GrowDoc — Stage Deep-Dive Articles
// Long-form explanatory content for growers who understand the basics
// and want to understand the WHY behind stage-specific recommendations.
// Voice: Technical writer — authoritative, research-informed, accessible.
// Keys match STAGES[].id from ./stage-rules.js (excludes 'done').

export const STAGE_DEEP_DIVES = {
  'germination': {
    title: 'Germination: Awakening the Seed',
    subtitle: 'Why water potential, temperature, and oxygen matter before the first leaf emerges',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Germination is not simply "waiting for a sprout." It is a tightly orchestrated cascade of metabolic events triggered by water uptake. The seed begins with a water potential so low (around −50 MPa) that moisture rushes in by osmosis — a process called imbibition. This water rehydrates enzymes and activates the embryo\'s respiration. The taproot emerges not because the plant is ready to grow above ground, but because the embryo must establish a water supply before anything else happens. Understanding this distinction matters because it explains why seedlings fail: most are killed by either too much water (anaerobic conditions that halt respiration) or too little (hydration stops halfway).',
      },
      {
        type: 'heading',
        text: 'Temperature and Enzyme Activity',
      },
      {
        type: 'paragraph',
        text: 'Cannabis seeds require 22–26°C to complete germination efficiently. This range is not arbitrary — it reflects the temperature optimum for the enzymes that drive growth. Below 20°C, enzyme activity slows drastically and dormancy deepens. Above 28°C, you increase the risk of pathogenic mold colonisation without accelerating germination enough to justify the risk. The germination window typically closes by day 7 if nothing has emerged; at that point you are likely dealing with a non-viable seed or one trapped in deep dormancy.',
      },
      {
        type: 'heading',
        text: 'Oxygen, Mold, and the Dome Trade-off',
      },
      {
        type: 'paragraph',
        text: 'The embryo respires aerobically even inside the seed — it needs oxygen to mobilise energy reserves. A saturated medium suffocates the seed and triggers decay. Yet you also need high humidity to prevent the seed drying out during imbibition. This tension is resolved with careful ventilation of the humidity dome: crack the vents slightly to allow gas exchange while maintaining RH above 70%. Visible mold on the medium surface is usually just cosmetic (saprophytic fungi), but it signals that ventilation is inadequate and anaerobic conditions are imminent. Increase airflow or reduce misting frequency.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Handle seeds only by the shell once the taproot has emerged. Any mechanical stress to the radicle (root tip) can permanently damage the growing point and abort germination.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Soaking seeds longer than 18 hours is a common trap. Beyond 18h, the seed is fully imbibed and further soaking risks rotting. The signal to stop is when the testa (seed coat) begins to split.',
      },
    ],
    sources: [
      { label: 'Potter 2014 — Cannabis horticulture seed physiology', url: null },
      { label: 'Bewley et al. 2013 — Seeds: physiology of development and germination', url: null },
      { label: 'Practitioner consensus', url: null },
    ],
    relatedStages: ['seedling', 'early-veg'],
  },

  'seedling': {
    title: 'Seedling Stage: Building the Root Foundation',
    subtitle: 'How to prioritise root development over shoot expansion without sacrificing light',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'The first three weeks after emergence are defined by a single physiological priority: root mass accumulation. Aboveground growth is still minimal — the cotyledons (seed leaves) are feeding photosynthesis — but underground, the taproot is elongating and lateral roots are proliferating. This phase determines the plant\'s capacity to take up water and nutrients for the entire grow. Seedlings that enter late veg with stunted root systems will never catch up, no matter how much light or nutrients you add later. The limiting factor is root architecture, not leaf area.',
      },
      {
        type: 'heading',
        text: 'Overwatering: The Silent Killer',
      },
      {
        type: 'paragraph',
        text: 'Seedling root rot is almost always caused by waterlogged soil, not pathogenic fungi. When soil pores stay saturated, oxygen is displaced and aerobic respiration fails. Root cells switch to anaerobic fermentation — an inefficient process that produces toxic byproducts. Root tips begin to rot within days. This is why growers on a fixed watering schedule lose seedlings: a 5 L pot started in wet soil can take 5–7 days to dry enough for the next watering, but the seedling may asphyxiate by day 3. The solution is the lift-test: pick up the pot and judge by weight. A freshly watered seedling pot should feel noticeably heavier than a dry one. When in doubt, wait another day.',
      },
      {
        type: 'heading',
        text: 'Light and Stretch: The Distance Question',
      },
      {
        type: 'paragraph',
        text: 'Seedlings under insufficient light will stretch — elongating stems and staying small — because they are prioritising vertical growth to escape shade. However, seedling stems are fragile and cannot support elongation without risk of collapse. The safe zone for most LED panels is 45–60 cm above canopy, which delivers 150–250 PPFD. This is low enough to prevent light stress but high enough to signal that light is abundant and vertical stretch is unnecessary. If your seedling is leggy by day 10, the light is too far. If leaves are cupping or tacoing upward, the light is too close. Once the first true leaves appear, you have photosynthesis-driven growth, and you can begin raising PPFD.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'VPD for seedlings should stay at 0.4–0.8 kPa — low transpiration demand because roots cannot yet replace water fast. High humidity (65–75%) helps offset this.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Do not feed seedlings before day 10. Cotyledons are mobilising enough nitrogen to sustain early growth. Adding nutrients before roots are developed enough to absorb them will burn root tips.',
      },
    ],
    sources: [
      { label: 'Magagnini et al. 2018 — Cannabis cultivation growth stages', url: null },
      { label: 'Practitioner consensus on seedling root priority', url: null },
      { label: 'Marrone et al. 2016 — Seedling morphology under varied PPFD', url: null },
    ],
    relatedStages: ['germination', 'early-veg'],
  },

  'early-veg': {
    title: 'Early Vegetative Growth: The Training Window',
    subtitle: 'Why weeks 3–5 are the critical moment for shaping plant architecture',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Early vegetative growth (roughly weeks 3–5 from emergence) marks the transition from fragile seedling to trainable plant. The stem is now woody enough to handle manipulation without permanent damage, root mass is sufficient to support aggressive shoot growth, and node stacking is rapid and predictable. This window is where training decisions (topping, low-stress training, manifolding) have the highest return: a plant with four well-developed colas will outproduce an untopped plant by 20–35%, and the yield potential ceiling is set now. A plant trained poorly in early veg cannot be fixed in late veg — the canopy architecture is locked in.',
      },
      {
        type: 'heading',
        text: 'The Topping Sweet Spot',
      },
      {
        type: 'paragraph',
        text: 'Topping (removing the growing tip between nodes 4 and 5) works by disrupting apical dominance — the plant\'s natural tendency to push one central stem taller. When you remove the growing tip, two main meristems emerge from the topmost remaining node, each with equal strength. Topping earlier (nodes 2–3) creates more breaks but higher shock and slower recovery. Topping later (nodes 6+) reduces shock but gives diminishing returns because lower branches have already fallen behind in development and won\'t catch up. The sweet spot is node 4–5: you get clean branching, medium recovery time (3–5 days), and two main colas that finish equally. Topping in the morning rather than evening allows the plant the entire photoperiod to seal the wound and redirect auxins.',
      },
      {
        type: 'heading',
        text: 'Node Spacing and Light Penetration',
      },
      {
        type: 'paragraph',
        text: 'Node spacing (the distance between successive leaf nodes) is a genetic trait heavily modulated by light. Under low PPFD, plants stretch to maximise height. Under high PPFD (and cooler nights), nodes compact. Compact node spacing is desirable because it allows light to penetrate deeper into the canopy and reach inner flowers during bloom. Cannabis genetics vary from 5–10 cm spacing in dense hybrids to 15–20 cm in sativa-leaning strains. Early veg is the time to assess whether your strain\'s spacing will allow adequate light penetration to a full canopy. If spacing is already very wide by week 4, you may need to add another light source or plan for more aggressive defoliation later.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Start low-stress training (LST) only after the stem hardens — usually 2–3 weeks after emergence. Bend gently and secure with plant ties; avoid kinks that can snap the stem.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Defoliating fan leaves in early veg removes photosynthetic surface without the compensatory benefit of improved light penetration. The plant is still small; keep all leaves and focus on shaping structure instead.',
      },
    ],
    sources: [
      { label: 'Sutton et al. 2020 — Cannabis canopy architecture and yield', url: null },
      { label: 'Potter 2014 — Apical dominance and hormone redistribution', url: null },
      { label: 'Practitioner consensus on training timing', url: null },
    ],
    relatedStages: ['seedling', 'late-veg'],
  },

  'late-veg': {
    title: 'Late Vegetative Growth: Finalising Canopy Structure',
    subtitle: 'How to prepare the canopy for the biomass and light demands of flowering',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Late vegetative growth (weeks 5–8) is when the canopy reaches full footprint and branches catch up to the main cola. Node spacing tightens, internodes harden, and the plant is approaching its maximum vegetative biomass before energy shifts toward reproductive organs. This phase is the last safe window for major structural changes — extensive topping, mainlining, or aggressive defoliation should be complete by the start of flower. Any stress introduced now must resolve before flowering begins, or flower quality and yield will suffer.',
      },
      {
        type: 'heading',
        text: 'Canopy Evenness and Light Targeting',
      },
      {
        type: 'paragraph',
        text: 'A level canopy — where the topmost leaves across the entire growth area sit at roughly the same height — maximises light efficiency and ensures every flower receives similar radiation. This is not a natural state; it requires intentional manipulation. If branches are uneven, you can use progressive bending to raise shorter branches and gentle pulldown on overgrown sections. In a ScrOG (screen of green) setup, you weave stems through the mesh to force an even plane. The payoff is dramatic: an even canopy under the same light delivers 15–25% more flower by ensuring no bud site is shaded or underfed. Uneven canopies waste light on the tallest branches while lower sites photosynthesize poorly.',
      },
      {
        type: 'heading',
        text: 'Nitrogen Transition and Root Signalling',
      },
      {
        type: 'paragraph',
        text: 'Late veg is when you begin reducing nitrogen feeding in preparation for flowering. This is not because the plant suddenly does not need nitrogen — flower development still requires N for protein synthesis — but because excessive N delays the flower-signal transition and can promote late-stage vegetative growth (e.g., calyx stretching that produces airy flowers). Gradually lowering N by 20–30% over 1–2 weeks gives the plant a metabolic signal that the vegetative phase is ending. Roots also begin releasing cytokinins and auxins that prime the plant for reproductive morphogenesis. A plant shifted abruptly from full vegetative nutrition to full flowering will show stunting or slow flower initiation.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Check internodal spacing and leaf size by late veg. Leaves should be fully developed and stems should be woody and rigid. If growth is still very vigorous, you may want to extend veg slightly to allow hardening off.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Do not introduce major defoliation in the last 7–10 days of veg. Recovery requires 5+ days, and shock going into flowering will reduce flower production.',
      },
    ],
    sources: [
      { label: 'Leonard et al. 2015 — Cannabis vegetative to reproductive transition', url: null },
      { label: 'Practitioner consensus on late-veg nutrition shifts', url: null },
      { label: 'Magagnini et al. 2018 — Canopy structure optimization', url: null },
    ],
    relatedStages: ['early-veg', 'transition'],
  },

  'transition': {
    title: 'Transition to Flowering: The Metabolic Pivot',
    subtitle: 'How light cycles trigger reproductive morphogenesis and what happens in week 1',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'The transition from vegetative to reproductive growth is controlled by photoperiod (in photoperiodic cultivars) or by internal circadian rhythms (in autoflowers). For photoperiodic cannabis, shortening the day length to 12/12 light/dark triggers a cascade of hormonal changes. The plant senses the lengthening dark period through phytochrome, a light-sensing protein that accumulates in darkness. When night exceeds a critical threshold (roughly 12 hours for cannabis), florigen — a flower-promoting signal — is produced in leaves and transported to apical meristems. Within days, the architecture of new growth changes: leaves become smaller and more spaced, and floral primordia (flower bud precursors) appear at every node.',
      },
      {
        type: 'heading',
        text: 'Energy Reallocation and Stretch',
      },
      {
        type: 'paragraph',
        text: 'The first 7–10 days of flowering are called the "stretch" phase because the plant undergoes rapid elongation — often 50–100% height increase — as it allocates energy toward reproductive growth. This is not a problem in a properly sized room, but it is the last window to adjust light height, as additional height is locked in after week 2. Stretch happens because the plant is still pushing vegetative growth (new stem tissue and leaves) while simultaneously initiating flowers. Once the reproductive organs are established and carbon is being diverted into bud production instead of height, stretch ends.',
      },
      {
        type: 'heading',
        text: 'Environment and Stress in Early Flower',
      },
      {
        type: 'paragraph',
        text: 'Early flower is a sensitive period. Stress (light shock, temperature swings, root disturbance, or extreme humidity changes) during the first two weeks can trigger hermaphroditism or abortion of developing flowers. VPD should start coming up (0.8–1.2 kPa) as the plant transpires more, but RH should not drop below 50% — low RH combined with temperature stress is a recipe for pistil damage. Keep temperatures stable (22–27°C day, 18–22°C night) and avoid sudden changes in nutrient or water regimen.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Monitor height daily in the first 10 days of flower. If the canopy will exceed your light clearance, raise the light by 5–10 cm to compensate for expected stretch.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Do not prune, transplant, or move plants dramatically in the first two weeks of flower. Any stress now increases hermaphrodite risk and can abort developing flowers.',
      },
    ],
    sources: [
      { label: 'Thomas 2006 — Photoperiodism in cannabis and florigen signalling', url: null },
      { label: 'Bernstein 2014 — Flowering in marijuana (Cannabis sativa L.)', url: null },
      { label: 'Practitioner consensus on transition stress management', url: null },
    ],
    relatedStages: ['late-veg', 'early-flower'],
  },

  'early-flower': {
    title: 'Early Flowering: Establishing the Flower Site',
    subtitle: 'How buds form and why this 2-week window sets the final yield ceiling',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Early flowering (weeks 1–2 of 12/12) is when the plant establishes the number and size of primary floral clusters. Each flower site — formed at the apical meristem of every branch — is determined by the number of nodes and branches you have at the start of flower. Genetics also play a role: some cultivars produce dense, tight calyxes while others produce airy, spaced-out flowers. But the total number of flowers is locked in by canopy architecture from veg. A plant with four well-developed main colas will produce roughly four times as many flower sites as an untopped single-cola plant, even under identical conditions. This is why training in veg is so critical — you cannot create flower sites that do not have a branch to sit on.',
      },
      {
        type: 'heading',
        text: 'Calyx Development and Auxin Signalling',
      },
      {
        type: 'paragraph',
        text: 'Each flower is composed of many calyxes — the small, modified leaves that enclose the reproductive organs. These calyxes begin as tiny green structures and are packed with trichomes (the glandular hairs that produce cannabinoids and terpenes). In early flower, the plant is building the infrastructure of the flower, not yet building biomass. This is a fine-tuned developmental process, regulated by auxin (a plant hormone) concentrations. Stress, nutrient imbalance, or hormonal disruption at this stage can result in loose, spaced-out calyxes that mature into airy, low-density flowers. Conversely, stable conditions and adequate potassium (which aids water movement) promote tight, dense calyxes.',
      },
      {
        type: 'heading',
        text: 'Nutrition: Balancing Nitrogen and Phosphorus',
      },
      {
        type: 'paragraph',
        text: 'Early flower should see a clear shift from vegetative to bloom nutrition. Nitrogen drops to 30–40% of veg levels; phosphorus and potassium rise. Phosphorus is critical for energy transfer (ATP synthesis) during the metabolically expensive process of flower initiation. However, too much phosphorus can lock up other nutrients (especially zinc and iron), leading to deficiencies despite adequate feeding. The target is a P:K ratio around 1:1.5 to 1:2, with N at a level that supports growth without promoting vegetative overgrowth.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Cannabis flowers are photosynthetically active even during development. Maintaining high (but not excessive) light ensures each developing flower receives adequate energy to produce dense calyxes.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Excessive nitrogen in early flower promotes loose calyxes and delays flower maturation. If you see vigorous vegetative growth still happening in week 2 of flower, cut N by 30% immediately.',
      },
    ],
    sources: [
      { label: 'Magagnini et al. 2018 — Cannabinoid and terpene accumulation', url: null },
      { label: 'Potter 2014 — Flower structure and hormonal control', url: null },
      { label: 'Practitioner consensus on early-flower nutrition', url: null },
    ],
    relatedStages: ['transition', 'mid-flower'],
  },

  'mid-flower': {
    title: 'Mid Flowering: Biomass Accumulation and Resin Deposition',
    subtitle: 'How cannabinoid and terpene production ramps up and why environment matters more now',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Mid flowering (weeks 3–6 of flowering) is when the flower reaches its maximum growth rate and trichomes begin accumulating cannabinoids and terpenes in earnest. Calyx size stabilises by week 4, and from that point forward, growth is primarily about calyx density and resin deposition. This is why growers often see a stall in height around week 5 — the plant has shifted entirely to secondary metabolism (cannabinoid and terpene production) rather than primary growth (new tissue). The environment you maintain now — temperature, VPD, light intensity, and nutrient availability — directly affects resin yield and terpene profile. A plant stressed or underfed during mid-flower will mature with lower potency and thinner aroma.',
      },
      {
        type: 'heading',
        text: 'Trichome Development and Terpene Volatility',
      },
      {
        type: 'paragraph',
        text: 'Trichomes (the stalked glands on flowers) come in three types: bulbous (very small, less productive), capitate-sessile (medium, moderate resin), and capitate-stalked (large, high resin yield). All three types are present on a flower, but the capitate-stalked trichomes contribute most to potency. These structures begin accumulating cannabinoids in mid-flower and continue until ripening. Terpenes are more volatile — they evaporate if temperatures are too high. Cannabis terpenes include myrcene, pinene, limonene, and humulene, each with distinct aroma and effect profiles. Maintaining night temperatures at 18–22°C (especially in weeks 5–7) reduces terpene evaporation and allows concentrations to build. This is why late-flower temperature reduction is such a powerful tool for terpene-forward grows.',
      },
      {
        type: 'heading',
        text: 'Phosphorus and Potassium: The Critical Elements',
      },
      {
        type: 'paragraph',
        text: 'Mid-flower nutrient demands are dominated by phosphorus and potassium. Phosphorus is required for ATP synthesis (energy currency) during cannabinoid biosynthesis — a highly energy-intensive process. Potassium is critical for osmoregulation and water transport within the plant, ensuring trichomes stay hydrated and turgid (which makes them more visible and lowers stress-to-stress ratios). A slight potassium deficiency late in mid-flower often goes unnoticed until ripening, when the deficiency manifests as purple or reddish lower leaves. By then, yield is already locked in. Regular EC testing ensures you are not underfeeding potassium.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'VPD should sit at 1.0–1.4 kPa in mid-flower. Higher VPD increases transpiration, which moves more minerals from root to shoot and supports robust flower development.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'High temperatures (above 28°C) during mid-flower can reduce cannabinoid and terpene accumulation. Cannabis resin production is optimised around 24–26°C; heat stress redirects energy toward cooling rather than secondary metabolism.',
      },
    ],
    sources: [
      { label: 'Magagnini et al. 2018 — Cannabinoid and terpene production kinetics', url: null },
      { label: 'Hillig & Mahlberg 2004 — Trichome structure and phytochemistry', url: null },
      { label: 'Practitioner consensus on mid-flower environment', url: null },
    ],
    relatedStages: ['early-flower', 'late-flower'],
  },

  'late-flower': {
    title: 'Late Flowering: Maturation and Cannabinoid Conversion',
    subtitle: 'How THCA and CBDA levels peak and why timing of the final nutrients matters',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Late flowering (weeks 7–9 of 12/12, or about 3–4 weeks before target harvest) is when the flower undergoes final maturation. Trichomes stop growing new heads and begin filling with resin. THCA (tetrahydrocannabinolic acid, the non-intoxicating precursor to THC) reaches its peak concentration in the final 2–3 weeks before harvest. The pistils (female reproductive hairs) change colour from white to amber/brown, signalling biological maturity. Calyx size plateaus, and the plant begins reallocating nitrogen from leaves to flowers — a process that causes natural yellowing of the lower canopy.',
      },
      {
        type: 'heading',
        text: 'Trichome Ripeness and Harvesting Window',
      },
      {
        type: 'paragraph',
        text: 'Trichome maturity is conventionally assessed by colour: clear (immature), cloudy (peak THC), and amber (aging). A plant with 70% cloudy and 30% clear trichomes is approaching peak potency. At 50% cloudy and 50% amber, THC is still high but CBN (a degradation product) has started accumulating. Harvesting at "mostly cloudy" gives maximum THC; harvesting at "50% amber" gives a more sedating effect due to CBN. This is user preference, not a standard. However, harvesting before any amber appears typically yields flowers that are slightly more energising. Cannabinoid concentration peaks around this time, then declines slightly as THCA begins converting to CBN through oxidation.',
      },
      {
        type: 'heading',
        text: 'Final Nutrition and the Flush Debate',
      },
      {
        type: 'paragraph',
        text: 'In the final 1–2 weeks before harvest, some growers reduce nutrients to "flush" remaining salts from the substrate and plant tissue. The evidence for flushing is mixed: controlled studies show minimal difference in cannabinoid or terpene content between flushed and non-flushed flowers, and some growers report slightly better taste from non-flushed flowers (because some nutrient salts contribute subtle mineral notes). However, reducing nutrients in the final week does prevent over-feeding, which can cause a harsh smoke or excessive nutrient aftertaste. A reasonable compromise is to reduce feeding by 30–50% in week 8–9, rather than cutting it completely. This minimises salt accumulation without depriving the flower of final calcium and magnesium uptake.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Use a jeweller\'s loupe (30x magnification) to inspect trichomes. A hand lens is cheap and reliable; phone apps are inconsistent and often inaccurate.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Harvesting too early (at 70%+ clear trichomes) results in a racy, sometimes anxious effect and lower total cannabinoid yield. Waiting for at least 50% cloudiness maximises both potency and effect stability.',
      },
    ],
    sources: [
      { label: 'Hillig & Mahlberg 2004 — Trichome cannabinoid profiles', url: null },
      { label: 'Potency testing data (practitioner collection)', url: null },
      { label: 'Practitioner consensus on harvest timing and flushing', url: null },
    ],
    relatedStages: ['mid-flower', 'ripening'],
  },

  'ripening': {
    title: 'Ripening: Post-Harvest Maturation and Drying Prep',
    subtitle: 'What happens between harvest and drying and how to protect volatile compounds',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Ripening, in this context, refers to the 24–48 hours immediately after cutting the plant and before active drying begins. Despite being severed, the flower continues undergoing biochemical changes. Chlorophyll in leaves and small calyxes slowly degrades, revealing underlying yellow, orange, and purple pigments. THCA continues its gradual conversion to THC (which happens much faster during the heat of drying, but begins in the wet flower immediately post-harvest). Flavour compounds (terpenes) remain volatile and will evaporate rapidly if the air is hot and dry. This pre-drying period is when growers make the first critical decision: whether to hang-dry the whole plant (slower, more controlled) or trim immediately and dry the buds (faster, but higher terpene loss).',
      },
      {
        type: 'heading',
        text: 'Chlorophyll and Leaf Removal',
      },
      {
        type: 'paragraph',
        text: 'Cannabis flowers are chlorophyll-rich immediately after harvest. Chlorophyll (the green pigment) causes harshness when smoked or vaped — it burns at lower temperatures and produces an acrid taste. Allowing the flower to cure allows enzymes to break down chlorophyll over days and weeks. Removing fan leaves and trim leaves immediately after harvest speeds chlorophyll breakdown by reducing the leaf mass that contains chlorophyll. However, removing leaves also reduces the surface area that retains moisture, potentially causing the flower to dry too fast and lock in green, harsh flavours. The compromise: remove large fan leaves, but keep small leaves close to the calyx. This reduces chlorophyll source without sacrificing moisture retention.',
      },
      {
        type: 'heading',
        text: 'Environmental Conditions During Ripening',
      },
      {
        type: 'paragraph',
        text: 'The ideal ripening environment is 18–22°C, 50–65% RH, and darkness (to minimise light-driven THCA breakdown). Temperatures above 25°C will accelerate both terpene evaporation and chlorophyll breakdown (which sounds good, but produces harsh-tasting flowers). Humidity above 70% risks mould; below 40% causes too-fast drying and volatile loss. If possible, hang-dry whole plants in darkness for the first 24 hours, maintaining humidity and avoiding temperature swings. This allows initial chlorophyll degradation without the rapid drying that locks in astringency.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Bag-dryin (placing buds in paper bags at 18–22°C) is a low-cost way to extend ripening while preventing mould. Change the bags daily to prevent CO2 accumulation.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Do not expose wet flowers to light during ripening. THCA and terpenes are photolabile (degraded by light). Drying in sunlight, even for 2–3 hours, causes measurable quality loss.',
      },
    ],
    sources: [
      { label: 'McPartland et al. 2000 — Cannabinoid and terpene stability during storage and drying', url: null },
      { label: 'Practitioner consensus on post-harvest handling', url: null },
      { label: 'Enzyme kinetics in senescence (general biology)', url: null },
    ],
    relatedStages: ['late-flower', 'drying'],
  },

  'drying': {
    title: 'Drying: Moisture Removal and Chemical Stabilisation',
    subtitle: 'How controlled drying converts THCA to THC and preserves cannabinoid and terpene profiles',
    readingTime: '4 min',
    body: [
      {
        type: 'paragraph',
        text: 'Drying is where much of the final quality is determined. It is not simply removing water; it is a controlled chemical and biological process. As water leaves the flower tissue, THCA (the acidic form of THC) gradually converts to THC through non-enzymatic decarboxylation — a spontaneous, temperature-driven process that releases CO2. The rate of conversion depends on temperature and time. A slow, cool dry at 15–20°C over 10–14 days produces a gradual THCA-to-THC conversion that mimics proper curing and preserves terpenes. A fast, hot dry above 25°C over 3–5 days accelerates decarboxylation but also evaporates terpenes and can produce a chlorophyll-heavy, harsh-tasting final product. Most home growers aim for 8–12 days of hang-drying.',
      },
      {
        type: 'heading',
        text: 'The Drying Curve and Moisture Loss Kinetics',
      },
      {
        type: 'paragraph',
        text: 'Drying follows a predictable curve: rapid initial water loss (days 1–3, from ~75% moisture to ~50%), slowing loss (days 4–8, from ~50% to ~20%), then plateau (days 9+, asymptotically approaching equilibrium with the room RH). The flower is considered dry when the stem cracks when bent (typically 10–12 days in 50–60% RH at 18–22°C). If you dry too slowly (high humidity, low temp), mould risk increases exponentially. If you dry too fast (low humidity, high temp), terpenes are lost and the flower feels crispy on the outside but damp inside — a condition that promotes mould during curing. The target is a smooth, even dry where the outer layer dries only slightly faster than the interior.',
      },
      {
        type: 'heading',
        text: 'Hanging vs. Wet-Trim vs. Bag Drying',
      },
      {
        type: 'paragraph',
        text: 'Three main drying approaches exist: (1) Hang whole plants, let stem dry, then trim — slowest, best terpene retention, requires space and light control; (2) Wet-trim immediately, hang buds in net bags or on screens — faster (3–7 days), easier storage, more terpene loss; (3) Bag-dry in darkness, allowing initial in-the-bag ripening before active drying — moderate speed and terpene retention, lowest space requirement. For home growers with space and climate control, hanging whole plants is ideal. For limited space or high humidity environments, bag-drying buds is more reliable. Wet-trimming is fastest but should only be done if your environment can handle the increased exposed surface area without drying too fast.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Hang branches upside down, not right-side-up. Inverted branches allow residual moisture in the stem to migrate downward into the flowers, creating an even dry.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'The "crispy outside, wet inside" condition after 5–6 days of fast drying is a mould trap. If you see this, slow the drying environment immediately (increase RH, lower temp, reduce airflow) to allow moisture to equilibrate.',
      },
    ],
    sources: [
      { label: 'McPartland et al. 2000 — Cannabis drying and decarboxylation kinetics', url: null },
      { label: 'Guyonnet et al. 2020 — Cannabinoid stability during post-harvest handling', url: null },
      { label: 'Practitioner consensus on drying conditions', url: null },
    ],
    relatedStages: ['ripening', 'curing'],
  },

  'curing': {
    title: 'Curing: Enzyme-Driven Flavour Development',
    subtitle: 'Why 2–4 weeks in sealed containers transforms harsh flower into smooth, aromatic product',
    readingTime: '3 min',
    body: [
      {
        type: 'paragraph',
        text: 'Curing is the final and longest stage of post-harvest processing. Once the flower is dry (stem snaps when bent, but buds are not brittle), it is placed in airtight containers (glass jars) at 50–65% RH and 15–20°C. In this sealed, stable environment, several chemical processes occur simultaneously. Residual moisture within the buds equilibrates with the headspace, creating a controlled humidity level that prevents further desiccation and allows enzymatic activity to continue. Chlorophyll breaks down further. Terpene profiles continue evolving as some volatile compounds react with other compounds, creating new flavour notes. THCA continues converting to THC, though at a much slower rate than during drying. After 2–4 weeks, the flower has matured into a smooth, fragrant, potent product. This process cannot be rushed — opening jars daily to check on progress (a common mistake) allows humidity and temperature to fluctuate, disrupting the enzymes doing the work.',
      },
      {
        type: 'heading',
        text: 'Enzymatic Degradation of Chlorophyll',
      },
      {
        type: 'paragraph',
        text: 'Chlorophyll breakdown is primarily driven by chlorophyllase, an enzyme that cleaves the phytol tail from the chlorophyll molecule, converting it to chlorophyllide (a yellow-green compound). This process requires anaerobic conditions (low oxygen) and stable humidity — precisely what sealed jars provide. The initial drying process begins chlorophyll breakdown, but it is curing that completes it. This is why undried flowers kept in sealed jars for weeks can taste harsher than properly dried and cured flowers — the chlorophyll is still present and intact. Conversely, flowers dried very slowly with high humidity may have more time for enzymatic degradation during the ripening and drying stages and may need less curing time.',
      },
      {
        type: 'heading',
        text: 'Moisture Management and Mould Prevention',
      },
      {
        type: 'paragraph',
        text: 'Curing jars maintain 50–65% RH with the moisture naturally released from the buds and contained within the sealed space. If the RH inside the jar exceeds 65% after 2–3 hours, the flower is still too wet — it should have been dried longer. If RH drops below 50%, the environment is drying out the flowers again and curing slows. Some growers use humidity packs (two-way hydration packets) to maintain target RH even if the flower moisture was slightly off. The critical rule: if you smell mould or see any fuzzy growth after 2–3 days of curing, open the jar, remove affected buds, dry them further, and restart with fresh, dry flowers. Mouldy flower cannot be salvaged and is unsafe to smoke.',
      },
      {
        type: 'callout',
        kind: 'tip',
        text: 'Burp jars (open for 15–30 minutes daily) for the first week of curing to allow any excess moisture to escape and prevent CO2 buildup. After day 7, keep jars sealed except for occasional brief opening.',
      },
      {
        type: 'callout',
        kind: 'warning',
        text: 'Do not use humidity packs if you are not confident about your flower\'s initial dryness. Over-moist buds plus humidity packs equals mould. It is safer to jar slightly dry buds — they can equilibrate to target RH without risk.',
      },
    ],
    sources: [
      { label: 'McPartland et al. 2000 — Curing and post-harvest chlorophyll degradation', url: null },
      { label: 'Guyonnet et al. 2020 — Terpene and cannabinoid stability in sealed jars', url: null },
      { label: 'Practitioner consensus on curing protocols', url: null },
    ],
    relatedStages: ['drying', 'done'],
  },
};

/**
 * Lookup helper: return the deep-dive article for a given stage ID
 * @param {string} stageId - e.g. 'early-veg', 'mid-flower', etc.
 * @returns {object|null} - deep-dive object or null if not found
 */
export function getStageDeepDive(stageId) {
  return STAGE_DEEP_DIVES[stageId] || null;
}
