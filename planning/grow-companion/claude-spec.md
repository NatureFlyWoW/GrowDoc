# GrowDoc Grow Companion — Complete Specification

## Project Vision

Transform GrowDoc from a reactive diagnostic tool (Plant Doctor v3) into a proactive daily grow companion that dynamically optimizes cultivation advice based on each grower's setup, experience level, and priorities.

**Core Value Proposition**: "Open the app, see exactly what your plant needs today based on its actual state, your setup, and your goals."

**Target Users**: Indoor photoperiod cannabis growers of all experience levels (First Grow through Expert), growing in soil, coco, or hydro under LED/HPS/CFL lighting.

**Privacy**: Strictly personal tool. No accounts, no cloud, no data leaves the browser. Ever.

---

## Technical Constraints

- **Vanilla JS** — no framework, no build step, no npm dependencies
- **localStorage only** — all persistence client-side, warn at 80% capacity
- **Metric only** — Celsius, liters, centimeters, grams
- **Online only** — no PWA/offline support (can add later)
- **Desktop-first** — responsive for mobile, but primary experience is desktop
- **Dark theme** — #0c0e0a bg, green accents, consistent with Plant Doctor style
- **Auto-deploy** — Vercel auto-deploy on push to main

---

## App Structure

### Navigation
- **Collapsible sidebar** with toggle button
- Full labels when expanded (~220px), icons-only when collapsed (~60px)
- Sections: **Today** (dashboard) / **My Grow** (plants, timeline, training) / **Tools** (Plant Doctor, Stealth Audit) / **Knowledge Base** (contextual content, myth-busting)

### First Visit Flow
1. **Landing page** — clean, minimal, purely functional. Hero text, 3 feature highlights, one 'Get Started' button. Under 1 screen. No animations, no illustrations.
2. **Full setup wizard** (7-10 steps): growth stage, growing medium, lighting type + wattage, pot size, plant count, strain (from database), grow space dimensions, experience level (First Grow / Beginner / Intermediate / Advanced / Expert), priorities (1-5 stars each for Yield/Quality/Terpenes/Effect), plus specific effect selection if Effect is rated 3+.
3. **Dashboard** — personalized from the first moment based on setup answers.

### Between-Grows Mode
When a grow ends (via 'Finish Grow' flow with summary, optional yield, rating):
- Dashboard shifts to show past grow summary, planning tools, knowledge base
- 'Start New Grow' button prominent
- Previous grow data archived (summary only, detailed logs discarded)

---

## Feature Specifications

### 1. Grow Setup Profile

**Data collected during onboarding:**
- Growing medium: soil / coco / hydro / soilless
- Lighting type: LED / HPS / CFL / fluorescent + wattage/PPFD if known
- Grow space dimensions (L x W x H in cm)
- Number of plants
- Pot size per plant: 1L / 3L / 5L / 7L / 10L / 15L / 20L+
- Strain per plant (from database or custom entry)
- Experience level: First Grow / Beginner / Intermediate / Advanced / Expert
- Priority ratings: Yield (1-5 stars), Quality (1-5 stars), Terpenes (1-5 stars), Effect (1-5 stars)
- If Effect >= 3 stars: specific effect selection (Energetic / Relaxing / Creative / Pain Relief / Anti-Anxiety / Sleep)

**Stored in:** `growdoc-companion-profile` localStorage key

**One active grow at a time.** Past grows archived. Data model should support future multi-grow but UI is single-grow only.

### 2. Growth Stage Timeline

**Horizontal progress bar** showing grow progression left-to-right with stage markers.

**Stages:** Germination → Seedling → Veg → Transition → Early Flower → Mid Flower → Late Flower → Harvest → Dry → Cure → Complete

**Stage transitions:** Auto-advance with confirmation. App detects typical duration, shows prompt: "Ready to move to [next stage]? [Yes] [Not yet]"

**Milestone markers** overlaid on timeline:
- Topping window (based on node count / days in veg)
- Flip day (veg → flower transition)
- Defoliation windows (day 1 and day 21 of flower)
- Harvest window opening
- Cure milestones (week 1, 2, 4)

**Dry/Cure stages** absorb the existing Cure Tracker functionality with full daily logging (temp, RH, smell assessment, snap test, burp tracking).

### 3. Daily Task Engine — THE KILLER FEATURE

**Dynamic, per-plant task generation** based on: growth stage, days since last water/feed, medium type, lighting, priority settings, experience level, recent Plant Doctor diagnoses (if opted in), training plan.

**Experience-level adaptive detail:**
- First Grow/Beginner: Hyper-specific numbers ("Water Plant 2 — target pH 6.3, EC 1.4, ~1.5L based on 5L pot in mid-veg coco")
- Intermediate: Ranges with context ("Water Plant 2 — pH 6.0-6.5, EC 1.2-1.6, coco needs daily watering")
- Advanced/Expert: Brief action items ("Plant 2 — watering due (5 days, 5L soil)")

**Task priority levels:** Urgent (red) / Recommended (gold) / Optional (blue)

**Task actions (full management):**
- Done (with optional note about what was actually done)
- Dismiss (not applicable)
- Snooze (remind tomorrow or in X days)
- User can add custom tasks

**Three-layer content on each task:**
- Layer 1 (always visible): The action
- Layer 2 (expandable): Why this matters, evidence level, practitioner insight
- Layer 3 (link): Deep reference in Knowledge Base

**Evidence confidence** shown in Layer 2: Established / Promising / Speculative / Practitioner Consensus

### 4. Priority System

**1-5 star rating** for each priority:
- **Yield** (color: green) — maximize grams
- **Quality** (color: gold) — dense, frosty, perfect structure
- **Terpenes** (color: purple) — aroma, flavor, complexity
- **Effect** (color: indigo) — target specific subjective effects

**If Effect >= 3 stars**, user selects specific effect: Energetic / Relaxing / Creative / Pain Relief / Anti-Anxiety / Sleep. This maps to target terpene profiles (e.g., Relaxing → myrcene + caryophyllene, Energetic → terpinolene + limonene).

**Changeable anytime.** Adjusting priorities immediately recalculates all recommendations.

**App calculates relative weights internally** from star ratings. Stars are independent (not forced sum). E.g., Yield=5, Quality=3, Terpenes=5, Effect=2 → weights: Yield 33%, Quality 20%, Terpenes 33%, Effect 13%.

**Recommendation display:** Priority-adjusted recommendation + trade-off note. Example: "Harvest at 5-15% amber (terpene priority). Waiting to 30% amber would add ~15% weight but reduce terpene complexity."

### 5. Environment Dashboard (Integrated)

**VPD widget on main dashboard** showing last-entered temp/RH and current status (optimal/high/low for current stage and priority). User updates values inline.

**Calculators:**
- VPD calculator with stage-aware targets (Franco's complete VPD table, adjusted by priority)
- DLI calculator (PPFD × hours × 0.0036) with priority-adjusted targets
- Temperature differential advisor (day/night recommendations by stage and priority)
- Nutrient targets: EC/pH by medium and stage

**Environmental logging with trend graphs:**
- User logs daily temp/RH highs and lows
- App shows trend graphs over weeks
- Alerts on drift patterns ("Average night RH has increased 8% over 2 weeks — bud rot risk increasing")

### 6. Feeding Schedule Generator

**Brand-agnostic.** Generic N-P-K ratios, EC targets, pH targets by medium and stage.

**Inputs:** Medium (from profile), growth stage (from timeline), priority settings
**Outputs:** Recommended N-P-K ratio, target EC, target pH, medium-specific notes

**Medium-specific rules:**
- Soil: wet/dry cycles, organic tea recommendations, runoff pH guidance
- Coco: always CalMag, never let dry, daily watering in flower, 15-20% runoff
- Hydro: reservoir temp critical (<22°C), daily EC/pH monitoring

**Priority adjustments:**
- Terpene priority: lower EC, less N in flower, sulfur supplementation
- Yield priority: higher EC, push nutrients to plant tolerance
- Quality priority: standard EC, slight N reduction in flower

### 7. Harvest Window Advisor

**Trichome input:** Three sliders (Clear / Milky / Amber) that must sum to 100%.

**Priority-based recommendation** with trade-off notes:
- "Based on 80% milky, 15% amber and your TERPENE priority: harvest within 1-3 days"
- "Waiting 5 more days: +10% weight, -5-8% terpene complexity"

**Additional advice:**
- Stagger harvest recommendation (tops first, lowers 5-7 days later)
- Drying protocol based on priority (slow dry for terpenes: 15-17°C, 55-60% RH)
- Curing protocol with timeline

### 8. Training Planner

**Dedicated section in My Grow** where users set their training strategy.

**Training methods:** No training / LST only / Top + LST / Mainline / ScrOG / Lollipop only
**App generates schedule** with milestones based on plant stage and method:
- When to start LST (4-5 nodes, flexible stems)
- When to top (5th-6th node, vigorous growth)
- Defoliation windows (day 1 and day 21 of flower)
- Lollipop timing (end of stretch, week 2-3 of flower)

**Integrates with task engine:** Training milestones appear as scheduled tasks.

### 9. Quick Log System

**Per-plant logging** accessible from dashboard or My Grow.

**Log types:** Watered / Fed / Trained / Observed

**Adaptive detail (minimal default, expandable):**
- One-tap: "Fed Plant 2" + timestamp
- Expandable: pH, EC, volume, nutrient notes, runoff data
- "Same as last time?" for repeat feeds (pre-fills from last log)

**Days-since counters** on dashboard: last water, last feed, last check per plant.

**Log history** per plant, searchable/filterable.

### 10. Plant Doctor — Unified Diagnostic Flow

**Redesigned** from 3 modes (Wizard/Expert/Multi-Dx) into single adaptive flow:
- Start with guided questions (like Wizard)
- At any point, user can switch to multi-symptom selection
- Refine questions appear when disambiguation is needed
- Full context pre-filled from grow profile (medium, lighting, stage, recent logs)

**Integration:** "I see a problem" button on dashboard → navigates to Plant Doctor as full page. Context auto-loaded.

**Diagnosis follow-up:** After diagnosis, ask "Create a follow-up reminder?" If yes, task engine generates check-in task at appropriate interval.

**Outcome tracking:** Every diagnosis gets optional follow-up. Track: diagnosis → treatment → outcome (resolved/ongoing/worsened). Build personal "what works" database over time.

### 11. Knowledge Base

**Contextual content** — existing guide documents dissolved into contextual advice surfaced within tools. No standalone guide pages.

**Organized by topic and stage:**
- Stage-specific guides (what matters in seedling, veg, flower, etc.)
- Medium-specific guides (soil, coco, hydro best practices)
- Training guides (topping, LST, ScrOG technique)
- Nutrient guides (deficiency identification, feeding principles)
- Harvest/dry/cure guides

**Myth-busting section:** Dedicated area where debunked practices are explained with evidence. Not inline interruptions.

**Three-layer content everywhere:**
- Layer 1: Practical advice (Action)
- Layer 2: Why it matters + evidence level + source (expandable)
- Layer 3: Deep reference within Knowledge Base (internal links only)

**Evidence levels (shown in Layer 2):**
- Established (green): Replicated peer-reviewed research
- Promising (blue): Single study or strong preliminary data
- Speculative (gold): Mechanistically sound, not yet tested in cannabis
- Practitioner Consensus (gray): Widely accepted by experienced growers, limited formal study

**Conflict resolution:** Practitioner-first with science as validation. Lead with practical advice from experience. Add science as supporting or contradicting evidence.

### 12. Grow Journal & History

**Automatic journal** generated from Quick Log entries. Each log creates a journal entry.

**Per-grow summary** (displayed after "Finish Grow" flow):
- Setup recap (medium, lights, strain, priorities)
- Timeline overview (stage durations, total grow days)
- Key events (diagnoses, training milestones, stage transitions)
- Outcomes (treatment success rates, final notes, optional yield)

**Archiving:** Completed grows keep summary only. Detailed daily logs are discarded to save localStorage space. Warn user at 80% storage capacity.

### 13. Strain Database

**Large pre-built database** (500+ strains) compiled from public sources.

**Fields per strain:**
- Name (required)
- Breeder/seed bank
- Expected flowering time (weeks)
- Stretch ratio (1.5x - 4x)
- Known sensitivities (PM-prone, CalMag-hungry, heat-sensitive, etc.)
- Type: Indica-dom / Hybrid / Sativa-dom (for stretch/structure prediction only, NOT for effect prediction)
- Optional: dominant terpenes, THC/CBD range if known

**User can add custom strains** with the same field structure.

**Stored as:** Static JS data file (like plant-doctor-data.js), loaded at app startup.

### 14. Stealth Audit

**Kept as-is** in the Tools section. No changes needed. Existing standalone functionality.

---

## Data Architecture

### localStorage Keys

| Key | Purpose | Structure |
|-----|---------|-----------|
| `growdoc-companion-profile` | Active grow profile | {version, medium, lighting, space, experience, priorities, effect, plants[]} |
| `growdoc-companion-grow` | Active grow data | {id, startDate, currentStage, timeline, logs[], tasks[], diagnoses[]} |
| `growdoc-companion-archive` | Past grow summaries | [{id, summary, startDate, endDate, yield, rating, notes}] |
| `growdoc-companion-env` | Environment log history | [{date, tempHigh, tempLow, rhHigh, rhLow, vpdCalc}] |
| `growdoc-companion-training` | Training plan | {method, milestones[], completedActions[]} |
| `growdoc-companion-outcomes` | Treatment outcome database | [{diagnosisId, treatment, plantId, resolved, daysToResolve}] |
| `growdoc-companion-prefs` | UI preferences | {sidebarCollapsed, experienceLevel, lastViewedSection} |

### Schema Versioning
- Every localStorage key includes a `version` field
- Sequential migration functions at startup (v1→v2→v3)
- Corrupted data falls back to fresh state with warning

---

## Design System

### Colors
- Background: #0c0e0a (primary), #141a10 (cards), #1a2214 (hover)
- Text: #d4cdb7 (primary), #a39e8a (secondary), #6b6756 (disabled)
- Accent: #8fb856 (primary green), #6a9e3a (darker), #4a7a25 (press)
- Priority: Yield=#8fb856 (green), Quality=#c9a84c (gold), Terpenes=#9b59b6 (purple), Effect=#5b6abf (indigo)
- Evidence: Established=#8fb856 (green), Promising=#5a9eb8 (blue), Speculative=#c9a84c (gold), Practitioner=#a39e8a (gray)
- Status: Urgent=#c45c4a (red), Recommended=#c9a84c (gold), Optional=#5a9eb8 (blue)

### Typography
- Titles: 'DM Serif Display', Georgia, serif
- Body: 'Source Serif 4', Georgia, serif
- Data/Labels: 'IBM Plex Mono', monospace

### Responsive Breakpoints
- Desktop: >768px (primary experience)
- Tablet: <=768px (sidebar collapses)
- Mobile: <=640px (single column, full width)

### Component Patterns
- Card-based UI with expandable sections
- Form input groups (label + input + hint)
- Status badges with severity colors
- Progress bars with stage markers
- Star rating inputs for priorities
- Three-layer disclosure (action → why → reference)
- Per-plant task cards with action buttons (done/dismiss/snooze/notes)
