// GrowDoc Companion — Evidence Level Classifications
// Maps recommendation IDs to evidence levels with optional source citations.

export const EVIDENCE = {
  // ── VPD Recommendations ────────────────────────────────────────────────
  'vpd-seedling-range': {
    level: 'established',
    source: 'Hatfield & Hui 2019; Chandra et al. 2008',
    detail: 'VPD ranges for cannabis seedlings well-established in controlled environment research'
  },
  'vpd-veg-range': {
    level: 'established',
    source: 'Chandra et al. 2008; Backer et al. 2019',
    detail: 'Vegetative VPD targets supported by photosynthesis rate studies in cannabis'
  },
  'vpd-flower-range': {
    level: 'established',
    source: 'Chandra et al. 2011; Backer et al. 2019',
    detail: 'Flowering VPD targets derived from gas exchange and stomatal conductance data'
  },
  'vpd-ripening-range': {
    level: 'practitioner',
    source: null,
    detail: 'Ripening-stage VPD targets based on experienced grower consensus for mold prevention'
  },
  'vpd-night-offset': {
    level: 'established',
    source: 'General plant physiology; Taiz & Zeiger',
    detail: 'Night temperature drop for plant respiration is fundamental plant biology'
  },

  // ── DLI Recommendations ────────────────────────────────────────────────
  'dli-seedling-range': {
    level: 'established',
    source: 'Rodriguez-Morrison et al. 2021',
    detail: 'Seedling DLI requirements established through controlled LED studies'
  },
  'dli-veg-range': {
    level: 'established',
    source: 'Rodriguez-Morrison et al. 2021; Chandra et al. 2008',
    detail: 'Vegetative DLI targets supported by multiple photosynthesis studies'
  },
  'dli-flower-range': {
    level: 'established',
    source: 'Rodriguez-Morrison et al. 2021; Potter & Duncombe 2012',
    detail: 'Flowering DLI targets show diminishing returns above 40-50 mol/m2/day'
  },
  'dli-yield-priority': {
    level: 'promising',
    source: 'Rodriguez-Morrison et al. 2021',
    detail: 'Higher DLI correlates with increased yield, but heat stress risk rises'
  },
  'dli-terpene-priority': {
    level: 'promising',
    source: 'Eichhorn Bilodeau et al. 2019',
    detail: 'Moderate DLI may preserve volatile terpenes; excessive light can degrade them'
  },

  // ── Nutrient Recommendations ───────────────────────────────────────────
  'nutrient-ec-seedling': {
    level: 'established',
    source: 'Bernstein et al. 2019; Caplan et al. 2017',
    detail: 'Low EC for seedlings prevents salt burn on developing roots'
  },
  'nutrient-ec-veg': {
    level: 'established',
    source: 'Caplan et al. 2017; Bernstein et al. 2019',
    detail: 'Vegetative EC targets based on tissue analysis and yield studies'
  },
  'nutrient-ec-flower': {
    level: 'established',
    source: 'Caplan et al. 2017; Saloner & Bernstein 2020',
    detail: 'Flowering EC targets supported by multiple controlled studies'
  },
  'nutrient-ec-late-reduction': {
    level: 'established',
    source: 'Caplan et al. 2017',
    detail: 'EC reduction in late flower follows natural demand curve as plant matures'
  },
  'nutrient-ph-soil': {
    level: 'established',
    source: 'General horticulture; Ruter 2017',
    detail: 'Soil pH buffering and optimal range is well-established plant science'
  },
  'nutrient-ph-coco': {
    level: 'established',
    source: 'Abad et al. 2002; coco substrate research',
    detail: 'Coco coir pH management requirements well-documented in substrate research'
  },
  'nutrient-ph-hydro': {
    level: 'established',
    source: 'Resh 2012 (Hydroponic Food Production)',
    detail: 'Hydroponic pH ranges are foundational to soilless cultivation science'
  },
  'nutrient-npk-veg': {
    level: 'established',
    source: 'Saloner & Bernstein 2020, 2021',
    detail: 'Higher N ratio in veg supported by cannabis-specific tissue analysis'
  },
  'nutrient-npk-flower': {
    level: 'established',
    source: 'Saloner & Bernstein 2020; Bernstein et al. 2019',
    detail: 'PK-heavy ratio in flower drives bud development'
  },
  'nutrient-coco-calmag': {
    level: 'established',
    source: 'Abad et al. 2002; multiple hydroponic studies',
    detail: 'Coco cation exchange capacity depletes Ca and Mg from nutrient solution'
  },
  'nutrient-coco-led-calmag': {
    level: 'promising',
    source: 'Practitioner reports + Bugbee 2016',
    detail: 'LED-grown plants under coco show increased Ca/Mg demand vs HPS; limited formal studies'
  },

  // ── Watering Recommendations ───────────────────────────────────────────
  'water-soil-frequency': {
    level: 'practitioner',
    source: null,
    detail: 'Soil watering frequency based on universal grower experience; varies by environment'
  },
  'water-coco-daily': {
    level: 'established',
    source: 'Coco substrate research; Abad et al. 2002',
    detail: 'Coco dries faster than soil and should not be allowed to dry out — well-documented'
  },
  'water-hydro-continuous': {
    level: 'established',
    source: 'Resh 2012; standard hydroponic practice',
    detail: 'Hydroponic systems maintain continuous root-zone moisture by design'
  },
  'water-lift-test': {
    level: 'practitioner',
    source: null,
    detail: 'Universal grower practice — simple pot weight assessment to gauge soil moisture'
  },
  'water-runoff-check': {
    level: 'practitioner',
    source: null,
    detail: 'Checking runoff EC/pH is standard grower practice for monitoring root zone'
  },

  // ── Temperature Recommendations ────────────────────────────────────────
  'temp-day-night-diff': {
    level: 'established',
    source: 'Taiz & Zeiger (Plant Physiology); general horticulture',
    detail: 'Day/night temperature differential for plant respiration is fundamental physiology'
  },
  'temp-terpene-drop': {
    level: 'promising',
    source: 'Eichhorn Bilodeau et al. 2019',
    detail: 'Lower night temps in late flower may preserve volatile terpenes; limited cannabis-specific data'
  },
  'temp-anthocyanin': {
    level: 'promising',
    source: 'Eichhorn Bilodeau et al. 2019; general plant pigment research',
    detail: 'Cold night temps promote anthocyanin expression (purple color) in many plant species'
  },

  // ── Harvest Recommendations ────────────────────────────────────────────
  'harvest-trichome-check': {
    level: 'established',
    source: 'Forensic and botanical literature; trichome development stages documented for decades',
    detail: 'Trichome development stages (clear/milky/amber) are well-documented in botanical science, not just community consensus'
  },
  'harvest-flush-debate': {
    level: 'speculative',
    source: null,
    detail: 'No controlled studies support improved quality from extended pre-harvest flush'
  },
  'harvest-dark-period': {
    level: 'speculative',
    source: null,
    detail: 'No controlled studies support 24-48h darkness before harvest improving quality'
  },
  'harvest-amber-ratio': {
    level: 'practitioner',
    source: null,
    detail: 'Amber trichome percentage as ripeness indicator is community consensus, not formally studied'
  },

  // ── Training Recommendations ───────────────────────────────────────────
  'training-lst': {
    level: 'established',
    source: 'General horticulture; canopy management research',
    detail: 'Low-stress training for canopy evenness is standard horticultural practice'
  },
  'training-topping': {
    level: 'established',
    source: 'Danziger & Bernstein 2021',
    detail: 'Apical dominance removal (topping) to promote branching is well-established'
  },
  'training-scrog': {
    level: 'practitioner',
    source: null,
    detail: 'Screen of Green is widely used community technique; limited formal research specific to cannabis'
  },
  'training-defoliation': {
    level: 'promising',
    source: 'Danziger & Bernstein 2021',
    detail: 'Strategic defoliation shows yield benefits in some studies; timing and extent debated'
  },
  'training-supercrop': {
    level: 'practitioner',
    source: null,
    detail: 'Supercropping (stem pinching) is community technique; anecdotal effectiveness reports'
  },

  // ── Stage Transition Recommendations ───────────────────────────────────
  'stage-veg-to-flower': {
    level: 'established',
    source: 'Chandra et al. 2017; standard photoperiod science',
    detail: '12/12 light flip to induce flowering is fundamental cannabis photoperiod biology'
  },
  'stage-transition-stretch': {
    level: 'established',
    source: 'Cannabis cultivation literature',
    detail: 'Flower stretch (doubling in height) during first 2-3 weeks of 12/12 is well-documented'
  },
  'stage-ripening-signs': {
    level: 'practitioner',
    source: null,
    detail: 'Visual ripening indicators (swollen calyxes, pistil color) are grower consensus'
  },
  'stage-seedling-duration': {
    level: 'practitioner',
    source: null,
    detail: 'Seedling stage duration (1-2 weeks) based on common grower observation'
  }
};
