# Section 15: Plant Doctor -- Unified Diagnostic Flow

## Overview

This section redesigns the existing Plant Doctor v3 (currently a monolithic 6,400-line HTML file at `/docs/tool-plant-doctor.html`) into a unified diagnostic flow integrated with the Grow Companion app. The existing tool has three modes (Wizard, Multi-Dx, Quick-Dx) -- this section merges them into a single adaptive flow that automatically pre-fills context from the companion's grow profile and generates follow-up tasks.

The Plant Doctor is accessed via `/tools/doctor` in the companion sidebar. It retains all 44 diagnoses, 42 symptoms, 166 advice rules, and the note-aware context engine from v3, but restructures the code into ES modules and integrates with the companion's store, task engine, and plant data.

**Tech stack:** Vanilla JS (ES modules). No framework, no build step. Data extracted from the monolithic HTML into standalone JS modules.

---

## Dependencies

- **Section 02 (Store/Storage):** Diagnosis history is stored in `grow.plants[].diagnoses`. Outcome tracking data is stored in the `outcomes` array. The store's event bus is used to notify the task engine.
- **Section 04 (Grow Knowledge):** Medium-specific advice references nutrient data and environment targets from grow-knowledge modules.

## Blocks

This section does not block any other section. It can be built in parallel with sections 09-14 and 16-18.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/plant-doctor/doctor-engine.js` | Unified diagnostic flow: scoring algorithm, refine logic, state machine |
| `/js/plant-doctor/doctor-data.js` | Extracted SYMPTOMS, SCORING, REFINE_RULES data from v3 |
| `/js/plant-doctor/doctor-ui.js` | Diagnostic UI rendering adapted for companion's content area |
| `/js/plant-doctor/note-context.js` | Note-aware engine from v3 (parses free-text for additional context) |

### Source Files (Existing)

| File | Contains |
|------|----------|
| `/docs/tool-plant-doctor.html` | Monolithic v3 Plant Doctor (6,400 lines, all logic + data + UI inline) |
| `/docs/plant-doctor-data.js` | Existing data module (SYMPTOMS, SCORING arrays) |

---

## Tests (Implement First)

### Context Pre-Fill Tests

- **Profile loaded:** medium, lighting, and stage are auto-loaded from the companion profile (store) so the user does not need to re-enter them
- **Log-based notes:** recent log entries (last 7 days of watering, feeding, observations) are converted into note context strings that feed the note-aware engine

### Unified Flow Tests

- **Guided start:** flow starts with area selection (leaves, stems, roots, whole plant)
- **Symptom checkboxes:** symptom checkboxes appear for the selected area, filtered by region
- **Multi-area selection:** multiple symptoms can be selected across different areas (user can go back and add from other areas)
- **Real-time scoring:** scoring updates in real-time as symptoms are selected, with top candidate diagnoses updating live
- **Refine questions:** when top diagnoses are close in score (within 15% of each other), refine questions appear inline (not as a separate step)

### Existing Test Preservation

All 165+ existing Plant Doctor assertions must continue to pass after extraction into ES modules. These tests validate:

- **SYMPTOMS integrity:** all SYMPTOMS entries have id, label, region, group
- **SCORING integrity:** all SCORING keys match valid diagnosis IDs
- **REFINE_RULES integrity:** all REFINE_RULES conditions reference valid diagnoses
- **Scoring correctness:** selecting known symptom sets produces the expected top diagnosis
- **Note-aware adjustments:** specific note phrases adjust advice text correctly

### Integration Tests

- **Follow-up task creation:** clicking "Create follow-up reminder" after a diagnosis generates a task in the task engine (type `check`, linked to the plant and diagnosis)
- **Diagnosis history:** completing a diagnosis saves an entry to `grow.plants[plantId].diagnoses` with id, timestamp, diagnosisId, confidence, treatment text, and outcome status
- **Outcome tracking:** follow-up check-in presents "Did it improve?" prompt with options (resolved / ongoing / worsened); selection is recorded in the plant's diagnosis record and in the global `outcomes` array

### XSS Tests

- **Script injection in notes:** user notes containing `<script>alert('xss')</script>` are safely escaped when rendered in the result display
- **HTML in strain names:** custom strain names containing HTML entities are safely rendered via `escapeHtml()` or `textContent`

---

## Implementation Details

### Unified Flow Design

The unified flow replaces the old three-mode system (Wizard / Multi-Dx / Quick-Dx) with a single adaptive flow that starts guided and becomes open-ended.

**Flow steps:**

1. **Context pre-fill:** When the view loads, read the companion profile from the store. Pre-populate medium, lighting, stage, and experience level. If a specific plant was selected (e.g., "I see a problem" button from dashboard), pre-populate that plant's data including strain sensitivities and recent logs.

2. **Guided start (area selection):** First question asks: "Where do you see the problem?" with four clickable area cards:
   - Leaves (yellowing, spots, curling, wilting, discoloration)
   - Stems (discoloration, soft spots, stretching, lesions)
   - Roots (brown, slimy, root-bound, slow growth)
   - Whole Plant (drooping, stunted, general decline)

3. **Symptom selection:** After area selection, show symptom checkboxes filtered to that region. Each checkbox shows the symptom label from `SYMPTOMS`. The user can check multiple symptoms.

4. **Adaptive expansion:** An "Add symptoms from another area" button allows the user to expand to other regions without losing current selections. The scoring panel stays visible and updates in real-time.

5. **Real-time scoring:** As symptoms are checked/unchecked, the scoring engine runs immediately. A live panel shows the top 3-5 candidate diagnoses with confidence bars. This replaces the old "analyze" button approach -- results are always visible.

6. **Refine questions:** When the top two diagnoses are within 15% confidence of each other, refine questions from `REFINE_RULES` appear inline below the symptom list. Answering a refine question immediately updates scores.

7. **Results:** Below the scoring panel, full result cards appear for each diagnosis above a confidence threshold. Each card includes:
   - Diagnosis name with confidence percentage bar
   - Severity badge (mild / moderate / severe)
   - Three-layer content disclosure:
     - Layer 1: Immediate action text (what to do now), adapted for current medium/lighting/stage
     - Layer 2 (expandable): Why this diagnosis, evidence level badge, contributing symptoms
     - Layer 3 (link): Knowledge Base article reference for deep reading
   - "Create follow-up reminder" button
   - Plant selector (which plant is this diagnosis for)

8. **Note context:** A free-text note field is always visible below the symptom area. The note-aware engine (`note-context.js`) parses entered text for keywords and phrases that provide additional diagnostic context (e.g., "just switched to flower" adjusts pH-related advice, "using tap water" adds CalMag consideration).

### doctor-engine.js (Scoring and Flow Logic)

The engine manages the diagnostic state machine and scoring algorithm.

```javascript
/**
 * doctor-engine.js
 *
 * createDiagnosticSession(profile) -- Initialize a new diagnostic session
 *   with pre-filled profile data. Returns a session object.
 *
 * selectArea(session, areaId) -- Filter available symptoms to the
 *   selected region. Returns filtered symptom list.
 *
 * toggleSymptom(session, symptomId) -- Add/remove a symptom from the
 *   selected set. Triggers rescoring. Returns updated scores.
 *
 * runScoring(session) -- Execute the scoring algorithm against all
 *   selected symptoms. Returns ranked diagnosis array with confidence
 *   percentages.
 *
 * getRefineQuestions(session) -- Check if top diagnoses are close in
 *   score. If so, return applicable refine questions from REFINE_RULES.
 *
 * answerRefine(session, questionId, answer) -- Process a refine answer
 *   and rescore. Returns updated scores.
 *
 * applyNoteContext(session, noteText) -- Parse free-text note through
 *   the note-aware engine. Adjusts advice text and may add/remove
 *   diagnostic considerations.
 *
 * saveDiagnosis(session, plantId, diagnosisId) -- Save selected diagnosis
 *   to the plant's diagnosis history in the store.
 *
 * createFollowUp(session, plantId, diagnosisId) -- Generate a follow-up
 *   check task in the task engine (3-5 day interval).
 */
```

**Scoring algorithm (preserved from v3):**

The scoring system assigns points to each diagnosis based on which symptoms are selected. Each diagnosis in the SCORING data has a set of symptom-to-weight mappings. The algorithm:

1. For each diagnosis, sum the weights of all selected symptoms that appear in its scoring map
2. Normalize scores to percentages (highest score = 100%, others proportional)
3. Apply refine question adjustments (bonus/penalty to specific diagnoses)
4. Apply note-context adjustments (bonus for context-matching diagnoses)
5. Return sorted array of `{diagnosisId, name, confidence, severity, advice}` above a minimum threshold (default 15%)

### doctor-data.js (Extracted Data)

This file contains the three core data structures extracted from the monolithic Plant Doctor v3.

```javascript
/**
 * SYMPTOMS -- Array of symptom definitions.
 * Each: {
 *   id: String,       // Unique symptom identifier
 *   label: String,    // Display text
 *   region: String,   // 'leaves' | 'stems' | 'roots' | 'whole-plant'
 *   group: String     // Grouping for UI organization (e.g., 'color', 'shape', 'texture')
 * }
 * Contains 42 symptoms from v3.
 *
 * SCORING -- Object mapping diagnosis IDs to scoring rules.
 * Each: diagnosisId -> {
 *   name: String,
 *   severity: String,    // 'mild' | 'moderate' | 'severe'
 *   symptoms: {          // symptomId -> weight (1-10)
 *     [symptomId]: Number
 *   },
 *   advice: {
 *     [medium]: String   // Medium-specific advice text
 *   }
 * }
 * Contains 44 diagnoses from v3.
 *
 * REFINE_RULES -- Array of refine question definitions.
 * Each: {
 *   id: String,
 *   question: String,           // Text shown to user
 *   condition: {                // When to show this question
 *     topDiagnoses: String[],   // Show when these diagnoses are in top results
 *     minGap: Number            // Show when score gap between top 2 is less than this
 *   },
 *   answers: [{
 *     text: String,
 *     adjustments: {            // diagnosisId -> score adjustment (+/-)
 *       [diagnosisId]: Number
 *     }
 *   }]
 * }
 */
export const SYMPTOMS = [ /* extracted from v3 */ ];
export const SCORING = { /* extracted from v3 */ };
export const REFINE_RULES = [ /* extracted from v3 */ ];
```

### doctor-ui.js (UI Rendering)

Renders the diagnostic interface within the companion's `<main id="content">` area.

```javascript
/**
 * doctor-ui.js
 *
 * renderDoctorView(container, store) -- Main entry point. Renders the
 *   full Plant Doctor interface:
 *   1. Context summary bar (pre-filled profile data)
 *   2. Area selection cards
 *   3. Symptom checkbox area (filtered by selected region)
 *   4. Note input field
 *   5. Live scoring panel (updates in real-time)
 *   6. Refine questions (appear inline when needed)
 *   7. Result cards with three-layer disclosure
 *
 * renderAreaSelector(container, onSelect) -- Four clickable area cards.
 *
 * renderSymptomList(container, symptoms, selected, onToggle) -- Checkbox
 *   list of symptoms for the active region.
 *
 * renderScoringPanel(container, scores) -- Live-updating ranked diagnosis
 *   list with confidence bars.
 *
 * renderResultCard(container, diagnosis, profile) -- Individual result
 *   card with medium/stage-adapted advice and three-layer disclosure.
 *
 * renderFollowUpPrompt(container, diagnosis, plantId, onCreate) --
 *   "Create follow-up reminder" button with plant selector.
 */
```

**UI rendering rules:**
- All user-provided text (notes, plant names, custom strain names) must be passed through `escapeHtml()` before insertion into HTML templates, or rendered via `textContent`
- Confidence bars use CSS width percentages, colored by severity (green = mild, gold = moderate, red = severe)
- Result cards use the three-layer disclosure component from `/js/components/disclosure.js` (Section 01 or shared component)
- Evidence level badges use the same styling as the Knowledge Base

### note-context.js (Note-Aware Engine)

Extracted from the v3 note-aware system. Parses free-text input for cultivation context clues.

```javascript
/**
 * note-context.js
 *
 * parseNoteContext(noteText) -- Analyze free-text note for keywords and
 *   contextual phrases. Returns an array of context flags:
 *   e.g., ['recent-transplant', 'tap-water', 'new-nutrients', 'overwatered-recently']
 *
 * adjustAdvice(advice, contextFlags, medium, stage) -- Modify advice
 *   text based on detected context. For example:
 *   - 'recent-transplant' + nutrient deficiency -> "This may be transplant shock,
 *     not a true deficiency. Wait 5-7 days before adjusting nutrients."
 *   - 'tap-water' + CalMag issue -> "Tap water may contain enough calcium.
 *     Test EC before adding CalMag."
 *   - 'new-nutrients' + burn symptoms -> "New nutrient brand may be more concentrated.
 *     Reduce to 50% recommended dose and increase gradually."
 *
 * getContextFromLogs(recentLogs) -- Convert recent plant log entries into
 *   note context strings. E.g., a watering log from yesterday with high EC
 *   adds 'recent-high-ec-feed' context flag.
 */
```

### Integration with Companion

**"I see a problem" entry point:**

From the dashboard, a persistent "I see a problem" button (or task card action) navigates to `/tools/doctor` with query parameters specifying the plant:

```
/tools/doctor?plant=plant-id-123
```

The doctor view reads this parameter, pre-selects the plant, and loads its strain sensitivities and recent logs as additional context.

**Diagnosis saving:**

When a user completes a diagnosis, the result is saved to the plant's record:

```javascript
// Shape of a saved diagnosis entry (in grow.plants[].diagnoses)
{
  id: 'dx-uuid',
  timestamp: '2026-04-08T12:30:00Z',
  diagnosisId: 'nitrogen-deficiency',  // references SCORING key
  confidence: 85,
  treatment: 'Increase nitrogen in next feeding. Target EC 1.4-1.6.',
  followUpTaskId: 'task-uuid',         // if follow-up was created
  outcome: 'pending'                    // 'pending' | 'resolved' | 'ongoing' | 'worsened'
}
```

**Outcome tracking:**

When a follow-up task is completed, the task engine presents an outcome prompt: "How is [plant name] responding to the [diagnosis] treatment?"

Options:
- **Resolved** -- marks the diagnosis outcome as `resolved`, records `daysToResolve` in the global `outcomes` array
- **Ongoing** -- keeps the diagnosis active, generates another follow-up task in 3-5 days
- **Worsened** -- marks outcome as `worsened`, suggests re-running the diagnostic

The global `outcomes` array builds a treatment success database over time:

```javascript
// Shape of an outcome record (in store.outcomes)
{
  diagnosisId: 'nitrogen-deficiency',
  treatment: 'Increase nitrogen',
  medium: 'soil',
  resolved: true,
  daysToResolve: 5
}
```

### Extraction Strategy (from Monolithic HTML)

The existing `/docs/tool-plant-doctor.html` is a single file containing all JavaScript logic, CSS, and HTML. The extraction process:

1. **Identify data blocks:** Locate the `SYMPTOMS`, `SCORING`, `REFINE_RULES`, and note-context rule arrays in the HTML file's `<script>` sections. Copy these verbatim into `doctor-data.js` and `note-context.js`.

2. **Identify scoring logic:** Extract the scoring algorithm functions (symptom weight summing, normalization, refine application). Place in `doctor-engine.js`.

3. **Identify UI rendering:** Extract DOM creation functions. Adapt them to render into the companion's content area instead of the standalone page. Place in `doctor-ui.js`.

4. **Adapt for ES modules:** Convert all `var`/`let`/`const` function-scoped code into proper `export` statements. Replace any global variable references with module imports.

5. **Adapt for companion context:** Replace the old profile collection UI (medium/lighting dropdowns that existed in the standalone tool) with reads from the companion store. The standalone tool asked users to select their medium and lighting -- the companion already knows this.

6. **Preserve test assertions:** Every existing assertion in the v3 test suite must have a corresponding assertion in the extracted modules' `runTests()` functions. The assertion text and conditions should match even if the code structure changed.

---

## Implementation Checklist

1. Write context pre-fill tests (profile loads from store, logs convert to note context)
2. Write unified flow tests (area selection, symptom checkboxes, multi-area, real-time scoring, refine questions)
3. Write existing test preservation tests (verify all 165+ assertions have equivalents)
4. Write integration tests (follow-up task creation, diagnosis history save, outcome tracking)
5. Write XSS tests (script tags in notes, HTML in strain names)
6. Extract SYMPTOMS, SCORING, REFINE_RULES from `/docs/tool-plant-doctor.html` into `/js/plant-doctor/doctor-data.js`
7. Extract note-context rules into `/js/plant-doctor/note-context.js`
8. Implement `parseNoteContext()` and `adjustAdvice()` in note-context.js
9. Implement `getContextFromLogs()` to convert recent plant logs to context flags
10. Implement `createDiagnosticSession()` in doctor-engine.js with profile pre-fill
11. Implement `selectArea()` to filter symptoms by region
12. Implement `toggleSymptom()` with immediate rescoring
13. Implement `runScoring()` algorithm (weight summing, normalization, threshold filtering)
14. Implement `getRefineQuestions()` logic (check score gap, return applicable questions)
15. Implement `answerRefine()` with score adjustments
16. Implement `applyNoteContext()` integration between note-context.js and doctor-engine.js
17. Implement `saveDiagnosis()` to persist diagnosis to plant record in store
18. Implement `createFollowUp()` to generate a check task via the task engine
19. Implement `renderDoctorView()` in doctor-ui.js as the main view entry point
20. Implement area selector, symptom list, scoring panel, result cards, and follow-up prompt UI
21. Wire "I see a problem" button from dashboard to `/tools/doctor?plant=id`
22. Implement outcome tracking flow (resolved/ongoing/worsened) on follow-up task completion
23. Run all 165+ preserved tests and verify passing
24. Run all new integration tests and verify passing
25. Run XSS tests and verify passing
26. Test the full diagnostic flow end-to-end: area selection -> symptoms -> scoring -> refine -> results -> follow-up -> outcome
