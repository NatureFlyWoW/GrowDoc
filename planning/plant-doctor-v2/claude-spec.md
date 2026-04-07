# Plant Doctor v2 — Complete Specification

## 1. Overview

Enhance the existing Plant Doctor tool (`docs/tool-plant-doctor.html`) with four major features:

1. **Multi-Dx Mode** — New third mode for multi-symptom compound diagnosis
2. **Adaptive Inline Questions** — Targeted follow-up questions before showing results
3. **Notes Input** — "Add notes" expander on each diagnostic step
4. **Treatment Journal** — Full follow-up review loop with timeline and re-assessment

The v1 wizard and expert modes remain unchanged. V1's decision tree (TREE) and result nodes are preserved and reused as the diagnosis target for the new scoring engine.

## 2. Architecture

### 2.1 File Structure
- `docs/tool-plant-doctor.html` — UI, rendering, state machine, modes, tests
- `docs/plant-doctor-data.js` — Knowledge base: symptom-weight mappings, diagnosis scoring data, adaptive question rules (loaded via `<script src>`)

This split keeps the main file under 100KB while allowing the knowledge base to grow independently.

### 2.2 Knowledge Base Layer (plant-doctor-data.js)

**Symptom Registry** — flat map of symptom IDs to metadata:
```
SYMPTOMS = {
  'yellow-lower': { id, label: 'Yellowing on lower/older leaves', region: 'leaves', group: 'discoloration' },
  'yellow-upper': { id, label: 'Yellowing on upper/newer leaves', region: 'leaves', group: 'discoloration' },
  'brown-tips': { id, label: 'Brown/burnt leaf tips', region: 'leaves', group: 'damage' },
  'curling-up': { id, label: 'Leaves curling upward', region: 'leaves', group: 'deformation' },
  'drooping': { id, label: 'Drooping/wilting', region: 'whole', group: 'structure' },
  'white-powder': { id, label: 'White powdery substance', region: 'leaves', group: 'surface' },
  'stem-purple': { id, label: 'Purple stems', region: 'stems', group: 'discoloration' },
  'root-brown': { id, label: 'Brown/slimy roots', region: 'roots', group: 'root-health' },
  ... (30-40 symptoms total, derived from v1's question option labels)
}
```

**Diagnosis Scoring Map** — maps each v1 result node to its symptom weights:
```
SCORING = {
  'r-n-def': {
    symptoms: { 'yellow-lower': 0.9, 'yellow-tips': 0.3, 'pale-overall': 0.4 },
    stage_modifier: { 'late-flower': -0.3 },  // less likely if in late flower (natural fade)
    base_confidence: 0.85
  },
  'r-ph-lockout': {
    symptoms: { 'yellow-upper': 0.7, 'brown-tips': 0.5, 'yellow-lower': 0.4, 'spots-random': 0.5 },
    base_confidence: 0.82
  },
  ...
}
```

**Adaptive Question Rules** — forward-chaining rules for refining diagnosis:
```
REFINE_RULES = [
  {
    condition: diagnoses_include(['r-n-def', 'r-natural-fade']),
    question: 'How far into flowering are you?',
    options: [
      { label: 'Week 7+', adjust: { 'r-natural-fade': +0.3, 'r-n-def': -0.2 } },
      { label: 'Before week 7', adjust: { 'r-natural-fade': -0.4, 'r-n-def': +0.1 } }
    ]
  },
  {
    condition: diagnoses_include(['r-overwater', 'r-root-rot']),
    question: 'Do the roots smell bad when you check them?',
    options: [
      { label: 'Yes, foul smell', adjust: { 'r-root-rot': +0.3, 'r-overwater': -0.1 } },
      { label: 'No, roots look OK', adjust: { 'r-root-rot': -0.4 } }
    ]
  },
  ... (15-25 rules targeting common ambiguities)
]
```

### 2.3 Scoring Engine

**Multi-symptom scoring algorithm:**
1. User selects growth stage + multiple symptoms from checkbox groups
2. For each diagnosis in SCORING:
   - `base = sum(selected_symptom_weights) / sum(all_symptom_weights)`
   - Apply `stage_modifier` if growth stage matches
   - `corroboration = (unique_regions_with_matches - 1) * 0.05`
   - `score = min(base + corroboration, 1.0)`
3. Rank diagnoses by score
4. Filter to top 5 (or those above 0.3 threshold)
5. Check REFINE_RULES: if any rule's condition matches the current top diagnoses, present that question inline
6. After refinements, re-rank and display final results

**Combined fix plan generation:**
1. Collect all `checkFirst` items from top diagnoses, deduplicate
2. Collect all `fixes` items, deduplicate and order by: (a) fixes that address multiple diagnoses first, (b) then by diagnosis confidence rank
3. Present as unified step-by-step plan, not per-diagnosis

## 3. UI Design

### 3.1 Mode Selector
Add a third option to the existing toggle area:
- Wizard (default) — single-path step-by-step
- Expert — cascading dropdowns, single-path
- Multi-Dx — multi-symptom compound diagnosis

Implementation: Replace the binary toggle switch with a 3-option segmented control (pill buttons).

### 3.2 Multi-Dx Mode Layout

**Step 1: Context & Symptoms**
```
[Growth Stage Selector — same as v1 first question]

Symptoms (check all that apply):
  LEAVES
  [ ] Yellowing on lower/older leaves
  [ ] Yellowing on upper/newer leaves
  [ ] Brown/burnt tips
  [ ] Spots or burns
  [ ] Curling up (taco)
  [ ] Curling down (claw)
  [ ] White/powdery substance
  
  STEMS & STRUCTURE
  [ ] Purple stems
  [ ] Drooping/wilting
  [ ] Stretching
  
  ROOTS
  [ ] Brown/slimy roots
  [ ] Foul smell from root zone
  
  WHOLE PLANT
  [ ] Very dark green all over
  [ ] Pale/light green all over
  [ ] Stunted growth

  [Add notes...] (collapsible textarea)
```

Checkboxes grouped by plant region. Minimum 2 symptoms required to proceed (otherwise suggest wizard mode). Maximum not enforced but UI shows warning above 8.

**Step 2: Refining Questions (inline, 0-3 questions)**
If REFINE_RULES match the current top diagnoses, show each as a card with option buttons (same style as wizard questions). These appear one at a time with fade transitions.

"Add notes" expander available on each refining question.

**Step 3: Results**
```
Combined Diagnosis
━━━━━━━━━━━━━━━━━━━━━━

1. Nitrogen Deficiency (78%)     [warning]
   Supported by: yellowing lower leaves, pale overall
   
2. pH Lockout (62%)              [critical]
   Supported by: yellowing lower leaves, brown tips
   
3. Overwatering (45%)            [warning]
   Supported by: drooping, pale overall

━━━━━━━━━━━━━━━━━━━━━━
Combined Action Plan
━━━━━━━━━━━━━━━━━━━━━━

CHECK FIRST:
1. Verify pH: 6.0-6.5 (soil) or 5.5-6.0 (coco/hydro)
2. Test runoff pH and EC/PPM
3. Lift pot — is it heavy?

FIX STEPS:
1. If pH is off: flush with correctly pH'd water (3x pot volume)
2. Allow medium to dry before next watering
3. Resume feeding at correct pH with increased nitrogen
4. Monitor for 5-7 days

ALSO CONSIDER:
- Natural late-flower fade (if week 7+)
- Root rot (if roots smell bad)

[Save & Start Tracking]  [Start Over]
```

### 3.3 Notes Expander (All Modes)
Small "Add notes" link below each question step that expands to a textarea (max 200 chars). Notes are stored in the diagnosis session and displayed alongside results if present. Available in wizard, expert, and multi-dx modes.

### 3.4 Treatment Journal UI

**Entry Point:** "Save & Start Tracking" button on any result screen (wizard, expert, or multi-dx).

**Journal Dashboard** (replaces "Last Diagnosis" banner when journal entries exist):
```
Active Treatments
━━━━━━━━━━━━━━━━━

Apr 7 — Nitrogen Deficiency + pH Lockout
  Status: Treating (Day 3)
  Applied: Flushed, adjusted pH, increased N
  [Check In]

Mar 28 — Overwatering (Resolved)
  Resolved after 5 days

[New Diagnosis]
```

**Check-In Flow** (when user taps "Check In"):
1. "How is the plant responding?"
   - Much better / Somewhat better / No change / Getting worse / New symptoms
2. Based on answer:
   - Better: "Which symptoms improved?" (checkboxes of original symptoms)
   - No change/Worse: "How many days since you applied the fix?" + re-assessment
   - New symptoms: Opens multi-dx mode pre-populated with original unresolved symptoms + new ones
3. System re-scores:
   - Resolved symptoms reduce weights for associated diagnoses
   - Persistent symptoms after treatment reduce confidence in treated diagnosis specifically
   - New symptoms trigger fresh scoring merged with existing context
4. Updated results shown with changelog: "pH Lockout: 62% -> 35% (after flush, tips still brown but no new yellowing)"

**Journal Storage (localStorage):**
```js
{
  version: 2,
  lastDiagnosis: { ... },  // v1 compat
  journal: [
    {
      id: 'j-uuid',
      createdAt: timestamp,
      stage: 'veg',
      symptoms: ['yellow-lower', 'brown-tips'],
      notes: { 'step-symptoms': 'Started 3 days ago...', 'step-refine-1': 'Using coco...' },
      diagnoses: [{ resultId: 'r-n-def', confidence: 0.78, rank: 1 }, ...],
      combinedPlan: { checkFirst: [...], fixes: [...] },
      treatments: [
        { action: 'Flushed with pH 6.2 water', startedAt: timestamp, status: 'active' }
      ],
      checkIns: [
        { date: timestamp, response: 'somewhat-better', symptomsResolved: ['brown-tips'], 
          symptomsNew: [], notes: 'Tips stopped spreading', updatedScores: {...} }
      ],
      status: 'treating'  // 'active' | 'treating' | 'resolved' | 'escalated'
    }
  ]
}
```

## 4. State Machine Extension

```
v1 states: idle -> questioning -> result

v2 adds for multi-dx:
  idle -> symptom-select -> refining -> compound-result -> tracking

v2 adds for journal:
  tracking -> check-in -> re-assessment -> (tracking | compound-result)
```

Multi-dx state lives in a parallel state object:
```js
var multiDxState = {
  stage: null,           // growth stage selection
  selectedSymptoms: [],  // array of symptom IDs
  notes: {},             // { stepId: noteText }
  refineStep: 0,         // which refine question we're on
  refineAnswers: [],     // answers to refine questions
  scores: {},            // { diagnosisId: score }
  results: [],           // ranked diagnosis results
  activeJournalId: null  // if tracking
};
```

## 5. Backward Compatibility

- localStorage version bump from 1 to 2
- `loadState()` migrates v1 data: wraps `lastDiagnosis` into a journal entry if present
- v1 wizard and expert modes untouched (same code paths, same TREE)
- plant-doctor-data.js is loaded via `<script src>` before the main script block
- If data file fails to load, multi-dx mode shows an error; wizard/expert still work

## 6. Accessibility

- Checkbox groups use `fieldset` + `legend` for screen readers
- Refining questions use same aria-live pattern as wizard
- Journal entries are `<article>` elements with proper heading hierarchy
- Check-in flow reuses wizard accessibility patterns
- All interactive elements maintain 44px min touch target
- Notes textareas have visible labels

## 7. Performance Constraints

- Scoring engine must compute all diagnoses in <50ms for 40 symptoms x 44 diagnoses
- Journal capped at 20 entries (FIFO eviction on oldest resolved entries)
- Notes capped at 200 chars per step
- Combined plan deduplication uses simple string comparison
