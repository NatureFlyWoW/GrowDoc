# Plant Doctor v3: Plant Science & Diagnostic Core Overhaul

## Overview

The Plant Doctor tool (at `docs/tool-plant-doctor.html` + `docs/plant-doctor-data.js`) has been reviewed by a cannabis cultivation expert. Six critical and warning-level plant science issues were identified that affect diagnostic accuracy. This spec covers the core data model and diagnostic logic changes needed.

## Current Architecture

- **Standalone vanilla JS/HTML/CSS app** (~3880 lines)
- **Decision tree** with 72 nodes (27 questions, 44 results + 1 root) in a flat `TREE` map
- **Scoring engine** in `plant-doctor-data.js`: 34 symptoms, 44 scoring entries, 20 refine rules
- **Three modes**: Wizard (step-by-step), Expert (cascading dropdowns), Multi-Dx (multi-symptom scoring)
- **Treatment journal** with check-ins and status tracking
- **165 inline console tests** that all pass

## Items to Implement

### 1. Growing Medium Selection (CRITICAL)

**Problem:** The tool asks for growth stage but never asks about growing medium (soil vs coco vs hydro). This changes nearly every diagnosis:
- pH ranges differ: Soil 6.0-6.8, Coco 5.5-6.5, Hydro 5.5-6.0
- Coco inherently creates Ca/Mg deficiency (cation exchange grabs calcium, releases Na/K)
- Overwatering is nearly impossible in coco — telling a coco grower they have "Overwatering" is wrong advice
- "Flush with 3x pot volume" doesn't apply to DWC
- Root rot dynamics differ in DWC vs soil

**Requirements:**
- Add a "growing medium" question as the SECOND question (after growth stage) in all three modes
- Options: Soil / Coco coir / Hydro (DWC/NFT) / Soilless mix (peat/perlite)
- Store selection in state (like `multiDxState.stage`)
- Apply medium as a scoring modifier in `scoreDiagnoses()` (same mechanism as `stage_modifier`)
- Customize treatment text per medium in result nodes (pH ranges, flush instructions, watering advice)
- The medium must be available when creating journal entries

### 2. Fix Calcium Mobility Error (CRITICAL)

**Problem:** `r-ca-def` is reachable through the "lower/older leaves" wizard path, but calcium is an IMMOBILE nutrient — it shows on NEW growth first. Random brown spots on old leaves are far more likely pH lockout, Mn deficiency, or Mg necrosis.

**Requirements:**
- Reroute the "lower leaf brown spots" wizard path away from `r-ca-def`
- `r-ca-def` should only be reachable through NEW growth symptom paths
- The "lower leaf spots" path should point toward pH lockout or Mg deficiency (spotted pattern)
- `r-ca-def-new` is already correctly placed and can stay
- Add or update refine rules to disambiguate Ca vs Mg vs Mn on similar symptoms

### 3. Add Missing Pest Diagnostics (WARNING)

**Problem:** Only spider mites and powdery mildew are covered. Missing critical pests:
- **Broad mites** — invisible to naked eye, cause twisted/distorted new growth. Currently this routes to Ca deficiency, which is DANGEROUS (wrong treatment)
- **Thrips** — silver streaks on leaves, black frass dots, extremely common indoors
- **Fungus gnats** — small flies near soil, larvae eat root hairs, stunt seedlings
- **Bud rot (Botrytis)** — gray mold in buds, only mentioned as a hint currently

**Requirements:**
- Add result nodes: `r-thrips`, `r-fungus-gnats`, `r-broad-mites`, `r-bud-rot`
- Add new symptoms to SYMPTOMS registry: `silver-streaks`, `tiny-flying-insects`, `sticky-residue`, `gray-mold-bud`
- Add scoring entries in plant-doctor-data.js
- Add wizard tree paths for pest diagnosis
- Add refine rules to disambiguate broad mites vs Ca deficiency (key: broad mites cause UNIFORM distortion, Ca def is patchy/random)

### 4. Add Lighting Type Question (WARNING)

**Problem:** Under modern LED fixtures, CalMag deficiency is the #1 hidden yield killer. LEDs drive photosynthesis faster without infrared heating, increasing Ca/Mg demand while reducing passive Ca transport. The tool mentions this in one place but doesn't adjust scoring.

**Requirements:**
- Add a lighting type question: LED / HPS / CFL / Fluorescent / Natural sunlight
- Store in state alongside stage and medium
- Apply as scoring modifier: under LED, boost `r-ca-def`, `r-ca-def-new`, `r-mg-def`, `r-mg-def-spots`, `r-ca-mg` by +0.15 to +0.20
- Add LED-specific notes to CalMag-related result cards

### 5. Add Hermaphrodite Detection (WARNING)

**Problem:** Hermaphroditism (banana-shaped pollen sacs in bud sites) is one of the most urgent diagnostic situations. Not covered at all.

**Requirements:**
- Add `r-hermie-stress` (stress-induced, potentially recoverable) and `r-hermie-genetic` (genetic, should cull)
- Add wizard path from flower-stage symptoms (visible pollen sacs, bananas in buds)
- Add refine questions to distinguish stress vs genetic hermie
- Treatment: for stress-induced — identify and remove stressor, pluck bananas, monitor daily. For genetic — cull unless irreplaceable genetics
- Include urgency messaging: this is time-critical, pollen can ruin the entire grow room

### 6. VPD Integration into Diagnostics (WARNING)

**Problem:** "Leaves curling upward" could be heat stress OR high VPD — completely different fixes. No temperature/humidity follow-up questions exist.

**Requirements:**
- Add refine questions for the curling-up and dry/crispy paths that ask about canopy temperature and RH
- Calculate approximate VPD from answers and adjust scoring:
  - VPD > 1.6 kPa: boost humidity-related diagnoses
  - VPD < 0.4 kPa: boost overwatering and mold-related diagnoses
- Add VPD context text to heat stress, low humidity, and high humidity result cards
- Link to the Environment Dashboard's VPD calculator if available

## Technical Constraints

- Must maintain ES5-compatible JavaScript (var, no arrow functions, no template literals)
- All state management is in-memory objects, no framework
- Tests are inline console tests (`runTests()` function)
- The app is a single HTML file + one external data JS file
- Changes must be backward-compatible with existing localStorage journal data
- The plant-doctor-data.js file uses global `SCORING`, `SYMPTOMS`, and `REFINE_RULES` arrays/objects

## Files Involved

- `docs/tool-plant-doctor.html` — Main app (decision tree, rendering, event binding, tests)
- `docs/plant-doctor-data.js` — External knowledge base (symptoms, scoring, refine rules)

## Success Criteria

- All new diagnostic paths produce botanically accurate results
- Growing medium and lighting type influence scoring appropriately
- Existing 165+ tests still pass
- New features have corresponding tests
- No regression in existing diagnostic accuracy
- Hermie and pest paths correctly differentiate from nutrient deficiency lookalikes
