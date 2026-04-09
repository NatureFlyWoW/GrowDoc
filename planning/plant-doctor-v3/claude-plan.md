# Plant Doctor v3: Implementation Plan

## Overview

Plant Doctor v3 overhauls the diagnostic core of GrowDoc's Plant Doctor tool to fix plant science errors, add missing diagnostic pathways, and introduce growing medium and lighting context that fundamentally changes how diagnoses are scored and treatments are recommended.

The tool is a standalone vanilla JS/HTML/CSS application in two files: `docs/tool-plant-doctor.html` (~3900 lines) and `docs/plant-doctor-data.js` (~500 lines). It uses ES5 JavaScript (var, no arrow functions, no template literals), renders via innerHTML replacement with manual event rebinding, and has 165 inline console tests.

---

## Section 01: Data Model & State Changes

### Why

Every subsequent section depends on having the medium and lighting type available in state. The current state objects (`state`, `multiDxState`) track `mode`, `currentNode`, `history`, `wizardNotes`, and `expertSelections`. Growing medium and lighting type must be added as first-class state properties because they influence scoring, treatment text rendering, and persistence.

### What to Change

**State objects** — Add two new properties to both `state` and `multiDxState`:

```javascript
// In state initialization — initial value is null (no selection yet)
state.medium    // null | 'soil' | 'coco' | 'hydro' | 'soilless'
state.lighting  // null | 'led' | 'hps' | 'cfl' | 'fluorescent' | 'sunlight'
```

Same for `multiDxState.medium` and `multiDxState.lighting`. Initial value is `null` — loaded from `growdoc-grow-profile` on init if available. When `null`, scoring modifiers are skipped (no adjustment) and treatment text falls back to `'default'`.

**Reset functions** — Update `reset()` and `resetMultiDxState()` to preserve medium/lighting (don't reset them — they're persistent preferences, not per-session state).

**localStorage persistence** — Create a new storage key `growdoc-grow-profile` to persist medium and lighting selections. On init, read this and pre-populate state. The profile is separate from the journal schema to avoid migration complexity. Schema:

```javascript
{ version: 1, medium: 'soil', lighting: 'led' }
```

**Journal entry schema** — Add `medium` and `lighting` fields to the object returned by `createJournalEntry()`. These are informational (recorded at time of diagnosis). Backward-compatible: missing fields default to `null`.

**Test coverage:** Verify state initialization includes new fields. Verify localStorage round-trip for grow profile. Verify journal entries include medium/lighting.

---

## Section 02: Treatment Text Data Model Migration

### Why

Currently, result nodes use flat string arrays for `checkFirst` and `fixes`. To show medium-specific treatment text, these must become object maps with per-medium arrays. This is the highest-effort change and touches every result node, so it must be designed carefully to be backward-compatible and incrementally adoptable.

### What to Change

**Result node structure** — Convert `checkFirst` and `fixes` from:
```javascript
checkFirst: ['Verify pH 6.0-6.5', 'Check drainage']
```
To:
```javascript
checkFirst: {
  default: ['Verify pH 6.0-6.5', 'Check drainage'],
  soil:  ['Verify pH 6.0-6.8 (soil optimal range)', 'Check drainage — is pot too heavy?'],
  coco:  ['Verify pH 5.8-6.2 (coco range)', 'Check runoff pH and EC'],
  hydro: ['Verify pH 5.5-6.0 (hydro range)', 'Check reservoir pH and EC']
}
```

**Renderer changes** — The rendering functions (`renderResultCard`, `renderMultiDxResults`) currently iterate `node.checkFirst` as an array. Update to:
1. Use `Array.isArray(node.checkFirst)` as the type discriminator (ES5-compatible)
2. If array: use directly (backward compat for nodes not yet migrated)
3. If object: resolve via fallback chain: `node.checkFirst[state.medium] || node.checkFirst['default'] || []`
4. When `state.medium` is `null`, this naturally falls through to `'default'`

Create a helper function `resolveMediumText(textOrMap, medium)` to encapsulate this logic — used by renderResultCard, renderMultiDxResults, and generateCombinedPlan.

**`makeResult()` default update** — Update the `makeResult()` helper's default `checkFirst` from flat array to object format:
```javascript
checkFirst: { default: ['Verify pH is in range for your medium'] }
```

This allows incremental migration: nodes can be updated one at a time.

**`generateCombinedPlan()`** — This function merges multiple diagnosis plans in Multi-Dx mode. It currently deduplicates flat string arrays. Update to handle the object map format: resolve per-medium arrays first, then deduplicate.

**Prioritized migration** — Not all 44 result nodes need medium-specific text on day one. Prioritize nodes where medium changes the advice:
- All pH-related nodes (pH lockout, pH drift, pH flux)
- All watering nodes (overwatering, underwatering)
- All nutrient deficiency nodes (Ca, Mg, N, P, K, Fe, Mn, Zn)
- Root rot
- Nutrient burn

Pest nodes and environment nodes can use `default` only initially.

**Test coverage:** Verify renderer handles both object-map and flat-array formats. Verify `generateCombinedPlan()` works with both formats. Verify specific nodes render correctly for each medium.

---

## Section 03: UI — Medium/Lighting Questions & Persistent Badges

### Why

The user must select growing medium and lighting type before proceeding to symptoms. These selections persist across sessions and display as editable badges at the top of the tool.

### What to Change

**New question nodes** — Add two new tree nodes at the beginning of the wizard flow:

1. `q-medium`: "What growing medium are you using?" — Options: Soil, Coco coir, Hydro (DWC/NFT), Soilless mix
2. `q-lighting`: "What type of lighting?" — Options: LED, HPS, CFL/Fluorescent, Natural sunlight

**Flow depends on saved profile:**

- **No saved profile (first-time user):** `q-medium` → `q-lighting` → `q-stage` → existing flow. ROOT becomes `q-medium`.
- **Saved profile exists:** Skip medium/lighting questions, go directly to `q-stage`. Show medium/lighting as editable badges at top. Badges are the mechanism to change — clicking one returns to that question.

**ROOT constant change** — ROOT changes from `'q-stage'` to `'q-medium'`. This impacts:
- `reset()` function — must reset to `q-medium`
- `renderProgress()` — progress dot count changes
- Tree traversal test at line 2917 — must start from new ROOT
- Expert mode `renderExpert()` — starts at ROOT, will naturally get medium/lighting as first cascading selects (no separate dropdowns needed)
- Any test that references ROOT directly

When a saved profile exists, the `init()` function sets `state.medium` and `state.lighting` from localStorage and sets `state.currentNode = 'q-stage'` to skip the setup questions.

**Expert mode** — Add two new dropdowns at the top of the expert cascading selects for medium and lighting.

**Multi-Dx mode** — Add medium and lighting pill selectors alongside the existing stage pills.

**Editable badges** — After initial selection, show small pill-shaped badges at the top of the tool (near the mode selector) displaying current medium and lighting. Clicking a badge returns to that question to change it.

**Badge CSS** — Small, inline-flex, monospace font, border matching the existing design system. Use `--accent` for active state. Match the existing `.mode-btn` styling pattern.

**Badge persistence** — On each selection change, update `growdoc-grow-profile` in localStorage. On init, read and pre-populate.

**Test coverage:** Verify medium/lighting selection updates state. Verify badge rendering. Verify persistence round-trip. Verify all three modes handle medium/lighting.

---

## Section 04: Scoring Engine — Medium & Lighting Modifiers

### Why

The scoring engine currently applies `stage_modifier` to adjust diagnosis scores based on growth stage. The same mechanism must apply for growing medium and lighting type, because a coco grower seeing overwatering symptoms is far less likely to actually be overwatering than a soil grower.

### What to Change

**New modifier maps** in scoring entries (plant-doctor-data.js):

```javascript
'r-overwater': {
  symptoms: { ... },
  stage_modifier: { ... },
  medium_modifier: { 'coco': -0.25, 'hydro': -0.30 },
  lighting_modifier: {},
  base_confidence: 0.85
}

'r-ca-def': {
  symptoms: { ... },
  stage_modifier: { ... },
  medium_modifier: { 'coco': +0.15 },
  lighting_modifier: { 'led': +0.15 },
  base_confidence: 0.80
}
```

**`scoreDiagnoses()` signature change** — The existing function takes `stage` as an explicit parameter (not from global state). Follow the same pattern:

```javascript
function scoreDiagnoses(selectedSymptoms, stage, medium, lighting, treatedDiagnoses)
```

Callers pass the appropriate values: `runMultiDxDiagnosis()` passes from `multiDxState`, wizard mode passes from `state`.

After applying `stage_modifier`, also apply `medium_modifier[medium]` and `lighting_modifier[lighting]` if they exist. Same additive mechanism.

**Combined modifier floor** — Clamp total negative modifier sum (stage + medium + lighting) to -0.40 minimum. This prevents over-suppression (e.g., coco + late flower for overwatering would be -0.55 unclamped, which nearly eliminates the diagnosis even with perfect symptom matches).

**Wizard mode modifier application** — Wizard mode bypasses `scoreDiagnoses()` and uses tree traversal to reach results directly. The confidence displayed comes from the static `node.confidence` value. To apply medium/lighting modifiers in wizard mode, add a `getAdjustedConfidence(node, medium, lighting)` function that looks up the scoring entry for the node's ID and applies medium/lighting modifiers. Call this in `renderResultCard()` when in wizard/expert mode to adjust the displayed confidence.

**Medium modifiers to add across diagnoses:**
- Coco: boost Ca/Mg deficiencies (+0.15), suppress overwatering (-0.25)
- Hydro: suppress overwatering (-0.30), boost root rot (+0.15), suppress fungus gnats (-0.20)
- Soilless: minor Ca/Mg boost (+0.05)

**Lighting modifiers:**
- LED: boost Ca/Mg deficiencies (+0.15-0.20)
- All others: no modifier (baseline assumption)

**Test coverage:** Verify medium modifier adjusts scores correctly. Verify LED lighting modifier boosts Ca/Mg. Verify coco suppresses overwatering score. Verify modifiers don't exceed base_confidence cap.

---

## Section 05: Ca Mobility Fix & Wizard Tree Rerouting

### Why

The current wizard path "Yellowing → Lower/older → Yellow with brown spots" leads to `r-ca-def`, which is botanically wrong. Calcium is semi-mobile and deficiency shows on NEW growth. Brown spots on old leaves are far more likely pH lockout, Mg deficiency, or fungal issues.

### What to Change

**Reroute BOTH wizard paths** — There are TWO paths that reach `r-ca-def` from old-leaf contexts:

1. `q-yellow-old` (line 675): "Yellow with brown spots" → `r-ca-def` — **Change to** → `r-ph-lockout`
2. `q-random-spots` (line 703): "Yellow halo around the spots" → `r-ca-def` — **Change to** a new sub-question `q-spot-growth-location` that asks "Are the spots on old/lower or new/upper leaves?" and routes old → `r-ph-lockout`, new → `r-ca-def`

The `r-ca-def` node must ONLY be reachable through new growth symptom paths.

**Update `r-ph-lockout`** — Add to its `alsoConsider`:
- Magnesium Deficiency: "If chlorosis follows an interveinal pattern on lower leaves"
- Leaf Septoria: "If spots are small, circular, and brown with yellow halos — fungal, not nutrient"

**Update `r-ca-def`** — Ensure it's only reachable from new growth paths. Update its description to emphasize: "Calcium is semi-mobile — symptoms appear on NEW growth because Ca cannot be redistributed from old leaves."

**Update existing refine rule** — `rule-ca-vs-mg` already exists in plant-doctor-data.js at line 355. UPDATE it to include the medium context (coco growers are more likely to have Ca issues). Do NOT create a duplicate.

**Add new refine rules** for Multi-Dx disambiguation:

1. `rule-ca-vs-broadmite`: When Ca def and broad mites both score:
   - "Do affected leaves have a glossy, wet-looking surface?"
   - Options: "Yes, shiny/plastic look" → boost broad mites. "No, normal or crispy" → boost Ca def.

**Test coverage:** Verify the old-leaf path no longer reaches `r-ca-def`. Verify `r-ca-def` IS reachable through new-growth paths. Verify refine rules fire when appropriate diagnoses co-occur.

---

## Section 06: New Pest & Hermie Diagnostic Paths

### Why

The tool only covers spider mites and powdery mildew. Broad mites, thrips, fungus gnats, and bud rot are common indoor pests that are frequently misdiagnosed as nutrient deficiencies. Hermaphroditism is a time-critical situation with no coverage.

### What to Add

**New symptoms in registry** (plant-doctor-data.js SYMPTOMS array):
- `silver-streaks` — Silver/bronze streaks on leaf surface (region: leaves, group: surface)
- `tiny-flying-insects` — Small flies near soil surface (region: whole-plant, group: damage)
- `glossy-new-growth` — Shiny/wet-looking distorted new growth (region: leaves, group: deformation)
- `gray-mold-bud` — Gray fuzzy growth on/in buds (region: whole-plant, group: damage)
- `single-leaf-death-bud` — Single leaf dying at a bud site (region: leaves, group: damage)
- `black-frass` — Tiny black dots on leaf surface (region: leaves, group: surface)
- `pollen-sacs` — Round structures at branch nodes (region: whole-plant, group: structure)
- `nanners-in-buds` — Yellow banana shapes emerging from buds (region: whole-plant, group: structure)

**New result nodes** in TREE (tool-plant-doctor.html):

1. `r-broad-mites` — severity: critical. Treatment includes Avid/Forbid (veg only), predatory mites, 60x microscope diagnosis.
2. `r-thrips` — severity: warning. Treatment includes spinosad cycles, predatory mites, biologicals for flower.
3. `r-fungus-gnats` — severity: warning. Treatment includes BTi drench, dry-back, potato test for confirmation.
4. `r-bud-rot` — severity: critical. Treatment: immediate removal + environmental correction. Never salvage affected buds.
5. `r-hermie-stress` — severity: critical, urgency: time-sensitive. Treatment: pluck nanners, mist, fix stressor, harvest ASAP.
6. `r-hermie-genetic` — severity: critical, urgency: time-sensitive. Treatment: cull unless irreplaceable genetics.

**Urgency UX for hermie nodes** — Add a new `urgency` property to result nodes. When `urgency === 'time-sensitive'`, `renderResultCard()` prepends a red alert banner:

```html
<div class="result-alert">
  <span class="alert-icon">⚠</span>
  TIME-SENSITIVE — Act within 24 hours
  <div class="alert-timeline">Pollen can spread to your entire grow room. Every hour matters.</div>
</div>
```

CSS: `.result-alert` — red background (#8b1a1a), white text, bold, 12px border-radius, prominent placement above the diagnosis name. Add `role="alert"` and `aria-live="assertive"` for screen reader urgency.

**Accessibility for new UI elements:**
- Medium/lighting badges: `aria-label="Growing medium: {value}. Click to change."`
- Multi-Dx pill selectors for medium/lighting: `role="radiogroup"` with `role="radio"` on each pill
- Alert banner: `role="alert"` ensures screen readers announce it immediately

**`r-bud-rot` alsoConsider addition:** Add caterpillar/pest damage as an also-consider entry: "Caterpillar damage — if you find small holes or frass pellets inside the bud, caterpillars (not Botrytis) may be the primary cause."

**Wizard tree branches** — Add a new question path from the top-level symptom question:

From the initial symptom category question, add an option "Pests / Physical signs / Unusual structures" that branches to:
- "What are you seeing?" → Silver/bronze marks → Thrips path
- "What are you seeing?" → Small flying insects near soil → Fungus gnats path  
- "What are you seeing?" → Distorted glossy new growth → Broad mites path
- "What are you seeing?" → Gray mold on buds → Bud rot path
- "What are you seeing?" → Unusual structures in flower → Hermie path

The hermie sub-path asks:
- "When did structures appear?" → Early flower / Late flower
- "How widespread?" → Isolated / Multiple locations

**Routing matrix:**
- Early flower + widespread → `r-hermie-genetic` (plant turned early, before stress could accumulate)
- Early flower + isolated → `r-hermie-genetic` (conservative — early pollen sacs are nearly always genetic)
- Late flower + isolated → `r-hermie-stress` (classic stress-induced nanners)
- Late flower + widespread → new refine question asking about identifiable stressor; with stressor → stress, without → genetic

**Scoring entries** (plant-doctor-data.js SCORING):

Each new result node needs a scoring entry mapping its symptom weights, stage/medium modifiers, and base_confidence. Key symptom mappings:

- `r-broad-mites`: `glossy-new-growth: 0.95`, `twisted-new-growth: 0.8`, `stunted-growth: 0.5`
- `r-thrips`: `silver-streaks: 0.95`, `black-frass: 0.85`, `spots-random: 0.3`
- `r-fungus-gnats`: `tiny-flying-insects: 0.95`, `stunted-growth: 0.5`, `drooping: 0.3`
- `r-bud-rot`: `gray-mold-bud: 0.95`, `single-leaf-death-bud: 0.85`. Add `medium_modifier: { 'hydro': -0.15 }` (less relevant in hydro)
- `r-fungus-gnats`: Add `medium_modifier: { 'hydro': -0.40 }` (no soil medium for larvae in hydro)
- `r-hermie-stress`: `nanners-in-buds: 0.95`, stage_modifier: early-flower -0.3
- `r-hermie-genetic`: `pollen-sacs: 0.95`, stage_modifier: late-flower -0.3

**Refine rules:**

1. `rule-broadmite-vs-ca`: When both broad mites and Ca def score — "Do affected leaves have a glossy/plastic appearance?" 
2. `rule-gnats-vs-overwater`: When both gnats and overwatering score — "Do you see small flying insects near the soil?"
3. `rule-hermie-stress-vs-genetic`: When both hermie types score — "When did structures first appear?" Early flower → genetic, Late flower → stress

**Test coverage:** Verify all new result nodes exist in TREE and are valid. Verify scoring entries produce non-zero scores for their symptoms. Verify refine rules fire when conditions met. Verify urgency banner renders for hermie nodes. Verify wizard paths reach each new pest node.

---

## Section 07: VPD Context & Enhanced Notes

### Why

VPD (Vapor Pressure Deficit) is a key diagnostic variable but the user chose a lightweight integration: enhanced notes prompting and context text on relevant result cards. No VPD calculation is built into the tool.

### What to Change

**Enhanced notes placeholders** — For symptom paths related to curling, crispy edges, drooping, and wilting, change the notes expander placeholder from the generic "Optional: add context about this step..." to:

"Include temp and RH if known (e.g., 25°C / 50% RH) — helps narrow the diagnosis"

This applies to the question nodes where these symptoms are selected. Identify by examining the nodes that lead to heat stress, VPD-related, and humidity-related results.

**VPD context on result cards** — Add a `vpdContext` property to relevant result nodes. When present, `renderResultCard()` renders it as a special info box below the treatment sections:

```html
<div class="vpd-context">
  <div class="vpd-context-title">Environment Check</div>
  <div class="vpd-context-body">{text}</div>
</div>
```

Nodes that get VPD context:
- `r-heat-stress`: "If VPD is above 1.6 kPa (high temp + low humidity), the cure is raising humidity, not just lowering temperature."
- `r-ca-def`, `r-ca-def-new`: "Both very high and very low VPD can cause Ca deficiency symptoms by disrupting transpiration-driven Ca transport. Check your VPD before supplementing calcium."
- `r-overwater`: "If RH is above 70% and the plant droops despite normal soil moisture, low VPD (not overwatering) may be the real cause."
- Any new humidity-related nodes

**CSS** — `.vpd-context`: bordered info box with distinct background (subtle blue-green tint), monospace title, body text.

**Test coverage:** Verify `vpdContext` renders when present. Verify enhanced placeholder text appears on relevant question nodes.

---

## Section 08: Integration Tests & Plant Science Validation

### Why

Franco noted that the 165 existing tests validate logic and UI but NOT plant science correctness. This section adds tests that encode botanical facts to prevent future regressions.

### What to Add

**Plant science validation tests** — New test block within `runTests()`:

1. **Nutrient mobility tests:** For each nutrient pathway, verify that the wizard tree routes correctly:
   - "Old leaf + interveinal chlorosis" → should NOT reach Ca deficiency
   - "New growth + brown spots" → should be able to reach Ca deficiency
   - "Old leaf + uniform yellowing" → should reach N deficiency

2. **Medium modifier tests:** Verify scoring adjustments:
   - Score overwatering with medium='coco' → score should be lower than with medium='soil'
   - Score Ca deficiency with lighting='led' → score should be higher than with lighting='hps'

3. **Pest disambiguation tests:** Verify refine rules:
   - When broad mites AND Ca def both score, the refine rule `rule-broadmite-vs-ca` should appear
   - When overwatering AND fungus gnats both score, `rule-gnats-vs-overwater` should appear

4. **Urgency rendering tests:**
   - `r-hermie-stress` and `r-hermie-genetic` should have `urgency: 'time-sensitive'`
   - Result card HTML for these nodes should contain the alert banner class

5. **Treatment text rendering tests:**
   - With medium='soil', pH text should reference 6.0-6.8
   - With medium='coco', pH text should reference 5.8-6.2
   - With medium='hydro', pH text should reference 5.5-6.0

6. **Backward compatibility tests:**
   - Result nodes with flat-array checkFirst/fixes should still render correctly
   - Journal entries without medium/lighting fields should load without error

**Test count target:** Add 25-35 new tests covering the above categories. Total should be 190-200 tests, all passing.

---

## Implementation Order

The sections should be implemented in this order due to dependencies:

1. **Section 01** (Data Model & State) — Foundation for everything
2. **Section 02** (Treatment Text Migration) — Must exist before sections that add medium-specific text
3. **Section 03** (UI — Questions & Badges) — Provides the medium/lighting UI
4. **Section 04** (Scoring Engine) — Applies medium/lighting to diagnosis scoring
5. **Section 05** (Ca Mobility Fix) — Reroutes wizard tree + adds refine rules
6. **Section 06** (Pest & Hermie Paths) — New diagnostic content
7. **Section 07** (VPD Context) — Enhancement layer on top of existing + new nodes
8. **Section 08** (Integration Tests) — Validates everything

Sections 05, 06, and 07 can be partially parallelized since they add content to different parts of the tree, but all depend on sections 01-04 being complete.

---

## Risk Assessment

**Highest risk:** Section 02 (Treatment Text Migration). Converting 44 result nodes from flat arrays to object maps is tedious and error-prone. The backward-compatible renderer (handles both formats) mitigates this by allowing incremental migration.

**Medium risk:** Section 06 (New Pest Paths). Adding 6 new result nodes + 8 new symptoms + scoring + refine rules + wizard branches is the largest content addition. Plant science accuracy must be validated against the research findings.

**Low risk:** Sections 01, 03, 04, 07, 08 are straightforward state/UI/scoring changes following existing patterns.
