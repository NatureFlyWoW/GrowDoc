# Section 4: Drying & Cure Tracker

## Overview

Build `docs/tool-cure-tracker.html` — a multi-phase harvest tracker guiding growers through drying (days 1-14) and curing (week-based burp logging). State machine with backward transitions, auto-triggered alerts, completedSummaries history, full localStorage persistence.

**File to create:** `docs/tool-cure-tracker.html`
**Depends on:** Section 01 (sidebar integration)

---

## Tests First

### Console Tests (embed as runTests())

```js
function runTests() {
  let passed = 0, failed = 0;
  function assert(condition, msg) {
    if (condition) { passed++; console.log('PASS:', msg); }
    else { failed++; console.error('FAIL:', msg); }
  }
  // State transitions: idle→drying, drying→curing, curing→drying, curing→complete, complete→idle
  // "Start Curing" disabled before 7 calendar days, enabled at 7
  // Day numbers computed correctly from harvestDate
  // Alert: jar RH > 70 → critical
  // Alert: smell "Ammonia" → critical
  // Alert: jar RH < 55 → warning
  // completedSummaries capped at 10
  // Note fields capped (500/200 chars)
  // localStorage round-trip preserves full state
  // Corrupted localStorage → warning + export, not crash
  // "Back to Drying" preserves drying logs
  console.log(`\n${passed} passed, ${failed} failed`);
}
```

### Manual Verification
- [ ] Idle: start screen with date input defaulting to today
- [ ] Idle: "Previous Harvests" visible if completedSummaries exist
- [ ] Drying: timeline days 1-14 with correct dates from harvestDate
- [ ] Drying: current day has pulsing dot
- [ ] Drying: temp/RH inline range indicators (green 15-18°C/55-65%, gold close, red out)
- [ ] Drying: guidance text changes by day range
- [ ] Drying→Curing: disabled before day 7, tooltip explains why
- [ ] Curing: week cards expand/collapse
- [ ] Curing: burp log form adds session to current week
- [ ] Curing: high RH / ammonia triggers critical alerts
- [ ] Curing: low RH triggers warning
- [ ] Curing: "Back to Drying" preserves all drying logs
- [ ] Complete: summary with all stats
- [ ] Complete: "Copy Summary" → clipboard
- [ ] Complete: "Start New Harvest" saves summary, confirms before reset
- [ ] State persists through reload at every phase
- [ ] Private browsing: works without localStorage, shows warning

### Accessibility
- [ ] Phase transitions announced via `aria-live`
- [ ] All inputs labeled
- [ ] Accordion keyboard-accessible
- [ ] Alert boxes have `role="alert"`
- [ ] Focus moves on phase transition
- [ ] 44px touch targets
- [ ] WCAG AA contrast

---

## Data Model

```js
{
  version: 1,
  harvestDate: null,         // ISO date string
  phase: 'idle',             // "idle"|"drying"|"curing"|"complete"
  dryingLogs: [],            // [{ day, date, done, tempC, rhPercent, notes }]
  curingLogs: [],            // [{ week, day, date, burped, durationMin, rhJar, smell, notes }]
  completedSummaries: []     // [{ harvestDate, totalDryDays, totalCureDays, notes }] max 10
}
```

## State Transitions

```
idle → drying     (enter harvest date + click Start)
drying → curing   (click "Start Curing", enabled after 7 calendar days)
curing → drying   (click "Back to Drying" — preserves dryingLogs)
curing → complete (click "Mark Cure Complete")
complete → idle   (click "Start New Harvest" — saves summary, confirms first)
```

"7 calendar days" = `(today - harvestDate) >= 7 days` by date comparison, NOT checkbox count.

---

## Key Functions (Stubs)

```js
function loadState()      // localStorage read, try/catch, version check, corruption handling
function saveState()      // Debounced 1000ms, serialize, try/catch, cap summaries at 10
function canStartCuring() // true if >= 7 calendar days since harvestDate
function startDrying(date)// Set phase, harvestDate, clear logs
function startCuring()    // Guard canStartCuring(), set phase
function backToDrying()   // Set phase, preserve dryingLogs
function markComplete()   // Set phase
function startNewHarvest()// Confirm, build summary, push to completedSummaries, reset to idle
function getCurrentDryDay()// 1-based: floor((today - harvestDate) / 86400000) + 1
function getDayGuidance(day)// Day-range-specific guidance text
function getCureWeek()    // 1-based week since curing began
function getBurpGuidance(week)// Target frequency per week
function getAlerts(burpEntry) // Returns [{level, message}] for RH/smell triggers
function render()         // Dispatches to phase-specific renderer
```

---

## Phase UIs

### Idle
Hero title, harvest date input (default today), "Start New Harvest" button. "Previous Harvests" if completedSummaries exist.

### Drying (Days 1-14)
Two-column: vertical timeline (left) + daily log card (right). Stacks on mobile.

Timeline: 14 day markers. Completed=green filled, Current=pulsing accent, Future=outlined.

Log card: day number + date, checkbox, temp/RH inputs with range indicators, day guidance text, notes (max 500).

"Start Curing" button: disabled <7 days with tooltip.

### Curing (Weeks 1-4+)
"Back to Drying" button at top.

Week accordion cards: week number, date range, target burp frequency, logged sessions.

Burp form: datetime-local (default now), duration (min), jar RH (%), smell dropdown (Hay/Grass, Ammonia, Transitioning, Strain-specific, Complex/Rich), notes (max 200).

Auto-alerts after each burp: `.crit` for RH>70 or Ammonia, `.warn` for RH<55.

"Mark Cure Complete" button at bottom.

### Complete
Summary card: harvest date, dry days, cure days, avg temp/RH, smell progression, warnings.

"Copy Summary" → clipboard. "Start New Harvest" → confirm → save summary → reset.

---

## localStorage

**Key:** `growdoc-cure-tracker`
Debounced 1000ms auto-save. Schema versioned. CompletedSummaries capped at 10. Note field caps: 500 (drying), 200 (curing). Corrupted data: warning + export raw JSON + reset.

---

## Design System

Canonical `:root` from glossary.html. Alert boxes (.tip/.warn/.crit), cards, buttons, inputs with focus glow. Pulse animation for current day dot. Fade-in for phase transitions. Responsive at 640px.

## Actual Implementation Notes

**File created:** `docs/tool-cure-tracker.html` (~740 lines, single file with embedded CSS/JS)
**Deviations from plan:**
- Added `escapeHtml()` utility to prevent XSS via innerHTML injection (code review fix)
- Added `safeFloat()` helper replacing broken `parseFloat() ?? 0` pattern (code review fix)
- Added `addDays()` helper for DST-safe date arithmetic instead of `86400000` ms multiplication (code review fix)
- Added Space key handler on timeline day items for keyboard accessibility (code review fix)
- `getCureWeek()` calculates based on first log date rather than a stored curingStartDate (plan doesn't include curingStartDate)
- Missing `day` field in curing log entries (minor plan model omission)
**Code review:** 4 auto-fixes applied. No user-decision items.
