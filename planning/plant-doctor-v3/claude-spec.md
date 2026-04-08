# Plant Doctor v3: Combined Specification

## Project Context

GrowDoc Plant Doctor is a standalone vanilla JS/HTML/CSS diagnostic tool for cannabis plant problems. The v2 implementation has 72 decision tree nodes, a scoring engine with 34 symptoms and 44 diagnoses, 20 refine rules, a treatment journal with check-ins, and 165 passing inline tests. A cultivation expert (Franco) reviewed the tool and identified 6 critical/warning plant science issues affecting diagnostic accuracy.

## Architecture Summary

- **Files:** `docs/tool-plant-doctor.html` (~3900 lines) + `docs/plant-doctor-data.js` (~500 lines)
- **Language:** ES5-compatible JavaScript (var, no arrow functions, no template literals)
- **Decision Tree:** Flat `TREE` map with question nodes (`q-*`) and result nodes (`r-*`), built with `makeResult()` helper
- **Scoring:** `scoreDiagnoses()` uses symptom weights, stage modifiers, corroboration bonus, capped at `base_confidence`
- **Refine Rules:** Condition functions + adjustment maps for disambiguation
- **State:** `state` (wizard/expert), `multiDxState` (multi-dx), `journalState` (journal) — in-memory objects
- **Storage:** localStorage v2 schema with versioned migration
- **Rendering:** `render()` → `innerHTML` replacement → event binding functions

## Items to Implement

### Item 1: Growing Medium Selection (CRITICAL)

**What:** Add growing medium as the FIRST mandatory question before growth stage.

**Options:** Soil / Coco coir / Hydro (DWC/NFT) / Soilless mix (peat/perlite)

**Data model changes:**
- New state property: `state.medium` (wizard/expert), `multiDxState.medium` (multi-dx)
- Persist in localStorage as a user preference, show as editable badge at top of tool
- Add `medium_modifier` to scoring entries (same mechanism as `stage_modifier`)
- Convert result node `checkFirst`/`fixes` from flat string arrays to object maps:
  ```
  checkFirst: { soil: [...], coco: [...], hydro: [...], default: [...] }
  ```
  Renderer picks array based on selected medium, falls back to `default`

**Scoring modifiers by medium:**
- Coco: boost `r-ca-def`, `r-ca-def-new`, `r-mg-def`, `r-ca-mg` by +0.15 (coco grabs Ca)
- Coco: suppress `r-overwater` by -0.25 (nearly impossible to overwater coco)
- Hydro: suppress `r-overwater` by -0.3
- Hydro: boost `r-root-rot` by +0.15

**Treatment text variants:** pH ranges differ per medium (soil 6.0-6.8, coco 5.5-6.3, hydro 5.5-6.0). Watering advice differs. Flush instructions differ. Every result node with pH or watering advice needs medium-specific variants.

**Wizard flow:** Medium question → Stage question → Symptom questions (existing flow)

**Persistence:** Save selected medium + lighting type to localStorage. On return visits, show as editable pill/badge at top that can be tapped to change. Pre-populate the question with saved value.

### Item 2: Fix Calcium Mobility Error (CRITICAL)

**What:** Reroute the "lower leaf brown spots" wizard path away from `r-ca-def`.

**Research confirms:** Calcium is semi-mobile (phloem-immobile, xylem-mobile via transpiration). Deficiency shows on NEW growth. Brown spots on OLD leaves = Mg deficiency, pH lockout, or leaf septoria.

**Changes:**
- The wizard path "Yellowing → Lower/older → Yellow with brown spots" currently routes to `r-ca-def` → change to route to `r-ph-lockout`
- `r-ph-lockout` gets updated `alsoConsider` entries pointing to Mg deficiency and leaf septoria
- `r-ca-def` remains accessible ONLY through new growth symptom paths
- Add/update refine rules to disambiguate when Ca and Mg both score high in Multi-Dx:
  - "Where are the spots appearing?" → Old leaves = Mg/pH, New growth = Ca
  - "Are veins staying green (interveinal pattern)?" → Yes = Mg, No/random spots = Ca or pH

### Item 3: Missing Pest Diagnostics (WARNING)

**What:** Add 4 new pest + 1 hermie diagnostic paths, accessible via BOTH Wizard and Multi-Dx.

**New result nodes:**

1. **r-broad-mites** — Twisted/glossy new growth, invisible to naked eye
   - Key differentiator from Ca def: glossy/wet surface, no brown spots, spreads plant-to-plant
   - Treatment: Avid/Forbid in veg, predatory mites, heat treatment for clones

2. **r-thrips** — Silver streaks + black frass dots
   - Key differentiator: frass present = thrips, no frass = spray damage
   - Treatment: Spinosad 3-day cycles in veg, biologicals in flower

3. **r-fungus-gnats** — Small flies near soil, larval root damage
   - Key differentiator from overwatering: adults visible + larvae in soil
   - Treatment: BTi drench, let soil dry, predatory nematodes

4. **r-bud-rot** — Gray mold in buds, single leaf death at bud sites
   - Key differentiator from senescence: rapid onset + gray fuzz + musty smell
   - Treatment: Immediately remove affected buds, lower RH, improve airflow

**New symptoms to add to registry:**
- `silver-streaks` — Silver/bronze streaks on leaf surface
- `tiny-flying-insects` — Small flies near soil surface
- `glossy-new-growth` — Shiny/wet-looking distorted new growth
- `gray-mold-bud` — Gray fuzzy growth on/in buds
- `single-leaf-death-bud` — Individual leaf dying at a bud site

**Wizard tree additions:** New question branch after "What are you seeing?" → "Pests / Physical signs" → sub-questions for each pest type

**Scoring entries:** Add to `SCORING` in plant-doctor-data.js with appropriate symptom weights

**Refine rules:** Add rule to disambiguate broad mites vs Ca deficiency when both score in Multi-Dx

### Item 4: Lighting Type Question (WARNING)

**What:** Add lighting type selection. Store alongside medium.

**Options:** LED / HPS / CFL / Fluorescent / Natural sunlight

**Implementation:**
- Add as a question in wizard flow (after medium, after stage — or alongside medium as a "grow setup" screen)
- Store in state + persist to localStorage + show as editable badge
- Scoring modifier: Under LED, boost Ca/Mg-related diagnoses by +0.15 to +0.20
- Add LED-specific notes to CalMag result cards explaining the transpiration mechanism

### Item 5: Hermaphrodite Detection (WARNING)

**What:** Add hermie detection with urgency UX.

**New result nodes:**
1. **r-hermie-stress** — Stress-induced nanners (late flower, limited, stressor identified)
   - Treatment: Pluck bananas, mist with water, identify/fix stressor, monitor daily, harvest ASAP
   - Severity: critical
   
2. **r-hermie-genetic** — Genetic hermaphroditism (early flower, widespread, no stressor)
   - Treatment: CULL immediately unless irreplaceable genetics
   - Severity: critical

**Urgency UX:** Red alert banner at top of result card: "TIME-SENSITIVE — act within 24 hours" with distinct red banner styling (not just the severity badge). Include action timeline.

**New symptoms:** `pollen-sacs` — Round structures at nodes, `nanners-in-buds` — Yellow banana shapes in buds

**Wizard path:** From flower stage → "Unusual structures" → sub-questions about timing, distribution, stressor presence → route to stress or genetic result

**Refine rules:** Disambiguate stress vs genetic based on: timing (early vs late flower), distribution (widespread vs isolated), identifiable stressor

### Item 6: VPD Context in Diagnostics (WARNING)

**What:** Lightweight VPD integration via enhanced notes prompting.

**Implementation:**
- For the curling-up, dry/crispy, and drooping symptom paths, enhance the notes placeholder text to prompt for temp + RH:
  - "Include temp and RH if known (e.g., 25°C / 50% RH) — helps narrow diagnosis"
- Add VPD context text to heat stress, low humidity, high humidity, and Ca deficiency result cards:
  - "Tip: Calculate VPD from your temp/RH. Above 1.6 kPa = too dry, below 0.4 = too humid."
  - Include the symptom overlap information (high VPD mimics heat stress; low VPD mimics overwatering)
- Add notes to Ca deficiency results explaining that VPD issues (both high and low) can cause Ca symptoms by disrupting transpiration-driven Ca transport

## Technical Constraints

- ES5 JavaScript only (var, no const/let, no arrow functions, no template literals)
- No framework — vanilla DOM manipulation
- All events rebound on each `render()` call (innerHTML replacement pattern)
- Tests are inline in `runTests()` — save/restore state around test blocks
- localStorage v2 schema — new fields must be backward-compatible (missing fields → defaults)
- Medium-specific treatment text uses object maps with `default` fallback

## Success Criteria

1. All new diagnostic paths are botanically accurate (validated against research)
2. Growing medium influences scoring and treatment text throughout
3. Ca deficiency is ONLY reachable through new growth symptoms
4. Pest paths correctly differentiate from nutrient deficiency lookalikes
5. Hermie detection has urgency UX with red banner
6. Existing 165+ tests still pass
7. New features have corresponding inline tests
8. Medium/lighting persist in localStorage with editable badges
9. No regression in existing diagnostic accuracy
