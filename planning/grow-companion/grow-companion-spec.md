# GrowDoc Grow Companion — Implementation Spec

## Vision
Transform GrowDoc from a reactive diagnostic "Plant Doctor" tool into a proactive daily grow companion that helps any cannabis grower dynamically optimize their grow based on their setup, experience level, and priorities (yield, quality, terpenes, effect).

## Current State
- **App**: Plant Doctor v3 — 6,400-line vanilla JS diagnostic tool
- **Tech**: Vanilla JS/HTML/CSS (no framework, no build step, no npm deps), Vercel Functions, GitHub API backend
- **Features**: 44 diagnoses, 42 symptoms, 166 advice rules, note-aware context engine, 3 diagnostic modes (wizard/expert/multi-dx), treatment journal, localStorage persistence
- **Deployed**: growdoc.vercel.app via Vercel auto-deploy
- **Key files**: 
  - `docs/tool-plant-doctor.html` (6466 lines — main diagnostic tool)
  - `docs/plant-doctor-data.js` (596 lines — knowledge base)
  - `docs/tool-env-dashboard.html` (VPD/DLI calculator)
  - `app.js` (151 lines — doc viewer/nav)
  - `index.html` / `style.css` — main app shell

## Architecture Decisions (User Confirmed)
1. **Stay vanilla JS** — no framework, no build step. User likes the simplicity.
2. **Local-only persistence** — localStorage, no accounts, no cloud. Privacy-first community tool.
3. **All features** — comprehensive companion, best possible usability. No cutting corners.
4. **Priority system**: Slider-based (weight multiple priorities, e.g. 60% terpenes / 40% quality). Presets can come later.
5. **All user levels** with progressive disclosure — users self-identify expertise level (or use preset).
6. **Desktop-first** responsive design.
7. **No photo features** in this phase — skip entirely, add later.
8. **Knowledge integration**: ALL of these:
   - A) Built into the task engine (proactive, context-aware advice from Franco's protocols)
   - B) Reference guides you can browse
   - C) Both proactive + reference
   - D) Evidence confidence levels on every recommendation (Professor's recommendation)
9. **Plant Doctor integration**: Deep integration — diagnostic triggers from daily logs, "I see spots" auto-launches doctor with context pre-filled. If too complex, keep as standalone feature within the app.
10. **Community project** — no monetization, free and open.

## Expert Research Summary

### Franco (Cultivation Expert — Decades of Experience)
Delivered comprehensive protocols for:
- **Daily/weekly/stage grower workflows** — what decisions matter when
- **Priority-based parameter tables** (specific numbers for yield/quality/terpenes/effect):
  - Yield: DLI 40-50+, PPFD 800-1000+, 26-28C, VPD 1.0-1.4, aggressive training, harvest 30-40% amber
  - Quality: DLI 35-45, PPFD 600-800, 24-26C/18-20C night, moderate training, harvest 10-20% amber
  - Terpenes: DLI 30-40, PPFD 500-700, 22-24C/16-18C night, organic medium preferred, harvest 5-15% amber, slow dry 15-17C
  - Effect targeting: Energetic (0-10% amber, terpinolene/limonene), Sedative (30-50% amber, myrcene/caryophyllene), Anti-anxiety (15-25% amber, linalool, consider CBD genetics)
- **Complete VPD targets by stage** (seedling through ripening, with day/night temp/RH ranges):

| Stage | Day Temp (C) | Night Temp (C) | Day RH (%) | Night RH (%) | Target VPD (kPa) |
|-------|-------------|----------------|------------|--------------|-------------------|
| Seedling | 24-26 | 22-24 | 65-75 | 70-80 | 0.4-0.8 |
| Early Veg | 24-27 | 20-23 | 55-65 | 60-70 | 0.8-1.0 |
| Late Veg | 25-28 | 20-23 | 50-60 | 55-65 | 1.0-1.2 |
| Transition | 24-27 | 19-22 | 50-58 | 55-62 | 1.0-1.3 |
| Early Flower | 24-27 | 18-21 | 48-55 | 50-58 | 1.0-1.4 |
| Mid Flower | 23-26 | 17-20 | 45-55 | 48-55 | 1.2-1.5 |
| Late Flower | 21-24 | 15-18 | 40-50 | 42-50 | 1.2-1.6 |
| Ripening | 20-23 | 14-17 | 38-45 | 40-48 | 1.3-1.6 |

- **DLI targets by stage AND priority**:

| Stage | Minimum | Standard | Yield Priority | Quality Priority | Terpene Priority |
|-------|---------|----------|---------------|-----------------|-----------------|
| Seedling | 12 | 15-18 | 18 | 15 | 13-15 |
| Veg | 20 | 25-35 | 35-45 | 30-35 | 25-30 |
| Early Flower | 25 | 30-40 | 40-50 | 35-40 | 30-35 |
| Mid Flower | 30 | 35-45 | 45-55 | 38-45 | 32-38 |
| Late Flower | 25 | 30-40 | 40-50 | 35-40 | 28-35 |

- **Nutrient strategies by medium** (soil/coco/hydro) with specific EC targets, N-P-K ratios, and feeding frequencies per stage
- **Training protocols** (topping, LST, ScrOG, mainline, lollipop, defoliation timing) with yield/quality/terp impact ratings
- **Harvest timing by priority** with trichome assessment protocols
- **Drying and curing protocols** with specific temp/RH/duration targets
- **Daily task engine logic**: "What Should I Do Today?" based on stage, days since last water/feed, environment, priority

### Professor (Academic Cannabis Science)
Delivered evidence-based validation with confidence levels:
- **ESTABLISHED**: Yield scales linearly with PPFD to 1800 umol (Rodriguez-Morrison 2021). Cannabinoid % is genetic, not environmental. Optimal flower N=160mg/L, P=40-80mg/L, K=60-175mg/L (Bernstein lab). UV-B does NOT increase THC (debunked). Flushing has no effect (Stemeroff 2017). Indica/sativa classification is meaningless for effects (Russo 2016).
- **PROMISING**: 13h photoperiod +38% THC yield (Ahrens 2024). Drought stress protocol +43% THCA yield (Caplan 2019). LED increases Ca/Mg demand.
- **SPECULATIVE**: VPD targets (extrapolated from general horticulture, no cannabis-specific studies). Temperature differentials for terpenes (mechanistically sound, not tested). Terpene manipulation through environment (not demonstrated).
- **Key recommendation**: Every recommendation should have an evidence confidence indicator (Established/Promising/Speculative/Practitioner Consensus).

### UX Researcher
Key patterns:
- **Two-speed structure**: Quick Ops (daily glance, 30 seconds) + Grow Hub (deep dive, 10+ minutes)
- **Desktop-first navigation**: Sidebar with sections: Today / My Grow / Tools / Knowledge Base
- **Dashboard zones**: Zone 1 (status banner), Zone 2 (today's actions), Zone 3 (grow timeline snapshot)
- **Progressive profiling**: Don't front-load setup questions. Ask at point of use, build profile over time.
- **Three-layer content**: Action (always visible) -> Why (expandable) -> Deep Reference (link out)
- **Quick Log pattern**: Plant -> Action -> Confirm in under 15 seconds
- **Six design principles**: Context-first, Speed+Depth as modes, Earn every notification, Log is the product, Grows have seasons, Plant is the hero

### Product Manager
- **Competitive positioning**: vs Grow with Jane (passive journaling), BudLabs (hardware-dependent), GrowDiaries (community-only), forums/YouTube (static/inconsistent)
- **Differentiators**: Science-backed, setup-aware, proactive, closed feedback loops, free + accessible
- **Success metrics**: >80% setup completion, >60% timeline adoption, >40% daily task engagement, >70% 7-day retention

## Features to Implement (All of These)

### 1. App Shell & Navigation Redesign
Transform from document viewer to companion app:
- Desktop-first layout with sidebar navigation (Today / My Grow / Tools / Knowledge Base)
- Responsive for mobile
- Dark theme consistent with existing design system (#0c0e0a bg, #8fb856 accent green)
- Quick-access toolbar for common actions

### 2. Grow Setup Profile
- Growing medium (soil/coco/hydro/soilless)
- Lighting type + wattage/PPFD if known
- Grow space dimensions
- Number of plants
- Nutrient line/brand (optional)
- Experience level (First Grow / Beginner / Intermediate / Advanced / Expert) -- or preset
- Priority sliders (yield/quality/terpenes/effect, weighted, summing to 100%)
- Stored in localStorage, accessible app-wide
- Profiles for multiple simultaneous grows

### 3. Growth Stage Timeline
- Visual timeline showing current position in grow cycle
- Stages: Germination -> Seedling -> Veg -> Transition -> Early Flower -> Mid Flower -> Late Flower -> Harvest -> Dry -> Cure
- User sets start date + current stage, app calculates position
- Milestone markers (topping day, flip day, defoliation windows, harvest window)
- Stage-appropriate content and advice changes automatically

### 4. Daily Task Engine ("What Should I Do Today?")
This is the KILLER FEATURE. Dynamic, context-aware task generation:
- Based on: growth stage, days since last water/feed, medium type, lighting, priority settings, experience level
- Examples: "Lift test -- likely time to water (5 days since last, 3-gal soil, mid-veg)"
- "Defoliation window opens today (Day 21 of flower) -- remove fan leaves blocking bud sites, max 20-25%"
- "Check trichomes -- harvest window approaching based on timeline"
- Tasks ranked by importance (urgent/recommended/optional)
- Each task has the three-layer disclosure: What to do -> Why -> Deep reference
- Evidence confidence badge on each recommendation

### 5. Environment Calculator
- VPD calculator with stage-aware targets (using Franco's complete VPD table)
- DLI calculator (PPFD x hours x 0.0036) with priority-adjusted targets
- Nutrient calculator: EC/pH targets by medium and stage
- Temperature differential advisor
- All outputs adjusted by priority sliders (yield targets different from terpene targets)
- Shows "your current" vs "optimal range" with specific adjustment advice

### 6. Priority System (Slider-Based)
- 4 sliders: Yield / Quality / Terpenes / Effect
- Weighted (sum to 100% or independent 0-100 each)
- Changes propagate to: DLI targets, VPD targets, temperature recommendations, nutrient ratios, training advice, harvest timing, drying/curing protocols
- Visual indicator of current priority balance
- Franco's complete parameter tables encoded as the engine behind this

### 7. Feeding Schedule Generator
- Input: medium, nutrient brand (or generic), growth stage, priority
- Output: specific ratios, EC target, pH target for today
- Adjusts by priority (terpene priority = lower EC, less N in flower)
- Medium-specific advice (coco: never let dry, always CalMag; soil: wet/dry cycles; hydro: res temp critical)
- Shows when to transition ratios based on stage

### 8. Harvest Window Advisor
- Trichome assessment input (clear/milky/amber percentages via sliders)
- Priority-based recommendation: "Based on 80% milky, 15% amber and your TERPENE priority: harvest within 1-3 days"
- Trade-off display: "Waiting 5 more days: +10% weight, -5-8% terpene complexity"
- Stagger harvest recommendation
- Drying/curing protocol based on priority (slow dry for terpenes, specific temp/RH targets)

### 9. Quick Log System
- Per-plant logging: Watered / Fed / Trained / Observed
- Timestamp auto-filled, optional pH/EC/notes
- "Same as last time?" for repeat feeds
- Days-since counters (last water, last feed, last check)
- Log history per plant, searchable

### 10. Knowledge Base with Evidence Levels
- Franco's protocols as browsable reference (organized by stage and topic)
- Professor's evidence ratings on each claim (Established / Promising / Speculative / Debunked)
- Three-layer disclosure on every piece of advice
- Myth-busting section (flushing, darkness, sugar supplements, indica/sativa)
- Integrated with existing GrowDoc guides

### 11. Plant Doctor Deep Integration
- "I see a problem" button in daily dashboard launches Plant Doctor with full context pre-filled (medium, lighting, stage, recent log entries as notes)
- If a log entry mentions symptoms, suggest running Plant Doctor
- Diagnosis results feed back into the daily task engine ("CalMag deficiency diagnosed 3 days ago -- check for improvement today")
- Treatment tracking from diagnosis to resolution

### 12. Grow Journal & History
- Automatic journal from log entries
- Per-grow summary (setup, timeline, key events, outcomes)
- Compare current grow to previous grows
- "What worked" highlights from past grows

## Data Architecture (localStorage)
All data in localStorage with structured JSON:
- `growdoc-companion-profile`: Setup, priorities, experience level
- `growdoc-companion-plants`: Array of plant objects with stage, start date, logs
- `growdoc-companion-grows`: Grow history (completed grows)
- `growdoc-companion-tasks`: Generated tasks with completion status
- Existing `plant-doctor-journal` integrated

## Design System
- Extend existing dark theme (#0c0e0a, #8fb856, #c9a84c, #c45c4a, #5a9eb8)
- Typography: DM Serif Display (titles), Source Serif 4 (body), IBM Plex Mono (data/labels)
- Evidence confidence badges: Established (green), Promising (blue), Speculative (gold), Debunked (red)
- Priority colors: Yield (gold), Quality (green), Terpenes (purple), Effect (blue)
- Card-based UI with expandable sections (three-layer disclosure pattern)
- Desktop-first responsive layout

## Key Technical Considerations
- No framework -- vanilla JS with clean module pattern
- No build step -- direct script loading
- localStorage for all persistence (with export/import for backup)
- Existing Vercel deployment pipeline (auto-deploy on push)
- Plant Doctor integration via shared localStorage and function calls (not iframe isolation)
- All Franco/Professor knowledge encoded as JS data modules (like plant-doctor-data.js)
