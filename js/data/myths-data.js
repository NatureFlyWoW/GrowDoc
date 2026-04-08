// GrowDoc Companion — Myth Busting Data (v2 — 16 myths)

export const MYTHS = [

  // ─── Original 7 ───────────────────────────────────────────────────────────

  {
    id: 'flushing',
    claim: 'You must flush for 2 weeks before harvest to improve taste',
    verdict: 'Busted',
    explanation: 'Multiple controlled studies show no significant difference in taste, smoothness, or chemical composition between flushed and non-flushed cannabis. A proper dry and cure has far more impact on final quality than pre-harvest flushing. The perceived improvement growers report after flushing is more plausibly explained by the extra 1–2 weeks of maturation time the flush window adds, not the absence of nutrients. If you have been feeding at reasonable salt levels throughout the grow, there is nothing to flush.',
    sources: [
      'Caplan et al. (2022) — Front. Plant Sci.',
      'RX Green Technologies flush study (2020)',
      'Multiple blind taste panel studies — no significant difference detected',
    ],
  },

  {
    id: 'darkness-before-harvest',
    claim: '48–72 hours of darkness before harvest increases potency',
    verdict: 'Unproven',
    explanation: 'No peer-reviewed evidence supports this claim. Some growers report anecdotal improvements, but controlled measurements show no significant THC or terpene increase from extended dark periods. Trichome maturation is a gradual enzymatic process that occurs over weeks, not hours. A 48-hour dark period represents less than 1% of the total flowering duration — it is implausible that it would produce a measurable change in cannabinoid levels that months of metabolic activity did not. The trichome changes some growers observe are more likely a natural progression that would have occurred on the same timeline regardless of the dark treatment.',
    sources: [
      'No peer-reviewed studies available as of 2025',
      'General consensus: trichome maturation is a weeks-long process, not triggered by acute darkness',
    ],
  },

  {
    id: 'indica-sativa',
    claim: 'Indica = body high, Sativa = head high',
    verdict: 'Busted',
    explanation: 'The indica/sativa distinction is a botanical classification about plant morphology (leaf width, plant height, node spacing), not effect profile. Effects are determined by cannabinoid ratios (THC:CBD:CBN) and terpene profiles, not plant shape or growth pattern. A so-called "sativa" with high myrcene and low THC can produce sedating effects. A "indica" with high limonene and high THC can produce an energetic, cerebral effect. The categorisation is useful for breeders and cultivators as a morphological descriptor — it is misleading when applied to consumer effects. Chemotype (cannabinoid and terpene profile) is the accurate predictor of effect.',
    sources: [
      'Watts et al. (2021) — Nature Plants',
      'de Meijer et al. (2003) — Genetics',
      'Pearce et al. (2014) — Journal of Neuroimmunology — terpene entourage effects',
    ],
  },

  {
    id: 'more-nutrients-more-yield',
    claim: 'More nutrients = bigger plants = more yield',
    verdict: 'Busted',
    explanation: 'Over-feeding is far more common and damaging than under-feeding. Cannabis is not a heavy feeder compared to many crops. Nutrient burn — the visible damage from excess salt concentration at the roots — reduces both yield and quality. Symptoms include brown, burnt leaf tips and margins, and can progress to widespread leaf damage if unchecked. Start at 50–75% of manufacturer recommendations and increase only if the plant shows clear deficiency signs. High-EC feeding makes the most sense for experienced growers who have dialled in their system and are growing in inert media (coco/hydro) where salt accumulation is managed with high runoff. In organic soil, overfeeding is even more likely to cause problems by killing the beneficial microbes that buffer nutrient availability.',
    sources: [
      'Cannabis cultivation best practices — multiple university extension guides',
      'General consensus across agronomic research on optimal nutrient loading',
    ],
  },

  {
    id: 'uv-increases-thc',
    claim: 'UV-B light significantly increases THC production',
    verdict: 'Partially True',
    explanation: 'Some studies show modest THC increases (5–15%) with supplemental UV-B, likely as a plant stress response — THCA biosynthesis may function partly as a UV-B absorber to protect plant tissue. However, the effect is small compared to the influence of genetics and overall growing conditions. UV-B also poses real risks: it causes skin and eye damage to growers, can bleach and degrade terpenes with overexposure, and can stress plants if overdone. Practical implementation requires careful timing (2–4 hours of UV-B per day, not all-day exposure) and appropriate UV-blocking eye protection during inspection. For most growers the cost-benefit is unfavourable compared to simply dialling in VPD, DLI, and genetics.',
    sources: [
      'Lydon et al. (1987) — Photochemistry and Photobiology',
      'Magagnini et al. (2018) — Photochemical & Photobiological Sciences',
      'Rodriguez-Morrison et al. (2021) — Front. Plant Sci. — limited THC effect vs terpene impact',
    ],
  },

  {
    id: 'molasses-for-buds',
    claim: 'Adding molasses to soil makes buds bigger and sweeter',
    verdict: 'Partially True',
    explanation: 'Blackstrap molasses is a carbohydrate source that feeds soil microbes, which can improve nutrient cycling and microbial activity in organic or living soil setups. This is a legitimate practice in that context. It does NOT directly feed the plant or make buds "sweeter" — plant roots do not absorb sucrose from soil. The sugar is consumed by microorganisms in the rhizosphere, and the resulting microbial activity can improve nutrient availability. In coco, hydro, or synthetic soil grows there is no microbial ecosystem to feed and molasses has no benefit. In living soil, the carbohydrate input can support microbial populations during flush periods or in between organic compost additions.',
    sources: [
      'Soil microbiology research — general consensus in organic agriculture',
      'Sugars as root exudate analogues — supporting rhizosphere microbiology',
    ],
  },

  {
    id: 'ice-water-trichomes',
    claim: 'Watering with ice water before harvest increases trichome production',
    verdict: 'Busted',
    explanation: 'Cold root zone temperatures stress the plant and can slow metabolic processes including trichome production. Trichome production is determined by genetics and weeks of environmental conditions — it cannot be meaningfully changed in the final 24–48 hours before harvest with a temperature shock treatment. The purple coloration some associate with this technique is anthocyanin expression, which is triggered by cooler temperatures but is a pigmentation response, not a trichome density change. If anything, sudden cold root-zone stress in the final days before harvest is more likely to cause stress responses that reduce quality than to improve it.',
    sources: [
      'No peer-reviewed studies support this practice',
      'Cold root zone stress — adverse effects documented in horticultural literature',
    ],
  },

  // ─── 9 New Myths ──────────────────────────────────────────────────────────

  {
    id: 'more-light-more-yield',
    claim: 'The more light you give a cannabis plant, the more it will yield',
    verdict: 'Partially True',
    explanation: 'Cannabis has a light saturation point — the PPFD level beyond which additional photons produce no further increase in photosynthesis and actually begin to cause photoinhibition (damage to the photosystem). For most cannabis varieties this saturation point is approximately 1200–1500 µmol/m²/s PPFD under ambient CO2. Above this level with normal CO2, additional light causes stress rather than growth. DLI above 45–50 mol/m²/day shows diminishing and eventually negative returns in standard growing conditions. The relationship between light and yield is real up to that point — more light in the 200–1000 PPFD range does produce more photosynthesis and yield. But "more is always better" stops being true at moderate to high intensities. With supplemental CO2 at 1200–1500 ppm, the saturation point shifts upward to approximately 1800–2000 PPFD — which is why CO2 supplementation only makes sense when you are already at high light intensity.',
    sources: [
      'Chandra et al. (2015) — Physiologia Plantarum — cannabis light saturation',
      'Sager & McFarlane (1997) — Radiation management in controlled environments',
      'Rodriguez-Morrison et al. (2021) — Front. Plant Sci.',
    ],
  },

  {
    id: 'bigger-pots-bigger-plants',
    claim: 'Bigger pots always mean bigger plants and bigger yields',
    verdict: 'Partially True',
    explanation: 'Root zone volume is genuinely one of the limiting factors on plant size and yield — a plant in a 5L pot cannot reach the same potential as the same genetics in a 25L pot, all else being equal. However, the relationship is not linear and the benefits plateau. A 25L pot vs a 50L pot produces minimal additional yield in most indoor setups because the plant finishes before the root system can fully explore the extra volume. The more significant issue: very large containers in indoor tents cause problems. They take much longer to dry out between waterings, which increases overwatering risk. They are difficult to move. They require huge amounts of soil per run. For soil grows, 10–15L per plant in a photoperiod grow and 5–10L for autos is the practical sweet spot where root volume is adequate and management is practical. Container material matters more than raw volume — a fabric pot in a smaller size often outperforms a plastic pot of larger size due to air pruning.',
    sources: [
      'Root zone volume and plant growth — general horticultural research',
      'Cannabis-specific: practical grower consensus, limited controlled studies',
    ],
  },

  {
    id: 'expensive-nutrients',
    claim: 'You need expensive premium nutrient lines to grow high-quality cannabis',
    verdict: 'Busted',
    explanation: 'Cannabis requires the same macro and micronutrients as any other plant — nitrogen, phosphorus, potassium, calcium, magnesium, sulphur, and a range of trace elements. These are commodities. The active ingredients in a $80 branded "bloom booster" are largely identical to those in a $12 generic potassium phosphate supplement. Numerous grow competitions and documented grows have produced exceptional cannabis with basic two-part or three-part nutrient lines that cost a fraction of premium products. The quality premium marketed by expensive nutrient companies is mostly branding. What actually matters: correctly balanced NPK ratios for each growth stage, adequate calcium and magnesium, correct pH, and sensible feed volumes. The grow environment (VPD, DLI, temperature) and genetics have vastly more impact on final quality than the brand name on your nutrient bottle.',
    sources: [
      'Independent cannabis growing community analyses — generic vs branded nutrient comparisons',
      'Agronomic research — macro and micronutrient requirements are species-determined, not brand-determined',
    ],
  },

  {
    id: 'hermies-always-genetic',
    claim: 'Hermaphrodite plants are always the result of bad genetics',
    verdict: 'Partially True',
    explanation: 'Hermaphroditism in cannabis has two distinct causes. True genetic hermaphroditism is inherent in the genome — some lines are unstable and will produce pollen sacs under normal, unstressed conditions. This is a breeding quality issue and a legitimate reason to avoid certain genetics or seedbanks. However, stress-induced hermaphroditism can occur in otherwise stable genetics when plants experience severe environmental disruption: light leaks during the dark period, extreme heat stress, physical damage, severe nutrient stress, or pH crashes. In these cases, the plant\'s survival response triggers pollen sac production as a self-pollination mechanism. Light leaks are the most common cause in indoor grows. Before concluding that genetics are to blame, rule out all environmental stress sources. A well-sealed tent with no light leaks is the first line of hermie prevention.',
    sources: [
      'Mohan Ram & Sett (1982) — cannabis sex determination research',
      'Light interruption triggering hermaphroditism — documented in multiple cannabis grow studies',
    ],
  },

  {
    id: 'organic-always-better',
    claim: 'Organic cannabis is always better quality than synthetic-grown cannabis',
    verdict: 'Partially True',
    explanation: 'Organic cannabis grown in a well-developed living soil, properly dried and cured, often does produce a more complex flavour profile compared to synthetic-grown cannabis. The mechanism is likely the diverse array of organic acids, secondary metabolites, and microbial by-products that accumulate in living soil systems rather than being directly caused by "organic" nutrients. However, poorly executed organic grows produce inferior cannabis compared to well-executed synthetic grows. Organic does not automatically mean better — it means a different growing system with its own requirements and failure modes. Some of the highest-scoring cannabis in lab testing and competitions has been grown in synthetic nutrient systems in coco. The single largest influence on quality remains genetics, followed by environment, followed by harvest/dry/cure execution. Growing method (organic vs synthetic) is a secondary factor that has some influence but does not override the fundamentals.',
    sources: [
      'Fellermeier & Zenk (1998) — cannabinoid biosynthesis pathway — not medium-dependent',
      'Cannabis competition results — winning entries from both organic and synthetic grows',
    ],
  },

  {
    id: 'cant-top-autoflowers',
    claim: 'You should never top autoflowers — it stunts them permanently',
    verdict: 'Partially True',
    explanation: 'Topping autoflowers carries a genuine risk that does not exist for photoperiod plants: because autos run on a fixed internal clock, the 5–10 day recovery period after topping represents a meaningful fraction of their total veg time. An auto that would have vegged for 25 days before flowering effectively loses 30–40% of its veg window to recovery if topped early. However, "permanently stunts" overstates the risk. An experienced grower who tops an auto at the 3rd–4th node in week 2–3 can achieve a beneficial result — the recovery time is modest and the bushy structure carries through to higher yields. The risk scales with stress and timing: topping late, fimming inaccurately, or topping a stressed auto is likely to reduce yield. For beginners and in short-cycle autos (under 70 days), the risk-reward calculation strongly favours LST only. For experienced growers with healthy fast-finishing autos (80+ days), a careful early top can be worthwhile.',
    sources: [
      'Cannabis autoflower community documentation — practical outcomes',
      'Ruderalis hybrid genetics — fixed flowering timeline literature',
    ],
  },

  {
    id: 'curing-doesnt-matter',
    claim: 'Curing is optional — properly dried cannabis is ready to smoke',
    verdict: 'Busted',
    explanation: 'Properly dried cannabis that has not been cured is functionally smokeable but is measurably inferior in flavour, smoothness, and aroma to the same batch after an 8-week cure. During curing, enzymatic processes continue to break down chlorophyll (the source of the harsh grassy taste in fresh-dried cannabis) and plant sugars, ammonia from protein breakdown dissipates, and volatile terpene fractions redistribute and stabilise. These are real chemical changes that are measurable by analytical methods. Research on terpene profiles before and after cure shows the terpene composition continues to evolve for 8–12 weeks post-harvest. The minimum cure to notice a clear quality improvement is 4 weeks. The "ready to smoke off the dry" approach that some growers use is understandable but they are consuming a demonstrably less refined product than a well-cured version of the same batch would be.',
    sources: [
      'Namdar et al. (2018) — Phytochemistry — terpene changes post-harvest',
      'General cannabis curing — documented chlorophyll and ammonia breakdown processes',
      'Terpene volatility and preservation during cure — industry analytical data',
    ],
  },

  {
    id: 'ro-water-always-better',
    claim: 'Reverse osmosis water is always better for cannabis than tap water',
    verdict: 'Partially True',
    explanation: 'Reverse osmosis (RO) water starts at near-zero TDS (total dissolved solids), which gives you complete control over your nutrient solution — you are building from scratch with nothing to interfere. For growers using comprehensive nutrient programs in coco or hydro, or for those with poor-quality tap water (high chloramine, high sodium, alkaline pH that resists adjustment), RO is genuinely the better starting point. However, for soil growers using organic methods, the mineral content of quality tap water (typically 50–200 ppm in municipal supplies) can actually be beneficial — the calcium and magnesium in tap water contribute to plant nutrition and soil mineral balance. RO water without proper mineral supplementation can also lead to calcium and magnesium deficiencies if CalMag is not added. The correct statement is: RO water is better for controlled synthetic and hydroponic systems. Tap water, let sit 24 hours to off-gas chlorine, is adequate and sometimes preferable for organic soil grows.',
    sources: [
      'Water chemistry effects on hydroponic nutrient availability — peer-reviewed horticulture',
      'Chloramine vs chlorine — different off-gassing behaviour and treatment requirements',
    ],
  },

  {
    id: 'defoliation-more-light',
    claim: 'Aggressive defoliation in flower dramatically increases yield by letting more light reach bud sites',
    verdict: 'Partially True',
    explanation: 'Targeted defoliation of leaves that are directly blocking bud sites can modestly improve yield and bud quality by improving light penetration. This is the legitimate basis of the technique. The "more defoliation = more yield" extrapolation from this principle is where growers go wrong. Leaves are the plant\'s photosynthetic factories — they produce the carbohydrates that build bud mass. Removing them does not just increase light penetration, it simultaneously reduces the plant\'s energy production capacity. Heavy mid-to-late flower defoliation (stripping 40%+ of leaf mass after week 4) has been shown in multiple grower-documented experiments to reduce final yield, because the buds enter their primary mass-building phase with insufficient photosynthetic capacity. The optimal strategy is a targeted defoliation at flip (weeks 1–2 of flower) and a modest clean-up at week 3, then leaving the plant largely alone for the remainder of flower.',
    sources: [
      'Photosynthesis and leaf area index — general horticultural research',
      'Cannabis defoliation community experiments — documented yield outcomes with heavy vs light defoliation',
    ],
  },

];
