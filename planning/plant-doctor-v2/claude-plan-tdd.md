# TDD Plan: Plant Doctor v2

Testing approach: Inline `runTests()` function (extending v1 pattern). All tests run in the browser console. No external test framework. Tests use the existing `assert(condition, msg)` pattern with pass/fail counting and state save/restore.

---

## Section 1: Knowledge Base Data File

```
// Test: SYMPTOMS is defined and is an object with at least 25 entries
// Test: Every SYMPTOMS entry has required fields: id, label, region, group
// Test: Every SYMPTOMS region is one of: 'leaves', 'stems', 'roots', 'whole'
// Test: SCORING is defined and is an object with at least 40 entries
// Test: Every SCORING key matches a TREE result node ID
// Test: Every symptom ID referenced in SCORING.symptoms exists in SYMPTOMS
// Test: All SCORING weight values are between 0.0 and 1.0
// Test: REFINE_RULES is defined and is an array with at least 10 entries
// Test: Every REFINE_RULES entry has id, condition (function), question (string), options (array)
// Test: Every REFINE_RULES option has label (string) and adjust (object)
```

---

## Section 2: Scoring Engine

```
// Test: scoreDiagnoses returns array of { resultId, score, matchedSymptoms }
// Test: scoreDiagnoses with known symptoms returns expected top diagnosis (e.g., ['yellow-lower', 'yellow-tips'] → r-n-def in top 3)
// Test: corroboration bonus applies — symptoms from 3 regions score higher than same-count from 1 region
// Test: stage_modifier applies — late-flower reduces r-n-def score vs veg stage
// Test: treatedDiagnoses parameter reduces score by 0.2 for listed diagnoses
// Test: all scores clamped to [0, 1]
// Test: diagnoses below 0.25 threshold are filtered out
// Test: results are sorted descending by score
// Test: maximum 5 results returned

// Test: getRefineQuestions returns matching rules when top diagnoses meet conditions
// Test: getRefineQuestions returns empty array when no rules match
// Test: applyRefineAnswer adjusts scores correctly and maintains [0, 1] bounds

// Test: generateCombinedPlan deduplicates checkFirst items
// Test: generateCombinedPlan orders fixes — shared fixes first, then by diagnosis rank
// Test: generateCombinedPlan handles single diagnosis (no compound)
```

---

## Section 3: Mode Selector Redesign

```
// Test: state.mode defaults to 'wizard'
// Test: setMode('expert') updates state.mode and re-renders
// Test: setMode('multi-dx') updates state.mode and initializes multiDxState
// Test: mode selector has role="radiogroup" with 3 role="radio" children
// Test: aria-checked updates correctly on mode switch
// Test: if SYMPTOMS is undefined, multi-dx tab is disabled
```

---

## Section 4: Multi-Dx Mode UI & Flow

```
// Test: multiDxState.phase starts at 'select'
// Test: Diagnose button disabled when < 2 symptoms selected
// Test: Diagnose button disabled when no stage selected
// Test: selecting symptoms updates multiDxState.selectedSymptoms
// Test: clicking Diagnose runs scoreDiagnoses and transitions to 'refining' or 'results'
// Test: if no refine rules match, skip directly to 'results' phase
// Test: refine step increments after each answer
// Test: back from refine returns to previous refine or to select
// Test: results phase shows ranked diagnoses with combined plan
// Test: "Start Over" resets multiDxState to initial values
```

---

## Section 5: Notes Input

```
// Test: notes textarea respects 200 char max
// Test: notes stored in wizardNotes[nodeId] for wizard mode
// Test: notes stored in multiDxState.notes for multi-dx mode
// Test: notes content passes through escapeHtml before rendering (XSS check)
// Test: notes survive within a diagnosis session (not lost on back/forward)
// Test: notes included in journal entry when saved
```

---

## Section 6: Treatment Journal

```
// Test: v1 localStorage (version 1) migrates to v2 format
// Test: v1 backup stored under growdoc-plant-doctor-v1-backup during migration
// Test: journal entry creation from wizard result includes mode:'wizard', symptoms:[]
// Test: journal entry creation from multi-dx result includes symptoms array and combinedPlan
// Test: journal capped at 20 entries — 21st evicts oldest resolved
// Test: if all 20 are active, 21st evicts oldest overall
// Test: treatment selection creates treatments[] entries with status:'active'
// Test: check-in creates valid checkIn record with date, response, symptom deltas
// Test: re-scoring with resolved symptoms reduces associated diagnosis scores
// Test: re-scoring with treatedDiagnoses applies -0.2 penalty
// Test: journal entry status transitions: active → treating → resolved
// Test: corrupted journal data triggers warning, not crash
```

---

## Section 7: Mode Selector, State Machine & Render Updates

```
// Test: render() dispatches to correct renderer based on state.mode
// Test: journalState.view !== 'dashboard' overrides mode rendering (check-in takes precedence)
// Test: journal dashboard shows when journal.length > 0 and at starting state
// Test: journal dashboard hides during active diagnosis flow
// Test: mode switch preserves wizard history when switching to expert (existing behavior)
// Test: mode switch to multi-dx starts fresh multiDxState
// Test: v1 backward compat — wizard and expert modes unchanged when no data file
```

---

## Section 8: Full Integration Tests

```
// Test: complete multi-dx flow — select stage + 3 symptoms → refine → compound results
// Test: save to journal → treatment selection → check-in → re-assessment
// Test: wizard diagnosis → save to journal → check-in updates scores
// Test: localStorage round-trip for full v2 schema (journal + session data)
// Test: all v1 tests still pass (tree traversal, goBack, reset, toggle, etc.)
```
