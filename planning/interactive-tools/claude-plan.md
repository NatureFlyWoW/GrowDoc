# GrowDoc Interactive Tools — Implementation Plan

## Context

GrowDoc is a static HTML documentation site for cannabis cultivation, hosted on Vercel. It currently serves read-only guides in a sidebar + iframe viewer. We are adding four interactive tools that load in the same iframe viewer, each a self-contained HTML file with inline CSS and JS. Tools persist state via `localStorage` and require no login.

The audience is dual: the current private grow team AND eventually the public. Tools must be intuitive for first-time growers while remaining useful for experienced cultivators.

**Important architectural note:** The parent page (`index.html`, `style.css`) uses a **light cream/tan theme** (`--bg: #f5f0e8`, `--sidebar-bg: #e8dcc8`), while the docs loaded in the iframe use a **dark botanical theme**. The iframe has no `sandbox` attribute — tool HTML files share the parent's `localStorage` origin, so all storage keys must be carefully namespaced with a `growdoc-` prefix to avoid collisions.

## Architecture Overview

### File Structure
```
docs/
  tool-plant-doctor.html      # Symptom diagnosis wizard
  tool-env-dashboard.html      # VPD + DLI environment calculator
  tool-cure-tracker.html       # Drying & curing protocol tracker
  tool-stealth-audit.html      # Monthly OPSEC checklist
  docs.json                    # Updated with tool entries
app.js                         # Updated: tools section above priority groups
style.css                      # Updated: tool category styles (LIGHT theme)
```

Each tool is a standalone `<!DOCTYPE html>` page with all CSS in a `<style>` block and all JS in a `<script>` block. No external dependencies beyond Google Fonts (DM Serif Display, Source Serif 4, IBM Plex Mono).

### Canonical Design System for Tool Pages (Dark Theme — Inside Iframe)

All four tools use the **same exact `:root` block**, copied from `docs/glossary.html` as the canonical reference. This ensures visual consistency across tools and with existing documentation:

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

### Interactive Element Styles (Elevated Treatment)

Interactive elements feel **slightly elevated** — alive rather than static docs. Same palette, but with glow effects, transitions, and visual feedback:

- **Input fields**: `--bg3` background, 1px `--border` border. On focus: `--accent` border with `box-shadow: 0 0 0 3px rgba(143,184,86,0.15)` glow. Transition: `border-color 0.2s, box-shadow 0.2s`.
- **Buttons (primary)**: `--accent` background, dark text. On hover: darken 10% + `transform: translateY(-1px)` lift + `box-shadow: 0 4px 12px rgba(143,184,86,0.3)`. Transition: 0.2s ease.
- **Buttons (secondary)**: Transparent with `--accent` border. Hover fills with accent at 10% opacity.
- **Result cards**: Fade-in animation (`opacity 0→1, transform translateY(8px→0)` over 0.3s). Slightly brighter `--bg2` background with colored left-border matching severity.
- **Progress indicators**: Accent green fill on dark track, animated `width` transitions.
- **Toggle switch** (expert mode): CSS-only with `--accent` active state, smooth slide animation.

### Accessibility Requirements (All Tools)

- All inputs have `<label>`, `aria-required="true"`, `aria-describedby` for help text
- Dynamic results use `<div aria-live="polite" aria-atomic="true">` regions
- Keyboard: Tab through inputs, Enter to submit, Escape to reset
- Focus visible: `outline: 3px solid var(--accent); outline-offset: 2px`
- Minimum touch targets: 44px (`min-height: 44px` on all buttons/inputs)
- Screen-reader-only: `.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }`
- WCAG AA contrast: all text ≥4.5:1 ratio, UI components ≥3:1

### localStorage Pattern (Shared Across All Tools)

Each tool uses a namespaced key with schema versioning:

```
Key: "growdoc-{tool-name}"
Value: { version: number, ...toolState }
```

On load: read key → parse JSON in try/catch → check `version` → run migration functions if outdated → populate UI. On change: debounce (1000ms) → serialize → write in try/catch.

If `localStorage` is unavailable (private browsing, quota exceeded): show `.warn` alert "Your progress won't be saved in private browsing mode." Tool still functions, just without persistence.

If stored data is corrupted (JSON parse fails): show warning with option to export raw data to clipboard before resetting to defaults. Never silently discard user data.

---

## Section 1: Sidebar Integration (app.js + style.css + docs.json)

### docs.json Changes

Add four entries with `"category": "tool"`. Tools have no `priority` field — they render in their own pinned section. Set `"status": "DONE"` so they are unaffected by status filters.

```json
{ "id": "plant-doctor", "title": "Plant Doctor", "subtitle": "Interactive symptom diagnosis",
  "icon": "🩺", "status": "DONE", "category": "tool", "file": "tool-plant-doctor.html" }
{ "id": "env-dashboard", "title": "Environment Dashboard", "subtitle": "VPD + DLI calculator & chart",
  "icon": "🌡️", "status": "DONE", "category": "tool", "file": "tool-env-dashboard.html" }
{ "id": "cure-tracker", "title": "Drying & Cure Tracker", "subtitle": "Harvest-to-jar protocol tracker",
  "icon": "🫙", "status": "DONE", "category": "tool", "file": "tool-cure-tracker.html" }
{ "id": "stealth-audit", "title": "Stealth Audit", "subtitle": "Monthly OPSEC security checklist",
  "icon": "🔒", "status": "DONE", "category": "tool", "file": "tool-stealth-audit.html" }
```

### app.js Changes

Modify the `render()` function:

1. **Filter count must exclude tools**: Change the status count to `docs.filter(d => d.category !== 'tool' && (d.status || 'OPEN') === s).length` — otherwise the DONE chip count inflates by 4.

2. **Extract tools before priority grouping**: From the full `docs` array (not `visibleDocs`), extract all entries where `category === "tool"`. Tools are always visible regardless of status filter.

3. **Render tools section first** in `#nav-list`: A "Tools" group header (using the existing `.priority-group` / `.priority-header` markup pattern but with class `prio-tools`) followed by tool nav items.

4. **Priority group loop continues below** unchanged.

5. **Mobile nav**: Prepend tool items (with class `.cat-tool`) before the priority-sorted doc items. Tool pills get a distinct accent border color.

### style.css Changes (LIGHT Theme — Parent Page)

The parent page sidebar uses light backgrounds (`--sidebar-bg: #e8dcc8`). Tool category styles must work on this light background — NOT the dark theme inside docs.

Add:
- `.nav-item.cat-tool`: Green-tinted background `rgba(74, 124, 35, 0.12)`, left border `3px solid rgba(74, 124, 35, 0.5)`. Slightly stronger visual weight than botanical/planning tints.
- `.nav-item.cat-tool:hover`: `rgba(74, 124, 35, 0.22)` background.
- `.nav-item.cat-tool.active`: `#4a7c23` solid background (green — distinct from the dark green used for botanical and blue for planning).
- `.priority-group.prio-tools .priority-label`: `color: #4a7c23` (green, consistent with accent).
- `.priority-group.prio-tools .priority-header`: `border-bottom-color: rgba(74, 124, 35, 0.4)`.
- `.mobile-nav-item.cat-tool`: `border-color: rgba(74, 124, 35, 0.5); background: rgba(74, 124, 35, 0.08)`.
- `.mobile-nav-item.cat-tool.active`: `background: #4a7c23; border-color: #4a7c23`.

---

## Section 2: Plant Doctor — Symptom Diagnosis Wizard

### Data Architecture

The diagnostic decision tree is encoded as a JSON object tree embedded in the `<script>` block. Each node is either a **question node** (has `question`, `options`, `help`) or a **result node** (has `diagnosis`, `confidence`, `severity`, `fixes`, `checkFirst`).

The tree mirrors the plant-diagnostics skill's diagnostic map:

**Level 1**: Growth stage (seedling / veg / early flower / mid flower / late flower) — affects which diagnoses are likely.

**Level 2**: Primary symptom category:
- Yellowing → branches by leaf position (old vs new)
- Spots/Burns → branches by pattern (tips only, random, circular, interveinal)
- Curling → branches by direction (up=taco, down=claw, edges)
- Drooping → branches by pot weight check (heavy=overwater, light=underwater)
- White/Powdery → branches by location (surface=PM, bleached=light burn)
- Color changes → branches by color (purple stems, dark green)

**Level 3+**: Refinement questions that narrow to specific diagnosis.

Each result node contains:
- `diagnosis`: Condition name (e.g., "Nitrogen Deficiency")
- `confidence`: 0.0–1.0 — how certain given the symptom path
- `severity`: `"critical"` | `"warning"` | `"note"`
- `checkFirst`: Array of things to verify before treating (always includes pH)
- `fixes`: Array of step-by-step remediation instructions
- `alsoConsider`: Array of differential diagnoses with brief descriptions

**Tree size note**: Use shared result templates (e.g., common "check pH first" blocks referenced by ID rather than duplicated) and concise fix text to keep the tree compact. The file is deployed via git push (no 500KB API limit), but smaller is still better for load time.

### UI: Wizard Mode (Default)

**Layout**: Hero title → progress indicator (step dots) → question card → option buttons → back button.

One question at a time. User clicks an option → current card fades out (0.3s) → next question fades in. Back button pops history stack and returns to previous question.

Progress indicator shows step dots with completed/active/upcoming states. Announce step changes via `.sr-only` `aria-live` region ("Step 2 of 5: Where are the symptoms?").

When a result node is reached, display the **Diagnosis Card**:
- Severity indicator (colored left border: red/gold/green)
- Diagnosis name (large serif heading)
- Confidence percentage
- "Check First" priority list (numbered, with explanations)
- Fix instructions (numbered steps)
- "Also Consider" section with alternative diagnoses
- "Start Over" button to reset the wizard

Focus management: move focus to the new question or result card on each transition.

### UI: Expert Mode

Toggle switch at the top labeled "Expert Mode." When active:
- All questions from the tree appear as a **scrollable single-page form** — dropdowns and radio groups for each level
- Questions are still **sequentially dependent**: selecting a Level 2 answer reveals the corresponding Level 3 options (same tree structure, just rendered inline instead of one-at-a-time)
- Unanswered dependent questions are disabled/hidden until their parent is answered
- "Diagnose" button at the bottom runs the tree traversal using the filled-in path
- Result displays at the bottom of the form

This is the same tree traversal as wizard mode, just with all visible levels shown at once for faster navigation by experienced growers.

### State Machine

```
States: idle → questioning → result
Actions: selectOption, goBack, reset, toggleExpertMode
```

The wizard maintains a `history` stack (array of visited node IDs). `goBack()` pops the stack and re-renders the previous question. `reset()` clears the stack and returns to the first question.

### localStorage

Key: `growdoc-plant-doctor`
Schema: `{ version: 1, lastDiagnosis: { date, path, result } | null }`
Save the last completed diagnosis so the user can reference it. No ongoing state beyond that.

---

## Section 3: Environment Dashboard — VPD + DLI Calculator

### Layout

Single-page dashboard with two distinct sections separated by a decorative divider.

**Top: Environment Health Summary** — combined VPD + DLI status as color-coded badges.

**Middle section: VPD Calculator**
- Input row: Air temp (°C, number input, range 10–45), RH (%, number input, range 10–100), Leaf temp offset (°C, default -2, range -5 to +5)
- Growth stage dropdown: Seedling/Clone, Veg, Early Flower, Late Flower
- Output: Large VPD value display (e.g., "1.05 kPa") with color-coded background (green=optimal, gold=acceptable, red=danger)
- Visual chart: CSS grid heatmap at **5°C temperature steps × 5% RH steps** (5 rows × 13 columns = 65 cells). Render once on load and when growth stage changes. Only the position marker updates on input change.
  - Temp axis (Y): 15, 20, 25, 30, 35°C
  - RH axis (X): 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90%
  - Cell colors: Green (optimal for selected stage), Gold (acceptable), Red (danger), Dark (outside range)
  - User position: Pulsing accent dot at the nearest grid intersection
- On mobile (<640px): Chart displays as a simplified table with VPD values visible in cells
- Below chart: Text advice — what the current VPD means, what to adjust (e.g., "VPD 1.4 is above optimal for veg. Lower temperature or raise humidity.")

**Bottom section: DLI Calculator**
- Input row: PPFD (µmol/m²/s, range 0–2000), Photoperiod (hours, range 1–24, default auto-set from stage: 18 for veg, 12 for flower)
- Output: DLI value = `PPFD × hours × 0.0036` (mol/m²/day)
- Horizontal gauge bar:
  - Track: dark background
  - Fill: gradient from red (DLI < 15) through gold (15–30) to green (30–50+)
  - Markers: "Low" at 15, "Good" at 30, "Plateau" at 40–50
  - User's value: accent fill with value label above
- Context text: interpretation + practical advice. e.g., "At DLI <30, canopy management matters MORE than watts — optimize absorption of limited photons."

### VPD Calculation

Formula: `VPD = SVP(Tleaf) - (SVP(Tair) × RH/100)` where `SVP(T) = 0.6108 × exp(17.27 × T / (T + 237.3))` (Tetens formula, result in kPa).

Leaf temp = Air temp + offset (default -2°C for LED grows, since LEDs emit less infrared heat than HPS).

Stage-specific optimal ranges:

| Stage | Optimal VPD (kPa) | Acceptable Range |
|-------|-------------------|------------------|
| Seedling/Clone | 0.4–0.8 | 0.3–1.0 |
| Veg | 0.8–1.2 | 0.6–1.4 |
| Early Flower | 1.0–1.4 | 0.8–1.6 |
| Late Flower | 1.2–1.6 | 1.0–1.8 |

### Real-time Updates

Calculations fire on every `input` event (no submit button). VPD value, zone indicator, advice text, and position marker update immediately. Subtle pulse animation on the VPD output value when it changes. The grid itself is NOT re-rendered on input — only the marker moves and the result text updates.

### localStorage

Key: `growdoc-env-dashboard`
Schema: `{ version: 1, lastInputs: { temp, rh, offset, stage, ppfd, photoperiod } }`
Restore inputs on page load so the dashboard remembers the grower's typical environment.

---

## Section 4: Drying & Cure Tracker

### Data Model

```
State: {
  version: 1,
  harvestDate: ISO date string | null,
  phase: "idle" | "drying" | "curing" | "complete",
  dryingLogs: [{ day: number, date: string, done: boolean, tempC: number|null, rhPercent: number|null, notes: string }],
  curingLogs: [{ week: number, day: number, date: string, burped: boolean, durationMin: number|null, rhJar: number|null, smell: string, notes: string }],
  completedSummaries: [{ harvestDate: string, totalDryDays: number, totalCureDays: number, notes: string }]
}
```

### State Transitions

```
idle → drying    (user enters harvest date and clicks "Start")
drying → curing  (user clicks "Start Curing", enabled after 7 calendar days since harvest date)
curing → drying  (user clicks "Back to Drying" — buds need more dry time)
curing → complete (user clicks "Mark Cure Complete")
complete → idle  (user clicks "Start New Harvest" — previous summary saved to completedSummaries array)
```

**"Day 7+ reached"** means 7 calendar days have passed since the entered `harvestDate`, NOT that 7 checkboxes are checked. A grower who waits without logging can still transition.

### Phase: Idle (Start Screen)

Hero with tool title, brief explanation. Single "Start New Harvest" button. Harvest date input (defaults to today). If `completedSummaries` exist, show a "Previous Harvests" link to view past summaries.

### Phase: Drying (Days 1–14)

**Layout**: Vertical timeline on the left, daily log form on the right.

**Timeline**: Vertical line with day markers (1–14). Completed days = filled green dot. Current day (by calendar) = pulsing accent dot. Future days = outlined.

**Daily log card** (for current/past days):
- Day number and calendar date (computed from harvestDate + day offset)
- Checkbox: "Day completed"
- Temp (°C) and RH (%) inputs with inline target indicators (green if 15–18°C and 55–65% RH, gold if close, red if out of range)
- Day-specific guidance:
  - Days 1–3: "Check for mold spots. Adjust fan if needed. Keep air gentle."
  - Days 4–6: "Try snapping a small stem. If it bends, keep drying."
  - Days 7–10: "Branch snap test daily. When pencil-thick stems snap cleanly = ready."
  - Days 10–14: "Extended drying = more terpene preservation. Don't rush."
- Notes textarea (max 500 chars)

**Transition**: "Buds are ready — Start Curing" button. Enabled when ≥7 calendar days since harvest date. Disabled with tooltip explaining why if <7 days.

### Phase: Curing (Weeks 1–4+)

**"Back to Drying" button** at top — for when buds turn out too wet after jarring. Returns to drying phase, preserving existing drying logs.

**Week cards** (expandable accordion):
- Week number and date range
- Target burp frequency:
  - Week 1: 2–3× daily, 10–15 min each
  - Week 2: 1× daily, 5–10 min
  - Week 3: Every 2–3 days, 5 min
  - Week 4+: Weekly or sealed with Boveda
- List of burp sessions logged this week

**Burp log form** (quick add):
- Date/time (defaults to now)
- Duration (minutes, number input)
- Jar RH (%) reading
- Smell (dropdown: Hay/Grass, Ammonia, Transitioning, Strain-specific, Complex/Rich)
- Notes (short text, max 200 chars)

**Auto-triggered alerts** (using `.crit` / `.warn` box patterns):
- Jar RH >70%: `.crit` — "Too wet! Leave lids off 1–2 hours. Check for mold."
- Smell = "Ammonia": `.crit` — "Anaerobic bacteria active. Leave lids off 2–4 hrs, check all buds for mold."
- Jar RH <55%: `.warn` — "Overdried. Add Boveda 62% pack to stabilize humidity."

**Complete button**: "Mark Cure Complete" at bottom.

### Phase: Complete (Summary)

Display harvest summary card:
- Harvest date
- Total drying days, total cure days
- Average drying temp/RH
- Smell progression (timeline of smell entries)
- Any warnings that occurred during the cure
- "Copy Summary" button (formats as text, copies to clipboard)
- "Start New Harvest" button (saves summary to `completedSummaries` array, confirms before resetting)

### localStorage

Key: `growdoc-cure-tracker`
Full state persisted with debounced auto-save (1000ms) on every input change. Schema versioned. Cap `completedSummaries` at 10 entries (trim oldest). Cap individual note fields at stated character limits.

On corrupted data: show warning dialog offering to export raw JSON to clipboard before resetting.

---

## Section 5: Stealth Audit Checklist

### Data Model

```
State: {
  version: 1,
  currentAudit: { date: string, items: { [itemId]: "pass"|"fail"|"na" } } | null,
  auditHistory: [{ date: string, overallScore: number, categoryScores: { smell: number, noise: number, light: number, physical: number, electrical: number } }]
}
```

### Checklist Structure

Five collapsible category sections:

**Smell (40% weight, 6 items)**:
1. `smell-ar-door`: Stand outside AR door — any detectable odor?
2. `smell-apartment`: Stand at apartment entrance — any odor in hallway?
3. `smell-negative-pressure`: Tent walls sucking in? (negative pressure check)
4. `smell-ducts`: All duct connections — aluminum tape secure?
5. `smell-vent-grate`: Ventilation grate sealed?
6. `smell-door-gap`: Door gap sealed?

**Noise (20% weight, 3 items)**:
1. `noise-ar-door`: Stand outside AR door — fan audible?
2. `noise-apartment`: Stand outside apartment door — any unusual sound?
3. `noise-fan-speed`: Fan speed at minimum effective level?

**Light (20% weight, 3 items)**:
1. `light-ar-door`: During dark period: any light visible under AR door?
2. `light-bulb`: AR ceiling bulb disconnected/removed?
3. `light-seams`: Tent zippers/seams checked for pinholes?

**Physical (10% weight, 3 items)**:
1. `physical-items`: No grow-related items visible outside AR?
2. `physical-door`: AR door closed and (ideally) locked?
3. `physical-trash`: No suspicious trash in common recycling?

**Electrical (10% weight, 3 items)**:
1. `electrical-strip`: Single quality power strip, not daisy-chained?
2. `electrical-elevated`: All connections elevated off floor?
3. `electrical-circuits`: No overloaded circuits?

### UI

**Header**: Tool title + "Days since last audit" badge. Color-coded: green (<30 days), gold (30–60), red (>60 or never audited).

**Category sections**: Accordion/collapsible cards. Each header shows category name, weight, and current score (e.g., "Smell (40%) — 5/6 Pass"). Click to expand/collapse.

**Each item**: Three **radio buttons** in a row — Pass (green) / Fail (red) / N/A (grey). Item description text next to the radio group. Using radio buttons (not cycling toggle) for accessibility — no need to cycle through wrong states, and proper `role="radiogroup"` semantics.

```html
<fieldset class="audit-item">
  <legend class="sr-only">Smell check: AR door</legend>
  <p class="item-desc">Stand outside AR door — any detectable odor?</p>
  <div role="radiogroup" aria-label="Rating">
    <label><input type="radio" name="smell-ar-door" value="pass"> Pass</label>
    <label><input type="radio" name="smell-ar-door" value="fail"> Fail</label>
    <label><input type="radio" name="smell-ar-door" value="na"> N/A</label>
  </div>
</fieldset>
```

**Scoring panel** (sticky at top or bottom):
- Overall stealth score: large percentage with color-coded background (green ≥90%, gold 70–89%, red <70%)
- Category breakdown: horizontal bars showing per-category percentage
- Calculation: `overallScore = Σ(categoryWeight × categoryScore)` where `categoryScore = passCount / (passCount + failCount)`. N/A items excluded from both counts.

**Actions**:
- "Save Audit" — saves date + scores to `auditHistory`, clears `currentAudit`
- "View History" — expandable section showing past audits with dates and scores (last 12 months)
- "Reset" — clears current audit without saving

### localStorage

Key: `growdoc-stealth-audit`
Save current audit state + history array. Cap at 12 audit entries (one year of monthly audits). Schema versioned.

---

## Implementation Order

1. **Section 1: Sidebar Integration** — foundational, everything depends on tools appearing in the nav
2. **Section 3: Environment Dashboard** — simplest tool (pure calculation, no state machine), good first interactive build to establish the design patterns for inputs/buttons/results
3. **Section 5: Stealth Audit** — checklist UI exercises localStorage persistence patterns (save/load/history)
4. **Section 4: Cure Tracker** — multi-phase state machine with complex persistence, builds on patterns from sections 3 and 5
5. **Section 2: Plant Doctor** — most complex UI (wizard + expert mode), largest data set (full diagnostic tree)

## Cross-Cutting Concerns

### Shared CSS Patterns
All tools define the same base CSS variables (from the canonical `:root` block above) and reuse the same patterns: alert boxes (`.tip`, `.warn`, `.crit`), cards (`.cd`, `.lb`, `.vl`), grids (`.g2`, `.g3`). These are duplicated in each file (no shared CSS since tools are self-contained) but kept identical for visual consistency.

### Input Validation
Clamp numeric inputs to sensible ranges using `min`/`max` HTML attributes AND JS validation:
- Temperature: 0–50°C
- Humidity: 0–100%
- PPFD: 0–2000 µmol/m²/s
- Photoperiod: 1–24 hours

### Error Handling
- localStorage unavailable: `.warn` alert, tool functions without persistence
- Corrupted data: Warning dialog + export raw JSON to clipboard option before reset
- Invalid inputs: Inline validation messages, never crash

### Cache Busting
The parent app appends `?t=timestamp` to iframe src URLs. Tools should not parse `location.search` or expect meaningful query parameters.
