diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index 554bb77..9731563 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -3519,6 +3519,319 @@ function runTests() {
     else localStorage.removeItem(STORAGE_KEY);
   })();
 
+  // ══════════════════════════════════════════════
+  // Section 07: Integration Tests
+  // ══════════════════════════════════════════════
+
+  // ── 7.1 All v1 Tests Still Pass ──
+  // The original v1 tests remain at the top of runTests().
+  // No additional code needed — if they were broken, they already failed above.
+
+  // ── 7.2 Data File Cross-Reference Validation ──
+
+  if (dataFileLoaded()) {
+
+    // Test: every symptom ID in SYMPTOMS appears in at least 1 SCORING entry
+    var symptomUsage = {};
+    for (var symId7 in SYMPTOMS) {
+      if (!SYMPTOMS.hasOwnProperty(symId7)) continue;
+      symptomUsage[symId7] = 0;
+    }
+    for (var diagId7 in SCORING) {
+      if (!SCORING.hasOwnProperty(diagId7)) continue;
+      for (var scoreSym in SCORING[diagId7].symptoms) {
+        if (!SCORING[diagId7].symptoms.hasOwnProperty(scoreSym)) continue;
+        if (symptomUsage[scoreSym] !== undefined) {
+          symptomUsage[scoreSym]++;
+        }
+      }
+    }
+    var unusedSymptoms = [];
+    var singleUseSymptoms = [];
+    for (var symCheck in symptomUsage) {
+      if (!symptomUsage.hasOwnProperty(symCheck)) continue;
+      if (symptomUsage[symCheck] === 0) unusedSymptoms.push(symCheck);
+      else if (symptomUsage[symCheck] === 1) singleUseSymptoms.push(symCheck);
+    }
+    assert(unusedSymptoms.length === 0,
+      'All SYMPTOMS used in at least 1 SCORING entry (' + unusedSymptoms.length + ' unused: ' + unusedSymptoms.slice(0, 5).join(', ') + ')');
+    if (singleUseSymptoms.length > 10) {
+      console.warn('WARNING: ' + singleUseSymptoms.length + ' symptoms appear in only 1 SCORING entry');
+    }
+
+    // Test: every SCORING entry references at least 2 symptoms
+    var scoringTooFew = [];
+    for (var diagId72 in SCORING) {
+      if (!SCORING.hasOwnProperty(diagId72)) continue;
+      var symCount7 = 0;
+      for (var s7 in SCORING[diagId72].symptoms) {
+        if (SCORING[diagId72].symptoms.hasOwnProperty(s7)) symCount7++;
+      }
+      if (symCount7 < 2) scoringTooFew.push(diagId72);
+    }
+    assert(scoringTooFew.length === 0,
+      'All SCORING entries have at least 2 symptoms (' + scoringTooFew.length + ' have fewer: ' + scoringTooFew.slice(0, 5).join(', ') + ')');
+
+    // Test: SCORING keys cover all v1 result nodes
+    var treeResultCount7 = 0;
+    var missingScoringKeys = [];
+    for (var treeId7 in TREE) {
+      if (!TREE.hasOwnProperty(treeId7)) continue;
+      if (!isResult(TREE[treeId7])) continue;
+      treeResultCount7++;
+      if (!SCORING[treeId7]) missingScoringKeys.push(treeId7);
+    }
+    assert(missingScoringKeys.length === 0,
+      'SCORING covers all ' + treeResultCount7 + ' TREE result nodes (' + missingScoringKeys.length + ' missing: ' + missingScoringKeys.slice(0, 5).join(', ') + ')');
+
+    // Test: no orphan SCORING keys
+    var orphanScoring = [];
+    for (var scOrphan in SCORING) {
+      if (!SCORING.hasOwnProperty(scOrphan)) continue;
+      if (!TREE[scOrphan]) orphanScoring.push(scOrphan);
+    }
+    assert(orphanScoring.length === 0,
+      'No orphan SCORING keys (' + orphanScoring.length + ' reference non-existent TREE nodes: ' + orphanScoring.slice(0, 5).join(', ') + ')');
+
+    // Test: REFINE_RULES adjust keys all reference valid SCORING entries
+    var refineAdjustBad7 = [];
+    for (var ri7 = 0; ri7 < REFINE_RULES.length; ri7++) {
+      for (var oi7 = 0; oi7 < REFINE_RULES[ri7].options.length; oi7++) {
+        var adj7 = REFINE_RULES[ri7].options[oi7].adjust;
+        for (var adjKey7 in adj7) {
+          if (!adj7.hasOwnProperty(adjKey7)) continue;
+          if (!SCORING[adjKey7]) {
+            refineAdjustBad7.push(REFINE_RULES[ri7].id + ' -> ' + adjKey7);
+          }
+        }
+      }
+    }
+    assert(refineAdjustBad7.length === 0,
+      'All REFINE_RULES adjust targets exist in SCORING (' + refineAdjustBad7.length + ' invalid: ' + refineAdjustBad7.slice(0, 3).join(', ') + ')');
+
+    // Test: REFINE_RULES condition functions don't throw when given edge cases
+    var conditionErrors = 0;
+    var edgeCases = [
+      [],
+      [{ resultId: 'r-n-def', score: 0.9 }],
+      [{ resultId: 'nonexistent', score: 0.5 }],
+      [{ resultId: 'r-n-def', score: 0.01 }]
+    ];
+    for (var ruleIdx = 0; ruleIdx < REFINE_RULES.length; ruleIdx++) {
+      for (var ecIdx = 0; ecIdx < edgeCases.length; ecIdx++) {
+        try {
+          REFINE_RULES[ruleIdx].condition(edgeCases[ecIdx]);
+        } catch(e) {
+          conditionErrors++;
+        }
+      }
+    }
+    assert(conditionErrors === 0,
+      'REFINE_RULES conditions handle edge cases without throwing (' + conditionErrors + ' errors)');
+
+    // ── 7.3 Complete Multi-Dx Flow ──
+
+    var savedMode7 = state.mode;
+    var savedMdx7 = JSON.parse(JSON.stringify(multiDxState));
+    var savedJournal7 = journalState.view;
+    var savedJournalData7 = JSON.parse(JSON.stringify(journalData));
+
+    // Test: end-to-end multi-dx flow
+    resetMultiDxState();
+    state.mode = 'multi-dx';
+
+    multiDxState.stage = 'veg';
+    multiDxState.selectedSymptoms = ['yellow-lower', 'brown-tips', 'drooping'];
+    assert(canDiagnose() === true, 'E2E: canDiagnose true with 3 symptoms + stage');
+
+    runMultiDxDiagnosis();
+    assert(multiDxState.results.length > 0, 'E2E: scoring produces results');
+    assert(multiDxState.phase === 'refining' || multiDxState.phase === 'results',
+      'E2E: phase transitions to refining or results');
+
+    while (multiDxState.phase === 'refining' && multiDxState.refineStep < multiDxState.refineQuestions.length) {
+      answerRefineQuestion(0);
+    }
+    assert(multiDxState.phase === 'results', 'E2E: reaches results phase after refining');
+    assert(multiDxState.results.length > 0 && multiDxState.results.length <= 5,
+      'E2E: 1-5 results returned (' + multiDxState.results.length + ')');
+
+    var e2eSorted = true;
+    for (var e2eI = 1; e2eI < multiDxState.results.length; e2eI++) {
+      if (multiDxState.results[e2eI].score > multiDxState.results[e2eI - 1].score) {
+        e2eSorted = false;
+      }
+    }
+    assert(e2eSorted, 'E2E: results sorted descending by score');
+
+    var e2ePlan = generateCombinedPlan(multiDxState.results);
+    assert(e2ePlan.checkFirst.length > 0, 'E2E: combined plan has checkFirst items');
+    assert(e2ePlan.fixes.length > 0, 'E2E: combined plan has fix steps');
+
+    // ── 7.4 Journal Lifecycle: Create → Track → Check-In → Resolve ──
+
+    var e2eEntry = createJournalEntry('multi-dx', null, multiDxState.results, e2ePlan,
+      { 'step-symptoms': 'Integration test note' });
+    assert(e2eEntry.id, 'E2E Journal: entry has ID');
+    assert(e2eEntry.symptoms.length === 3, 'E2E Journal: entry has 3 symptoms');
+    assert(e2eEntry.diagnoses.length > 0, 'E2E Journal: entry has diagnoses');
+    assert(e2eEntry.notes['step-symptoms'] === 'Integration test note', 'E2E Journal: entry includes notes');
+
+    e2eEntry.treatments = createTreatments(['Flush with pH water', 'Increase nitrogen']);
+    e2eEntry.status = 'treating';
+    assert(e2eEntry.treatments.length === 2, 'E2E Journal: 2 treatments created');
+    assert(e2eEntry.status === 'treating', 'E2E Journal: status is treating');
+
+    var e2eCheckIn = createCheckInRecord('somewhat-better', ['brown-tips'], [], 'Tips stopped spreading');
+    e2eEntry.checkIns.push(e2eCheckIn);
+    assert(e2eEntry.checkIns.length === 1, 'E2E Journal: check-in added');
+    assert(e2eEntry.checkIns[0].response === 'somewhat-better', 'E2E Journal: check-in response correct');
+    assert(e2eEntry.checkIns[0].symptomsResolved.length === 1, 'E2E Journal: 1 symptom resolved');
+
+    var updatedSymptoms7 = ['yellow-lower', 'drooping'];
+    var treatedIds7 = e2eEntry.diagnoses.map(function(d) { return d.resultId; });
+    var reScored = scoreDiagnoses(updatedSymptoms7, 'veg', treatedIds7);
+    assert(reScored.length > 0, 'E2E Journal: re-scoring produces results');
+
+    e2eEntry.status = 'resolved';
+    assert(e2eEntry.status === 'resolved', 'E2E Journal: entry resolved');
+
+    // ── 7.5 Wizard Diagnosis → Save to Journal ──
+
+    state.mode = 'wizard';
+    state.currentNode = 'r-n-def';
+    state.history = [ROOT, 'q-symptom', 'q-yellow-where', 'q-yellow-old'];
+    state.wizardNotes = { 'q-stage': 'Week 3 veg', 'q-yellow-old': 'Started 4 days ago' };
+
+    var wizEntry7 = createJournalEntry('wizard', 'r-n-def',
+      [{ resultId: 'r-n-def', score: 0.85, rank: 1 }], null, state.wizardNotes);
+    assert(wizEntry7.mode === 'wizard', 'E2E Wizard: journal entry mode is wizard');
+    assert(wizEntry7.symptoms.length === 0, 'E2E Wizard: symptoms array empty for wizard');
+    assert(wizEntry7.notes['q-stage'] === 'Week 3 veg', 'E2E Wizard: notes included');
+
+    // ── 7.6 localStorage Round-Trip for Full v2 Schema ──
+
+    (function() {
+      var savedStorage7 = localStorage.getItem(STORAGE_KEY);
+      var testData7 = {
+        version: 2,
+        journal: [e2eEntry, wizEntry7],
+        migrateCount: 3
+      };
+      try {
+        localStorage.setItem(STORAGE_KEY, JSON.stringify(testData7));
+        var loaded7 = loadStateV2();
+        assert(loaded7.version === 2, 'E2E Storage: v2 schema loads correctly');
+        assert(loaded7.journal.length === 2, 'E2E Storage: 2 journal entries survive round-trip');
+        assert(loaded7.journal[0].checkIns.length === 1, 'E2E Storage: check-ins survive round-trip');
+        assert(loaded7.journal[0].treatments.length === 2, 'E2E Storage: treatments survive round-trip');
+        assert(loaded7.journal[1].notes['q-stage'] === 'Week 3 veg', 'E2E Storage: notes survive round-trip');
+      } catch(e) {
+        assert(false, 'E2E Storage round-trip failed: ' + e.message);
+      }
+      if (savedStorage7) localStorage.setItem(STORAGE_KEY, savedStorage7);
+      else localStorage.removeItem(STORAGE_KEY);
+    })();
+
+    // ── 7.7 Backward Compatibility ──
+
+    state.mode = 'wizard';
+    state.currentNode = ROOT;
+    state.history = [];
+    var wizNode7 = TREE[state.currentNode];
+    assert(wizNode7 && wizNode7.question, 'Backward compat: wizard root node accessible');
+    assert(wizNode7.options && wizNode7.options.length > 0, 'Backward compat: wizard root has options');
+
+    state.mode = 'expert';
+    state.expertSelections = {};
+    state.expertSelections[ROOT] = 1;
+    var expertHtml7 = renderExpert();
+    assert(expertHtml7.indexOf('expert-select') !== -1, 'Backward compat: expert mode renders dropdowns');
+
+    var modeSelector7 = document.querySelector('.mode-selector');
+    assert(modeSelector7 !== null, 'Backward compat: mode selector exists');
+    var wizBtn7 = document.querySelector('[data-mode="wizard"]');
+    var expBtn7 = document.querySelector('[data-mode="expert"]');
+    assert(wizBtn7 !== null && expBtn7 !== null, 'Backward compat: wizard and expert mode buttons exist');
+
+    // ── 7.8 Edge Cases ──
+
+    var emptyScores7 = scoreDiagnoses([], 'veg', []);
+    assert(emptyScores7.length === 0, 'Edge: empty symptoms → empty results');
+
+    var badSymScores7 = scoreDiagnoses(['nonexistent-symptom', 'yellow-lower'], 'veg', []);
+    assert(Array.isArray(badSymScores7), 'Edge: unknown symptom ID does not crash scoring');
+
+    var emptyPlan7 = generateCombinedPlan([]);
+    assert(emptyPlan7.checkFirst.length === 0 && emptyPlan7.fixes.length === 0,
+      'Edge: empty diagnoses → empty plan');
+
+    var badPlan7 = generateCombinedPlan([{ resultId: 'nonexistent', score: 0.5, matchedSymptoms: [] }]);
+    assert(badPlan7.fixes.length === 0, 'Edge: invalid resultId → empty plan (no crash)');
+
+    var origScores7 = [{ resultId: 'r-n-def', score: 0.8, matchedSymptoms: ['yellow-lower'] }];
+    var badRefine7 = applyRefineAnswer(origScores7, 'nonexistent-rule', 0);
+    assert(badRefine7[0].score === 0.8, 'Edge: invalid ruleId → scores unchanged');
+
+    resetMultiDxState();
+    multiDxGoBack();
+    assert(multiDxState.phase === 'select', 'Edge: back at select phase stays at select');
+
+    var smallJournal7 = [{ id: 'test', status: 'active', createdAt: new Date().toISOString() }];
+    var evictResult7 = evictJournalEntry(smallJournal7);
+    assert(evictResult7.length === 1, 'Edge: evict with < 20 entries does nothing');
+
+    // ── 7.9 Performance Sanity Check ──
+
+    var perfStart7 = performance.now ? performance.now() : Date.now();
+    for (var perfI7 = 0; perfI7 < 100; perfI7++) {
+      scoreDiagnoses(['yellow-lower', 'brown-tips', 'drooping', 'curling-up', 'spots-random'], 'veg', []);
+    }
+    var perfEnd7 = performance.now ? performance.now() : Date.now();
+    var perfMs7 = perfEnd7 - perfStart7;
+    assert(perfMs7 < 500, 'Performance: 100 scoring runs in ' + Math.round(perfMs7) + 'ms (target < 500ms)');
+
+    // Restore integration test state
+    state.mode = savedMode7;
+    multiDxState.stage = savedMdx7.stage;
+    multiDxState.selectedSymptoms = savedMdx7.selectedSymptoms;
+    multiDxState.notes = savedMdx7.notes;
+    multiDxState.refineStep = savedMdx7.refineStep;
+    multiDxState.refineQuestions = savedMdx7.refineQuestions;
+    multiDxState.refineAnswers = savedMdx7.refineAnswers;
+    multiDxState.scores = savedMdx7.scores;
+    multiDxState.results = savedMdx7.results;
+    multiDxState.phase = savedMdx7.phase;
+    journalState.view = savedJournal7;
+    journalData = savedJournalData7;
+
+  } else {
+    console.log('SKIP: Integration tests requiring data file (7.2-7.9)');
+
+    // Even without data file, backward-compat tests should run:
+    state.mode = 'wizard';
+    state.currentNode = ROOT;
+    state.history = [];
+    render();
+    var appContent7 = document.getElementById('app').innerHTML;
+    assert(appContent7.indexOf('opt-btn') !== -1, 'Backward compat (no data): wizard renders option buttons');
+
+    state.mode = 'expert';
+    state.expertSelections = {};
+    render();
+    var expertAppContent7 = document.getElementById('app').innerHTML;
+    assert(expertAppContent7.indexOf('expert-select') !== -1, 'Backward compat (no data): expert renders dropdowns');
+
+    var multiDxBtn7 = document.querySelector('[data-mode="multi-dx"]');
+    if (multiDxBtn7) {
+      assert(multiDxBtn7.getAttribute('aria-disabled') === 'true',
+        'Backward compat (no data): multi-dx tab disabled');
+    }
+
+    state.mode = 'wizard';
+    render();
+  }
+
   // Restore state
   state.currentNode = savedState.currentNode;
   state.history = savedState.history;
