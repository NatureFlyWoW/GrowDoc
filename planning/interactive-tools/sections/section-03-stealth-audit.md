# Section 03: Stealth Audit — Monthly OPSEC Security Checklist

## Overview

Build `docs/tool-stealth-audit.html` — a standalone, self-contained interactive HTML page that provides a monthly OPSEC checklist. 18 items across 5 weighted categories, radio button scoring (Pass/Fail/N/A), real-time weighted score calculation, audit history in localStorage, and "days since last audit" badge.

Uses the **dark botanical theme** inside the iframe. All CSS and JS inline.

**Depends on:** Section 01 (sidebar integration). Can be tested independently by opening directly in browser.

---

## Tests First

### Console Tests (embed in tool-stealth-audit.html)

```js
function runTests() {
  let passed = 0, failed = 0;
  function assert(condition, msg) {
    if (condition) { passed++; console.log('PASS:', msg); }
    else { failed++; console.error('FAIL:', msg); }
  }
  // Test: scoring with all 18 items Pass → 100%
  // Test: scoring with all Fail → 0%
  // Test: scoring with all N/A → no NaN/Infinity, graceful fallback
  // Test: mixed scoring — smell: 4 pass, 1 fail, 1 N/A → 80%; all others 100% → overall 92%
  // Test: category weights sum to 100 (40+20+20+10+10)
  // Test: "days since last audit" from stored date 15 days ago → 15
  // Test: audit history capped at 12
  // Test: save audit adds to history and clears current
  // Test: localStorage round-trip preserves state
  console.log(`\n${passed} passed, ${failed} failed`);
}
```

### Manual Verification
- [ ] All 18 items render across 5 collapsible categories
- [ ] Radio buttons (Pass/Fail/N/A) work for each item
- [ ] Category scores update in real-time
- [ ] Overall score color: green ≥90%, gold 70-89%, red <70%
- [ ] Category bars show proportional fill
- [ ] Accordion expand/collapse on click
- [ ] "Save Audit" stores scores, shows confirmation
- [ ] "View History" shows past audits
- [ ] "Days since last audit" badge correct count/color
- [ ] Reset clears without saving
- [ ] Private browsing: works without localStorage, shows warning
- [ ] Corrupted data: warning + export option

### Accessibility
- [ ] Radio groups: `<fieldset>` / `<legend>` / `role="radiogroup"`
- [ ] Score changes via `aria-live="polite"`
- [ ] Accordion keyboard-accessible (Enter/Space)
- [ ] Radio buttons keyboard-navigable (arrow keys)
- [ ] Focus visible: 3px accent outline
- [ ] Min touch targets: 44px
- [ ] WCAG AA 4.5:1 contrast

---

## Design System

Canonical `:root` block (from glossary.html):
```css
:root {
  --bg: #0c0e0a; --bg2: #141a10; --bg3: #1a2214;
  --text: #d4cdb7; --text2: #a39e8a; --text3: #6b6756;
  --accent: #8fb856; --accent2: #6a9e3a; --accent3: #4a7a25;
  --gold: #c9a84c; --gold2: #a8872e;
  --red: #c45c4a; --red2: #a33d2d;
  --blue: #5a9eb8;
  --border: #2a3320; --border2: #3a4530;
  --serif: 'DM Serif Display', Georgia, serif;
  --body: 'Source Serif 4', Georgia, serif;
  --mono: 'IBM Plex Mono', monospace;
}
```

Interactive element patterns: inputs with focus glow, primary/secondary buttons, `.sr-only` class, 44px min touch targets.

---

## Data Model

**Key:** `growdoc-stealth-audit`

```js
{
  version: 1,
  currentAudit: {
    date: "ISO string",
    items: { "smell-ar-door": "pass"|"fail"|"na", ... }
  } | null,
  auditHistory: [
    { date: "ISO", overallScore: 92, categoryScores: { smell: 80, noise: 100, light: 100, physical: 100, electrical: 100 } }
    // ... capped at 12 entries
  ]
}
```

localStorage patterns: load with try/catch + version check + migrations, debounced save (1000ms), corrupted data → warning + export option.

---

## Checklist — All 18 Items

### Smell (40% weight, 6 items)
| ID | Description |
|----|-------------|
| `smell-ar-door` | Stand outside AR door — any detectable odor? |
| `smell-apartment` | Stand at apartment entrance — any odor in hallway? |
| `smell-negative-pressure` | Tent walls sucking in? (negative pressure check) |
| `smell-ducts` | All duct connections — aluminum tape secure? |
| `smell-vent-grate` | Ventilation grate sealed? |
| `smell-door-gap` | Door gap sealed? |

### Noise (20% weight, 3 items)
| ID | Description |
|----|-------------|
| `noise-ar-door` | Stand outside AR door — fan audible? |
| `noise-apartment` | Stand outside apartment door — any unusual sound? |
| `noise-fan-speed` | Fan speed at minimum effective level? |

### Light (20% weight, 3 items)
| ID | Description |
|----|-------------|
| `light-ar-door` | During dark period: any light visible under AR door? |
| `light-bulb` | AR ceiling bulb disconnected/removed? |
| `light-seams` | Tent zippers/seams checked for pinholes? |

### Physical (10% weight, 3 items)
| ID | Description |
|----|-------------|
| `physical-items` | No grow-related items visible outside AR? |
| `physical-door` | AR door closed and (ideally) locked? |
| `physical-trash` | No suspicious trash in common recycling? |

### Electrical (10% weight, 3 items)
| ID | Description |
|----|-------------|
| `electrical-strip` | Single quality power strip, not daisy-chained? |
| `electrical-elevated` | All connections elevated off floor? |
| `electrical-circuits` | No overloaded circuits? |

---

## Scoring Algorithm

### Per-Category
```
categoryScore = passCount / (passCount + failCount) × 100
```
N/A items excluded from both counts. All-N/A category → 100% (or excluded from weighted average).

### Overall
```
overallScore = Σ(categoryWeight × categoryScore) / Σ(weightsOfCategoriesWithRatedItems)
```
If a category has all N/A, its weight redistributes proportionally.

### Color Zones
| Range | Color | Variable |
|-------|-------|----------|
| ≥ 90% | Green | `--accent` |
| 70-89% | Gold | `--gold` |
| < 70% | Red | `--red` |

---

## UI Layout

### Page Structure
1. **Hero header**: "Stealth Audit" + "Monthly OPSEC Security Checklist"
2. **Days-since badge**: Color-coded (green <30d, gold 30-60d, red >60d or never)
3. **Scoring panel** (sticky on desktop): Overall score + 5 category bars
4. **Category accordions** (5 sections, collapsible)
5. **Action buttons**: Save Audit (primary), View History (secondary), Reset (secondary/danger)
6. **History section** (expandable): Past audits, reverse chronological

### Each Audit Item
```html
<fieldset class="audit-item">
  <legend class="sr-only">Smell check: AR door</legend>
  <p class="item-desc">Stand outside AR door — any detectable odor?</p>
  <div role="radiogroup" aria-label="Rating for smell-ar-door">
    <label><input type="radio" name="smell-ar-door" value="pass"> Pass</label>
    <label><input type="radio" name="smell-ar-door" value="fail"> Fail</label>
    <label><input type="radio" name="smell-ar-door" value="na"> N/A</label>
  </div>
</fieldset>
```

Radio styling: Pass=green accent, Fail=red, N/A=grey when selected.

---

## JS Architecture

### Key Functions (Stubs)

```js
function loadState()
  /** Read key, parse JSON try/catch, check version, return state or default */

function saveState(state)
  /** Serialize, write try/catch. Debounced 1000ms. */

function calculateScores(items)
  /** Return { overallScore, categoryScores }. Handle all-N/A gracefully. */

function daysSinceLastAudit(history)
  /** Days since most recent audit, or null. */

function saveAudit()
  /** Calculate scores, push to history (cap 12), clear current, persist. */

function resetAudit()
  /** Confirm, clear radios, clear currentAudit. No save. */

function renderScores()
  /** Update scoring panel + aria-live region. */

function renderHistory()
  /** Render history section from auditHistory. */

function handleRadioChange(event)
  /** Update items, recalculate, re-render, debounced save. */

function toggleCategory(categoryId)
  /** Expand/collapse accordion. */

function init()
  /** DOMContentLoaded: load state, render, attach listeners. */
```

### Event Handling
- Radio changes: event delegation on `input[type="radio"]`
- Accordion: click + keydown (Enter/Space)
- Buttons: direct click handlers

---

## Mobile
- Categories stack (block-level)
- Radio targets ≥ 44px
- Scoring panel not sticky on mobile (inline at top)
- No horizontal scroll needed

## Error Handling
- localStorage unavailable: `.warn` banner, tool works without persistence
- Corrupted data: warning + export raw JSON + reset
- Radio buttons: constrained by HTML, no extra validation needed
