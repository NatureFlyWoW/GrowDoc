# Section 07: Integration Tests

## Overview

Add end-to-end integration tests that verify complete user flows across all sections, cross-reference data validation between TREE/SYMPTOMS/SCORING, and backward compatibility with v1 behavior. These tests run inside the existing `runTests()` function in the browser console.

**Files to modify:**
- `docs/tool-plant-doctor.html` — add integration test block to `runTests()`

**Dependencies:** All previous sections (01-06) must be complete

**Blocks:** None (final section)

---

## Tests First

This entire section IS tests. All code below goes inside `runTests()`, after the section-specific tests from Sections 01-06.

```js
// ══════════════════════════════════════════════
// Section 07: Integration Tests
// ══════════════════════════════════════════════

// ── 7.1 All v1 Tests Still Pass ──
// The original 9 v1 tests remain at the top of runTests().
// This section does NOT duplicate them — it only verifies
// that the v1 tests have not been removed or broken.
// The v1 tests cover:
//   1. Tree traversal (all paths reach result)
//   2. goBack()
//   3. reset()
//   4. Expert mode toggle → setMode() (updated in Section 02)
//   5. Expert selections from wizard history
//   6. Cascade clearing in expert mode
//   7. Result node field validation
//   8. Confidence range validation
//   9. localStorage round-trip
//  10. Corrupted localStorage handling
//
// No additional code needed here — if v1 tests were broken
// during refactoring, they will already fail above.

// ── 7.2 Data File Cross-Reference Validation ──

if (dataFileLoaded()) {

  // Test: every symptom ID in SYMPTOMS appears in at least 2 SCORING entries
  var symptomUsage = {};
  for (var symId in SYMPTOMS) {
    if (!SYMPTOMS.hasOwnProperty(symId)) continue;
    symptomUsage[symId] = 0;
  }
  for (var diagId in SCORING) {
    if (!SCORING.hasOwnProperty(diagId)) continue;
    for (var scoreSym in SCORING[diagId].symptoms) {
      if (!SCORING[diagId].symptoms.hasOwnProperty(scoreSym)) continue;
      if (symptomUsage[scoreSym] !== undefined) {
        symptomUsage[scoreSym]++;
      }
    }
  }
  var unusedSymptoms = [];
  var singleUseSymptoms = [];
  for (var symCheck in symptomUsage) {
    if (!symptomUsage.hasOwnProperty(symCheck)) continue;
    if (symptomUsage[symCheck] === 0) unusedSymptoms.push(symCheck);
    else if (symptomUsage[symCheck] === 1) singleUseSymptoms.push(symCheck);
  }
  assert(unusedSymptoms.length === 0,
    'All SYMPTOMS used in at least 1 SCORING entry (' + unusedSymptoms.length + ' unused: ' + unusedSymptoms.slice(0, 5).join(', ') + ')');
  // Note: single-use is a warning, not a failure — some symptoms are unique identifiers
  if (singleUseSymptoms.length > 10) {
    console.warn('WARNING: ' + singleUseSymptoms.length + ' symptoms appear in only 1 SCORING entry');
  }

  // Test: every SCORING entry references at least 2 symptoms
  var scoringTooFew = [];
  for (var diagId2 in SCORING) {
    if (!SCORING.hasOwnProperty(diagId2)) continue;
    var symCount = 0;
    for (var s in SCORING[diagId2].symptoms) {
      if (SCORING[diagId2].symptoms.hasOwnProperty(s)) symCount++;
    }
    if (symCount < 2) scoringTooFew.push(diagId2);
  }
  assert(scoringTooFew.length === 0,
    'All SCORING entries have at least 2 symptoms (' + scoringTooFew.length + ' have fewer: ' + scoringTooFew.slice(0, 5).join(', ') + ')');

  // Test: SCORING keys cover all v1 result nodes
  var treeResultCount = 0;
  var missingScoringKeys = [];
  for (var treeId in TREE) {
    if (!TREE.hasOwnProperty(treeId)) continue;
    if (!isResult(TREE[treeId])) continue;
    treeResultCount++;
    if (!SCORING[treeId]) missingScoringKeys.push(treeId);
  }
  assert(missingScoringKeys.length === 0,
    'SCORING covers all ' + treeResultCount + ' TREE result nodes (' + missingScoringKeys.length + ' missing: ' + missingScoringKeys.slice(0, 5).join(', ') + ')');

  // Test: no orphan SCORING keys (SCORING key exists but TREE node does not)
  var orphanScoring = [];
  for (var scOrphan in SCORING) {
    if (!SCORING.hasOwnProperty(scOrphan)) continue;
    if (!TREE[scOrphan]) orphanScoring.push(scOrphan);
  }
  assert(orphanScoring.length === 0,
    'No orphan SCORING keys (' + orphanScoring.length + ' reference non-existent TREE nodes: ' + orphanScoring.slice(0, 5).join(', ') + ')');

  // Test: REFINE_RULES adjust keys all reference valid SCORING entries
  var refineAdjustBad = [];
  for (var ri = 0; ri < REFINE_RULES.length; ri++) {
    for (var oi = 0; oi < REFINE_RULES[ri].options.length; oi++) {
      var adj = REFINE_RULES[ri].options[oi].adjust;
      for (var adjKey in adj) {
        if (!adj.hasOwnProperty(adjKey)) continue;
        if (!SCORING[adjKey]) {
          refineAdjustBad.push(REFINE_RULES[ri].id + ' -> ' + adjKey);
        }
      }
    }
  }
  assert(refineAdjustBad.length === 0,
    'All REFINE_RULES adjust targets exist in SCORING (' + refineAdjustBad.length + ' invalid: ' + refineAdjustBad.slice(0, 3).join(', ') + ')');

  // Test: REFINE_RULES condition functions don't throw when given edge cases
  var conditionErrors = 0;
  var edgeCases = [
    [],
    [{ resultId: 'r-n-def', score: 0.9 }],
    [{ resultId: 'nonexistent', score: 0.5 }],
    [{ resultId: 'r-n-def', score: 0.01 }]
  ];
  for (var ruleIdx = 0; ruleIdx < REFINE_RULES.length; ruleIdx++) {
    for (var ecIdx = 0; ecIdx < edgeCases.length; ecIdx++) {
      try {
        REFINE_RULES[ruleIdx].condition(edgeCases[ecIdx]);
      } catch(e) {
        conditionErrors++;
      }
    }
  }
  assert(conditionErrors === 0,
    'REFINE_RULES conditions handle edge cases without throwing (' + conditionErrors + ' errors)');

  // ── 7.3 Complete Multi-Dx Flow ──

  // Save state
  var savedMode = state.mode;
  var savedMdx = JSON.parse(JSON.stringify(multiDxState));
  var savedJournal = journalState.view;
  var savedJournalData = JSON.parse(JSON.stringify(journalData));

  // Test: end-to-end multi-dx flow — select stage + symptoms → score → refine → results
  resetMultiDxState();
  state.mode = 'multi-dx';

  // Phase 1: Select stage and symptoms
  multiDxState.stage = 'veg';
  multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips', 'drooping'];
  assert(canDiagnose() === true, 'E2E: canDiagnose true with 3 symptoms + stage');

  // Run diagnosis
  runMultiDxDiagnosis();
  assert(multiDxState.results.length > 0, 'E2E: scoring produces results');
  assert(multiDxState.phase === 'refining' || multiDxState.phase === 'results',
    'E2E: phase transitions to refining or results');

  // Skip through refine questions if any
  while (multiDxState.phase === 'refining' && multiDxState.refineStep < multiDxState.refineQuestions.length) {
    answerRefineQuestion(0);
  }
  assert(multiDxState.phase === 'results', 'E2E: reaches results phase after refining');
  assert(multiDxState.results.length > 0 && multiDxState.results.length <= 5,
    'E2E: 1-5 results returned (' + multiDxState.results.length + ')');

  // Verify results are sorted
  var e2eSorted = true;
  for (var e2eI = 1; e2eI < multiDxState.results.length; e2eI++) {
    if (multiDxState.results[e2eI].score > multiDxState.results[e2eI - 1].score) {
      e2eSorted = false;
    }
  }
  assert(e2eSorted, 'E2E: results sorted descending by score');

  // Verify combined plan can be generated
  var e2ePlan = generateCombinedPlan(multiDxState.results);
  assert(e2ePlan.checkFirst.length > 0, 'E2E: combined plan has checkFirst items');
  assert(e2ePlan.fixes.length > 0, 'E2E: combined plan has fix steps');

  // ── 7.4 Journal Lifecycle: Create → Track → Check-In → Resolve ──

  // Create journal entry
  var e2eEntry = createJournalEntry('multi-dx', null, multiDxState.results, e2ePlan,
    { 'step-symptoms': 'Integration test note' });
  assert(e2eEntry.id, 'E2E Journal: entry has ID');
  assert(e2eEntry.symptoms.length === 3, 'E2E Journal: entry has 3 symptoms');
  assert(e2eEntry.diagnoses.length > 0, 'E2E Journal: entry has diagnoses');
  assert(e2eEntry.notes['step-symptoms'] === 'Integration test note', 'E2E Journal: entry includes notes');

  // Add treatments
  e2eEntry.treatments = createTreatments(['Flush with pH water', 'Increase nitrogen']);
  e2eEntry.status = 'treating';
  assert(e2eEntry.treatments.length === 2, 'E2E Journal: 2 treatments created');
  assert(e2eEntry.status === 'treating', 'E2E Journal: status is treating');

  // Create check-in
  var e2eCheckIn = createCheckInRecord('somewhat-better', ['brown-tips'], [], 'Tips stopped spreading');
  e2eEntry.checkIns.push(e2eCheckIn);
  assert(e2eEntry.checkIns.length === 1, 'E2E Journal: check-in added');
  assert(e2eEntry.checkIns[0].response === 'somewhat-better', 'E2E Journal: check-in response correct');
  assert(e2eEntry.checkIns[0].symptomsResolved.length === 1, 'E2E Journal: 1 symptom resolved');

  // Re-score with updated symptoms (remove resolved, apply treated penalty)
  var updatedSymptoms = ['yellow-lower', 'drooping']; // brown-tips resolved
  var treatedIds = e2eEntry.diagnoses.map(function(d) { return d.resultId; });
  var reScored = scoreDiagnoses(updatedSymptoms, 'veg', treatedIds);
  assert(reScored.length > 0, 'E2E Journal: re-scoring produces results');

  // Resolve
  e2eEntry.status = 'resolved';
  assert(e2eEntry.status === 'resolved', 'E2E Journal: entry resolved');

  // ── 7.5 Wizard Diagnosis → Save to Journal ──

  // Simulate wizard reaching a result
  state.mode = 'wizard';
  state.currentNode = 'r-n-def';
  state.history = [ROOT, 'q-symptom', 'q-yellow-where', 'q-yellow-old'];
  state.wizardNotes = { 'q-stage': 'Week 3 veg', 'q-yellow-old': 'Started 4 days ago' };

  var wizEntry = createJournalEntry('wizard', 'r-n-def',
    [{ resultId: 'r-n-def', score: 0.85, rank: 1 }], null, state.wizardNotes);
  assert(wizEntry.mode === 'wizard', 'E2E Wizard: journal entry mode is wizard');
  assert(wizEntry.symptoms.length === 0, 'E2E Wizard: symptoms array empty for wizard');
  assert(wizEntry.notes['q-stage'] === 'Week 3 veg', 'E2E Wizard: notes included');

  // ── 7.6 localStorage Round-Trip for Full v2 Schema ──

  (function() {
    var savedStorage = localStorage.getItem(STORAGE_KEY);
    var testData = {
      version: 2,
      journal: [e2eEntry, wizEntry],
      migrateCount: 3
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
      var loaded = loadStateV2();
      assert(loaded.version === 2, 'E2E Storage: v2 schema loads correctly');
      assert(loaded.journal.length === 2, 'E2E Storage: 2 journal entries survive round-trip');
      assert(loaded.journal[0].checkIns.length === 1, 'E2E Storage: check-ins survive round-trip');
      assert(loaded.journal[0].treatments.length === 2, 'E2E Storage: treatments survive round-trip');
      assert(loaded.journal[1].notes['q-stage'] === 'Week 3 veg', 'E2E Storage: notes survive round-trip');
    } catch(e) {
      assert(false, 'E2E Storage round-trip failed: ' + e.message);
    }
    // Restore
    if (savedStorage) localStorage.setItem(STORAGE_KEY, savedStorage);
    else localStorage.removeItem(STORAGE_KEY);
  })();

  // ── 7.7 Backward Compatibility ──

  // Test: wizard mode works without data file loaded (core functionality)
  // (The TREE is inline — wizard never depends on SYMPTOMS/SCORING)
  state.mode = 'wizard';
  state.currentNode = ROOT;
  state.history = [];
  var wizNode = TREE[state.currentNode];
  assert(wizNode && wizNode.question, 'Backward compat: wizard root node accessible');
  assert(wizNode.options && wizNode.options.length > 0, 'Backward compat: wizard root has options');

  // Test: expert mode works without data file loaded
  state.mode = 'expert';
  state.expertSelections = {};
  state.expertSelections[ROOT] = 1;
  var expertHtml = renderExpert();
  assert(expertHtml.indexOf('expert-select') !== -1, 'Backward compat: expert mode renders dropdowns');

  // Test: mode selector exists and has wizard + expert tabs
  var modeSelector = document.querySelector('.mode-selector');
  assert(modeSelector !== null, 'Backward compat: mode selector exists');
  var wizBtn = document.querySelector('[data-mode="wizard"]');
  var expBtn = document.querySelector('[data-mode="expert"]');
  assert(wizBtn !== null && expBtn !== null, 'Backward compat: wizard and expert mode buttons exist');

  // ── 7.8 Edge Cases ──

  // Test: scoring with empty symptom array returns empty results
  var emptyScores = scoreDiagnoses([], 'veg', []);
  assert(emptyScores.length === 0, 'Edge: empty symptoms → empty results');

  // Test: scoring with nonexistent symptom ID returns results (ignores unknown)
  var badSymScores = scoreDiagnoses(['nonexistent-symptom', 'yellow-lower'], 'veg', []);
  assert(Array.isArray(badSymScores), 'Edge: unknown symptom ID does not crash scoring');

  // Test: generateCombinedPlan with empty array returns empty plan
  var emptyPlan = generateCombinedPlan([]);
  assert(emptyPlan.checkFirst.length === 0 && emptyPlan.fixes.length === 0,
    'Edge: empty diagnoses → empty plan');

  // Test: generateCombinedPlan with invalid resultId is graceful
  var badPlan = generateCombinedPlan([{ resultId: 'nonexistent', score: 0.5, matchedSymptoms: [] }]);
  assert(badPlan.fixes.length === 0, 'Edge: invalid resultId → empty plan (no crash)');

  // Test: applyRefineAnswer with invalid ruleId returns original scores
  var origScores = [{ resultId: 'r-n-def', score: 0.8, matchedSymptoms: ['yellow-lower'] }];
  var badRefine = applyRefineAnswer(origScores, 'nonexistent-rule', 0);
  assert(badRefine[0].score === 0.8, 'Edge: invalid ruleId → scores unchanged');

  // Test: multiDxGoBack at phase select does nothing harmful
  resetMultiDxState();
  multiDxGoBack();
  assert(multiDxState.phase === 'select', 'Edge: back at select phase stays at select');

  // Test: evictJournalEntry with fewer than 20 entries returns unchanged
  var smallJournal = [{ id: 'test', status: 'active', createdAt: new Date().toISOString() }];
  var evictResult = evictJournalEntry(smallJournal);
  assert(evictResult.length === 1, 'Edge: evict with < 20 entries does nothing');

  // ── 7.9 Performance Sanity Check ──

  // Test: scoring completes in under 100ms for typical input
  var perfStart = performance.now ? performance.now() : Date.now();
  for (var perfI = 0; perfI < 100; perfI++) {
    scoreDiagnoses(['yellow-lower', 'brown-tips', 'drooping', 'curling-up', 'spots-random'], 'veg', []);
  }
  var perfEnd = performance.now ? performance.now() : Date.now();
  var perfMs = perfEnd - perfStart;
  assert(perfMs < 500, 'Performance: 100 scoring runs in ' + Math.round(perfMs) + 'ms (target < 500ms)');

  // Restore all state
  state.mode = savedMode;
  multiDxState.stage = savedMdx.stage;
  multiDxState.selectedSymptoms = savedMdx.selectedSymptoms;
  multiDxState.notes = savedMdx.notes;
  multiDxState.refineStep = savedMdx.refineStep;
  multiDxState.refineQuestions = savedMdx.refineQuestions;
  multiDxState.refineAnswers = savedMdx.refineAnswers;
  multiDxState.scores = savedMdx.scores;
  multiDxState.results = savedMdx.results;
  multiDxState.phase = savedMdx.phase;
  journalState.view = savedJournal;
  journalData = savedJournalData;

} else {
  console.log('SKIP: Integration tests requiring data file (7.2-7.9)');

  // Even without data file, these backward-compat tests should run:

  // Test: wizard mode renders without data file
  state.mode = 'wizard';
  state.currentNode = ROOT;
  state.history = [];
  render();
  var appContent = document.getElementById('app').innerHTML;
  assert(appContent.indexOf('opt-btn') !== -1, 'Backward compat (no data): wizard renders option buttons');

  // Test: expert mode renders without data file
  state.mode = 'expert';
  state.expertSelections = {};
  render();
  var expertAppContent = document.getElementById('app').innerHTML;
  assert(expertAppContent.indexOf('expert-select') !== -1, 'Backward compat (no data): expert renders dropdowns');

  // Test: multi-dx tab is disabled without data file
  var multiDxBtn = document.querySelector('[data-mode="multi-dx"]');
  if (multiDxBtn) {
    assert(multiDxBtn.getAttribute('aria-disabled') === 'true',
      'Backward compat (no data): multi-dx tab disabled');
  }

  state.mode = 'wizard';
  render();
}
```

---

## Implementation Details

### 1. Test Organization Within `runTests()`

The complete `runTests()` function after all sections should have this structure:

```
function runTests() {
  var passed = 0, failed = 0;
  function assert(condition, msg) { ... }

  // Save/restore wrapper for all state
  var savedState = { ... };

  // ── v1 Tests (original 9, updated for Section 02) ──
  // Tree traversal, goBack, reset, mode switch, expert selections,
  // cascade clearing, result fields, confidence range, localStorage, corruption

  // ── Section 01: Knowledge Base Tests ──
  // SYMPTOMS, SCORING, REFINE_RULES structure validation

  // ── Section 02: State & Mode Selector Tests ──
  // state.mode, setMode(), radiogroup, aria-checked, data file gating

  // ── Section 03: Scoring Engine Tests ──
  // scoreDiagnoses, getRefineQuestions, applyRefineAnswer, generateCombinedPlan

  // ── Section 04: Notes Input Tests ──
  // renderNotesExpander, storage, XSS, persistence

  // ── Section 05: Multi-Dx Mode Tests ──
  // toggleSymptom, canDiagnose, runMultiDxDiagnosis, answerRefineQuestion

  // ── Section 06: Treatment Journal Tests ──
  // Migration, entry creation, eviction, treatments, check-ins, corruption

  // ── Section 07: Integration Tests ──
  // Cross-reference validation, E2E flows, backward compat, edge cases, performance

  // Restore all state
  state.currentNode = savedState.currentNode;
  // ... etc
  render();

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
}
```

### 2. State Save/Restore Pattern

Integration tests mutate global state extensively. The save/restore pattern is critical:

**At the start of integration tests:**
```js
var savedMode = state.mode;
var savedCurrentNode = state.currentNode;
var savedHistory = state.history.slice();
var savedExpertSel = JSON.parse(JSON.stringify(state.expertSelections));
var savedWizNotes = JSON.parse(JSON.stringify(state.wizardNotes));
var savedMdx = JSON.parse(JSON.stringify(multiDxState));
var savedJournalView = journalState.view;
var savedJournalEntry = journalState.activeEntryId;
var savedJournalData = JSON.parse(JSON.stringify(journalData));
var savedLastDx = lastDiagnosis;
```

**At the end of integration tests:**
```js
state.mode = savedMode;
state.currentNode = savedCurrentNode;
state.history = savedHistory;
state.expertSelections = savedExpertSel;
state.wizardNotes = savedWizNotes;
multiDxState.stage = savedMdx.stage;
multiDxState.selectedSymptoms = savedMdx.selectedSymptoms;
// ... (restore all multiDxState fields)
journalState.view = savedJournalView;
journalState.activeEntryId = savedJournalEntry;
journalData = savedJournalData;
lastDiagnosis = savedLastDx;
render();
```

### 3. Test Count Target

Expected total test count across all sections:

| Section | Test Count |
|---------|-----------|
| v1 original (updated) | ~10 |
| Section 01: Knowledge Base | ~12 |
| Section 02: State/Mode | ~10 |
| Section 03: Scoring Engine | ~15 |
| Section 04: Notes | ~7 |
| Section 05: Multi-Dx | ~12 |
| Section 06: Journal | ~12 |
| Section 07: Integration | ~25 |
| **Total** | **~103** |

All tests should pass when the data file is loaded. When the data file is absent, sections requiring it should skip gracefully and report the skip count. The v1 backward-compatibility tests should ALWAYS pass regardless of data file presence.

### 4. Conditional Test Execution

Tests that require the data file use this guard pattern:

```js
if (dataFileLoaded()) {
  // tests that need SYMPTOMS, SCORING, REFINE_RULES
} else {
  console.log('SKIP: [section name] tests (data file not loaded)');
}
```

The `dataFileLoaded()` function (from Section 02) returns `true` only when all three globals are defined.

### 5. Test Isolation

Each test section should be self-contained. No test should depend on a previous test's side effects. Use IIFEs `(function() { ... })()` for tests that create/modify localStorage to ensure cleanup even if the test fails:

```js
(function() {
  var savedRaw = localStorage.getItem(STORAGE_KEY);
  try {
    // ... test logic ...
    assert(condition, message);
  } catch(e) {
    assert(false, 'Test crashed: ' + e.message);
  }
  // Always restore
  if (savedRaw) localStorage.setItem(STORAGE_KEY, savedRaw);
  else localStorage.removeItem(STORAGE_KEY);
})();
```

### 6. Synchronous Rendering Tests

Some tests verify rendered HTML by checking `document.getElementById('app').innerHTML`. These work because `render()` is synchronous (it directly sets innerHTML). However, the fade transition wrapping via `transitionToNode()` uses `setTimeout`. For tests that call functions using `transitionToNode`, override it temporarily as v1 tests already do:

```js
var _origTransition = transitionToNode;
transitionToNode = function(id) { state.currentNode = id; };
// ... tests ...
transitionToNode = _origTransition;
```

---

## Integration Points

- **All Sections (01-06)**: This section validates the output of all previous sections
- **v1 Codebase**: Ensures no regressions in wizard/expert mode behavior

---

## Checklist

1. Add Section 07 integration tests to `runTests()` after all section-specific tests
2. Implement full state save/restore around integration tests
3. Add cross-reference validation tests (7.2): symptom usage, SCORING coverage, REFINE_RULES targets
4. Add end-to-end multi-dx flow test (7.3): select → score → refine → results → plan
5. Add journal lifecycle test (7.4): create → track → check-in → re-score → resolve
6. Add wizard-to-journal test (7.5): wizard result → create journal entry with notes
7. Add localStorage v2 round-trip test (7.6): serialize → deserialize → validate fields
8. Add backward compatibility tests (7.7): wizard/expert render without data file, mode selector presence
9. Add edge case tests (7.8): empty inputs, invalid IDs, back at select, small journal eviction
10. Add performance sanity check (7.9): 100 scoring runs under 500ms
11. Add conditional execution guard for data-file-dependent tests
12. Verify all tests use IIFE pattern for localStorage manipulation
13. Open in browser with data file loaded, run `runTests()` — all pass
14. Open in browser WITHOUT data file, run `runTests()` — v1 + backward compat pass, data-dependent skip
15. Verify test count is ~100+ with all sections complete
16. Verify state is fully restored after tests (UI returns to pre-test state)
