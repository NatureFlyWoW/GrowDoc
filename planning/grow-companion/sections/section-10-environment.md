# Section 10: Environment Dashboard & Tracking

## Overview

This section builds the environment monitoring and tracking system: a compact VPD widget for the dashboard, a full environment logging view with trend graphs, a DLI calculator, and a temperature differential advisor. Environment readings are logged daily (temp highs/lows, RH highs/lows), VPD is calculated automatically, and simple SVG trend charts show environmental conditions over time. Drift detection alerts the user when conditions deviate from optimal.

**Tech stack:** Vanilla JS (ES modules). Charts are rendered as inline SVG elements (no chart library). All environment data is stored in `environment.readings[]` in localStorage via the store.

---

## Dependencies

- **Section 02 (Store/Storage):** Environment readings are stored in `environment.readings[]` in the reactive store. The compaction strategy (daily to weekly for readings >30 days old) is handled by storage.js.
- **Section 04 (Grow Knowledge):** VPD targets by stage, DLI targets by stage and priority, and temperature differential recommendations come from `grow-knowledge.js`.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/vpd-widget.js` | Compact VPD calculator/status widget for the dashboard |
| `/js/components/env-chart.js` | Simple SVG trend line chart for temp/RH/VPD over time |
| `/js/views/environment.js` | Full environment view with logging, calculators, and charts (route: `/grow/environment`) |

---

## Tests (Implement First)

### VPD Calculator Tests

- **Known input correctness:** VPD formula produces correct result for known inputs (25C, 60% RH)
- **LED leaf-temp offset:** LED leaf-temp offset is -2C, HPS offset is -1C
- **Optimal status:** status is "optimal" when VPD in target range for current stage
- **Out of range status:** status is "high" or "low" when outside range

### DLI Calculator Tests

- **Formula verification:** DLI = PPFD * hours * 0.0036 (verify with known values)
- **18h veg calculation:** 400 PPFD at 18h = 25.9 DLI
- **12h flower calculation:** 800 PPFD at 12h = 34.6 DLI

### Environment Logging Tests

- **Reading storage:** logging a reading adds to environment.readings array
- **Compaction:** readings older than 30 days are compacted to weekly averages
- **Trend data:** trend data returns correct number of data points for selected range

### Chart Tests

- **Data point count:** chart SVG renders with correct number of data points
- **Empty data:** chart handles empty data set (no crash)
- **Single point:** chart handles single data point

---

## Implementation Details

### vpd-widget.js (Dashboard Component)

A compact card for the dashboard sidebar showing current VPD status. This is the widget consumed by section 09 (dashboard).

**VPD calculation:**

The Vapour Pressure Deficit formula accounts for leaf temperature offset based on lighting type:

```
Leaf temp = Air temp + offset
  - LED offset: -2C (LEDs run cooler, leaves are cooler than air)
  - HPS offset: -1C (HPS radiates heat, less leaf-air differential)
  - CFL/Fluorescent offset: -1C

SVP_air = 0.6108 * exp((17.27 * airTemp) / (airTemp + 237.3))
SVP_leaf = 0.6108 * exp((17.27 * leafTemp) / (leafTemp + 237.3))
VPD = SVP_leaf - (SVP_air * RH / 100)
```

**Signature:**

```javascript
// vpd-widget.js

/**
 * calculateVPD(tempC, rhPercent, lightingType) -- Calculates VPD in kPa.
 *   Applies leaf-temp offset based on lighting type.
 *   Returns: { vpd: Number, leafTemp: Number, status: String }
 *   Status is determined by comparing VPD to target range for current stage.
 */
export function calculateVPD(tempC, rhPercent, lightingType) { /* ... */ }

/**
 * getVPDStatus(vpd, stage) -- Compares VPD to target range for current stage.
 *   Returns: 'optimal' | 'high' | 'low' | 'critical-high' | 'critical-low'
 *   Uses VPD_TARGETS from grow-knowledge.js.
 *   Optimal: within target range. High/Low: within 20% of range boundary.
 *   Critical: >20% outside range.
 */
export function getVPDStatus(vpd, stage) { /* ... */ }

/**
 * renderVPDWidget(container, store) -- Renders the compact VPD widget.
 *   Shows: VPD value, status text, last reading time, color-coded border.
 *   "Update" button reveals inline temp/RH inputs.
 *   "Full view" link navigates to /grow/environment.
 */
export function renderVPDWidget(container, store) { /* ... */ }
```

**Visual design:**
- Card with color-coded left border: green (optimal), gold (borderline), red (out of range)
- Main display: VPD value in large text (e.g., "1.12 kPa")
- Status text below: "Optimal for Mid Flower" or "High -- lower temperature or raise humidity"
- Last reading timestamp: "Updated 2h ago"
- "Update" button expands to show:
  - Temperature input (C)
  - Relative Humidity input (%)
  - "Save" button that calculates VPD, stores reading, and refreshes widget
- "Full view" link at bottom

### environment.js (Full Environment View)

The full environment page at `/grow/environment` provides comprehensive environment logging, calculators, and trend visualization.

**Signature:**

```javascript
// environment.js (view)

/**
 * renderEnvironmentView(container, store) -- Full environment tracking view.
 *   Sections: daily logging form, VPD calculator, DLI calculator,
 *   temperature differential display, nutrient targets, trend charts.
 */
export function renderEnvironmentView(container, store) { /* ... */ }
```

**Daily logging form:**

Input fields for today's environment readings:
- Temperature High (C) -- highest temp recorded today
- Temperature Low (C) -- lowest temp recorded today
- RH High (%) -- highest humidity today
- RH Low (%) -- lowest humidity today

On submit: creates an entry in `environment.readings[]` with the shape:
```javascript
{
  date: String,       // ISO date (YYYY-MM-DD)
  tempHigh: Number,
  tempLow: Number,
  rhHigh: Number,
  rhLow: Number,
  vpdDay: Number,     // calculated from tempHigh + average RH
  vpdNight: Number    // calculated from tempLow + average RH
}
```

The VPD values are auto-calculated when the form is submitted. Day VPD uses tempHigh with average RH; night VPD uses tempLow with average RH. Both apply the leaf-temp offset for the user's lighting type.

**VPD calculator (live):**

As the user types temp and RH values, VPD updates in real-time below the inputs. Displays:
- Calculated VPD value
- Target range for current stage (from `VPD_TARGETS[currentStage]`)
- Status: optimal / high / low
- Recommended adjustments if out of range

**DLI calculator:**

A separate calculator section:
- Input: PPFD (micromoles/m2/s)
- Input: Photoperiod (hours of light) -- pre-filled from `profile.photoperiodHours`
- Output: DLI = PPFD * hours * 0.0036 (mol/m2/day)
- Display: target DLI range for current stage and priority (from `DLI_TARGETS[stage][priority]`)
- Status: "On target" / "Below target -- increase light intensity or duration" / "Above target -- risk of light stress"

The DLI formula: `DLI = PPFD * photoperiod_seconds / 1,000,000`. With hours: `DLI = PPFD * hours * 3600 / 1,000,000 = PPFD * hours * 0.0036`.

**Temperature differential display:**

Shows current day/night temperature difference vs recommended:
- Current differential: `tempHigh - tempLow`
- Recommended differential from `TEMP_DIF[priority]` in grow-knowledge.js
- Typical recommendation: 5-10C differential for most stages. Terpene priority favors larger differential in late flower.
- If current differential deviates significantly, show adjustment advice

**Nutrient targets display:**

Shows current EC/pH targets for the user's medium, stage, and priority blend:
- Target EC range
- Target pH range
- CalMag note if applicable (coco + LED)
- This is a read-only reference panel (actual feeding tracking is in section 12)

### env-chart.js (SVG Trend Charts)

Simple line charts rendered as inline SVG. No external charting library.

**Signature:**

```javascript
// env-chart.js

/**
 * renderTrendChart(container, options) -- Renders an SVG line chart.
 *   options.data      -- Array of {date, value} data points
 *   options.label     -- Chart title (e.g., "Temperature", "VPD")
 *   options.unit      -- Unit string (e.g., "C", "kPa", "%")
 *   options.targetMin -- Optional lower bound of optimal range (draws shaded band)
 *   options.targetMax -- Optional upper bound of optimal range
 *   options.width     -- Chart width in pixels (default: container width)
 *   options.height    -- Chart height in pixels (default: 200)
 *   options.color     -- Line color (default: accent green)
 */
export function renderTrendChart(container, options) { /* ... */ }
```

**Chart rendering:**

- X-axis: dates, labeled at intervals (every 7 days for 30-day view, every 3 days for 14-day view)
- Y-axis: values with auto-scaled range (min to max of data, with padding)
- Line: SVG `<polyline>` connecting data points
- Data points: small circles at each measurement
- Optimal range: semi-transparent shaded rectangle between `targetMin` and `targetMax`
- Hover/click on data point shows tooltip with exact date + value

**Time range selector:** Buttons above charts to select 14 / 30 / 60 day views. The chart filters data points to the selected range.

**Charts displayed on the environment view:**
1. Temperature chart: two lines (tempHigh in warm color, tempLow in cool color) with optimal range band
2. Humidity chart: two lines (rhHigh, rhLow) with optimal range band
3. VPD chart: one line (day VPD) with optimal range band for current stage

**Edge cases:**
- Empty data (no readings yet): show a placeholder message "Log your first reading to see trends"
- Single data point: show the point without a connecting line
- Missing days: connect available points (skip gaps)

### Drift Detection

When the environment view renders, it calculates a 7-day moving average for VPD and compares it to the target range for the current stage. If the average deviates more than 10% from the target range boundary:

- Show a warning banner at the top of the environment view
- Generate an environment alert task in the task engine (via `evaluateEnvironmentTriggers`)
- Warning text: "Your 7-day average VPD is [value] kPa, which is [X%] [above/below] the optimal range for [stage]. Adjust [temperature/humidity] to bring it back in range."

### Data Compaction

Environment readings older than 30 days are compacted from daily to weekly averages. This is handled by `storage.js` (section 02) during the compaction cycle. The compacted entries have the same shape but the `date` field represents the start of the week, and all values are averages.

The compaction reduces environment data by approximately 75% over time, keeping the app well within the localStorage 5MB budget.

---

## Implementation Checklist

1. Write VPD calculator tests (known inputs, LED/HPS offset, optimal/high/low status)
2. Write DLI calculator tests (formula verification, 18h veg, 12h flower)
3. Write environment logging tests (reading storage, compaction, trend data)
4. Write chart tests (data point count, empty data, single point)
5. Create `/js/components/vpd-widget.js` with `calculateVPD()` and `renderVPDWidget()`
6. Implement VPD formula with leaf-temp offset for LED (-2C), HPS (-1C), CFL (-1C)
7. Implement `getVPDStatus()` comparing VPD to stage-specific targets
8. Implement compact VPD widget with color-coded border and inline update form
9. Create `/js/views/environment.js` with `renderEnvironmentView()`
10. Implement daily logging form (temp high/low, RH high/low) with auto VPD calculation
11. Implement live VPD calculator with real-time updates as user types
12. Implement DLI calculator (PPFD * hours * 0.0036) with target range display
13. Implement temperature differential display with priority-adjusted recommendations
14. Implement nutrient targets reference panel (read-only)
15. Create `/js/components/env-chart.js` with `renderTrendChart()`
16. Implement SVG line chart rendering (polyline, data points, axis labels)
17. Implement optimal range shading (semi-transparent band)
18. Implement time range selector (14/30/60 days)
19. Implement hover/click tooltips on data points
20. Handle chart edge cases (empty data, single point, missing days)
21. Implement drift detection (7-day moving average vs target range)
22. Implement drift warning banner
23. Run all environment tests and verify passing
24. Test VPD widget integration with dashboard (section 09)
25. Test chart rendering with various data volumes
