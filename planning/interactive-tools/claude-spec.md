# GrowDoc Interactive Tools — Complete Specification

## Overview

Add four interactive tools to the GrowDoc static site that help both newbie growers and professionals. Each tool is a self-contained HTML file loaded in the existing iframe doc viewer, with no login required and browser-only state persistence.

## Stack & Constraints

- **Platform**: Static HTML site on Vercel (https://growdoc.vercel.app)
- **Tech**: Vanilla JS + CSS, no frameworks, no build step
- **Design**: Dark botanical theme (DM Serif Display / Source Serif 4 / IBM Plex Mono)
- **Deployment**: Each tool = one `.html` file in `docs/`, registered in `docs.json`
- **Persistence**: `localStorage` only (no backend/API needed for tool state)
- **Access**: Fully open — no login required to use tools
- **Iframe**: Tools load inside the existing viewer iframe — fully self-contained
- **Responsive**: Mobile breakpoint at 640px, grids collapse to single column

## Sidebar Integration

Tools get a **new pinned section at the top of the sidebar**, above the existing priority groups. This requires:
1. A new `"category": "tool"` value in `docs.json`
2. Updated `app.js` to render tools section before priority groups
3. Distinct visual treatment (different tint/icon style) to differentiate from docs

## Visual Style for Interactive Elements

Interactive elements (buttons, inputs, selectors) should feel **slightly elevated/distinct** from the static docs:
- Same dark color palette (`--bg`, `--bg2`, `--accent`, etc.)
- But interactive elements get subtle glow effects, hover transitions, and a "living" feel
- Inputs: dark background with accent-colored borders on focus, subtle inner glow
- Buttons: gradient backgrounds with hover lift effect
- Results/outputs: fade-in animations when values change
- Consult frontend developer agent for final design decisions

## Tool 1: Plant Doctor (Symptom Checker)

### Purpose
Interactive diagnostic wizard that walks growers through identifying plant problems. Based on the plant-diagnostics skill's decision tree.

### UX Mode
- **Default: Step-by-step wizard** — one question per screen, each answer narrows the diagnosis
- **Expert mode toggle**: Shows all fields at once for experienced growers

### Decision Tree Flow
1. **Growth stage**: Seedling / Veg / Early flower / Mid flower / Late flower
2. **Primary symptom**: Yellowing / Spots-Burns / Curling / Drooping / White-Powdery / Discoloration
3. **Symptom location**: Old leaves (bottom) / New growth (top) / Everywhere
4. **Pattern**: Uniform / Interveinal / Margins / Tips only / Random spots / Circular
5. **Additional context**: Watering frequency / Last feed / Medium type

### Output
- **Diagnosis card** with condition name, confidence level, and severity indicator
- **"Check First" priorities**: pH → Watering → CalMag (most issues are lockout or overwatering)
- **Fix instructions**: Step-by-step remediation
- **Differential diagnoses**: Other possible causes ranked by likelihood

### Data Source
Encode the full diagnostic map from the plant-diagnostics skill:
- Mobile nutrient issues (old leaves): N, Mg, P, Ca, K deficiency patterns
- Immobile nutrient issues (new growth): Fe, Ca lockout, light/nute burn, heat/N toxicity
- Environmental stress: heat, light burn, wind burn, cold, VPD issues
- Pest identification: fungus gnats, spider mites, thrips, aphids, PM, bud rot
- pH lockout chart (soil optimal 6.0–6.8)
- The troubleshooting decision tree

### localStorage
Save last diagnosis for reference. No ongoing state needed.

## Tool 2: Environment Dashboard (VPD + DLI Calculator)

### Purpose
Combined VPD and DLI calculator showing the grower exactly where their environment sits and what to adjust.

### VPD Section
- **Inputs**: Air temperature (°C), Relative humidity (%), Leaf temp offset (default -2°C for LED)
- **Output**: VPD value in kPa, color-coded zone indicator
- **Visual**: SVG or CSS-grid VPD chart showing temp on Y-axis, RH on X-axis, colored zones, with user's current position marked
- **Stage targets**: Dropdown for growth stage → shows optimal VPD range
  - Seedling/Clone: 0.4–0.8 kPa
  - Veg: 0.8–1.2 kPa
  - Early flower: 1.0–1.4 kPa
  - Late flower: 1.2–1.6 kPa

### DLI Section
- **Inputs**: PPFD (µmol/m²/s), Photoperiod (hours — default 18 for veg, 12 for flower)
- **Output**: DLI (mol/m²/day) = PPFD × hours × 0.0036
- **Visual**: Bar/gauge showing where DLI sits vs yield plateau (40-50 mol/m²/day)
- **Context**: "At DLI <30, canopy management matters MORE than watts"

### Combined Environment Score
Show an overall "Environment Health" indicator combining VPD zone + DLI adequacy.

### localStorage
Save last inputs so the calculator remembers your typical environment on reload.

## Tool 3: Drying & Cure Tracker

### Purpose
Single-harvest tracker with day-by-day drying protocol and cure jar burping schedule.

### Phase 1: Drying (Days 1-14)
- **Start**: Enter harvest date, drying environment targets (15-18°C, 55-65% RH)
- **Daily log**: Checkbox for each day with target actions
  - Days 1-3: Check for mold spots, adjust fan if needed
  - Days 5-7: Small branch snap test
  - Days 7-10: Branch snap test daily
  - Days 10-14: Ready when pencil-thick branches snap cleanly
- **Environment tracker**: Log daily temp/RH readings
- **Visual**: Timeline with progress indicator, current day highlighted

### Phase 2: Cure (Weeks 1-4+)
- **Week 1**: Burp 2-3× daily, 10-15 min each. Check for ammonia smell.
- **Week 2**: Burp 1× daily, 5-10 min. Aroma transitioning.
- **Week 3**: Burp every 2-3 days, 5 min. Smoke test possible.
- **Week 4+**: Weekly burp or sealed with Boveda 62%.
- **Each burp**: Checkbox + optional note (smell description, observations)
- **Jar RH tracking**: Log humidity readings per burp

### Completion & Reset
- Mark harvest as complete → show summary (total dry days, cure duration, notes)
- Export summary as text
- Reset for next harvest

### localStorage
Full state persistence — survive page reloads. Schema versioned for future updates.

## Tool 4: Stealth Audit Checklist

### Purpose
Monthly security audit checklist from the stealth-opsec skill. Check off items, get an overall stealth score, track when items were last checked.

### Categories
1. **Smell** (6 items): Outside AR door, apartment entrance, negative pressure, duct connections, vent grate sealed, door gap sealed
2. **Noise** (3 items): Outside AR door, outside apartment door, fan at minimum speed
3. **Light** (3 items): Light under AR door during dark period, AR bulb disconnected, tent seams/zippers
4. **Physical** (3 items): No grow items visible, AR door closed/locked, no suspicious trash
5. **Electrical** (3 items): Single power strip, connections off floor, no overloaded circuits

### Scoring
- Each item: Pass / Fail / N/A
- Category score: % passed
- Overall stealth score: weighted average (Smell 40%, Noise 20%, Light 20%, Physical 10%, Electrical 10%)
- Color-coded: Green (90%+), Gold (70-89%), Red (<70%)

### History
- Save audit date + scores
- Show last audit date and score per category
- "Days since last audit" indicator with warning if >30 days

### localStorage
Save audit history (date + scores). Show trend over time if multiple audits saved.

## docs.json Integration

Add new entries with `"category": "tool"` — these render in the pinned tools section:

```json
{ "id": "plant-doctor", "title": "Plant Doctor", "subtitle": "Interactive symptom diagnosis",
  "icon": "🩺", "status": "DONE", "category": "tool", "file": "tool-plant-doctor.html" },
{ "id": "env-dashboard", "title": "Environment Dashboard", "subtitle": "VPD + DLI calculator & chart",
  "icon": "🌡️", "status": "DONE", "category": "tool", "file": "tool-env-dashboard.html" },
{ "id": "cure-tracker", "title": "Drying & Cure Tracker", "subtitle": "Harvest-to-jar protocol tracker",
  "icon": "🫙", "status": "DONE", "category": "tool", "file": "tool-cure-tracker.html" },
{ "id": "stealth-audit", "title": "Stealth Audit", "subtitle": "Monthly OPSEC security checklist",
  "icon": "🔒", "status": "DONE", "category": "tool", "file": "tool-stealth-audit.html" }
```

## app.js Changes

Update the render function to:
1. Extract tools (`category === "tool"`) from `visibleDocs` before priority grouping
2. Render a "Tools" section at the top of `nav-list`, styled distinctly
3. Tools are always visible (not affected by status filters — they're always "DONE")

## style.css Changes

Add styles for:
1. `.priority-group.prio-tools` — distinct visual treatment (maybe accent border or subtle gradient background)
2. `.nav-item.cat-tool` — different tint from botanical/planning (accent green glow?)
3. Form element styles that can be reused across all tools (inputs, buttons, selectors)
