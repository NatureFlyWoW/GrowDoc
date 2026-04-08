# Section 12: Feeding Schedule & Nutrient Calculator

## Overview

This section builds a view showing recommended feeding parameters for the current stage, medium, and priority blend, along with a nutrient calculator that compares actual readings to targets. The feeding schedule is brand-agnostic -- it works with N-P-K ratios, EC, and pH rather than specific product lines. The priority system shifts feeding targets (yield priority increases EC, terpene priority lowers it), and medium-specific advice handles the key differences between soil, coco, and hydro.

**Tech stack:** Vanilla JS (ES modules). Feeding data comes from `grow-knowledge.js` and `feeding-calculator.js` data modules. The view renders into the main content area at route `/grow/feeding`.

---

## Dependencies

- **Section 02 (Store/Storage):** Profile data (medium, stage, priorities) is read from the reactive store.
- **Section 04 (Grow Knowledge):** `NUTRIENT_TARGETS[medium][stage]` provides EC, pH, N-P-K ratio, and CalMag data. `DLI_TARGETS` and `TEMP_DIF` inform supplementary advice.
- **Section 06 (Priority System):** The priority engine blends feeding targets based on star ratings. Yield priority increases EC targets; terpene priority lowers them.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/data/feeding-calculator.js` | Feeding schedule data and calculator logic: EC/pH/NPK targets by medium, stage, priority |
| `/js/views/feeding.js` | Feeding schedule view with recommendation card, overview table, and nutrient calculator (route: `/grow/feeding`) |

---

## Tests (Implement First)

### Schedule Tests

- **Soil/veg targets:** soil/veg returns correct N-P-K ratio and EC range
- **Coco/flower CalMag:** coco/flower returns CalMag requirement note
- **Hydro reservoir warning:** hydro returns reservoir temp warning
- **Terpene priority EC:** terpene priority reduces EC target vs yield priority

### Calculator Tests

- **EC above target:** EC above target range generates "reduce" advice
- **EC below target:** EC below target range generates "increase" advice
- **pH out of range:** pH out of range generates specific correction advice

---

## Implementation Details

### feeding-calculator.js (Data + Logic Module)

This module contains the nutrient target data and the calculator functions that compare actual readings to targets.

**Signature:**

```javascript
// feeding-calculator.js

/**
 * getFeedingSchedule(medium, stage, priorities) -- Returns feeding targets
 *   for the given medium, stage, and priority blend.
 *
 *   Returns: {
 *     ecTarget: { min: Number, max: Number },
 *     phTarget: { min: Number, max: Number },
 *     npkRatio: String,           // e.g., "3-1-2" for veg, "1-3-2" for flower
 *     calmagRequired: Boolean,    // true for coco, especially under LED
 *     calmagDose: String,         // e.g., "1-2 ml/L" or null
 *     notes: String[],            // medium-specific tips
 *     evidence: String            // evidence level for this recommendation
 *   }
 */
export function getFeedingSchedule(medium, stage, priorities) { /* ... */ }

/**
 * compareToTarget(actualEC, actualPH, medium, stage, priorities) -- Compares
 *   actual readings to target ranges and returns advice.
 *
 *   Returns: {
 *     ecStatus: 'on-target' | 'above' | 'below',
 *     ecAdvice: String,           // specific adjustment suggestion
 *     phStatus: 'on-target' | 'above' | 'below',
 *     phAdvice: String,           // specific correction advice
 *     overallStatus: 'good' | 'adjust' | 'concern'
 *   }
 */
export function compareToTarget(actualEC, actualPH, medium, stage, priorities) { /* ... */ }
```

**Nutrient target data structure:**

The raw data lives in `grow-knowledge.js` as `NUTRIENT_TARGETS[medium][stage]`. The feeding calculator reads this data and applies priority blending.

Key data points by medium and stage:

**Soil:**
- Seedling: EC 0.4-0.8, pH 6.2-6.8, N-P-K ratio heavy N (3-1-2)
- Veg: EC 0.8-1.4, pH 6.0-6.8, N-P-K ratio heavy N (3-1-2)
- Early Flower: EC 1.2-1.8, pH 6.0-6.5, N-P-K shifting to P-K (1-3-2)
- Mid Flower: EC 1.4-2.0, pH 6.0-6.5, N-P-K heavy P-K (0-3-3)
- Late Flower: EC 1.0-1.6, pH 6.0-6.5, N-P-K reduced (tapering)
- Ripening: EC 0.4-0.8, pH 6.0-6.5, minimal nutrients

**Coco:**
- Seedling: EC 0.4-0.6, pH 5.5-6.0, N-P-K (3-1-2), CalMag always required
- Veg: EC 0.8-1.2, pH 5.5-6.0, N-P-K (3-1-2), CalMag 1-2 ml/L
- Early Flower: EC 1.2-1.6, pH 5.5-6.0, N-P-K (1-3-2), CalMag 1-2 ml/L
- Mid Flower: EC 1.4-1.8, pH 5.5-6.0, N-P-K (0-3-3), CalMag 1 ml/L
- Late Flower: EC 1.0-1.4, pH 5.5-6.0, tapering, CalMag 0.5-1 ml/L
- Ripening: EC 0.2-0.6, pH 5.5-6.0, minimal

**Hydro:**
- Similar to coco ranges but pH 5.5-6.5
- Additional note: reservoir temperature should be 18-21C to prevent root rot
- CalMag required, especially under LED
- EC tends to run slightly lower than coco (roots have direct access)

**Priority blending effect on EC:**

The priority engine adjusts EC targets:
- Yield priority (5 stars): EC target shifts up by ~10-15% (more nutrients = more growth)
- Quality priority (5 stars): EC target stays at baseline (balanced approach)
- Terpene priority (5 stars): EC target shifts down by ~10-15% (mild nutrient stress enhances terpene production)
- Effect priority: no direct EC adjustment (effect is influenced by harvest timing, not feeding)

Example: If base EC for soil/mid-flower is 1.4-2.0, and user has terpene priority at 5 stars with yield at 2:
- Blended EC target might be 1.2-1.7 (shifted down toward terpene optimization)
- Trade-off note: "Your terpene priority reduces EC targets slightly. This mild nutrient stress can enhance terpene production at the cost of ~5-10% less flower weight."

**N-P-K ratio descriptions:**

Ratios are described as general proportions rather than exact numbers, keeping the system brand-agnostic:
- "High Nitrogen (3-1-2)" -- vegetative growth focus
- "Balanced transition (2-2-2)" -- early flower transition
- "High Phosphorus-Potassium (1-3-2)" -- bud development
- "Heavy P-K (0-3-3)" -- peak flower, maximize bud density
- "Taper (1-1-1 reduced)" -- late flower, reducing inputs

**Medium-specific advice notes:**

The `notes[]` array in the return value includes advice specific to the medium:

- **Soil:** "Alternate water-only and nutrient feeds. Soil has buffering capacity -- small pH fluctuations are absorbed." "If runoff EC exceeds input EC by more than 0.5, flush with plain pH'd water."
- **Coco:** "CalMag is essential in coco, especially under LED lighting where calcium uptake is lower." "Feed with every watering -- coco has no nutrient buffering." "Target 10-20% runoff to prevent salt buildup."
- **Hydro:** "Check reservoir pH and EC daily -- drift is common." "Keep reservoir temperature between 18-21C to prevent root rot and maintain dissolved oxygen." "Top off with half-strength solution between full changes."

### feeding.js (View)

The feeding view at `/grow/feeding` displays the current feeding recommendation and provides the nutrient calculator.

**Signature:**

```javascript
// feeding.js

/**
 * renderFeedingView(container, store) -- Full feeding schedule view.
 *   Shows current recommendation card, stage overview table,
 *   nutrient calculator, and priority adjustment explanation.
 */
export function renderFeedingView(container, store) { /* ... */ }
```

**Current feeding recommendation card:**

A prominent card showing the feeding targets for the user's current situation:
- Heading: "Feeding Targets -- [Stage Name] in [Medium]"
- EC target range: large, color-coded (green if recent log is in range)
- pH target range: large, color-coded
- N-P-K ratio description
- CalMag note (if applicable): highlighted in a callout box
- Medium-specific advice notes
- Evidence level badge
- Priority adjustment note (if priorities shift targets from default)

**Stage-by-stage feeding overview table:**

A scrollable table showing feeding targets across all stages for the user's medium:

| Stage | EC Range | pH Range | N-P-K | CalMag | Notes |
|-------|----------|----------|-------|--------|-------|

The current stage row is highlighted with the accent color. This gives users a forward-looking view of how feeding changes throughout the grow.

**Nutrient calculator:**

An interactive section where users input their current nutrient solution readings and get comparison advice.

Input fields:
- Current EC (number input, step 0.1)
- Current pH (number input, step 0.1)

Output (updates on input change or "Compare" button):
- EC status: "On target (1.6 is within 1.4-2.0)" or "Above target (2.4 is 0.4 above the 1.4-2.0 range) -- reduce base nutrient concentration by ~20%"
- pH status: "On target" or "Below target (5.2 is below 5.5-6.0) -- add pH Up. For coco, small amounts of potassium silicate can raise pH while providing silicon benefits."
- Overall assessment with color indicator (green/gold/red)

**Priority adjustment explanation:**

A collapsible section explaining how the user's priorities affect feeding:
- Shows the user's current priority star ratings
- Explains which priorities shift EC and how
- Shows the delta between default targets and priority-adjusted targets
- "These adjustments are based on Franco's cultivation protocols: higher terpene priority slightly reduces nutrient concentration to create mild stress that enhances volatile terpene production."

---

## Implementation Checklist

1. Write schedule tests (soil/veg N-P-K and EC, coco/flower CalMag note, hydro reservoir warning, terpene priority EC reduction)
2. Write calculator tests (EC above/below target advice, pH out of range correction advice)
3. Create `/js/data/feeding-calculator.js` with `getFeedingSchedule()` and `compareToTarget()`
4. Implement `getFeedingSchedule()` reading from `NUTRIENT_TARGETS` and applying priority blending
5. Implement EC target adjustment based on priority weights
6. Implement N-P-K ratio descriptions for each stage
7. Implement CalMag requirement detection (coco + LED especially)
8. Implement medium-specific advice note generation
9. Implement `compareToTarget()` with specific adjustment suggestions
10. Implement EC comparison logic with percentage-based reduction/increase advice
11. Implement pH comparison logic with medium-specific correction advice
12. Create `/js/views/feeding.js` with `renderFeedingView()`
13. Implement current feeding recommendation card with all target displays
14. Implement stage-by-stage overview table with current stage highlighting
15. Implement nutrient calculator with live EC/pH comparison
16. Implement priority adjustment explanation section
17. Implement trade-off note display for priority-shifted targets
18. Run all feeding schedule tests and verify passing
19. Run all calculator tests and verify passing
20. Test feeding view with different medium/stage/priority combinations
21. Verify CalMag notes appear correctly for coco + LED setups
