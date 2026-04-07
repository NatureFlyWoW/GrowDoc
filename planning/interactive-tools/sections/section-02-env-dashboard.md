# Section 2: Environment Dashboard (VPD + DLI Calculator)

## Overview

Build `docs/tool-env-dashboard.html` — a single-page interactive environment calculator combining VPD calculator with CSS-grid heatmap and DLI calculator with gauge bar. Pure calculation, real-time updates on every input change, localStorage for remembering last inputs.

**File to create:** `docs/tool-env-dashboard.html`
**Depends on:** Section 01 (sidebar integration)

---

## Tests First

### Console Tests (embed as runTests())

```js
function runTests() {
  let pass = 0, fail = 0;
  function assert(condition, msg) {
    if (condition) { pass++; console.log('PASS: ' + msg); }
    else { fail++; console.error('FAIL: ' + msg); }
  }

  // VPD at 25C, 60% RH, -2 offset → ~0.91 kPa
  const vpd1 = calcVPD(25, 60, -2);
  assert(Math.abs(vpd1 - 0.91) < 0.05, 'VPD at 25C/60%/-2 offset ~ 0.91');

  // VPD at 20C, 50% RH, 0 offset → ~1.17 kPa
  const vpd2 = calcVPD(20, 50, 0);
  assert(Math.abs(vpd2 - 1.17) < 0.05, 'VPD at 20C/50%/0 offset ~ 1.17');

  // Edge: near 0C, 100% RH → VPD near 0
  assert(calcVPD(1, 100, 0) < 0.05, 'VPD near 0 at ~0C/100%RH');

  // Edge: 45C, 10% RH → high VPD
  assert(calcVPD(45, 10, -2) > 5, 'VPD high at 45C/10%RH');

  // DLI: 400 PPFD × 18h = 25.92
  assert(Math.abs(calcDLI(400, 18) - 25.92) < 0.01, 'DLI 400*18 = 25.92');

  // DLI: 600 PPFD × 12h = 25.92
  assert(Math.abs(calcDLI(600, 12) - 25.92) < 0.01, 'DLI 600*12 = 25.92');

  // Zone classification
  assert(getZone(0.6, 'seedling') === 'optimal', '0.6 optimal for seedling');
  assert(getZone(1.0, 'veg') === 'optimal', '1.0 optimal for veg');
  assert(getZone(2.0, 'veg') === 'danger', '2.0 danger for veg');

  // Chart has 65 cells
  assert(document.querySelectorAll('.vpd-cell').length === 65, '65 VPD cells');

  // Position marker exists
  assert(document.querySelector('.vpd-marker') !== null, 'Marker exists');

  // localStorage round-trip
  try {
    const td = { version: 1, lastInputs: { temp: 25, rh: 60, offset: -2, stage: 'veg', ppfd: 400, photoperiod: 18 } };
    localStorage.setItem('growdoc-env-dashboard', JSON.stringify(td));
    const loaded = JSON.parse(localStorage.getItem('growdoc-env-dashboard'));
    assert(loaded.lastInputs.temp === 25, 'localStorage round-trip');
  } catch(e) { assert(false, 'localStorage: ' + e.message); }

  console.log('--- ' + pass + ' passed, ' + fail + ' failed ---');
}
```

### Manual Verification
- [ ] Entering temp/RH immediately shows VPD (no submit button)
- [ ] VPD color: green=optimal, gold=acceptable, red=danger
- [ ] Stage change updates chart zone colors and advice
- [ ] Pulsing dot on chart at user's position
- [ ] DLI bar fills with correct gradient
- [ ] Photoperiod auto-sets (18h veg, 12h flower)
- [ ] Advice text updates for different zones
- [ ] Inputs persist across reload
- [ ] Mobile (<640px): chart as simplified table
- [ ] All inputs usable at 640px

### Accessibility
- [ ] All inputs have `<label>` + `aria-describedby`
- [ ] VPD result in `aria-live="polite"` region
- [ ] Chart has `aria-label`
- [ ] Tab navigates all inputs
- [ ] Focus visible: 3px accent outline
- [ ] Min touch targets: 44px
- [ ] WCAG AA contrast

---

## Design System

Canonical `:root` block from glossary.html (see plan). Google Fonts: DM Serif Display, Source Serif 4, IBM Plex Mono. Interactive element patterns: focus glow, button lift, pulse animations.

---

## Page Layout

### Top: Environment Health Summary
Combined VPD + DLI status as color-coded badges.

### Middle: VPD Calculator

**Inputs:** Air temp (°C, 10-45, step 0.5), RH (%, 10-100), Leaf temp offset (°C, default -2, -5 to +5), Growth stage dropdown (Seedling/Clone, Veg, Early Flower, Late Flower).

**Output:** Large VPD value with zone-colored background + pulse animation on change.

**Heatmap:** CSS grid, 5°C steps × 5% RH steps = 65 cells.
- Y-axis: 15, 20, 25, 30, 35°C
- X-axis: 30, 35, 40... 90% (13 columns)
- Cell colors by zone for selected stage (green/gold/red/dark)
- Position marker: pulsing accent dot at nearest intersection
- Grid renders once + on stage change. Only marker moves on input change.
- Mobile: simplified HTML table with VPD values in cells

**Advice text:** Dynamic interpretation of current VPD.

### Bottom: DLI Calculator

**Inputs:** PPFD (0-2000, step 10), Photoperiod (1-24h, auto-set from stage).

**Formula:** `DLI = PPFD × hours × 0.0036`

**Gauge bar:** Dark track, gradient fill (red→gold→green), markers at 15/30/40-50.

**Context text:** Dynamic advice including "At DLI <30, canopy management matters MORE than watts."

---

## VPD Calculation

```
SVP(T) = 0.6108 × exp(17.27 × T / (T + 237.3))  // kPa
leafTemp = airTemp + offset  // default -2 for LED
VPD = SVP(leafTemp) - (SVP(airTemp) × RH / 100)
```

### Zone Ranges
| Stage | Optimal | Acceptable |
|-------|---------|------------|
| Seedling | 0.4–0.8 | 0.3–1.0 |
| Veg | 0.8–1.2 | 0.6–1.4 |
| Early Flower | 1.0–1.4 | 0.8–1.6 |
| Late Flower | 1.2–1.6 | 1.0–1.8 |

---

## Real-time Updates

All calculations on `input` event. No submit button. Pulse animation on value change. Grid NOT re-rendered on input — only marker moves. Grid re-colors on stage change.

**Photoperiod auto-set:** Track `photoperiodManuallySet` flag. Auto-update only if false. Set true when user changes it directly.

---

## localStorage

**Key:** `growdoc-env-dashboard`
**Schema:** `{ version: 1, lastInputs: { temp, rh, offset, stage, ppfd, photoperiod } }`

Load: try/catch → version check → populate inputs or use defaults (25°C, 60%, -2, veg, 400, 18h).
Save: debounced 1000ms on any input change.
Unavailable: `.warn` alert, tool works without persistence.
Corrupted: warning + export raw JSON option.

---

## Key Implementation Notes

1. Heatmap uses offset=0 for cell calculations (general conditions). User's offset only affects result display + marker.
2. Cache busting: don't parse `location.search`.
3. Keep file compact — generate 65 cells in JS, not hardcoded HTML. Target well under 100KB.
4. Language: English (`<html lang="en">`).

## Actual Implementation Notes

**File created:** `docs/tool-env-dashboard.html` (~850 lines, single file with embedded CSS/JS)
**Deviations from plan:**
- Used `??` instead of `||` for numeric defaults (code review fix for falsy-zero bug)
- DLI canopy management advice threshold corrected to <30 (was <25)
- Focus styles use outline instead of box-shadow (High Contrast Mode compatibility)
- Added null guard in loadState() for missing lastInputs property
- Corrupted localStorage export option simplified to inline raw JSON display (no separate export button)
**Code review:** 5 auto-fixes applied. No user-decision items.
