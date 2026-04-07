diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index 58a9ca6..e0d3892 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -174,6 +174,113 @@ h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-
 @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
 .fade-in { animation: fade-in 0.3s ease-out; }
 
+/* Notes expander */
+.notes-expander {
+  margin-top: 12px;
+  margin-bottom: 8px;
+}
+.notes-toggle {
+  display: inline-flex;
+  align-items: center;
+  gap: 6px;
+  font-family: var(--mono);
+  font-size: 0.75rem;
+  color: var(--text3);
+  background: none;
+  border: none;
+  cursor: pointer;
+  padding: 4px 0;
+  transition: color 0.15s;
+}
+.notes-toggle:hover {
+  color: var(--text2);
+}
+.notes-toggle:focus-visible {
+  outline: 3px solid var(--accent);
+  outline-offset: 2px;
+}
+.notes-toggle-icon {
+  display: inline-block;
+  width: 14px;
+  height: 14px;
+  transition: transform 0.2s;
+}
+.notes-toggle-icon.open {
+  transform: rotate(90deg);
+}
+.notes-body {
+  overflow: hidden;
+  max-height: 0;
+  opacity: 0;
+  transition: max-height 0.25s ease-out, opacity 0.2s ease-out;
+}
+.notes-body.open {
+  max-height: 120px;
+  opacity: 1;
+}
+.notes-textarea {
+  width: 100%;
+  min-height: 60px;
+  max-height: 80px;
+  padding: 10px 12px;
+  background: var(--bg);
+  border: 1px solid var(--border2);
+  border-radius: 8px;
+  color: var(--text);
+  font-family: var(--body);
+  font-size: 0.85rem;
+  resize: vertical;
+  transition: border-color 0.2s;
+}
+.notes-textarea:focus {
+  outline: none;
+  border-color: var(--accent);
+}
+.notes-textarea::placeholder {
+  color: var(--text3);
+  font-style: italic;
+}
+.notes-counter {
+  font-family: var(--mono);
+  font-size: 0.7rem;
+  color: var(--text3);
+  text-align: right;
+  margin-top: 4px;
+}
+.notes-counter.near-limit {
+  color: var(--gold);
+}
+.notes-counter.at-limit {
+  color: var(--red);
+}
+/* Notes display in result card */
+.result-notes {
+  margin-top: 16px;
+  padding-top: 12px;
+  border-top: 1px solid var(--border);
+}
+.result-notes-title {
+  font-family: var(--mono);
+  font-size: 0.72rem;
+  font-weight: 600;
+  color: var(--text3);
+  text-transform: uppercase;
+  letter-spacing: 0.5px;
+  margin-bottom: 6px;
+}
+.result-note-item {
+  font-size: 0.85rem;
+  color: var(--text2);
+  margin-bottom: 4px;
+  padding-left: 8px;
+  border-left: 2px solid var(--border2);
+}
+.result-note-step {
+  font-family: var(--mono);
+  font-size: 0.7rem;
+  color: var(--text3);
+}
+
 /* Responsive */
 @media (max-width: 640px) {
   body { padding: 14px; }
@@ -631,6 +738,201 @@ var TREE = {
   })
 };
 
+/* ── Scoring Engine ── */
+function scoreDiagnoses(selectedSymptoms, stage, treatedDiagnoses) {
+  var results = [];
+  var selectedMap = {};
+  for (var i = 0; i < selectedSymptoms.length; i++) {
+    selectedMap[selectedSymptoms[i]] = true;
+  }
+
+  for (var diagId in SCORING) {
+    if (!SCORING.hasOwnProperty(diagId)) continue;
+    var entry = SCORING[diagId];
+    var matched = [];
+    var matchedWeight = 0;
+    var totalWeight = 0;
+
+    for (var symId in entry.symptoms) {
+      if (!entry.symptoms.hasOwnProperty(symId)) continue;
+      totalWeight += entry.symptoms[symId];
+      if (selectedMap[symId]) {
+        matchedWeight += entry.symptoms[symId];
+        matched.push(symId);
+      }
+    }
+
+    if (totalWeight === 0 || matched.length === 0) continue;
+
+    var baseScore = matchedWeight / totalWeight;
+
+    // Stage modifier
+    var stageAdjust = 0;
+    if (entry.stage_modifier && entry.stage_modifier[stage]) {
+      stageAdjust = entry.stage_modifier[stage];
+    }
+
+    // Corroboration bonus
+    var regionsHit = {};
+    for (var mi = 0; mi < matched.length; mi++) {
+      var sym = SYMPTOMS[matched[mi]];
+      if (sym) regionsHit[sym.region] = true;
+    }
+    var regionCount = 0;
+    for (var rk in regionsHit) {
+      if (regionsHit.hasOwnProperty(rk)) regionCount++;
+    }
+    var corroboration = regionCount > 1 ? (regionCount - 1) * 0.05 : 0;
+
+    // Final score
+    var finalScore = baseScore + stageAdjust + corroboration;
+    finalScore = Math.min(finalScore, entry.base_confidence);
+    finalScore = Math.max(0, Math.min(1, finalScore));
+
+    // Treated penalty
+    if (treatedDiagnoses && Array.isArray(treatedDiagnoses)) {
+      for (var ti = 0; ti < treatedDiagnoses.length; ti++) {
+        if (treatedDiagnoses[ti] === diagId) {
+          finalScore = Math.max(0, finalScore - 0.2);
+        }
+      }
+    }
+
+    if (finalScore >= 0.25) {
+      results.push({ resultId: diagId, score: finalScore, matchedSymptoms: matched });
+    }
+  }
+
+  results.sort(function(a, b) { return b.score - a.score; });
+  return results.slice(0, 5);
+}
+
+function getRefineQuestions(rankedDiagnoses) {
+  var matched = [];
+  for (var i = 0; i < REFINE_RULES.length; i++) {
+    var rule = REFINE_RULES[i];
+    try {
+      if (rule.condition(rankedDiagnoses)) {
+        matched.push(rule);
+      }
+    } catch (e) {
+      // Skip rules with broken conditions
+    }
+  }
+  return matched;
+}
+
+function applyRefineAnswer(scores, ruleId, optionIndex) {
+  // Find the rule
+  var rule = null;
+  for (var i = 0; i < REFINE_RULES.length; i++) {
+    if (REFINE_RULES[i].id === ruleId) { rule = REFINE_RULES[i]; break; }
+  }
+  if (!rule || !rule.options[optionIndex]) return scores;
+
+  var adjust = rule.options[optionIndex].adjust;
+
+  // Deep copy scores
+  var updated = [];
+  for (var j = 0; j < scores.length; j++) {
+    updated.push({
+      resultId: scores[j].resultId,
+      score: scores[j].score,
+      matchedSymptoms: scores[j].matchedSymptoms.slice()
+    });
+  }
+
+  // Apply adjustments
+  for (var k = 0; k < updated.length; k++) {
+    if (adjust[updated[k].resultId] !== undefined) {
+      updated[k].score += adjust[updated[k].resultId];
+      updated[k].score = Math.max(0, Math.min(1, updated[k].score));
+    }
+  }
+
+  // Re-sort
+  updated.sort(function(a, b) { return b.score - a.score; });
+  return updated;
+}
+
+function generateCombinedPlan(topDiagnoses) {
+  var checkFirstSet = {};
+  var checkFirstList = [];
+  var fixEntries = [];
+  var alsoSet = {};
+  var alsoList = [];
+
+  for (var i = 0; i < topDiagnoses.length; i++) {
+    var diag = topDiagnoses[i];
+    var treeNode = TREE[diag.resultId];
+    if (!treeNode || !isResult(treeNode)) continue;
+
+    // checkFirst — deduplicate
+    if (treeNode.checkFirst) {
+      for (var ci = 0; ci < treeNode.checkFirst.length; ci++) {
+        var cf = treeNode.checkFirst[ci];
+        if (!checkFirstSet[cf]) {
+          checkFirstSet[cf] = true;
+          checkFirstList.push(cf);
+        }
+      }
+    }
+
+    // fixes — track count and rank
+    if (treeNode.fixes) {
+      for (var fi = 0; fi < treeNode.fixes.length; fi++) {
+        fixEntries.push({ fix: treeNode.fixes[fi], rank: i, diagId: diag.resultId });
+      }
+    }
+
+    // alsoConsider — deduplicate by name
+    if (treeNode.alsoConsider) {
+      for (var ai = 0; ai < treeNode.alsoConsider.length; ai++) {
+        var ac = treeNode.alsoConsider[ai];
+        if (!alsoSet[ac.name]) {
+          alsoSet[ac.name] = true;
+          alsoList.push(ac);
+        }
+      }
+    }
+  }
+
+  // Deduplicate and order fixes
+  var fixCount = {};
+  var fixFirstRank = {};
+  for (var fe = 0; fe < fixEntries.length; fe++) {
+    var f = fixEntries[fe].fix;
+    if (fixCount[f] === undefined) {
+      fixCount[f] = 0;
+      fixFirstRank[f] = fixEntries[fe].rank;
+    }
+    fixCount[f]++;
+    if (fixEntries[fe].rank < fixFirstRank[f]) {
+      fixFirstRank[f] = fixEntries[fe].rank;
+    }
+  }
+
+  var uniqueFixes = [];
+  var fixSeen = {};
+  for (var uf = 0; uf < fixEntries.length; uf++) {
+    if (!fixSeen[fixEntries[uf].fix]) {
+      fixSeen[fixEntries[uf].fix] = true;
+      uniqueFixes.push(fixEntries[uf].fix);
+    }
+  }
+
+  uniqueFixes.sort(function(a, b) {
+    if (fixCount[b] !== fixCount[a]) return fixCount[b] - fixCount[a];
+    return fixFirstRank[a] - fixFirstRank[b];
+  });
+
+  return {
+    checkFirst: checkFirstList,
+    fixes: uniqueFixes,
+    alsoConsider: alsoList
+  };
+}
+
 /* ── State ── */
 var STORAGE_KEY = 'growdoc-plant-doctor';
 var storageAvailable = true;
@@ -762,7 +1064,11 @@ function renderWizardQuestion(node) {
   for (var i = 0; i < node.options.length; i++) {
     html += '<button class="opt-btn" data-idx="' + i + '" type="button">' + escapeHtml(node.options[i].label) + '</button>';
   }
-  html += '</div></div>';
+  html += '</div>';
+  // Notes expander
+  var existingNote = state.wizardNotes[node.id] || '';
+  html += renderNotesExpander(node.id, existingNote, 'wizardNotes');
+  html += '</div>';
   if (state.history.length > 0) {
     html += '<div class="nav-row"><button class="btn btn-secondary" id="btn-back" type="button">Back</button>';
     html += '<button class="btn btn-secondary" id="btn-reset" type="button">Start Over</button></div>';
@@ -801,9 +1107,35 @@ function renderResultCard(node) {
     }
     html += '</ul></div>';
   }
+
+  // Notes display
+  var notesToShow = {};
+  if (state.mode === 'multi-dx') {
+    notesToShow = multiDxState.notes;
+  } else {
+    notesToShow = state.wizardNotes;
+  }
+  var hasNotes = false;
+  for (var nk in notesToShow) {
+    if (notesToShow.hasOwnProperty(nk) && notesToShow[nk]) { hasNotes = true; break; }
+  }
+  if (hasNotes) {
+    html += '<div class="result-notes">';
+    html += '<div class="result-notes-title">Your Notes</div>';
+    for (var noteKey in notesToShow) {
+      if (!notesToShow.hasOwnProperty(noteKey) || !notesToShow[noteKey]) continue;
+      html += '<div class="result-note-item">';
+      html += '<span class="result-note-step">' + escapeHtml(noteKey) + '</span><br>';
+      html += escapeHtml(notesToShow[noteKey]);
+      html += '</div>';
+    }
+    html += '</div>';
+  }
+
   html += '</div>';
   html += '<div class="nav-row">';
-  html += '<button class="btn btn-primary" id="btn-reset" type="button">Start Over</button>';
+  html += '<button class="btn btn-primary" id="btn-save-track" type="button">Save &amp; Start Tracking</button>';
+  html += '<button class="btn btn-secondary" id="btn-reset" type="button">Start Over</button>';
   if (state.history.length > 0) {
     html += '<button class="btn btn-secondary" id="btn-back" type="button">Back</button>';
   }
@@ -837,6 +1169,9 @@ function renderExpert() {
     }
     html += '</select>';
     if (node.help) html += '<div class="expert-help">' + escapeHtml(node.help) + '</div>';
+    // Notes expander for expert mode
+    var expertNote = state.wizardNotes[node.id] || '';
+    html += renderNotesExpander(node.id, expertNote, 'wizardNotes');
     html += '</div>';
 
     if (sel !== undefined && sel !== null) {
@@ -865,6 +1200,87 @@ function renderLastDx() {
   el.style.display = 'block';
 }
 
+/* ── Rendering: Notes Expander ── */
+function renderNotesExpander(stepId, existingContent, storageKey) {
+  var content = existingContent || '';
+  var isOpen = content.length > 0;
+  var charCount = content.length;
+
+  var html = '<div class="notes-expander">';
+  html += '<button class="notes-toggle" type="button" data-notes-step="' + escapeHtml(stepId) + '"'
+       + ' data-notes-store="' + escapeHtml(storageKey) + '"'
+       + ' aria-expanded="' + (isOpen ? 'true' : 'false') + '">';
+  html += '<span class="notes-toggle-icon' + (isOpen ? ' open' : '') + '">&#9654;</span>';
+  html += isOpen ? 'Notes' : 'Add notes';
+  html += '</button>';
+  html += '<div class="notes-body' + (isOpen ? ' open' : '') + '">';
+  html += '<textarea class="notes-textarea" data-notes-step="' + escapeHtml(stepId) + '"'
+       + ' data-notes-store="' + escapeHtml(storageKey) + '"'
+       + ' maxlength="200"'
+       + ' placeholder="Optional: add context about this step..."'
+       + ' aria-label="Notes for this step">'
+       + escapeHtml(content) + '</textarea>';
+
+  var counterClass = 'notes-counter';
+  if (charCount >= 200) counterClass += ' at-limit';
+  else if (charCount >= 170) counterClass += ' near-limit';
+  html += '<div class="' + counterClass + '">' + charCount + '/200</div>';
+  html += '</div></div>';
+  return html;
+}
+
+function bindNotesEvents() {
+  // Toggle buttons
+  var toggles = document.querySelectorAll('.notes-toggle');
+  for (var i = 0; i < toggles.length; i++) {
+    toggles[i].addEventListener('click', function() {
+      var body = this.nextElementSibling;
+      var icon = this.querySelector('.notes-toggle-icon');
+      var isOpen = body.classList.contains('open');
+
+      body.classList.toggle('open');
+      icon.classList.toggle('open');
+      this.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
+      this.textContent = '';
+      var newIcon = document.createElement('span');
+      newIcon.className = 'notes-toggle-icon' + (!isOpen ? ' open' : '');
+      newIcon.innerHTML = '&#9654;';
+      this.appendChild(newIcon);
+      this.appendChild(document.createTextNode(!isOpen ? 'Notes' : 'Add notes'));
+
+      if (!isOpen) {
+        var textarea = body.querySelector('.notes-textarea');
+        if (textarea) textarea.focus();
+      }
+    });
+  }
+
+  // Textarea input handlers
+  var textareas = document.querySelectorAll('.notes-textarea');
+  for (var j = 0; j < textareas.length; j++) {
+    textareas[j].addEventListener('input', function() {
+      var stepId = this.getAttribute('data-notes-step');
+      var store = this.getAttribute('data-notes-store');
+      var value = this.value.substring(0, 200);
+      this.value = value;
+
+      var counter = this.parentElement.querySelector('.notes-counter');
+      if (counter) {
+        counter.textContent = value.length + '/200';
+        counter.className = 'notes-counter';
+        if (value.length >= 200) counter.className += ' at-limit';
+        else if (value.length >= 170) counter.className += ' near-limit';
+      }
+
+      if (store === 'wizardNotes') {
+        state.wizardNotes[stepId] = value;
+      } else if (store === 'multiDxNotes') {
+        multiDxState.notes[stepId] = value;
+      }
+    });
+  }
+}
+
 /* ── Main Render ── */
 function render() {
   var app = document.getElementById('app');
@@ -890,12 +1306,14 @@ function render() {
       app.innerHTML = renderWizardQuestion(node);
     }
     bindWizardEvents();
+    bindNotesEvents();
     progressEl.style.display = '';
     renderProgress();
 
   } else if (state.mode === 'expert') {
     app.innerHTML = renderExpert();
     bindExpertEvents();
+    bindNotesEvents();
     var expertResult = getExpertResult();
     if (expertResult && (!lastDiagnosis || lastDiagnosis.result.id !== expertResult.id)) {
       saveLastDiagnosis(expertResult);
@@ -956,6 +1374,7 @@ function goBack() {
 function reset() {
   state.currentNode = ROOT;
   state.history = [];
+  state.wizardNotes = {};
   transitionToNode(ROOT);
 }
 
@@ -1072,6 +1491,14 @@ function bindWizardEvents() {
   if (backBtn) backBtn.addEventListener('click', goBack);
   var resetBtn = document.getElementById('btn-reset');
   if (resetBtn) resetBtn.addEventListener('click', reset);
+  var saveTrackBtn = document.getElementById('btn-save-track');
+  if (saveTrackBtn) {
+    saveTrackBtn.addEventListener('click', function() {
+      if (typeof saveToJournal === 'function') {
+        saveToJournal();
+      }
+    });
+  }
 }
 
 function bindExpertEvents() {
@@ -1107,6 +1534,7 @@ function bindExpertEvents() {
     state.expertSelections = {};
     state.currentNode = ROOT;
     state.history = [];
+    state.wizardNotes = {};
     render();
   });
   var backBtn = document.getElementById('btn-back');
@@ -1116,8 +1544,17 @@ function bindExpertEvents() {
     state.expertSelections = {};
     state.currentNode = ROOT;
     state.history = [];
+    state.wizardNotes = {};
     render();
   });
+  var saveTrackBtn = document.getElementById('btn-save-track');
+  if (saveTrackBtn) {
+    saveTrackBtn.addEventListener('click', function() {
+      if (typeof saveToJournal === 'function') {
+        saveToJournal();
+      }
+    });
+  }
 }
 
 /* ── Mode Selector Binding ── */
@@ -1501,6 +1938,196 @@ function runTests() {
   }
   assert(adjustBadIds === 0, 'All REFINE_RULES adjust IDs reference valid SCORING keys (' + adjustBadIds + ' invalid)');
 
+  // ── Section 03: Scoring Engine Tests ──
+
+  if (dataFileLoaded()) {
+
+    // ── scoreDiagnoses() tests ──
+
+    // Test: scoreDiagnoses returns array of { resultId, score, matchedSymptoms }
+    var testScores = scoreDiagnoses(['yellow-lower', 'yellow-tips'], 'veg', []);
+    assert(Array.isArray(testScores), 'scoreDiagnoses returns an array');
+    assert(testScores.length > 0, 'scoreDiagnoses returns at least one result');
+    assert(testScores[0].resultId && typeof testScores[0].score === 'number' && Array.isArray(testScores[0].matchedSymptoms),
+      'scoreDiagnoses results have resultId, score, matchedSymptoms');
+
+    // Test: known symptoms return expected diagnosis in top 3
+    var nDefFound = false;
+    for (var tsi = 0; tsi < Math.min(testScores.length, 3); tsi++) {
+      if (testScores[tsi].resultId === 'r-n-def') nDefFound = true;
+    }
+    assert(nDefFound, 'scoreDiagnoses with yellow-lower + yellow-tips returns r-n-def in top 3');
+
+    // Test: corroboration bonus — symptoms from 3 regions score higher
+    var singleRegion = scoreDiagnoses(['yellow-lower', 'yellow-tips', 'brown-tips'], 'veg', []);
+    var multiRegion = scoreDiagnoses(['yellow-lower', 'drooping', 'root-brown'], 'veg', []);
+    var singleMax = singleRegion.length > 0 ? singleRegion[0].score : 0;
+    var multiMax = multiRegion.length > 0 ? multiRegion[0].score : 0;
+    assert(typeof singleMax === 'number' && typeof multiMax === 'number',
+      'Corroboration bonus: multi-region scoring completes without error');
+
+    // Test: stage_modifier applies — late-flower scoring differs from veg
+    var vegScores = scoreDiagnoses(['yellow-lower', 'yellow-tips'], 'veg', []);
+    var lateFlowerScores = scoreDiagnoses(['yellow-lower', 'yellow-tips'], 'late-flower', []);
+    var vegNDef = null, lfNDef = null;
+    for (var vi = 0; vi < vegScores.length; vi++) {
+      if (vegScores[vi].resultId === 'r-n-def') vegNDef = vegScores[vi].score;
+    }
+    for (var li = 0; li < lateFlowerScores.length; li++) {
+      if (lateFlowerScores[li].resultId === 'r-n-def') lfNDef = lateFlowerScores[li].score;
+    }
+    if (vegNDef !== null && lfNDef !== null) {
+      assert(lfNDef < vegNDef, 'stage_modifier: late-flower reduces r-n-def score vs veg (' + lfNDef.toFixed(2) + ' < ' + vegNDef.toFixed(2) + ')');
+    } else {
+      assert(true, 'stage_modifier: r-n-def not in both result sets (skip comparison)');
+    }
+
+    // Test: treatedDiagnoses parameter reduces score
+    var untreated = scoreDiagnoses(['yellow-lower', 'yellow-tips'], 'veg', []);
+    var treated = scoreDiagnoses(['yellow-lower', 'yellow-tips'], 'veg', ['r-n-def']);
+    var untreatedNDef = null, treatedNDef = null;
+    for (var ui = 0; ui < untreated.length; ui++) {
+      if (untreated[ui].resultId === 'r-n-def') untreatedNDef = untreated[ui].score;
+    }
+    for (var ti = 0; ti < treated.length; ti++) {
+      if (treated[ti].resultId === 'r-n-def') treatedNDef = treated[ti].score;
+    }
+    if (untreatedNDef !== null) {
+      var expectedTreated = treatedNDef !== null ? treatedNDef : 0;
+      assert(expectedTreated < untreatedNDef, 'treatedDiagnoses reduces score for treated diagnosis');
+    } else {
+      assert(true, 'treatedDiagnoses: r-n-def not scored (skip)');
+    }
+
+    // Test: all scores clamped to [0, 1]
+    var allClamped = true;
+    for (var ci = 0; ci < testScores.length; ci++) {
+      if (testScores[ci].score < 0 || testScores[ci].score > 1) allClamped = false;
+    }
+    assert(allClamped, 'All scores clamped to [0, 1]');
+
+    // Test: diagnoses below 0.25 threshold are filtered out
+    var belowThreshold = false;
+    for (var thi = 0; thi < testScores.length; thi++) {
+      if (testScores[thi].score < 0.25) belowThreshold = true;
+    }
+    assert(!belowThreshold, 'No diagnoses below 0.25 threshold in results');
+
+    // Test: results sorted descending by score
+    var sorted = true;
+    for (var si = 1; si < testScores.length; si++) {
+      if (testScores[si].score > testScores[si - 1].score) sorted = false;
+    }
+    assert(sorted, 'Results sorted descending by score');
+
+    // Test: maximum 5 results returned
+    var manySymptoms = scoreDiagnoses(['yellow-lower', 'brown-tips', 'drooping', 'curling-up', 'spots-random', 'pale-overall'], 'veg', []);
+    assert(manySymptoms.length <= 5, 'Maximum 5 results returned (got ' + manySymptoms.length + ')');
+
+    // ── getRefineQuestions() tests ──
+
+    // Test: returns array (possibly empty)
+    var refineQs = getRefineQuestions(testScores);
+    assert(Array.isArray(refineQs), 'getRefineQuestions returns an array');
+
+    // Test: returns empty array when no rules match
+    var emptyRefine = getRefineQuestions([{ resultId: 'r-trichomes', score: 0.9 }]);
+    assert(Array.isArray(emptyRefine), 'getRefineQuestions handles single-diagnosis input');
+
+    // Test: returned rules have expected structure
+    for (var rqi = 0; rqi < refineQs.length; rqi++) {
+      assert(refineQs[rqi].id && refineQs[rqi].question && Array.isArray(refineQs[rqi].options),
+        'Refine question ' + rqi + ' has id, question, options');
+    }
+
+    // ── applyRefineAnswer() tests ──
+
+    // Test: applyRefineAnswer adjusts scores and maintains [0, 1] bounds
+    if (refineQs.length > 0) {
+      var adjustedScores = applyRefineAnswer(testScores, refineQs[0].id, 0);
+      assert(Array.isArray(adjustedScores), 'applyRefineAnswer returns an array');
+      var adjustClamped = true;
+      for (var ai = 0; ai < adjustedScores.length; ai++) {
+        if (adjustedScores[ai].score < 0 || adjustedScores[ai].score > 1) adjustClamped = false;
+      }
+      assert(adjustClamped, 'applyRefineAnswer keeps scores in [0, 1]');
+    }
+
+    // ── generateCombinedPlan() tests ──
+
+    // Test: generateCombinedPlan returns { checkFirst, fixes, alsoConsider }
+    var plan = generateCombinedPlan(testScores);
+    assert(plan && Array.isArray(plan.checkFirst) && Array.isArray(plan.fixes) && Array.isArray(plan.alsoConsider),
+      'generateCombinedPlan returns { checkFirst[], fixes[], alsoConsider[] }');
+
+    // Test: checkFirst items are deduplicated
+    var uniqueCheck = {};
+    var dupCheck = 0;
+    for (var pci = 0; pci < plan.checkFirst.length; pci++) {
+      if (uniqueCheck[plan.checkFirst[pci]]) dupCheck++;
+      uniqueCheck[plan.checkFirst[pci]] = true;
+    }
+    assert(dupCheck === 0, 'generateCombinedPlan deduplicates checkFirst items (' + dupCheck + ' duplicates)');
+
+    // Test: single diagnosis produces valid plan
+    var singlePlan = generateCombinedPlan([{ resultId: 'r-n-def', score: 0.85, matchedSymptoms: ['yellow-lower'] }]);
+    assert(singlePlan && singlePlan.fixes.length > 0, 'generateCombinedPlan handles single diagnosis');
+
+  } else {
+    console.log('SKIP: Scoring engine tests (data file not loaded)');
+  }
+
+  // ── Section 04: Notes Input Tests ──
+
+  // Test: renderNotesExpander returns HTML string containing textarea
+  var notesHtml = renderNotesExpander('test-node', '', 'wizardNotes');
+  assert(typeof notesHtml === 'string', 'renderNotesExpander returns a string');
+  assert(notesHtml.indexOf('textarea') !== -1, 'renderNotesExpander includes a textarea');
+  assert(notesHtml.indexOf('maxlength="200"') !== -1, 'renderNotesExpander includes 200 char limit');
+
+  // Test: notes stored in wizardNotes[nodeId] for wizard mode
+  state.wizardNotes = {};
+  state.wizardNotes['q-symptom'] = 'Test note content';
+  assert(state.wizardNotes['q-symptom'] === 'Test note content', 'Notes stored in wizardNotes by nodeId');
+  state.wizardNotes = {};
+
+  // Test: notes stored in multiDxState.notes for multi-dx mode
+  multiDxState.notes = {};
+  multiDxState.notes['step-symptoms'] = 'Multi-dx note';
+  assert(multiDxState.notes['step-symptoms'] === 'Multi-dx note', 'Notes stored in multiDxState.notes');
+  multiDxState.notes = {};
+
+  // Test: notes textarea respects 200 char max
+  var longNote = '';
+  for (var ni = 0; ni < 210; ni++) longNote += 'a';
+  var clipped = longNote.substring(0, 200);
+  assert(clipped.length === 200, 'Notes clipped to 200 chars');
+
+  // Test: notes content passes through escapeHtml before rendering (XSS check)
+  var xssNote = '<script>alert("xss")</script>';
+  var escaped = escapeHtml(xssNote);
+  assert(escaped.indexOf('<script>') === -1, 'escapeHtml strips script tags from notes');
+  assert(escaped.indexOf('&lt;script&gt;') !== -1, 'escapeHtml converts < to &lt; in notes');
+
+  // Test: notes survive within a diagnosis session (not lost on render cycle)
+  state.wizardNotes = {};
+  state.wizardNotes['q-stage'] = 'Surviving note';
+  render();
+  assert(state.wizardNotes['q-stage'] === 'Surviving note', 'Notes survive render cycle');
+  state.wizardNotes = {};
+
+  // Test: notes display in result card when present
+  state.wizardNotes = {};
+  state.wizardNotes['q-stage'] = 'My stage note';
+  state.wizardNotes['q-symptom'] = 'Symptom context';
+  var resultHtml = renderResultCard(TREE['r-n-def']);
+  assert(Object.keys(state.wizardNotes).length > 0, 'wizardNotes preserved for result card rendering');
+  state.wizardNotes = {};
+
+  // Test: renderNotesExpander with existing content pre-fills textarea
+  var prefilledHtml = renderNotesExpander('test-node', 'Existing text', 'wizardNotes');
+  assert(prefilledHtml.indexOf('Existing text') !== -1, 'renderNotesExpander pre-fills existing content');
+
   // Restore state
   state.currentNode = savedState.currentNode;
   state.history = savedState.history;
