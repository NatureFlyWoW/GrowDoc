# Section 04: Grow Knowledge Data Modules

## Overview

This section builds the data layer that encodes all cultivation protocols and evidence classifications. These are static JS data modules (similar to the existing `plant-doctor-data.js`) that serve as the single source of truth for environment targets, nutrient recommendations, stage timing, and evidence levels. Every recommendation system in the app queries these modules.

The data comes from established cannabis cultivation science and experienced practitioner knowledge. Each recommendation is classified by evidence level so the UI can display appropriate confidence indicators.

**Tech stack:** Vanilla JS data modules. No computation here -- just data structures. The priority engine, task engine, and view layers consume this data.

---

## Dependencies

- None. This is a pure data module with no runtime dependencies.

## Blocks

- **Section 08 (Task Engine):** Queries VPD targets, DLI targets, nutrient targets, watering frequency
- **Section 10 (Environment):** Uses VPD targets, DLI targets, temperature differentials
- **Section 12 (Feeding Schedule):** Uses nutrient targets by medium/stage/priority
- **Section 14 (Harvest Advisor):** Uses stage rules and harvest timing data

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/data/grow-knowledge.js` | VPD tables, DLI targets, nutrient ratios, temp differentials, watering frequency |
| `/js/data/evidence-data.js` | Evidence level classifications for all recommendations |

---

## Tests (Implement First)

The TDD plan refers to these as "Section 6: Grow Knowledge Data Modules" in the test file. All tests validate data integrity and plausibility.

### VPD Data Tests

- **Coverage:** VPD targets exist for all stages (seedling through ripening)
- **Plausible range:** all VPD target values are within plausible range (0.3-2.0 kPa)
- **Day/night logic:** day temp ranges are always higher than night temp ranges

### DLI Data Tests

- **Coverage:** DLI targets exist for all stage/priority combinations
- **Priority ordering:** yield priority DLI >= quality priority DLI >= terpene priority DLI
- **Plausible range:** all DLI values are in range 10-65

### Nutrient Data Tests

- **Coverage:** nutrient targets exist for all medium/stage combinations
- **EC progression:** EC targets decrease from mid-flower to late-flower
- **pH ranges by medium:** pH ranges differ between soil (6.0-6.8) and coco (5.5-6.5)
- **CalMag flag:** coco always has CalMag note

### Evidence Data Tests

- **Coverage:** every recommendation ID has an evidence classification
- **Valid levels:** evidence levels are one of: `established`, `promising`, `speculative`, `practitioner`
- **Citations:** established items include a source citation

---

## Implementation Details

### grow-knowledge.js

This module exports several data structures organized by stage, medium, and priority dimension.

**Growth stages used throughout the data:**

```javascript
const STAGES = [
  'germination', 'seedling', 'early-veg', 'late-veg',
  'transition', 'early-flower', 'mid-flower', 'late-flower',
  'ripening', 'drying', 'curing'
];
```

**VPD Targets:**

```javascript
/**
 * VPD_TARGETS[stage] = {
 *   dayTemp: { min: Number, max: Number },     // Celsius
 *   nightTemp: { min: Number, max: Number },    // Celsius
 *   dayRH: { min: Number, max: Number },        // Percentage
 *   nightRH: { min: Number, max: Number },      // Percentage
 *   vpdRange: { min: Number, max: Number }      // kPa
 * }
 *
 * Example values:
 *   seedling:     dayTemp 24-28, dayRH 65-80, VPD 0.4-0.8
 *   early-veg:    dayTemp 24-28, dayRH 55-70, VPD 0.8-1.1
 *   late-veg:     dayTemp 24-28, dayRH 50-65, VPD 0.9-1.2
 *   early-flower: dayTemp 24-27, dayRH 45-55, VPD 1.0-1.3
 *   mid-flower:   dayTemp 24-26, dayRH 40-50, VPD 1.1-1.4
 *   late-flower:  dayTemp 22-25, dayRH 35-45, VPD 1.2-1.5
 *   ripening:     dayTemp 20-24, dayRH 30-40, VPD 1.2-1.6
 *
 * Night temps are typically 2-5C below day temps.
 * Night RH can run 5-10% higher than day RH.
 */
export const VPD_TARGETS = { /* ... */ };
```

**DLI Targets:**

```javascript
/**
 * DLI_TARGETS[stage][priorityDimension] = {
 *   min: Number,       // mol/m2/day
 *   optimal: Number,   // mol/m2/day
 *   max: Number        // mol/m2/day
 * }
 *
 * Priority dimensions: 'yield', 'quality', 'terpenes'
 * (Effect does not directly alter DLI targets)
 *
 * Ordering rule: yield DLI >= quality DLI >= terpene DLI
 *   Yield priority pushes DLI higher to maximize photosynthesis and biomass.
 *   Terpene priority keeps DLI moderate to reduce heat stress and preserve volatiles.
 *
 * Example values (mid-flower):
 *   yield:    min 35, optimal 45, max 55
 *   quality:  min 30, optimal 40, max 50
 *   terpenes: min 25, optimal 35, max 45
 *
 * Range across all stages: 10-65 mol/m2/day
 *   Seedling: 12-20 (low, fragile plants)
 *   Late flower: 35-55 (peak demand)
 */
export const DLI_TARGETS = { /* ... */ };
```

**Nutrient Targets:**

```javascript
/**
 * NUTRIENT_TARGETS[medium][stage] = {
 *   ec: { min: Number, max: Number },     // mS/cm
 *   ph: { min: Number, max: Number },
 *   npkRatio: String,                      // e.g., "3-1-2" for veg, "1-2-3" for flower
 *   calmagNote: String | null,             // CalMag requirement note
 *   notes: String[]                        // Additional medium/stage-specific notes
 * }
 *
 * Mediums: 'soil', 'coco', 'hydro', 'soilless'
 *
 * pH ranges by medium:
 *   soil:     6.0-6.8 (buffered, wider range)
 *   coco:     5.5-6.5 (inert, tighter range)
 *   hydro:    5.5-6.0 (direct root contact)
 *   soilless: 5.8-6.3 (varies by mix)
 *
 * EC progression:
 *   Seedling:     0.4-0.8 (minimal feed)
 *   Early veg:    0.8-1.2
 *   Late veg:     1.2-1.6
 *   Early flower: 1.4-1.8
 *   Mid flower:   1.6-2.2 (peak)
 *   Late flower:  1.2-1.6 (reduce)
 *   Ripening:     0.4-0.8 (minimal)
 *
 * CalMag note: coco ALWAYS has a CalMag note (coco binds Ca/Mg).
 *   LED lighting also increases CalMag demand (noted when medium is coco + LED).
 */
export const NUTRIENT_TARGETS = { /* ... */ };
```

**Temperature Differentials:**

```javascript
/**
 * TEMP_DIF[priorityDimension] = {
 *   dayNightDifferential: { min: Number, max: Number }, // Celsius difference
 *   lateFlowerShift: String                              // description of late-flower strategy
 * }
 *
 * Terpene priority: larger differential (8-10C) to promote terpene production.
 *   Late flower: drop night temps to 15-18C for anthocyanin expression.
 * Yield priority: moderate differential (5-8C) to maintain metabolism.
 * Quality priority: moderate differential (6-9C) for balanced resin/terps.
 */
export const TEMP_DIF = { /* ... */ };
```

**Watering Frequency:**

```javascript
/**
 * WATERING_FREQUENCY[medium][potSizeBucket][stage] = {
 *   minDays: Number,   // minimum days between waterings
 *   maxDays: Number,   // maximum days between waterings
 *   notes: String      // guidance note
 * }
 *
 * Pot size buckets: 'small' (1-3L), 'medium' (5-7L), 'large' (10L+)
 *
 * Soil patterns:
 *   Small pot + flower: every 2-3 days
 *   Large pot + seedling: every 5-7 days
 *   General: "Lift test — water when pot feels light"
 *
 * Coco patterns:
 *   All pots in flower: daily (coco dries fast, no buffer)
 *   Veg: every 1-2 days
 *   Note: "Never let coco dry out completely"
 *
 * Hydro patterns:
 *   Continuous (reservoir-based): check reservoir daily
 *   Note: "Top off reservoir, full change weekly"
 */
export const WATERING_FREQUENCY = { /* ... */ };
```

### evidence-data.js

Maps every recommendation ID to an evidence level with optional source citation.

```javascript
/**
 * EVIDENCE[recommendationId] = {
 *   level: 'established' | 'promising' | 'speculative' | 'practitioner',
 *   source: String | null,    // Citation for established/promising items
 *   detail: String            // Brief explanation of the evidence basis
 * }
 *
 * Evidence levels:
 *   established  — Peer-reviewed research or multiple controlled studies
 *   promising    — Limited studies but consistent results
 *   speculative  — Theoretical basis, anecdotal support, needs more research
 *   practitioner — Widely accepted community practice, not formally studied
 *
 * Every recommendation ID used by the task engine, feeding calculator,
 * harvest advisor, and environment views MUST have an entry here.
 *
 * Example entries:
 *   'vpd-seedling-range': { level: 'established', source: 'Hatfield & Hui 2019', detail: 'VPD ranges for cannabis seedlings' }
 *   'coco-calmag': { level: 'established', source: 'Multiple hydroponic studies', detail: 'Coco cation exchange depletes Ca/Mg' }
 *   'terpene-temp-drop': { level: 'promising', source: 'Eichhorn Bilodeau et al. 2019', detail: 'Lower temps in late flower may preserve volatile terpenes' }
 *   'pre-harvest-dark': { level: 'speculative', source: null, detail: 'No controlled studies support 48h darkness claims' }
 *   'lift-test-watering': { level: 'practitioner', source: null, detail: 'Universal grower practice, simple and effective' }
 */
export const EVIDENCE = { /* ... */ };
```

**Recommendation ID conventions:** Use kebab-case IDs that describe the recommendation context. Group by domain:
- `vpd-*` for VPD-related recommendations
- `dli-*` for DLI-related recommendations  
- `nutrient-*` for nutrient/feeding recommendations
- `water-*` for watering recommendations
- `temp-*` for temperature recommendations
- `harvest-*` for harvest timing recommendations
- `training-*` for training method recommendations
- `stage-*` for stage transition recommendations

---

## Implementation Checklist

1. Write VPD data tests (all stages covered, plausible range 0.3-2.0, day > night temps)
2. Write DLI data tests (all stage/priority combos, priority ordering, range 10-65)
3. Write nutrient data tests (all medium/stage combos, EC progression, pH by medium, coco CalMag)
4. Write evidence data tests (all recommendation IDs covered, valid levels, established items have citations)
5. Create `/js/data/grow-knowledge.js` with VPD_TARGETS, DLI_TARGETS, NUTRIENT_TARGETS, TEMP_DIF, WATERING_FREQUENCY
6. Populate VPD_TARGETS for all stages with day/night temp, RH, and VPD ranges
7. Populate DLI_TARGETS for all stage/priority combinations
8. Populate NUTRIENT_TARGETS for all medium/stage combinations with EC, pH, NPK, CalMag
9. Populate TEMP_DIF for each priority dimension
10. Populate WATERING_FREQUENCY for all medium/pot-size/stage combinations
11. Create `/js/data/evidence-data.js` with EVIDENCE map
12. Assign evidence levels to every recommendation ID used across the app
13. Ensure all established-level entries include source citations
14. Run all data integrity tests and verify passing
15. Cross-reference with nutrient targets, VPD targets, and DLI targets to ensure no gaps
