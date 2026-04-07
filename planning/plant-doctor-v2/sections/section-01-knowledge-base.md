# Section 01: Knowledge Base Data File

## Overview

Create `docs/plant-doctor-data.js` — a standalone JavaScript file that defines three global constants consumed by the main Plant Doctor HTML file. This file is the foundation for Multi-Dx mode's scoring engine.

**Files to create:**
- `docs/plant-doctor-data.js` (new file)

**Files to modify:**
- `docs/tool-plant-doctor.html` — add `<script src="plant-doctor-data.js"></script>` before the existing inline `<script>` block

**Dependencies:** None (this section has no dependencies on other sections)

**Blocks:** Section 03 (scoring engine), Section 05 (multi-dx mode)

---

## Tests First

Add these tests inside `runTests()` in `tool-plant-doctor.html`, after the existing v1 tests. They use the same `assert(condition, msg)` pattern.

```js
// ── Section 01: Knowledge Base Data File Tests ──

// Test: SYMPTOMS is defined and is an object with at least 25 entries
assert(typeof SYMPTOMS === 'object' && SYMPTOMS !== null, 'SYMPTOMS is defined as an object');
var symptomCount = Object.keys(SYMPTOMS).length;
assert(symptomCount >= 25, 'SYMPTOMS has at least 25 entries (found ' + symptomCount + ')');

// Test: Every SYMPTOMS entry has required fields: id, label, region, group
var symptomMissingFields = 0;
for (var sId in SYMPTOMS) {
  if (!SYMPTOMS.hasOwnProperty(sId)) continue;
  var sym = SYMPTOMS[sId];
  if (!sym.id || !sym.label || !sym.region || !sym.group) symptomMissingFields++;
  if (sym.id !== sId) symptomMissingFields++; // id must match key
}
assert(symptomMissingFields === 0, 'All SYMPTOMS have id, label, region, group (' + symptomMissingFields + ' missing)');

// Test: Every SYMPTOMS region is one of the allowed values
var validRegions = { leaves: 1, stems: 1, roots: 1, whole: 1 };
var badRegionCount = 0;
for (var sId2 in SYMPTOMS) {
  if (!SYMPTOMS.hasOwnProperty(sId2)) continue;
  if (!validRegions[SYMPTOMS[sId2].region]) badRegionCount++;
}
assert(badRegionCount === 0, 'All SYMPTOMS regions are valid (' + badRegionCount + ' invalid)');

// Test: SCORING is defined and is an object with at least 40 entries
assert(typeof SCORING === 'object' && SCORING !== null, 'SCORING is defined as an object');
var scoringCount = Object.keys(SCORING).length;
assert(scoringCount >= 40, 'SCORING has at least 40 entries (found ' + scoringCount + ')');

// Test: Every SCORING key matches a TREE result node ID
var scoringBadKeys = 0;
for (var scId in SCORING) {
  if (!SCORING.hasOwnProperty(scId)) continue;
  if (!TREE[scId] || !isResult(TREE[scId])) scoringBadKeys++;
}
assert(scoringBadKeys === 0, 'Every SCORING key matches a TREE result node (' + scoringBadKeys + ' mismatched)');

// Test: Every symptom ID referenced in SCORING exists in SYMPTOMS
var scoringBadSymptoms = 0;
var scoringBadSymptomList = [];
for (var scId2 in SCORING) {
  if (!SCORING.hasOwnProperty(scId2)) continue;
  var syms = SCORING[scId2].symptoms;
  for (var symRef in syms) {
    if (!syms.hasOwnProperty(symRef)) continue;
    if (!SYMPTOMS[symRef]) {
      scoringBadSymptoms++;
      scoringBadSymptomList.push(symRef + ' in ' + scId2);
    }
  }
}
assert(scoringBadSymptoms === 0, 'Every symptom in SCORING exists in SYMPTOMS (' + scoringBadSymptoms + ' missing: ' + scoringBadSymptomList.slice(0, 5).join(', ') + ')');

// Test: All SCORING weight values are between 0.0 and 1.0
var badWeights = 0;
for (var scId3 in SCORING) {
  if (!SCORING.hasOwnProperty(scId3)) continue;
  var syms3 = SCORING[scId3].symptoms;
  for (var sw in syms3) {
    if (!syms3.hasOwnProperty(sw)) continue;
    if (typeof syms3[sw] !== 'number' || syms3[sw] < 0 || syms3[sw] > 1) badWeights++;
  }
}
assert(badWeights === 0, 'All SCORING weights are 0.0-1.0 (' + badWeights + ' out of range)');

// Test: All SCORING entries have base_confidence between 0.0 and 1.0
var badBaseConf = 0;
for (var scId4 in SCORING) {
  if (!SCORING.hasOwnProperty(scId4)) continue;
  var bc = SCORING[scId4].base_confidence;
  if (typeof bc !== 'number' || bc < 0 || bc > 1) badBaseConf++;
}
assert(badBaseConf === 0, 'All SCORING base_confidence values are 0.0-1.0 (' + badBaseConf + ' invalid)');

// Test: REFINE_RULES is defined and is an array with at least 10 entries
assert(Array.isArray(REFINE_RULES), 'REFINE_RULES is an array');
assert(REFINE_RULES.length >= 10, 'REFINE_RULES has at least 10 entries (found ' + REFINE_RULES.length + ')');

// Test: Every REFINE_RULES entry has id, condition (function), question (string), options (array)
var rulesMissingFields = 0;
for (var ri = 0; ri < REFINE_RULES.length; ri++) {
  var rule = REFINE_RULES[ri];
  if (!rule.id || typeof rule.condition !== 'function' || typeof rule.question !== 'string' || !Array.isArray(rule.options)) {
    rulesMissingFields++;
  }
}
assert(rulesMissingFields === 0, 'All REFINE_RULES have id, condition, question, options (' + rulesMissingFields + ' missing)');

// Test: Every REFINE_RULES option has label (string) and adjust (object)
var rulesOptionBad = 0;
for (var ri2 = 0; ri2 < REFINE_RULES.length; ri2++) {
  var opts = REFINE_RULES[ri2].options;
  for (var oi = 0; oi < opts.length; oi++) {
    if (typeof opts[oi].label !== 'string' || typeof opts[oi].adjust !== 'object') {
      rulesOptionBad++;
    }
  }
}
assert(rulesOptionBad === 0, 'All REFINE_RULES options have label and adjust (' + rulesOptionBad + ' invalid)');

// Test: Every diagnosis ID referenced in REFINE_RULES adjust objects exists in SCORING
var adjustBadIds = 0;
for (var ri3 = 0; ri3 < REFINE_RULES.length; ri3++) {
  var opts3 = REFINE_RULES[ri3].options;
  for (var oi3 = 0; oi3 < opts3.length; oi3++) {
    var adj = opts3[oi3].adjust;
    for (var adjKey in adj) {
      if (!adj.hasOwnProperty(adjKey)) continue;
      if (!SCORING[adjKey]) adjustBadIds++;
    }
  }
}
assert(adjustBadIds === 0, 'All REFINE_RULES adjust IDs reference valid SCORING keys (' + adjustBadIds + ' invalid)');
```

---

## Implementation Details

### File Structure: `docs/plant-doctor-data.js`

The file declares three global variables using `var` (ES5 — no `let`/`const`/arrow functions). The file is loaded via a `<script src>` tag placed immediately before the existing inline `<script>` block in `tool-plant-doctor.html`.

### 1. SYMPTOMS Registry

A flat object mapping kebab-case symptom IDs to metadata objects.

```js
var SYMPTOMS = {
  'yellow-lower': { id: 'yellow-lower', label: 'Yellowing on lower/older leaves', region: 'leaves', group: 'discoloration' },
  // ... 30-40 entries total
};
```

**Required fields per entry:**
- `id` (string) — must match the object key exactly
- `label` (string) — human-readable description shown in checkbox UI
- `region` (string) — one of `'leaves'`, `'stems'`, `'roots'`, `'whole'`. Drives the fieldset grouping in Multi-Dx mode's checkbox UI
- `group` (string) — semantic cluster for deduplication/relation. Examples: `'discoloration'`, `'damage'`, `'deformation'`, `'surface'`, `'structure'`, `'root-health'`

**Deriving symptoms from v1 TREE:**

Walk every question node in TREE and extract distinct symptom presentations from option labels. Similar options across different question nodes map to the same symptom. The following mapping guide shows how to derive the ~30-35 core symptoms:

| v1 Question Node | v1 Option Label | Symptom ID |
|---|---|---|
| q-yellow-where | Lower / older leaves | `yellow-lower` |
| q-yellow-where | Upper / newer leaves | `yellow-upper` |
| q-yellow-where | Whole plant | `yellow-whole` |
| q-yellow-old | Uniform yellow, starting from tips | `yellow-tips` |
| q-yellow-old | Yellow between veins (veins stay green) | `interveinal-lower` |
| q-yellow-old | Yellow with purple stems | `yellow-purple-stems` |
| q-yellow-old | Yellow with brown spots | `yellow-brown-spots` |
| q-yellow-new | Pale / light green overall | `pale-overall` |
| q-yellow-new | Yellow between veins, veins stay dark | `interveinal-upper` |
| q-yellow-new | Yellow tips and edges | `yellow-tip-edge` |
| q-yellow-new | New growth twisted or distorted | `twisted-new-growth` |
| q-spots-pattern | Brown / burnt leaf tips | `brown-tips` |
| q-spots-pattern | Random brown spots on leaves | `spots-random` |
| q-spots-pattern | Well-defined circular spots | `spots-circular` |
| q-spots-pattern | Tiny white or yellow speckling | `speckling` |
| q-curl-direction | Upward (taco-ing) | `curling-up` |
| q-curl-direction | Downward (clawing) | `curling-down` |
| q-curl-direction | Edges curling inward | `curling-edges` |
| q-curl-up-detail | Leaves feel dry or crispy | `leaves-dry-crispy` |
| q-curl-down-detail | Very dark green, shiny/waxy | `dark-green-waxy` |
| q-droop-pot | Heavy / saturated (pot weight) | `drooping` |
| q-droop-pot | Very light / bone dry | `drooping` (same symptom, different cause) |
| q-white-location | On leaf surfaces | `white-powder` |
| q-white-location | Top of plant / bleached tips | `bleached-tops` |
| q-color-which | Purple stems or leaves | `stem-purple` |
| q-color-which | Very dark green leaves | `dark-green` |
| q-color-which | Rusty / bronze on edges | `rusty-edges` |
| q-color-which | Red or pink leaf stems | `red-petioles` |
| q-seedling-symptom | Stretching | `stretching` |
| q-seedling-symptom | Stem narrowing at soil line | `stem-narrowing` |
| (root inspection) | Brown/slimy roots | `root-brown` |
| (root inspection) | Foul smell from root zone | `root-smell` |
| (general) | Stunted growth | `stunted-growth` |
| (general) | Webbing between leaves | `webbing` |

Target: **30-40 symptom entries** covering all regions.

**Region distribution guidelines:**
- `leaves` — 18-22 entries (largest group, most visible symptoms)
- `stems` — 3-5 entries
- `roots` — 2-3 entries
- `whole` — 4-6 entries

### 2. SCORING Map

Maps each of v1's 44 result node IDs to a scoring profile. Every key in SCORING must match a key in TREE that passes the `isResult()` check.

```js
var SCORING = {
  'r-n-def': {
    symptoms: { 'yellow-lower': 0.9, 'yellow-tips': 0.8, 'pale-overall': 0.4, 'yellow-whole': 0.3 },
    stage_modifier: { 'late-flower': -0.3 },
    base_confidence: 0.85
  },
  // ... one entry per result node (44 total)
};
```

**Fields per entry:**
- `symptoms` (object) — maps symptom IDs to weight values (0.0-1.0)
  - **0.8-1.0**: Hallmark symptom — this symptom is the primary indicator (e.g., `yellow-lower` for nitrogen deficiency)
  - **0.5-0.7**: Strong indicator — commonly associated
  - **0.3-0.4**: Moderate indicator — sometimes present
  - **0.1-0.2**: Weak/circumstantial — occasionally seen
- `stage_modifier` (object, optional) — maps growth stage strings to additive score adjustments. Stage keys must match the labels from v1's `q-stage` node options, converted to kebab-case: `'seedling'`, `'veg'`, `'early-flower'`, `'mid-flower'`, `'late-flower'`
- `base_confidence` (number, 0.0-1.0) — maximum achievable confidence. Mirrors the `confidence` field on the v1 TREE result node. Caps the final score.

**Weight derivation strategy:**

For each result node, examine its v1 tree path — the sequence of question options that leads to it. The final option in the path (the one that directly selects this result) gets a high weight (0.8-0.9). Options earlier in the path get moderate weights (0.4-0.6). Symptoms mentioned in `alsoConsider` get low weights (0.1-0.3). Symptoms from unrelated paths that would contradict this diagnosis are omitted (weight 0 = not listed).

**Coverage requirement:** Every symptom in SYMPTOMS should appear in at least 2 SCORING entries. Every SCORING entry should reference at least 2 symptoms.

### 3. REFINE_RULES Array

An array of rule objects that fire when top-ranked diagnoses match a condition. Each rule presents one disambiguation question.

```js
var REFINE_RULES = [
  {
    id: 'rule-n-vs-fade',
    condition: function(topDiagnoses) {
      var hasNDef = false, hasFade = false;
      for (var i = 0; i < topDiagnoses.length; i++) {
        if (topDiagnoses[i].resultId === 'r-n-def') hasNDef = true;
        if (topDiagnoses[i].resultId === 'r-natural-fade') hasFade = true;
      }
      return hasNDef && hasFade;
    },
    question: 'How far into flowering are you?',
    help: 'This helps distinguish natural fade from actual nitrogen deficiency.',
    options: [
      { label: 'Week 7+', adjust: { 'r-natural-fade': 0.3, 'r-n-def': -0.2 } },
      { label: 'Before week 7', adjust: { 'r-natural-fade': -0.4, 'r-n-def': 0.1 } }
    ]
  },
  // ... 15-25 rules total
];
```

**Required fields per rule:**
- `id` (string) — unique rule identifier, kebab-case, prefixed with `rule-`
- `condition` (function) — receives an array of `{ resultId, score }` objects (top diagnoses), returns boolean
- `question` (string) — the disambiguation question to present
- `help` (string, optional) — explanatory text shown below the question
- `options` (array) — 2-3 option objects, each with:
  - `label` (string) — button text
  - `adjust` (object) — maps diagnosis IDs to additive score adjustments (positive or negative floats)

**Rule design targets (minimum 15):**

| Rule ID | Distinguishes | Question Theme |
|---|---|---|
| `rule-n-vs-fade` | r-n-def vs r-natural-fade | Flowering stage/timing |
| `rule-overwater-vs-rootrot` | r-overwater vs r-root-rot | Root smell/appearance |
| `rule-ph-vs-multi-def` | r-ph-lockout vs deficiencies | Recent pH readings |
| `rule-heat-vs-light` | r-heat-stress vs r-light-burn | Light distance check |
| `rule-n-tox-vs-overwater` | r-n-tox vs r-overwater | Leaf color/texture |
| `rule-ca-vs-mg` | r-ca-def vs r-mg-def | Which leaves affected |
| `rule-nute-burn-severity` | r-nute-burn-mild vs r-nute-burn-severe | Burn progression |
| `rule-curl-cause` | r-heat-stress vs r-wind-burn | Fan placement |
| `rule-spots-cause` | r-fungal vs r-ca-def | Spot pattern detail |
| `rule-pm-vs-trichomes` | r-pm vs r-trichomes | Location on plant |
| `rule-ph-lockout-type` | r-ph-lockout vs r-ph-lockout-feed | When symptoms started |
| `rule-seedling-droop` | r-seedling-overwater vs r-transplant | Recent transplant? |
| `rule-yellow-speed` | r-ph-drift vs r-overwater-yellow | Symptom timeline |
| `rule-dark-green` | r-n-tox vs r-normal-veg | Leaf texture check |
| `rule-interveinal-location` | r-mg-def vs r-fe-def | Leaf age affected |

Additional rules (to reach 15-25) should target other common diagnostic pairs that share symptoms.

**Condition function pattern:**

All condition functions should use a helper pattern to check if specific diagnosis IDs appear in the top diagnoses array. A reusable helper function should be defined at the top of the file:

```js
function diagnosesInclude(ids) {
  return function(topDiagnoses) {
    var found = {};
    for (var i = 0; i < topDiagnoses.length; i++) {
      for (var j = 0; j < ids.length; j++) {
        if (topDiagnoses[i].resultId === ids[j] && topDiagnoses[i].score >= 0.25) {
          found[ids[j]] = true;
        }
      }
    }
    for (var k = 0; k < ids.length; k++) {
      if (!found[ids[k]]) return false;
    }
    return true;
  };
}
```

Then rules use: `condition: diagnosesInclude(['r-n-def', 'r-natural-fade'])`.

### HTML Modification

Add the script tag in `tool-plant-doctor.html` immediately before the closing `</body>` tag's inline script:

```html
<script src="plant-doctor-data.js"></script>
<script>
/* ── Helpers ── */
function escapeHtml(s) { ... }
// ... rest of existing inline script
```

This ensures `SYMPTOMS`, `SCORING`, and `REFINE_RULES` are available as globals before the inline script executes.

---

## Integration Points

- **Section 03 (Scoring Engine)** reads `SYMPTOMS`, `SCORING`, and `REFINE_RULES` to compute diagnosis scores
- **Section 05 (Multi-Dx Mode)** reads `SYMPTOMS` to render checkbox groups organized by `region`
- **Section 02 (Mode Selector)** checks `typeof SYMPTOMS !== 'undefined'` to enable/disable Multi-Dx tab
- **Section 07 (Integration Tests)** cross-validates data integrity between TREE, SYMPTOMS, and SCORING

---

## Checklist

1. Create `docs/plant-doctor-data.js` with the `diagnosesInclude()` helper function at the top
2. Define `var SYMPTOMS = { ... }` with 30-40 symptom entries derived from v1 TREE option labels
3. Verify all symptoms have `id`, `label`, `region` (one of 4 values), and `group`
4. Define `var SCORING = { ... }` with one entry per v1 result node (44 entries)
5. Verify every SCORING key matches a TREE result node ID
6. Verify every symptom referenced in SCORING.symptoms exists in SYMPTOMS
7. Verify all weight values are between 0.0 and 1.0
8. Verify all `base_confidence` values are between 0.0 and 1.0
9. Define `var REFINE_RULES = [ ... ]` with 15-25 rule objects
10. Verify every rule has `id`, `condition` (function), `question` (string), `options` (array)
11. Verify every option has `label` (string) and `adjust` (object with valid SCORING keys)
12. Add `<script src="plant-doctor-data.js"></script>` to HTML before the inline script
13. Add the Section 01 tests to `runTests()` in the HTML file
14. Open in browser, run `runTests()` — all new tests should pass
15. Verify wizard and expert modes still work identically (no regression)

---

## Implementation Notes

**Actual counts:**
- SYMPTOMS: 34 entries (leaves: 23, stems: 3, roots: 2, whole: 6)
- SCORING: 44 entries (all v1 result nodes covered)
- REFINE_RULES: 20 entries (15 mandatory + 5 additional)

**Files created:** `docs/plant-doctor-data.js`
**Files modified:** `docs/tool-plant-doctor.html` (script tag at line 205, 11 tests added to runTests())

**Deviations from plan:**
- `rusty-edges` and `dark-green` moved to region `leaves` (plan had them as `whole`; code review identified them as leaf-observed symptoms)
- Added `white-residue` symptom not in original mapping table (needed for `r-mineral` scoring)
- Added `webbing: 0.1` to `r-wpm-early` and `white-residue: 0.15` to `r-nute-burn-severe` to meet coverage requirement (every symptom in 2+ SCORING entries)

**Code review:** See `implementation/code_review/section-01-review.md` and `section-01-interview.md`
