# Section 14: Harvest Window Advisor

## Overview

The harvest advisor helps growers determine the optimal harvest window through a trichome assessment interface with three linked sliders (clear/milky/amber that always sum to 100%) and priority-based harvest recommendations. When the user reports their trichome ratios, the advisor produces a recommendation (Harvest Now / Harvest Soon / Keep Waiting) tailored to their priority settings, with trade-off notes explaining what they gain or lose by harvesting earlier or later. It also includes a stagger harvest suggestion and post-harvest drying/curing protocol recommendations.

**Tech stack:** Vanilla JS (ES modules). The trichome sliders are a custom DOM component. Harvest logic lives in a data module. The view renders at `/grow/harvest`.

---

## Dependencies

- **Section 02 (Store/Storage):** Trichome readings and harvest decisions can be stored in plant logs. Profile data (priorities) is read from the store.
- **Section 04 (Grow Knowledge):** VPD targets for drying conditions, temperature recommendations for curing, and stage-specific context come from `grow-knowledge.js`.
- **Section 06 (Priority System):** The priority engine determines which harvest window is "optimal" -- yield priority favors later harvest (more amber), terpene priority favors earlier harvest (peak milky), quality/effect priorities have nuanced recommendations.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/trichome-sliders.js` | Three linked sliders (clear/milky/amber = 100%) with proportional redistribution |
| `/js/data/harvest-advisor.js` | Trichome-to-recommendation logic, drying/curing protocols |
| `/js/views/harvest.js` | Harvest advisor view: trichome input, recommendations, post-harvest protocols (route: `/grow/harvest`) |

---

## Tests (Implement First)

### Trichome Slider Tests

- **Sum to 100%:** sliders sum to 100%
- **Proportional adjustment:** adjusting one slider proportionally adjusts others
- **Edge case (two at zero):** two at 0%, third at 100% -- moving third splits freed % equally
- **Integer snapping:** values snap to integers
- **Minimum granularity:** minimum granularity is 1%

### Recommendation Tests

- **Terpene priority harvest soon:** 80% milky + 15% amber + terpene priority produces "harvest soon"
- **Early stage keep waiting:** 90% clear + 10% milky produces "keep waiting"
- **Yield priority harvest now:** 50% amber + yield priority produces "harvest now"
- **Trade-off notes generated:** trade-off note is generated for non-dominant priorities
- **Stagger harvest suggestion:** stagger harvest suggestion appears when applicable

---

## Implementation Details

### trichome-sliders.js (Component)

Three range sliders that are mathematically linked so they always sum to exactly 100%. This is the primary input mechanism for the harvest advisor.

**Signature:**

```javascript
// trichome-sliders.js

/**
 * renderTrichomeSliders(container, options) -- Renders three linked sliders.
 *   options.initialValues -- { clear: Number, milky: Number, amber: Number } defaults to {clear: 100, milky: 0, amber: 0}
 *   options.onChange({ clear, milky, amber }) -- Callback when any slider changes
 *
 * Returns a controller object:
 *   { getValues() -- returns current {clear, milky, amber} }
 */
export function renderTrichomeSliders(container, options) { /* ... */ }

/**
 * redistributeSliders(changed, newValue, currentValues) -- Calculates new values
 *   for the other two sliders when one is adjusted.
 *   changed: 'clear' | 'milky' | 'amber' -- which slider was moved
 *   newValue: Number -- the new value for the changed slider (0-100)
 *   currentValues: { clear, milky, amber } -- current state of all three
 *
 *   Returns: { clear, milky, amber } -- all three values, summing to 100
 *
 *   Redistribution logic:
 *   - Calculate the delta (new value - old value for the changed slider)
 *   - Distribute the negative delta proportionally across the other two sliders
 *   - If both other sliders are 0, split the freed amount equally
 *   - All values snap to integers
 *   - All values are clamped to 0-100
 */
export function redistributeSliders(changed, newValue, currentValues) { /* ... */ }
```

**Proportional redistribution algorithm:**

When the user moves one slider (e.g., increases `milky` from 40 to 60):
1. Delta = 60 - 40 = +20 (milky increased by 20)
2. The other two sliders must decrease by a total of 20
3. Distribute proportionally: if `clear = 40` and `amber = 20`, their ratio is 2:1
4. Clear decreases by `20 * (40/60) = 13.3 -> 13`, amber decreases by `20 * (20/60) = 6.7 -> 7`
5. New values: clear = 27, milky = 60, amber = 13. Sum = 100.

**Edge case -- two sliders at zero:**

If `clear = 0`, `amber = 0`, `milky = 100`, and the user decreases milky to 80:
- Delta freed = 20
- Both other sliders are at 0, so proportional distribution is undefined (0/0)
- Split equally: clear = 10, amber = 10, milky = 80. Sum = 100.

**Edge case -- one slider at zero, one not:**

If `clear = 0`, `milky = 70`, `amber = 30`, and user increases amber to 50:
- Delta = +20. Clear and milky must absorb -20.
- Proportional: clear has 0, milky has 70. Ratio is 0:70, so all 20 comes from milky.
- New values: clear = 0, milky = 50, amber = 50.

**Integer snapping:** After redistribution, values are rounded to integers. A final correction step ensures the sum is exactly 100 (adjusting the largest value by +/-1 if rounding caused a 99 or 101 sum).

**Visual design:**
- Three horizontal range inputs, each with a colored track:
  - Clear: light/transparent color
  - Milky: white/cloudy color
  - Amber: warm amber/gold color
- Current percentage displayed next to each slider as a large number
- Total display below: "Total: 100%" (always, as confirmation)
- Labels: "Clear (immature)", "Milky (peak THC)", "Amber (degrading THC, more sedative)"

### harvest-advisor.js (Data + Logic Module)

Contains the recommendation logic that maps trichome ratios + priorities to harvest advice.

**Signature:**

```javascript
// harvest-advisor.js

/**
 * assessHarvest(trichomes, priorities, stage) -- Produces harvest recommendation.
 *   trichomes: { clear: Number, milky: Number, amber: Number } (sum to 100)
 *   priorities: { yield: Number, quality: Number, terpenes: Number, effect: Number }
 *   stage: String -- current stage ID (for context)
 *
 *   Returns: {
 *     recommendation: String,    // Main recommendation text
 *     urgency: 'now' | 'soon' | 'wait',
 *     urgencyLabel: String,      // "Harvest Now" | "Harvest Soon" | "Keep Waiting"
 *     tradeoffNote: String,      // What you gain/lose by waiting or harvesting
 *     staggerSuggestion: String | null, // Stagger harvest tip if applicable
 *     dryingProtocol: {
 *       tempRange: String,       // e.g., "15-17C" or "18-21C"
 *       rhRange: String,         // e.g., "55-60%"
 *       duration: String,        // e.g., "12-14 days"
 *       notes: String[]
 *     },
 *     curingProtocol: {
 *       jarRH: String,           // e.g., "58-62%"
 *       duration: String,        // e.g., "4-8 weeks minimum"
 *       burpSchedule: String,    // description of burp frequency over time
 *       notes: String[]
 *     }
 *   }
 */
export function assessHarvest(trichomes, priorities, stage) { /* ... */ }
```

**Recommendation logic by trichome ratio:**

The recommendation engine evaluates trichome ratios against priority-specific optimal windows:

**Base trichome interpretation (before priority adjustment):**
- Mostly clear (>50% clear): "Too early. Trichomes are still developing. Wait for more milky."
- Transitioning (30-50% clear, 40-60% milky, <10% amber): "Approaching harvest window. Trichomes are developing well."
- Peak milky (>70% milky, <20% amber): "Classic harvest window. Peak THC, full terpene profile."
- Milky-amber mix (50-70% milky, 15-30% amber): "Harvest window open. Balanced potency with some body effect."
- High amber (>30% amber): "Late harvest window. More sedative effect, reduced THC, heavier body stone."
- Very high amber (>50% amber): "Past peak. Significant THC degradation. Harvest immediately if not already."

**Priority-adjusted recommendations:**

- **Yield priority dominant:** Favors waiting longer. Amber up to 20-30% is acceptable because final swell adds weight. Recommendation shifts toward "wait" when milky is dominant but amber is low. Trade-off: "Waiting for 20-30% amber adds ~10-15% more bud weight but reduces peak THC by 5-10%."

- **Quality priority dominant:** Favors the classic 80% milky / 10-20% amber window. Balanced approach maximizing overall quality. Trade-off notes compare early vs late.

- **Terpene priority dominant:** Favors earlier harvest at peak milky (70-90% milky, 5-15% amber). Terpenes are most complex and volatile at peak maturity before degradation begins. Recommendation shifts toward "now" or "soon" earlier than other priorities. Trade-off: "Harvesting at peak milky preserves the most complex terpene profile. Waiting for more amber will add sedative effect but reduce terpene diversity by 5-8%."

- **Effect priority dominant:** Depends on `targetEffect` from profile:
  - Energetic/Creative: favor early harvest (high milky, low amber) for cerebral effects
  - Relaxing/Sleep/Pain-relief: favor later harvest (more amber) for body effects
  - Anti-anxiety: moderate (balanced milky/amber)

**Stagger harvest suggestion:**

Generated when trichome distribution suggests the plant has uneven ripening (common with tall plants or those without training). The suggestion appears when:
- Stage is late-flower or ripening
- Amber is 10-25% (some parts ripe, others still developing)
- Text: "Consider cutting the top colas first (they ripen faster), then lower the light closer to the remaining lower buds and give them 5-7 more days. This can increase lower bud density by 10-20%."

**Post-harvest protocols:**

Drying and curing recommendations are generated based on priority:

**Drying protocols by priority:**
- Terpene priority (dominant): 15-17C, 55-60% RH, 12-14 days. "Slower, cooler drying preserves volatile terpenes. Aim for the lower end of the temperature range."
- Yield priority (dominant): 18-21C, 55-65% RH, 10-12 days. "Standard drying conditions. Slightly faster is acceptable for yield-focused grows."
- Quality priority (dominant): 16-20C, 55-62% RH, 10-14 days. "Moderate conditions balancing speed and quality preservation."
- General notes: "Hang whole plants or large branches. Complete darkness. Gentle airflow (not pointed at plants). Stems should snap (not bend) when dry."

**Curing protocols:**
- Target jar RH: 58-62% (consistent across priorities)
- Duration: terpene priority recommends 6-12 weeks minimum; yield priority 2-4 weeks; quality 4-8 weeks
- Burp schedule: 3x/day week 1, 1x/day week 2, every 2-3 days weeks 3-4, weekly after that
- Notes vary by priority: terpene priority emphasizes patience; yield priority notes minimum cure time for smokability

### harvest.js (View)

The harvest advisor view at `/grow/harvest`.

**Signature:**

```javascript
// harvest.js

/**
 * renderHarvestView(container, store) -- Harvest advisor view.
 *   Renders trichome sliders, plant selector, assess button,
 *   recommendation display, and post-harvest protocol cards.
 */
export function renderHarvestView(container, store) { /* ... */ }
```

**Layout:**

1. **Plant selector** (if multiple plants in late flower/ripening): dropdown to select which plant is being assessed

2. **Trichome input section:**
   - Heading: "What do your trichomes look like?"
   - Brief instruction: "Use a jeweler's loupe or macro lens. Examine trichomes on the calyxes (not sugar leaves). Estimate the percentage of clear, milky, and amber trichomes."
   - Three linked sliders (from trichome-sliders.js)
   - "Assess" button triggers recommendation calculation

3. **Recommendation display** (appears after assessment):
   - Urgency badge: large colored badge -- "Harvest Now" (red/gold), "Harvest Soon" (gold), "Keep Waiting" (green)
   - Recommendation text: priority-tailored advice paragraph
   - Trade-off note: expandable card explaining what changes if the user waits or harvests now
   - Stagger suggestion (if applicable): highlighted tip card
   - Priority context: "Based on your priorities: Terpenes (5 stars), Yield (3 stars), Quality (3 stars), Effect (2 stars)"

4. **Post-harvest protocols** (expandable cards, always visible after first assessment):
   - **Drying protocol card:**
     - Recommended temperature range
     - Recommended RH range
     - Expected duration
     - Step-by-step notes (hang method, darkness, airflow, snap test)
   - **Curing protocol card:**
     - Target jar RH
     - Recommended minimum duration
     - Burp schedule breakdown by week
     - Storage tips

**Contextual display:**

If the plant is not yet in late-flower, ripening, or later stages, the view shows a message: "Harvest assessment is most useful in late flower and ripening stages. Your plant is currently in [stage name] -- come back in approximately [X days] when trichomes begin to mature."

If the grow has no active plants, redirect to dashboard (between-grows guard).

---

## Implementation Checklist

1. Write trichome slider tests (sum to 100%, proportional adjustment, two-at-zero edge case, integer snapping, 1% granularity)
2. Write recommendation tests (terpene priority harvest soon, early-stage keep waiting, yield priority harvest now, trade-off notes, stagger suggestion)
3. Create `/js/components/trichome-sliders.js` with `renderTrichomeSliders()` and `redistributeSliders()`
4. Implement proportional redistribution algorithm for three linked sliders
5. Handle edge case: two sliders at zero, equal split of freed percentage
6. Handle edge case: one slider at zero, all delta absorbed by remaining non-zero slider
7. Implement integer snapping with correction step to ensure exact sum of 100
8. Implement slider visual design with colored tracks and percentage displays
9. Create `/js/data/harvest-advisor.js` with `assessHarvest()`
10. Implement base trichome interpretation logic (clear/milky/amber ratio evaluation)
11. Implement yield priority harvest recommendation adjustments
12. Implement quality priority harvest recommendation adjustments
13. Implement terpene priority harvest recommendation adjustments (earlier harvest)
14. Implement effect priority adjustments based on targetEffect (energetic vs relaxing)
15. Implement trade-off note generation comparing early vs late harvest
16. Implement stagger harvest suggestion logic
17. Implement drying protocol generation by priority (temperature, RH, duration)
18. Implement curing protocol generation (jar RH, duration, burp schedule)
19. Create `/js/views/harvest.js` with `renderHarvestView()`
20. Implement plant selector for multi-plant grows
21. Implement trichome input section with instructions and sliders
22. Implement recommendation display with urgency badge, text, trade-off, stagger
23. Implement post-harvest protocol cards (drying and curing)
24. Implement contextual display for plants not yet in late flower
25. Run all trichome slider tests and verify passing
26. Run all recommendation tests and verify passing
27. Test full flow: set sliders -> assess -> view recommendation -> expand protocols
28. Test with different priority combinations to verify trade-off note variety
