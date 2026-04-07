# Usage Guide — GrowDoc Interactive Tools

## Quick Start

Open the GrowDoc site in a browser. The sidebar now has a pinned **Tools** group at the top with four interactive tools:

1. **Environment Dashboard** — VPD + DLI calculator
2. **Stealth Audit** — Monthly OPSEC security checklist
3. **Cure Tracker** — Multi-phase harvest tracker (drying/curing)
4. **Plant Doctor** — Interactive symptom diagnosis wizard

Each tool is a standalone HTML page loaded via the existing GrowDoc framework.

## Files Created/Modified

### Section 01: Sidebar Integration
- `docs/app.js` — Added Tools group with tool category styling, mobile nav support
- `docs/style.css` — Tool category visual styles
- `docs/docs.json` — Tool entries added to document manifest

### Section 02: Environment Dashboard
- `docs/tool-env-dashboard.html` — Combined VPD heatmap + DLI gauge calculator

### Section 03: Stealth Audit
- `docs/tool-stealth-audit.html` — 18-item weighted OPSEC checklist across 5 categories

### Section 04: Cure Tracker
- `docs/tool-cure-tracker.html` — Drying/curing state machine with daily logs and burp tracking

### Section 05: Plant Doctor
- `docs/tool-plant-doctor.html` — Diagnostic wizard with 72-node decision tree (27 questions, 44 results)

## Using Each Tool

### Environment Dashboard
- Enter temperature, humidity, and light PPFD values
- VPD is calculated in real-time with an interactive heatmap showing optimal zones by growth stage
- DLI is calculated from PPFD and photoperiod with a gauge bar
- Last inputs remembered via localStorage

### Stealth Audit
- Complete the 18-item checklist using Pass/Fail/N/A radio buttons
- Score is calculated in real-time with weighted categories
- Save audits to history (localStorage) and compare month-over-month

### Cure Tracker
- Start a harvest by entering the harvest date
- Track drying: daily temperature, humidity, and notes
- Transition to curing after 7+ days
- Log burp sessions with jar RH, duration, and smell progression
- Mark complete and view harvest summaries
- State machine: idle -> drying -> curing -> complete

### Plant Doctor
- **Wizard Mode** (default): Answer one question at a time with clickable option cards
  - Navigate with Back button or Start Over
  - Progress dots show your position
  - Fade transitions between questions
- **Expert Mode**: Toggle at top-right to see all questions as cascading dropdowns
  - Selecting a parent auto-shows the next level
  - Changing a parent clears dependent selections
  - Back button steps back one selection
- Diagnosis result card shows: severity level, confidence %, check-first steps, fix instructions, and alternative conditions to consider
- Last diagnosis saved to localStorage and shown as banner on next visit

## Running Tests

Each tool includes a `runTests()` function. Open the tool page in a browser, open the developer console (F12), and run:

```js
runTests()
```

This runs all embedded tests and reports pass/fail counts in the console.

## Technical Notes

- All tools are vanilla JavaScript (no build step, no dependencies)
- Dark theme using CSS custom properties from the GrowDoc design system
- Responsive at 640px breakpoint
- WCAG AA accessible: keyboard navigation, aria-live regions, screen reader support, 44px touch targets
- localStorage for persistence; graceful degradation when unavailable
