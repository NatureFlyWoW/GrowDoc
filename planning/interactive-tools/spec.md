# GrowDoc Interactive Tools — Spec

## Vision
Add interactive, beautifully designed tools to the GrowDoc static site that help both newbie growers and professionals. Each tool is a self-contained HTML file that loads in the existing iframe doc viewer.

## Current Stack
- Static HTML site on Vercel (https://growdoc.vercel.app)
- Vanilla JS + CSS — earthy, dark botanical design system (DM Serif Display, Source Serif 4, IBM Plex Mono)
- Sidebar doc viewer with priority-grouped navigation (Urgent Care → Setup → Future Runs → Reference)
- Serverless API functions (login, state, save) using GitHub as backend
- No frameworks, no build step
- docs.json registry for sidebar entries

## Design System
Dark theme: --bg:#0c0f0a, --accent:#8fb856 (green), --gold:#c9a84c, --red:#c45c4a, --blue:#5a9eb8
Typography: DM Serif Display (headings), Source Serif 4 (body), IBM Plex Mono (data/labels)
Cards with 1px borders, rounded corners, subtle gradients. Priority indicators with colored left borders.

## Core Concept
Interactive HTML sheets/tools that let users:
1. Describe their issues or situation (dropdown/checkbox selectors, not free-text AI)
2. Get a diagnostic/guidance sheet generated client-side from built-in decision trees
3. Work with it interactively (checklists, calculators, trackers with localStorage persistence)

## Tool Ideas to Explore

### From plant-diagnostics skill:
- **Plant Doctor**: Interactive symptom checker — select leaf position (top/bottom), symptom type (yellowing/spots/curling/drooping), pattern → get diagnosis with confidence rating, fix instructions, and "check these first" priorities (pH, watering, CalMag)
- Decision tree from the skill's diagnostic map, pH lockout chart, environmental stress table

### From cultivation-mastery skill:
- **VPD Calculator**: Enter temp + humidity → get VPD, color-coded zone indicator (too low/optimal/too high), with leaf temp offset for LED grows. Show target ranges per growth stage.
- **DLI Calculator**: Enter PPFD + photoperiod → daily light integral. Show where you sit vs yield plateau. Include light height optimization tips.
- **Watering Tracker**: Log watering events, track wet/dry cycles, get alerts if cycle is too frequent or too spaced

### From post-harvest skill:
- **Harvest Timer**: Trichome maturity selector → harvest window recommendation. Drying environment tracker (temp/RH logging). Cure jar burping schedule with countdown timers.
- **Drying & Cure Tracker**: Day-by-day protocol with checkboxes, environment targets, snap test reminders

### From terpene-profiling skill:
- **Terpene Effect Matcher**: Select desired effects (energizing/relaxing/creative/pain relief) → get target terpene profile → matching strain suggestions with terpene breakdown
- **Vaporizer Temp Guide**: Interactive temperature ladder showing which terpenes/cannabinoids activate at each temp

### From pheno-hunting skill:
- **Pheno Scorecard**: Digital version of the scoring framework — enter traits per phase, auto-calculate weighted scores, compare plants side-by-side, keeper/cull recommendation

### From stealth-opsec skill:
- **Stealth Audit Checklist**: Interactive monthly audit — check off each item (smell/noise/light/physical/electrical), get an overall stealth score, flag items overdue for checking

## Key Constraints
- Each tool = one self-contained HTML file with inline CSS/JS
- Must match the existing dark botanical design system
- localStorage for persistence (no backend needed for tool state)
- Works in iframe within the doc viewer
- Accessible (keyboard nav, ARIA, contrast compliant)
- Mobile-responsive
- No external dependencies beyond Google Fonts

## Non-Goals
- No AI/LLM integration (all logic is client-side decision trees)
- No user accounts or cloud sync
- No build step or transpilation
- Don't feature-scope — each tool does ONE thing well
