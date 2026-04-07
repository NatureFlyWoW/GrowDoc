# Section 5: Plant Doctor — Symptom Diagnosis Wizard

## Overview

Build `docs/tool-plant-doctor.html` — an interactive diagnostic symptom checker with step-by-step wizard (default) and expert mode (scrollable form). Full decision tree encoding the plant-diagnostics skill's diagnostic map. Fade transitions, history stack navigation, last diagnosis saved to localStorage.

**File to create:** `docs/tool-plant-doctor.html`
**Depends on:** Section 01 (sidebar integration)

---

## Tests First

### Console Tests (embed as runTests())

```
// Test: tree traversal reaches result node for every valid path combination
// Test: goBack() returns to previous question (history stack)
// Test: reset() clears history, returns to first question
// Test: expert mode toggle preserves/restores wizard state
// Test: dependent dropdowns in expert mode disable when parent unset
// Test: all result nodes have required fields (diagnosis, confidence, severity, fixes, checkFirst)
// Test: confidence values 0.0-1.0
// Test: localStorage save/load round-trips correctly
// Test: corrupted localStorage triggers warning, not crash
```

### Manual Verification
- [ ] Wizard: option click → next question with fade transition
- [ ] Wizard: back button returns to previous question
- [ ] Wizard: progress dots update correctly
- [ ] Wizard: result shows diagnosis card with severity color
- [ ] Wizard: "Start Over" resets to first question
- [ ] Expert: toggle shows scrollable form
- [ ] Expert: Level 3 only appears when Level 2 answered
- [ ] Expert: "Diagnose" traverses path, shows result
- [ ] Last diagnosis persists across reload
- [ ] Private browsing: works without localStorage

### Accessibility
- [ ] Tab navigates option buttons
- [ ] Enter/Space selects option
- [ ] Screen reader announces step changes
- [ ] Result card receives focus
- [ ] WCAG AA 4.5:1 contrast
- [ ] 44px touch targets
- [ ] All inputs labeled
- [ ] Focus visible outline

---

## Data Architecture: Decision Tree

Flat map of node IDs to node objects. Two node types:

### Question Node
```js
{ id: "string", question: "Display text", help: "Optional help",
  options: [{ label: "Option text", next: "next-node-id" }] }
```

### Result Node
```js
{ id: "string", diagnosis: "Condition Name", confidence: 0.85,
  severity: "critical"|"warning"|"note",
  checkFirst: ["Check pH", ...], fixes: ["Step 1", ...],
  alsoConsider: [{ name: "Alt diagnosis", hint: "If..." }] }
```

### Tree Structure

**Level 1 — Growth Stage:** Seedling, Veg, Early Flower, Mid Flower, Late Flower

**Level 2 — Primary Symptom:**
- Yellowing → branches by leaf position (old vs new)
- Spots/Burns → branches by pattern (tips, random, circular, interveinal)
- Curling → branches by direction (up/down/edges)
- Drooping → branches by pot weight (heavy=overwater, light=underwater)
- White/Powdery → branches by location (surface=PM, bleached=light burn)
- Color changes → branches by color (purple, dark green)

**Level 3+:** Refinement questions narrowing to specific diagnosis.

### Shared Result Templates
```js
function makeResult(overrides) {
  return { checkFirst: ["Verify pH 6.0-6.5 soil"], alsoConsider: [], ...overrides };
}
```

### Minimum Diagnostic Coverage (~40-60 result nodes)
**Deficiencies:** N, P, K, Ca, Mg, Fe, S
**Toxicities:** N toxicity, nutrient burn
**Environmental:** Light burn, heat stress, overwatering, underwatering, wind burn
**Pests/Disease:** Powdery mildew, root rot
**pH Related:** pH lockout

Tree size target: under 15KB JSON when minified.

---

## UI: Wizard Mode (Default)

### Layout (top to bottom)
1. Hero: "Plant Doctor" + subtitle
2. Mode toggle: Expert Mode switch (top right)
3. Progress dots: completed / active / upcoming
4. Question card: question text + help text
5. Option buttons: vertical stack of clickable cards
6. Back button: shown when history has entries
7. Last diagnosis banner: if previous diagnosis in localStorage

### Transitions
Option click → fade out (0.15s) → fade in new question (0.3s) → update progress dots → move focus → announce via aria-live.

### Result Display (Diagnosis Card)
- Severity left border (4px): red=critical, gold=warning, green=note
- Diagnosis name: large serif heading
- Confidence: percentage + horizontal bar
- "Check First": numbered priority list (always starts with pH)
- Fix instructions: numbered steps in card
- "Also Consider": subdued list of alternatives
- "Start Over" button: calls reset()
- Auto-saves to localStorage on display

---

## UI: Expert Mode

Toggle switch at top. When active:
- All questions rendered as scrollable form (dropdowns/radios)
- **Sequentially dependent**: Level 3 hidden/disabled until Level 2 answered
- Same tree traversal, just rendered inline
- "Diagnose" button at bottom (enabled when complete path selected)
- Result appended below form

When parent selection changes: clear all dependent children, re-hide.

---

## State Machine

```
States: idle → questioning → result
```

| Action | Effect |
|--------|--------|
| selectOption(i) | Push current to history, navigate to options[i].next. If result → show diagnosis. |
| goBack() | Pop history, re-render previous question |
| reset() | Clear history, return to root |
| toggleExpertMode() | Switch rendering, preserve internal state |

History stack: array of node IDs. `goBack()` pops, `reset()` clears.

---

## localStorage

**Key:** `growdoc-plant-doctor`
**Schema:** `{ version: 1, lastDiagnosis: { date, path, result } | null }`

Save immediately when diagnosis reached (no debounce needed — discrete clicks). On load: show "Last diagnosis" banner if exists. Start wizard fresh (don't restore mid-wizard).

Unavailable: `.warn` alert, tool works. Corrupted: warning + export + reset.

---

## Design System

Canonical `:root` from glossary.html. Interactive elements: option cards with hover glow, primary/secondary buttons, fade animations, progress dots (filled/pulsing/outlined), severity-colored result cards.

CSS patterns: `.tip`, `.warn`, `.crit` alert boxes, `.sr-only`, `.fade-in` animation keyframes. Responsive at 640px (single column, reduced padding).

---

## Key Implementation Notes

1. Tree stored as flat map for O(1) lookup
2. Expert mode = same tree, progressive disclosure (not fuzzy matching)
3. No debounce needed — save on diagnosis only
4. Don't parse `location.search` (parent adds cache-bust timestamp)
5. Target under 100KB total file size
6. English language (`<html lang="en">`)
