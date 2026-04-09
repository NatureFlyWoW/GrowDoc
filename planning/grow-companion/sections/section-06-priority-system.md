# Section 06: Priority System UI

## Overview

This section builds the star-rating UI component (1-5 stars per priority dimension), the weight calculation engine that converts star ratings into relative weights, the priority-adjusted target blending logic, and the effect type selector. The priority system influences every recommendation in the app -- environment targets, feeding schedules, harvest timing, and task generation all vary based on the user's priority balance.

**Design note:** The original spec mentioned "slider-based" priorities. This was superseded during stakeholder review to 1-5 star ratings per dimension. Stars are simpler UI, and the app calculates relative weights internally.

**Priority dimensions and colors:**
- Yield = green (`--priority-yield: #8fb856`)
- Quality = gold (`--priority-quality: #d4a843`)
- Terpenes = purple (`--priority-terpenes: #9b6cc0`)
- Effect = indigo (`--priority-effect: #5c6bc0`)

**Tech stack:** Vanilla JS (ES modules). The star-rating component is a reusable DOM component. The priority engine is a pure calculation module.

---

## Dependencies

- **Section 02 (Store/Storage):** Priority values are persisted in `profile.priorities` in the store.

## Blocks

- **Section 08 (Task Engine):** Task generation uses priority weights to adjust recommendation parameters.
- **Section 09 (Dashboard):** Dashboard displays priority-weighted recommendations.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/star-rating.js` | Reusable 1-5 star rating input component |
| `/js/data/priority-engine.js` | Weight calculation and target blending logic |

---

## Tests (Implement First)

The TDD plan refers to these as "Section 7: Priority System UI" in the test file.

### Star Rating Tests

- **Click sets rating:** clicking star N sets rating to N
- **Toggle deselect:** clicking same star toggles to N-1 (allows deselect)
- **Store update:** rating change updates store
- **Effect type visibility (show):** effect type selector shows when Effect >= 3
- **Effect type visibility (hide):** effect type selector hides when Effect < 3

### Weight Calculation Tests

- **Equal stars = equal weights:** equal stars produce equal weights
- **All-zero handling:** all-zero stars handled gracefully (default to equal)
- **Weights sum to 1.0:** weights sum to 1.0 (within floating point tolerance)
- **Dominant weight:** single priority at 5, others at 1, produces dominant weight

---

## Implementation Details

### star-rating.js (Component)

A reusable component that renders a labeled row of 5 clickable/tappable stars for a single priority dimension. Used in:
- Onboarding wizard step 9 (four instances, one per dimension)
- Settings page priority editor

**Rendering:**

Each star-rating instance renders:
- A label with the priority name and its associated color
- 5 star icons in a horizontal row
- Stars 1 through N are "filled" (solid color), stars N+1 through 5 are "empty" (outline)
- The filled color uses the dimension's priority color variable

**Interaction:**
- Click on star N sets the rating to N
- Click on the currently-selected star toggles the rating to N-1 (partial deselect). If star 1 is clicked while rating is 1, rating goes to 0.
- On any change, the component calls back to the parent (store update or wizard state update)

**Effect type selector:**
- When the Effect dimension's rating reaches >= 3, reveal an additional dropdown selector below the Effect stars
- Dropdown options: Energetic, Relaxing, Creative, Pain Relief, Anti-Anxiety, Sleep
- When Effect drops below 3, hide the dropdown and clear the selection (set `targetEffect` to null)

**Accessibility:**
- The star row uses `role="radiogroup"` with `aria-label` set to the priority name
- Each star is a focusable element with `role="radio"` and `aria-checked`
- Arrow keys (left/right) navigate between stars
- Space/Enter toggles the focused star
- The component announces changes via `aria-live="polite"` region

**Signature:**

```javascript
// star-rating.js

/**
 * renderStarRating(container, options) — Renders a star rating into the container.
 *   options.name       — Priority dimension name ('yield', 'quality', 'terpenes', 'effect')
 *   options.label      — Display label ('Yield', 'Quality', 'Terpenes', 'Effect')
 *   options.color      — CSS color variable name (e.g., '--priority-yield')
 *   options.value      — Initial value (1-5, default 3)
 *   options.onChange(value) — Callback when rating changes
 *
 * renderEffectSelector(container, options) — Renders the effect type dropdown.
 *   options.value      — Initial selection (string or null)
 *   options.onChange(value) — Callback when selection changes
 *   options.visible    — Whether to show the selector initially
 */
export function renderStarRating(container, options) { /* ... */ }
export function renderEffectSelector(container, options) { /* ... */ }
```

### Priority Display Widget

A compact read-only visualization showing the current priority balance. Displayed in settings and optionally on the dashboard.

**Rendering options (pick one):**
- Four colored horizontal bars, length proportional to star count (1-5)
- Four labeled star counts with colored icons

Includes a brief explainer text: "These priorities affect all recommendations throughout the app."

### priority-engine.js (Calculation Module)

Pure functions that convert star ratings into normalized weights and blend parameter targets.

**Weight calculation:**

The algorithm normalizes star ratings into weights that sum to 1.0. Stars are first converted to a relative scale, then normalized.

```javascript
/**
 * calculateWeights(priorities) -> { yield: Number, quality: Number, terpenes: Number, effect: Number }
 *
 * Input: { yield: 1-5, quality: 1-5, terpenes: 1-5, effect: 1-5 }
 * Output: weights summing to 1.0
 *
 * Algorithm:
 *   1. Sum all star values: total = yield + quality + terpenes + effect
 *   2. If total is 0, return equal weights { yield: 0.25, quality: 0.25, terpenes: 0.25, effect: 0.25 }
 *   3. Otherwise: weight[dim] = stars[dim] / total
 *
 * Example:
 *   Input: { yield: 5, quality: 3, terpenes: 5, effect: 1 }
 *   Total: 14
 *   Output: { yield: 0.357, quality: 0.214, terpenes: 0.357, effect: 0.071 }
 *
 * Edge cases:
 *   All zeros: return equal weights (0.25 each)
 *   Single dimension at 5, rest at 1: dominant weight (5/8 = 0.625)
 */
export function calculateWeights(priorities) { /* ... */ }
```

**Target blending:**

Takes a parameter that has different optimal values per priority dimension and returns a weighted blend.

```javascript
/**
 * blendTarget(parameterByPriority, weights) -> Number
 *
 * Input:
 *   parameterByPriority: { yield: Number, quality: Number, terpenes: Number }
 *     (effect usually does not alter numeric targets, so it may be absent)
 *   weights: { yield: Number, quality: Number, terpenes: Number, effect: Number }
 *
 * Output: Weighted average of the parameter values.
 *
 * Example:
 *   DLI optimal for mid-flower: { yield: 45, quality: 40, terpenes: 35 }
 *   weights: { yield: 0.357, quality: 0.214, terpenes: 0.357, effect: 0.071 }
 *   result = 45*0.357 + 40*0.214 + 35*0.357 = 16.065 + 8.56 + 12.495 = 37.12
 *   (effect weight is redistributed proportionally among the three that matter)
 *
 * When effect weight is non-trivial but the parameter has no effect dimension,
 * redistribute the effect weight proportionally among the other three dimensions.
 */
export function blendTarget(parameterByPriority, weights) { /* ... */ }
```

**Recommendation with trade-off notes:**

```javascript
/**
 * getRecommendation(param, stage, medium, priorities) -> {
 *   value: Number,         // blended target value
 *   range: { min: Number, max: Number },  // acceptable range
 *   tradeoffNote: String | null           // note about trade-offs if priorities conflict
 * }
 *
 * Trade-off note generation:
 *   When the dominant priority pushes the target significantly away from what
 *   another highly-rated priority would prefer, generate a note.
 *
 *   Example: If yield is 5 stars and terpenes is 4 stars, but the DLI target
 *   for yield is much higher than for terpenes:
 *   "Higher DLI benefits yield but may reduce terpene complexity.
 *    Your terpene priority (4 stars) suggests keeping DLI below [max]."
 *
 *   Rules for generating notes:
 *   - Only generate when two priorities with >= 3 stars pull in different directions
 *   - Be specific about the trade-off (what is gained, what is lost)
 *   - Include the star values for context
 */
export function getRecommendation(param, stage, medium, priorities) { /* ... */ }
```

---

## Implementation Checklist

1. [x] Write star rating tests (click sets rating, toggle deselect, store update, effect type show/hide)
2. [x] Write weight calculation tests (equal weights, all-zero handling, sum to 1.0, dominant weight)
3. [x] Create `/js/components/star-rating.js` with star rendering, click/toggle interaction, and effect type selector
4. [x] Implement star click handling (set to N, toggle N-1 on re-click)
5. [x] Implement effect type selector show/hide based on Effect >= 3 threshold
6. [x] Implement accessibility (radiogroup role, keyboard navigation, aria-live)
7. [x] Create `/js/data/priority-engine.js` with calculateWeights, blendTarget, getRecommendation
8. [x] Implement weight calculation with normalization and all-zero edge case
9. [x] Implement target blending with effect weight redistribution
10. [x] Implement trade-off note generation logic
11. [x] Create priority display widget (compact bar visualization with CSS)
12. [x] Run all star rating tests and verify passing
13. [x] Run all weight calculation tests and verify passing
14. [x] Refactor onboarding wizard step 9 to use reusable star-rating component
15. [x] Test priority engine with DLI_TARGETS and TEMP_DIF from grow-knowledge.js

## Actual Files Created/Modified

| File | Status | Notes |
|------|--------|-------|
| `/js/components/star-rating.js` | Created | renderStarRating, renderEffectSelector, renderPriorityDisplay |
| `/js/data/priority-engine.js` | Created | calculateWeights, blendTarget, getRecommendation (DLI + temp_dif) |
| `/js/tests/priority-system.test.js` | Created | 20 tests covering star rating + weight calculation + blending |
| `/js/views/onboarding.js` | Modified | Refactored step 9 to use reusable components, removed dead EFFECT_TYPES |
| `/js/main.js` | Modified | Registered priority-system test module |
| `/css/onboarding.css` | Modified | Added priority-display widget styles |

## Deviations from Plan

- **Roving tabindex added** (not in original spec): Code review caught that tabindex was stale after rating changes. Fixed with proper roving tabindex in updateStars().
- **idSuffix added to renderEffectSelector**: Prevents duplicate IDs when multiple instances exist (onboarding + settings).
- **`medium` param in getRecommendation**: Accepted but not used yet. Reserved for section-12 (feeding schedule).
