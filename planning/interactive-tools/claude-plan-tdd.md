# GrowDoc Interactive Tools — TDD Plan

## Testing Approach

This project is vanilla HTML/CSS/JS with no build step or test framework. Testing is done through:

1. **Browser console assertions**: Each tool includes a `runTests()` function (called via console or a hidden debug key) that validates core logic
2. **Manual verification checklist**: Documented steps for visual/interactive testing
3. **Accessibility testing**: Keyboard-only navigation and screen reader checks

Each section below mirrors the implementation plan and specifies what to verify BEFORE considering the section complete.

---

## Section 1: Sidebar Integration

### Console Tests
```
// Test: tools extracted from docs array regardless of status filter
// Test: filter chip counts exclude tool-category entries
// Test: tools render above priority groups in nav-list
// Test: tools always visible even when all status filters are toggled off
// Test: mobile nav includes tool items before doc items
```

### Manual Verification
- [ ] Four tool entries appear at top of sidebar in their own "Tools" group
- [ ] Tool nav items have green tint distinct from botanical (green) and planning (blue)
- [ ] Clicking a tool loads the correct iframe src
- [ ] Toggling all status filters off still shows tools section
- [ ] DONE filter chip count does NOT inflate by 4 (tools excluded)
- [ ] Active tool item has correct green background
- [ ] Mobile: tools appear first in horizontal scroll strip with green border
- [ ] Mobile: tool pills meet 44px touch target height

---

## Section 2: Plant Doctor

### Console Tests (embed in tool-plant-doctor.html)
```
// Test: tree traversal reaches a result node for every valid path combination
// Test: goBack() returns to previous question (history stack works)
// Test: reset() clears history and returns to first question
// Test: expert mode toggle preserves/restores wizard state
// Test: dependent dropdowns in expert mode disable when parent is unset
// Test: all result nodes have required fields (diagnosis, confidence, severity, fixes, checkFirst)
// Test: confidence values are 0.0-1.0
// Test: localStorage save/load round-trips correctly
// Test: corrupted localStorage triggers warning, not crash
```

### Manual Verification
- [ ] Wizard mode: each option click shows next question with fade transition
- [ ] Wizard mode: back button returns to previous question
- [ ] Wizard mode: progress dots update correctly
- [ ] Wizard mode: reaching result shows diagnosis card with severity color
- [ ] Wizard mode: "Start Over" resets to first question
- [ ] Expert mode: toggle shows all questions as scrollable form
- [ ] Expert mode: Level 3 options only appear when Level 2 is answered
- [ ] Expert mode: "Diagnose" button traverses the path and shows result
- [ ] Last diagnosis persists across page reload (localStorage)
- [ ] Private browsing: tool works without localStorage, shows warning

### Accessibility
- [ ] Tab navigates between option buttons in wizard mode
- [ ] Enter/Space selects an option
- [ ] Screen reader announces step changes
- [ ] Result card receives focus when displayed
- [ ] All text meets 4.5:1 contrast ratio

---

## Section 3: Environment Dashboard

### Console Tests (embed in tool-env-dashboard.html)
```
// Test: VPD calculation at known values — 25°C, 60% RH, -2 offset → expected VPD
// Test: VPD at 20°C, 50% RH, 0 offset → expected VPD (verify against published tables)
// Test: VPD at edge cases — 0°C, 100% RH → VPD ≈ 0
// Test: VPD at edge cases — 45°C, 10% RH → high VPD
// Test: DLI calculation — 400 PPFD × 18h → 400 * 18 * 0.0036 = 25.92
// Test: DLI calculation — 600 PPFD × 12h → 600 * 12 * 0.0036 = 25.92
// Test: zone classification correct for each growth stage
// Test: VPD chart has exactly 65 cells (5 temp × 13 RH)
// Test: position marker maps inputs to nearest grid cell
// Test: localStorage save/load round-trips inputs correctly
```

### Manual Verification
- [ ] Entering temp and RH immediately shows VPD value (no submit button)
- [ ] VPD value changes color: green in optimal range, gold in acceptable, red in danger
- [ ] Changing growth stage updates zone colors on chart and advice text
- [ ] VPD chart shows pulsing dot at user's current position
- [ ] DLI bar fills proportionally with correct color gradient
- [ ] Photoperiod defaults to 18h when stage is Veg, 12h when Flower
- [ ] Advice text updates meaningfully for different VPD zones
- [ ] Inputs persist across page reload
- [ ] Mobile: chart displays as simplified table
- [ ] Mobile: all inputs are usable at 640px width

### Accessibility
- [ ] All number inputs have labels and help text
- [ ] VPD result announced via aria-live region on change
- [ ] Chart has appropriate alt text or aria description
- [ ] Keyboard can navigate between all inputs

---

## Section 4: Cure Tracker

### Console Tests (embed in tool-cure-tracker.html)
```
// Test: state machine transitions: idle→drying, drying→curing, curing→drying, curing→complete, complete→idle
// Test: "Start Curing" disabled before 7 calendar days from harvest date
// Test: "Start Curing" enabled at exactly 7 calendar days
// Test: day numbers computed correctly from harvest date
// Test: alert triggers when jar RH > 70
// Test: alert triggers when smell = "Ammonia"
// Test: warning triggers when jar RH < 55
// Test: completedSummaries capped at 10 entries (oldest trimmed)
// Test: cure log note field capped at 200 chars
// Test: drying log note field capped at 500 chars
// Test: localStorage save/load preserves full state across phases
// Test: corrupted localStorage shows warning + export option, not crash
// Test: "Back to Drying" preserves existing drying logs
```

### Manual Verification
- [ ] Idle phase: shows start screen with harvest date input
- [ ] Drying phase: timeline shows days 1-14 with correct dates
- [ ] Drying phase: current day (by calendar) has pulsing dot
- [ ] Drying phase: temp/RH inputs show inline range indicators
- [ ] Drying phase: guidance text changes by day range
- [ ] Drying→Curing transition: button disabled before day 7, tooltip explains why
- [ ] Curing phase: week cards expand/collapse
- [ ] Curing phase: burp log form adds session to current week
- [ ] Curing phase: high RH and ammonia smell trigger critical alerts
- [ ] Curing phase: "Back to Drying" returns to drying view with logs preserved
- [ ] Complete phase: summary shows all stats correctly
- [ ] Complete phase: "Copy Summary" copies text to clipboard
- [ ] Complete: starting new harvest saves previous summary to history
- [ ] State persists through page reload at every phase

### Accessibility
- [ ] All phase transitions announced via aria-live
- [ ] Form inputs properly labeled
- [ ] Accordion sections keyboard-accessible (Enter/Space to toggle)
- [ ] Alert boxes have role="alert"

---

## Section 5: Stealth Audit

### Console Tests (embed in tool-stealth-audit.html)
```
// Test: scoring with all 18 items Pass → 100%
// Test: scoring with all Fail → 0%
// Test: scoring with all N/A → handle gracefully (no division by zero)
// Test: scoring with mixed Pass/Fail/N/A → correct weighted average
// Test: category weight verification — smell(40) + noise(20) + light(20) + physical(10) + electrical(10) = 100
// Test: smell category with 4 pass, 1 fail, 1 N/A → score = 4/5 = 80%
// Test: overall score with smell=80%, all others=100% → 0.4*80 + 0.2*100 + 0.2*100 + 0.1*100 + 0.1*100 = 92%
// Test: "days since last audit" calculation from stored date
// Test: audit history capped at 12 entries
// Test: save audit adds to history and clears current
// Test: localStorage round-trip preserves audit + history
```

### Manual Verification
- [ ] All 18 items render across 5 collapsible categories
- [ ] Radio buttons (Pass/Fail/N/A) work for each item
- [ ] Category scores update in real-time as items are rated
- [ ] Overall score updates with correct color (green/gold/red)
- [ ] Category bars show proportional fill
- [ ] Accordion sections expand/collapse on click
- [ ] "Save Audit" stores scores and shows confirmation
- [ ] "View History" shows past audits with dates
- [ ] "Days since last audit" badge shows correct count and color
- [ ] Reset clears all selections without saving

### Accessibility
- [ ] Radio groups have proper fieldset/legend/radiogroup semantics
- [ ] Score changes announced via aria-live
- [ ] Accordion sections togglable with keyboard
- [ ] All radio buttons keyboard-navigable (arrow keys within group)
