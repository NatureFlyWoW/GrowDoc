# Implementation Plan: Plant Doctor v2

## Background

GrowDoc's Plant Doctor is a single-page vanilla JS diagnostic tool for cannabis plant problems. Version 1 provides two modes: a step-by-step wizard and an expert mode with cascading dropdowns. Both traverse a static decision tree (72 nodes) to arrive at a single diagnosis.

Version 2 adds four capabilities:
1. **Multi-Dx Mode** — Select multiple symptoms simultaneously for compound diagnosis
2. **Adaptive Inline Questions** — Targeted follow-up questions that refine ambiguous diagnoses before showing results
3. **Notes Input** — Optional free-text context at each diagnostic step across all modes
4. **Treatment Journal** — Full follow-up review loop with check-ins, re-assessment, and outcome tracking

### Why These Changes

Real cannabis plants rarely show just one symptom. Overwatering causes drooping AND yellowing AND root issues. pH lockout manifests as multiple deficiency symptoms simultaneously. V1 forces users to pick one path, missing the compound picture. The treatment journal closes the feedback loop — instead of a one-shot diagnosis, users get an ongoing consultation.

### Architecture Decision: Two Files

The main HTML file is already ~70KB. Adding a scoring engine, 30-40 symptom definitions, scoring weights for 44 diagnoses, and 15-25 refine rules would push well past 100KB. The knowledge base is split into a separate file:

- `docs/tool-plant-doctor.html` — UI, rendering, state machine, all three modes, journal, tests
- `docs/plant-doctor-data.js` — Knowledge base (SYMPTOMS, SCORING, REFINE_RULES constants), loaded via `<script src>` before the main inline script

If the data file fails to load, wizard and expert modes still work (they use the v1 TREE which is inline). Multi-Dx mode shows a graceful error. Specifically, `init()` checks `typeof SYMPTOMS !== 'undefined'` — if false, the Multi-Dx tab in the mode selector is disabled with a tooltip "Data unavailable."

**Style rule:** All code uses `var` declarations and function expressions — no `let`, `const`, or arrow functions. ES5 throughout for consistency with v1.

---

## Section 1: Knowledge Base Data File

### File: `docs/plant-doctor-data.js`

This file defines three global constants consumed by the main HTML file.

### SYMPTOMS Registry

A flat object mapping symptom IDs to metadata. Symptom IDs are kebab-case strings. Each symptom belongs to a `region` (for UI grouping) and a `group` (for semantic clustering).

```js
var SYMPTOMS = {
  'yellow-lower': { id: 'yellow-lower', label: '...', region: 'leaves', group: 'discoloration' },
  ...
};
```

**Regions:** `leaves`, `stems`, `roots`, `whole` — these drive the checkbox group headings in Multi-Dx mode.

**Deriving symptoms:** Extract from v1's TREE question option labels. Each option that users click in the wizard represents a symptom observation. Map the ~35-40 distinct symptom presentations across all question nodes into SYMPTOMS entries. Not every tree option becomes a symptom — aggregate similar ones (e.g., "Yellow between veins (veins stay green)" and "Yellow or brown between veins" map to the same symptom `interveinal-yellow`).

### SCORING Map

Maps each of v1's 44 result node IDs to a scoring profile:

```js
var SCORING = {
  'r-n-def': {
    symptoms: { 'yellow-lower': 0.9, 'yellow-tips': 0.3, 'pale-overall': 0.4, ... },
    stage_modifier: { 'late-flower': -0.3 },
    base_confidence: 0.85
  },
  ...
};
```

**Weight values** (0.0 to 1.0): How strongly a symptom indicates this diagnosis. A weight of 0.9 means "this symptom is a hallmark of this condition." A weight of 0.2 means "sometimes associated."

**stage_modifier**: Adjustment to the final score based on growth stage. Positive values increase confidence, negative decrease. Applied additively after base scoring.

**base_confidence**: Maximum possible confidence for this diagnosis even with perfect symptom match. Accounts for inherent diagnostic uncertainty.

**Deriving weights:** Use v1's tree paths as a guide. If a symptom is the direct option leading to a diagnosis (e.g., "Uniform yellow, starting from tips" leads directly to r-n-def), give it a high weight (0.8-0.9). If a symptom is circumstantially associated (appears in the alsoConsider section), give it a low weight (0.1-0.3).

### REFINE_RULES Array

Forward-chaining rules that fire when the top-ranked diagnoses match a condition. Each rule presents one question with 2-3 options that adjust scores.

```js
var REFINE_RULES = [
  {
    id: 'rule-n-vs-fade',
    condition: function(topDiagnoses) { /* returns true if r-n-def and r-natural-fade both in top 5 */ },
    question: 'How far into flowering are you?',
    help: 'This helps distinguish natural fade from actual deficiency.',
    options: [
      { label: 'Week 7+', adjust: { 'r-natural-fade': 0.3, 'r-n-def': -0.2 } },
      { label: 'Before week 7', adjust: { 'r-natural-fade': -0.4, 'r-n-def': 0.1 } }
    ]
  },
  ...
];
```

**Rule count target:** 15-25 rules covering the most common diagnostic ambiguities. Focus on pairs/groups of diagnoses that share symptoms and need one discriminating question to differentiate.

**Condition functions:** Take an array of `{ id, score }` objects (the current top diagnoses) and return boolean. They should check if specific diagnosis IDs are both present above a minimum threshold (e.g., 0.25).

---

## Section 2: Scoring Engine

### Location: Inline in tool-plant-doctor.html

### Core Scoring Function

`scoreDiagnoses(selectedSymptoms, stage, treatedDiagnoses)` — takes an array of symptom IDs, a growth stage string, and an optional array of diagnosis IDs that were previously treated without success. Returns a sorted array of `{ resultId, score, matchedSymptoms[] }` objects.

**Algorithm:**
1. For each diagnosis in SCORING, calculate `matchedWeight = sum of weights for selected symptoms that appear in this diagnosis's symptom map`
2. Calculate `totalWeight = sum of ALL weights in this diagnosis's symptom map`
3. `baseScore = matchedWeight / totalWeight` (0.0 to 1.0)
4. Apply stage modifier if the selected stage appears in `stage_modifier`
5. Calculate corroboration bonus: count how many distinct regions (leaves, stems, roots, whole) have at least one matched symptom. Bonus = `(regions - 1) * 0.05`
6. `finalScore = min(baseScore + stageAdjust + corroboration, base_confidence)`
7. Clamp to [0, 1]
8. If optional `treatedDiagnoses` array is provided (for re-assessment), apply -0.2 penalty to each listed diagnosis ID
9. Filter out diagnoses below 0.25 threshold
10. Sort descending by score, return top 5

### Refine Application

`getRefineQuestions(rankedDiagnoses)` — takes the scored results, checks each REFINE_RULE's condition against them. Returns an array of matching rules (the questions to ask).

`applyRefineAnswer(scores, ruleId, optionIndex)` — applies the selected option's adjustments to the current scores. Returns updated scores. Adjustments are additive and clamped to [0, 1].

### Combined Plan Generator

`generateCombinedPlan(topDiagnoses)` — takes the final ranked diagnoses (after refinement). For each, looks up the v1 TREE result node by ID. Collects:
- All `checkFirst` items, deduplicated by string similarity (exact match)
- All `fixes` items, ordered by: fixes shared across multiple top diagnoses first, then by diagnosis rank
- All `alsoConsider` items, deduplicated

Returns `{ checkFirst[], fixes[], alsoConsider[] }`.

---

## Section 3: Mode Selector Redesign

### Current State
Binary toggle switch (Expert Mode on/off) in the header.

### New Design
Replace the toggle with a 3-option segmented control (pill buttons):

```
[Wizard] [Expert] [Multi-Dx]
```

- Wizard is selected by default
- Clicking a segment switches the active mode
- The `.toggle-wrap` container is replaced with a `.mode-selector` container
- Each button gets `role="radio"` within a `role="radiogroup"` for accessibility
- `aria-checked` tracks the active mode
- Active button uses `--accent3` background, inactive use `--bg3`
- **Keyboard navigation:** Left/Right arrow keys move between options (required by ARIA radiogroup pattern). Home/End jump to first/last. Space/Enter activates.

### State Management
- `state.mode` replaces `state.expertMode` (values: `'wizard'`, `'expert'`, `'multi-dx'`)
- On mode switch: if going from wizard to expert, preserve history as expertSelections (existing logic). If going to multi-dx, start fresh multi-dx state.
- `render()` dispatches to `renderWizard()`, `renderExpert()`, or `renderMultiDx()` based on `state.mode`

### Backward Compatibility
- `toggleExpertMode()` replaced by `setMode(mode)` function
- v1 localStorage has no mode field — defaults to wizard on load

---

## Section 4: Multi-Dx Mode UI & Flow

### State Object

```js
var multiDxState = {
  stage: null,
  selectedSymptoms: [],
  notes: {},
  refineStep: 0,
  refineQuestions: [],
  refineAnswers: [],
  scores: {},
  results: [],
  phase: 'select'  // 'select' | 'refining' | 'results'
};
```

### Phase 1: Symptom Selection (`phase: 'select'`)

Render a growth stage selector (same options as v1's q-stage but as a dropdown/segmented control, not wizard buttons). Below it, render checkbox groups organized by region.

Each checkbox group is a `<fieldset>` with a `<legend>` for the region name. Each symptom is a checkbox with a label. Checkboxes use the `.opt-btn` styling pattern but adapted for checkbox inputs (checked state shows accent border + filled indicator).

Below the checkbox groups, a "Diagnose" button (`.btn-primary`) is enabled when the stage is selected AND at least 2 symptoms are checked. If only 1 symptom is selected, show a hint: "Select at least 2 symptoms, or use Wizard mode for single-issue diagnosis." Above 8 selected symptoms, show a gold warning: "Many symptoms selected — results may be less precise. Consider focusing on the most prominent 4-6."

A "Notes" expander sits below the symptom groups — collapsible textarea, 200 char max.

When "Diagnose" is clicked: run `scoreDiagnoses()`, store results, check for refine questions. If refine questions exist, move to phase 'refining'. Otherwise, skip to phase 'results'.

### Phase 2: Refining Questions (`phase: 'refining'`)

One question at a time, same UI as wizard mode question cards (reuse `renderWizardQuestion` or a shared `renderQuestionCard` function). Each question has its own "Add notes" expander.

After each answer: apply score adjustment via `applyRefineAnswer()`, advance `refineStep`. If more refine questions remain, show next. Otherwise, move to phase 'results'.

Fade transitions between refine steps (reuse wizard's transition pattern).

Back button returns to previous refine question or to symptom selection.

### Phase 3: Results (`phase: 'results'`)

Render a ranked list of diagnosis cards. Each card shows:
- Diagnosis name (from v1 TREE result node)
- Confidence percentage + bar
- Severity badge
- "Supported by:" — list of user's selected symptoms that matched this diagnosis
- Expandable detail: the full checkFirst/fixes/alsoConsider from the v1 result node

Below the individual cards, render the **Combined Action Plan** section:
- "Check First" — deduplicated, numbered list
- "Fix Steps" — deduplicated, prioritized numbered list
- "Also Consider" — deduplicated list

Two action buttons:
- "Save & Start Tracking" — creates a journal entry, transitions to treatment selection view
- "Start Over" — resets multi-dx state

**Important:** The "Save & Start Tracking" button also appears on wizard and expert mode result cards (in `renderResultCard()`). Wizard/expert entries get `symptoms: []` and `mode: 'wizard'`/`'expert'`. This ensures the treatment journal is accessible from all modes, not just Multi-Dx.

---

## Section 5: Notes Input (All Modes)

### UI Component
A small "Add notes" link/button that expands to reveal a `<textarea>`. Max 200 characters with a character counter. Collapse toggle to minimize when not needed.

### Integration Points
- **Wizard mode:** Below each question card's option buttons, before the Back/Start Over nav row
- **Expert mode:** Below each dropdown's help text
- **Multi-Dx mode:** Below symptom checkboxes (step 1) and below each refine question (step 2)

### Storage
Notes are stored in `multiDxState.notes` (Multi-Dx) or in a `wizardNotes` object keyed by node ID (wizard/expert). On result display, any notes are shown in a "Your Notes" section at the bottom of the result card.

Notes persist only within the current diagnosis session. They are included in journal entries if the user saves to the treatment journal.

**XSS requirement:** All notes content MUST pass through `escapeHtml()` before rendering into innerHTML. Notes are free-text user input stored in localStorage — a textbook XSS vector without escaping.

---

## Section 6: Treatment Journal

### Data Structure
The journal is an array of entries stored in localStorage under the v2 schema. Each entry tracks one diagnosis session through its lifecycle.

**Entry fields:**
- `id` — UUID-style identifier (timestamp + random)
- `createdAt` — ISO timestamp
- `stage` — growth stage at diagnosis time
- `mode` — which mode produced this ('wizard', 'expert', 'multi-dx')
- `symptoms` — array of symptom IDs (empty for wizard/expert single-path)
- `notes` — object of step-keyed notes
- `diagnoses` — array of `{ resultId, confidence, rank }`
- `combinedPlan` — `{ checkFirst[], fixes[] }` (for multi-dx) or null (single-path)
- `treatments` — array of `{ action, startedAt, status }` where status is 'active'|'completed'|'abandoned'
- `checkIns` — array of check-in records
- `status` — 'active'|'treating'|'resolved'|'escalated'

**Cap:** Maximum 20 journal entries. When adding the 21st, evict the oldest entry with status 'resolved'. If all are active, evict oldest overall.

### Treatment Selection View

After "Save & Start Tracking" creates a journal entry, show the combined plan with checkboxes next to each fix step. User checks the items they plan to try. Checked items become `treatments[]` entries with `status: 'active'`. A "Start Tracking" button confirms and transitions to the journal dashboard.

### Journal Dashboard

**Display condition:** Show when `journal.length > 0` AND the user is at the starting state of any mode (wizard at ROOT, expert with no selections, multi-dx at phase 'select'). Hide during active diagnosis flow.

Shows active entries first, then recent resolved entries (last 3).

Each entry card shows:
- Date + primary diagnosis name
- Status badge (active/treating/resolved)
- Days since created
- Action button: "Check In" for active/treating, nothing for resolved

A "New Diagnosis" button starts a fresh diagnosis (wizard mode by default).

### Check-In Flow

Triggered by the "Check In" button on an active journal entry.

**Step 1: Status Update**
Question: "How is the plant responding?"
Options: Much better / Somewhat better / No change / Getting worse / New symptoms appeared

**Step 2: Detail (conditional)**
- If "Much better" or "Somewhat better": Show the original symptoms as checkboxes, ask which have improved/resolved
- If "No change" or "Getting worse": Ask "How many days since you applied the fix?" + optional notes about what was tried
- If "New symptoms appeared": Ask which new symptoms (show symptom checkboxes from SYMPTOMS registry, excluding already-present ones)

**Step 3: Re-Assessment**
Run the scoring engine with the updated symptom set:
- Remove resolved symptoms from the selected set
- Add any new symptoms
- Re-score all diagnoses
- Show updated rankings with a changelog comparing old vs new scores

If the top diagnosis changed significantly (dropped below rank 3 or new diagnosis entered top 3), highlight the change prominently.

**Step 4: Updated Plan**
If scores changed meaningfully (any top-3 diagnosis shifted by > 0.15), regenerate the combined action plan and display it. Otherwise, show "Continue current treatment plan" with the existing plan.

Add the check-in to the journal entry's `checkIns` array. Update the entry's status based on outcomes.

### Journal Persistence

**localStorage key:** Same as v1 (`growdoc-plant-doctor`), schema version bumped to 2.

**Migration:** When `loadState()` reads version 1 data:
1. **Backup first:** Store original JSON under `growdoc-plant-doctor-v1-backup`
2. Wrap `lastDiagnosis` into a journal entry (status: 'resolved', mode: 'wizard', created from stored date)
3. Set version to 2
4. Delete backup key after 5 successful v2 loads (track count in the v2 schema)

---

## Section 7: Mode Selector, State Machine & Render Updates

### Updated State Object

```js
var state = {
  mode: 'wizard',        // 'wizard' | 'expert' | 'multi-dx'
  currentNode: ROOT,
  history: [],
  expertSelections: {},
  wizardNotes: {}         // { nodeId: noteText }
};
```

`multiDxState` is a separate object (reset on mode switch to multi-dx).

`journalState` tracks the active journal view:
```js
var journalState = {
  view: 'dashboard',    // 'dashboard' | 'check-in' | 'check-in-detail' | 'check-in-result'
  activeEntryId: null,
  checkInData: {}
};
```

### State Precedence Rule

When multiple state objects are active, render dispatch follows this precedence:
1. `journalState.view !== 'dashboard'` → render check-in flow (overrides mode)
2. `state.mode` → dispatch to wizard/expert/multi-dx renderer
3. Journal dashboard renders above mode content when display condition is met

### Updated render()

The main `render()` function dispatches based on mode (respecting precedence above):
- `wizard` → existing wizard render path (with notes expander added)
- `expert` → existing expert render path (with notes expander added)
- `multi-dx` → dispatch to `renderMultiDxSelect()`, `renderMultiDxRefine()`, or `renderMultiDxResults()` based on `multiDxState.phase`

If journal entries exist and no diagnosis is active, show the journal dashboard above the main mode content.

### Updated init()

1. Check storage availability
2. Load state (with v1->v2 migration)
3. Render journal dashboard if entries exist
4. Bind mode selector
5. Render active mode

---

## Section 8: Testing

### New Tests for runTests()

Add to the existing 9 tests:

**Scoring engine tests:**
- Verify `scoreDiagnoses(['yellow-lower', 'brown-tips'], 'veg')` returns r-n-def and r-ph-lockout in top 5
- Verify corroboration bonus: symptoms from 3 regions score higher than same count from 1 region
- Verify stage modifiers apply correctly (late-flower reduces r-n-def score)
- Verify scores are clamped to [0, 1]

**Refine rule tests:**
- Verify `getRefineQuestions()` returns matching rules when top diagnoses meet conditions
- Verify `applyRefineAnswer()` adjusts scores and maintains [0, 1] bounds

**Combined plan tests:**
- Verify deduplication of checkFirst items across multiple diagnoses
- Verify fix ordering (shared fixes first)

**Journal tests:**
- Verify v1→v2 migration: v1 lastDiagnosis wraps into journal entry
- Verify journal FIFO eviction at 20 entries
- Verify check-in creates valid checkIn record
- Verify re-scoring after symptom resolution reduces relevant diagnosis confidence

**Data file tests:**
- Verify SYMPTOMS, SCORING, REFINE_RULES are defined (data file loaded)
- Verify every SCORING key matches a TREE result node ID
- Verify every symptom referenced in SCORING exists in SYMPTOMS
- Verify REFINE_RULES conditions are functions, options have adjust objects

**Notes tests:**
- Verify notes survive mode transitions
- Verify notes are included in journal entries

---

## Dependency Order

1. **Section 1** (Knowledge Base) — no dependencies, standalone data file
2. **Section 2** (Scoring Engine) — depends on Section 1 (uses SYMPTOMS, SCORING, REFINE_RULES)
3. **Section 3** (Mode Selector) — depends on Section 7 (state changes), can be built in parallel with Sections 1-2
4. **Section 4** (Multi-Dx UI) — depends on Sections 1, 2, 3
5. **Section 5** (Notes Input) — lightweight, depends on Section 3 (mode awareness)
6. **Section 6** (Treatment Journal) — depends on Sections 2, 4 (scoring + multi-dx for re-assessment)
7. **Section 7** (State Machine Updates) — foundational, should be built early alongside Section 3
8. **Section 8** (Testing) — depends on all above

**Suggested implementation order:** 1 → 7 → 3 → 2 → 5 → 4 → 6 → 8
