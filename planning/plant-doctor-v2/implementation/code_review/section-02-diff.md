diff --git a/docs/tool-plant-doctor.html b/docs/tool-plant-doctor.html
index e0018be..f8873a3 100644
--- a/docs/tool-plant-doctor.html
+++ b/docs/tool-plant-doctor.html
@@ -41,20 +41,21 @@ body {
 h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-bottom: 4px; }
 .subtitle { font-size: 0.9rem; color: var(--text2); margin-bottom: 0; }
 
-/* Toggle switch */
-.toggle-wrap { display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-top: 4px; }
-.toggle-label { font-family: var(--mono); font-size: 0.78rem; color: var(--text2); cursor: pointer; }
-.toggle-track {
-  position: relative; width: 44px; height: 24px; background: var(--bg3); border: 1px solid var(--border2);
-  border-radius: 12px; cursor: pointer; transition: background 0.2s;
+/* Mode selector (segmented control) */
+.mode-selector {
+  display: flex; gap: 0; background: var(--bg3); border: 1px solid var(--border2);
+  border-radius: 8px; padding: 3px; flex-shrink: 0;
 }
-.toggle-track.active { background: var(--accent3); border-color: var(--accent2); }
-.toggle-thumb {
-  position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: var(--text2);
-  border-radius: 50%; transition: transform 0.2s, background 0.2s;
+.mode-btn {
+  font-family: var(--mono); font-size: 0.78rem; font-weight: 600; padding: 8px 16px;
+  border: none; border-radius: 6px; background: transparent; color: var(--text2);
+  cursor: pointer; min-height: 36px; transition: background 0.15s, color 0.15s; white-space: nowrap;
 }
-.toggle-track.active .toggle-thumb { transform: translateX(20px); background: var(--text); }
-.toggle-track:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
+.mode-btn:hover { background: rgba(143,184,86,0.08); color: var(--text); }
+.mode-btn.active { background: var(--accent3); color: var(--text); }
+.mode-btn:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
+.mode-btn[aria-disabled="true"] { opacity: 0.35; cursor: not-allowed; }
+.mode-btn[aria-disabled="true"]:hover { background: transparent; color: var(--text2); }
 
 /* Storage warning */
 .storage-warn {
@@ -191,9 +192,10 @@ h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--accent); margin-
     <h1>Plant Doctor</h1>
     <p class="subtitle">Interactive symptom diagnosis wizard</p>
   </div>
-  <div class="toggle-wrap">
-    <span class="toggle-label" id="toggle-text">Expert Mode</span>
-    <div class="toggle-track" id="expert-toggle" role="switch" aria-checked="false" aria-labelledby="toggle-text" tabindex="0"><div class="toggle-thumb"></div></div>
+  <div class="mode-selector" role="radiogroup" aria-label="Diagnosis mode">
+    <button class="mode-btn active" role="radio" aria-checked="true" data-mode="wizard" tabindex="0" type="button">Wizard</button>
+    <button class="mode-btn" role="radio" aria-checked="false" data-mode="expert" tabindex="-1" type="button">Expert</button>
+    <button class="mode-btn" role="radio" aria-checked="false" data-mode="multi-dx" tabindex="-1" type="button">Multi-Dx</button>
   </div>
 </div>
 
@@ -634,14 +636,49 @@ var STORAGE_KEY = 'growdoc-plant-doctor';
 var storageAvailable = true;
 
 var state = {
+  mode: 'wizard',
   currentNode: ROOT,
   history: [],
-  expertMode: false,
-  expertSelections: {}
+  expertSelections: {},
+  wizardNotes: {}
+};
+
+var multiDxState = {
+  stage: null,
+  selectedSymptoms: [],
+  notes: {},
+  refineStep: 0,
+  refineQuestions: [],
+  refineAnswers: [],
+  scores: {},
+  results: [],
+  phase: 'select'
+};
+
+var journalState = {
+  view: 'dashboard',
+  activeEntryId: null,
+  checkInData: {}
 };
 
 var lastDiagnosis = null;
 
+function resetMultiDxState() {
+  multiDxState.stage = null;
+  multiDxState.selectedSymptoms = [];
+  multiDxState.notes = {};
+  multiDxState.refineStep = 0;
+  multiDxState.refineQuestions = [];
+  multiDxState.refineAnswers = [];
+  multiDxState.scores = {};
+  multiDxState.results = [];
+  multiDxState.phase = 'select';
+}
+
+function dataFileLoaded() {
+  return typeof SYMPTOMS !== 'undefined' && typeof SCORING !== 'undefined' && typeof REFINE_RULES !== 'undefined';
+}
+
 /* ── Storage ── */
 function checkStorage() {
   try {
@@ -831,40 +868,54 @@ function renderLastDx() {
 /* ── Main Render ── */
 function render() {
   var app = document.getElementById('app');
-  if (state.expertMode) {
-    app.innerHTML = renderExpert();
-    bindExpertEvents();
-    var expertResult = getExpertResult();
-    if (expertResult && (!lastDiagnosis || lastDiagnosis.result.id !== expertResult.id)) {
-      saveLastDiagnosis(expertResult);
-      lastDiagnosis = { date: new Date().toISOString(), result: { id: expertResult.id, diagnosis: expertResult.diagnosis, severity: expertResult.severity, confidence: expertResult.confidence }, path: [] };
-      renderLastDx();
-    }
-    if (expertResult) {
-      setTimeout(function() { var rc = document.getElementById('result-card'); if (rc) rc.focus(); }, 50);
+  var progressEl = document.getElementById('progress');
+
+  if (journalState.view !== 'dashboard') {
+    progressEl.style.display = 'none';
+    if (typeof renderCheckIn === 'function') {
+      app.innerHTML = renderCheckIn();
     }
-  } else {
+    return;
+  }
+
+  if (state.mode === 'wizard') {
     var node = TREE[state.currentNode];
     if (isResult(node)) {
       app.innerHTML = renderResultCard(node);
       saveLastDiagnosis(node);
       lastDiagnosis = { date: new Date().toISOString(), result: { id: node.id, diagnosis: node.diagnosis, severity: node.severity, confidence: node.confidence }, path: state.history.concat([node.id]) };
       renderLastDx();
-      setTimeout(function() {
-        var rc = document.getElementById('result-card');
-        if (rc) rc.focus();
-      }, 50);
+      setTimeout(function() { var rc = document.getElementById('result-card'); if (rc) rc.focus(); }, 50);
     } else {
       app.innerHTML = renderWizardQuestion(node);
     }
     bindWizardEvents();
-  }
-  var progressEl = document.getElementById('progress');
-  if (state.expertMode) {
-    progressEl.style.display = 'none';
-  } else {
     progressEl.style.display = '';
     renderProgress();
+
+  } else if (state.mode === 'expert') {
+    app.innerHTML = renderExpert();
+    bindExpertEvents();
+    var expertResult = getExpertResult();
+    if (expertResult && (!lastDiagnosis || lastDiagnosis.result.id !== expertResult.id)) {
+      saveLastDiagnosis(expertResult);
+      lastDiagnosis = { date: new Date().toISOString(), result: { id: expertResult.id, diagnosis: expertResult.diagnosis, severity: expertResult.severity, confidence: expertResult.confidence }, path: [] };
+      renderLastDx();
+    }
+    if (expertResult) {
+      setTimeout(function() { var rc = document.getElementById('result-card'); if (rc) rc.focus(); }, 50);
+    }
+    progressEl.style.display = 'none';
+
+  } else if (state.mode === 'multi-dx') {
+    if (multiDxState.phase === 'select') {
+      app.innerHTML = typeof renderMultiDxSelect === 'function' ? renderMultiDxSelect() : '<p style="color:var(--text2);padding:24px;">Multi-Dx mode loading...</p>';
+    } else if (multiDxState.phase === 'refining') {
+      app.innerHTML = typeof renderMultiDxRefine === 'function' ? renderMultiDxRefine() : '';
+    } else if (multiDxState.phase === 'results') {
+      app.innerHTML = typeof renderMultiDxResults === 'function' ? renderMultiDxResults() : '';
+    }
+    progressEl.style.display = 'none';
   }
 }
 
@@ -908,12 +959,12 @@ function reset() {
   transitionToNode(ROOT);
 }
 
-function toggleExpertMode() {
-  state.expertMode = !state.expertMode;
-  var toggle = document.getElementById('expert-toggle');
-  if (state.expertMode) {
-    toggle.classList.add('active');
-    toggle.setAttribute('aria-checked', 'true');
+function setMode(mode) {
+  if (mode === 'multi-dx' && !dataFileLoaded()) return;
+  var prevMode = state.mode;
+  state.mode = mode;
+
+  if (prevMode === 'wizard' && mode === 'expert') {
     state.expertSelections = {};
     var currentId = ROOT;
     for (var i = 0; i < state.history.length; i++) {
@@ -927,13 +978,27 @@ function toggleExpertMode() {
         }
       }
     }
-  } else {
-    toggle.classList.remove('active');
-    toggle.setAttribute('aria-checked', 'false');
   }
+
+  if (mode === 'multi-dx') {
+    resetMultiDxState();
+  }
+
+  updateModeSelector();
   render();
 }
 
+function updateModeSelector() {
+  var buttons = document.querySelectorAll('.mode-btn');
+  for (var i = 0; i < buttons.length; i++) {
+    var btn = buttons[i];
+    var isActive = btn.getAttribute('data-mode') === state.mode;
+    if (isActive) { btn.classList.add('active'); } else { btn.classList.remove('active'); }
+    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
+    btn.setAttribute('tabindex', isActive ? '0' : '-1');
+  }
+}
+
 function expertSelect(nodeId, optionIdx, depth) {
   state.expertSelections[nodeId] = optionIdx;
   var currentId = ROOT;
@@ -1055,12 +1120,50 @@ function bindExpertEvents() {
   });
 }
 
-/* ── Toggle Binding ── */
-function bindToggle() {
-  var toggle = document.getElementById('expert-toggle');
-  toggle.addEventListener('click', toggleExpertMode);
-  toggle.addEventListener('keydown', function(e) {
-    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpertMode(); }
+/* ── Mode Selector Binding ── */
+function bindModeSelector() {
+  var container = document.querySelector('.mode-selector');
+  if (!container) return;
+
+  if (!dataFileLoaded()) {
+    var multiBtn = container.querySelector('[data-mode="multi-dx"]');
+    if (multiBtn) {
+      multiBtn.setAttribute('aria-disabled', 'true');
+      multiBtn.setAttribute('title', 'Data unavailable \u2014 load plant-doctor-data.js');
+    }
+  }
+
+  container.addEventListener('click', function(e) {
+    var btn = e.target.closest('.mode-btn');
+    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;
+    setMode(btn.getAttribute('data-mode'));
+  });
+
+  container.addEventListener('keydown', function(e) {
+    var modes = ['wizard', 'expert'];
+    if (dataFileLoaded()) modes.push('multi-dx');
+    var currentIdx = modes.indexOf(state.mode);
+    var newIdx = currentIdx;
+
+    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
+      e.preventDefault();
+      newIdx = (currentIdx + 1) % modes.length;
+    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
+      e.preventDefault();
+      newIdx = (currentIdx - 1 + modes.length) % modes.length;
+    } else if (e.key === 'Home') {
+      e.preventDefault();
+      newIdx = 0;
+    } else if (e.key === 'End') {
+      e.preventDefault();
+      newIdx = modes.length - 1;
+    } else {
+      return;
+    }
+
+    setMode(modes[newIdx]);
+    var newBtn = container.querySelector('[data-mode="' + modes[newIdx] + '"]');
+    if (newBtn) newBtn.focus();
   });
 }
 
@@ -1074,7 +1177,7 @@ function init() {
   }
   loadState();
   renderLastDx();
-  bindToggle();
+  bindModeSelector();
   render();
 }
 
@@ -1088,7 +1191,7 @@ function runTests() {
     else { failed++; console.error('FAIL:', msg); }
   }
 
-  var savedState = { currentNode: state.currentNode, history: state.history.slice(), expertMode: state.expertMode, expertSelections: JSON.parse(JSON.stringify(state.expertSelections)) };
+  var savedState = { currentNode: state.currentNode, history: state.history.slice(), mode: state.mode, expertSelections: JSON.parse(JSON.stringify(state.expertSelections)) };
   var savedDx = lastDiagnosis;
 
   // Test: tree traversal reaches result node for every valid path combination
@@ -1112,7 +1215,7 @@ function runTests() {
   transitionToNode = function(id) { state.currentNode = id; };
   state.history = [ROOT];
   state.currentNode = 'q-symptom';
-  state.expertMode = false;
+  state.mode = 'wizard';
   goBack();
   assert(state.currentNode === ROOT && state.history.length === 0, 'goBack() returns to previous question');
 
@@ -1123,15 +1226,15 @@ function runTests() {
   assert(state.currentNode === ROOT && state.history.length === 0, 'reset() clears history and returns to root');
   transitionToNode = _origTransition;
 
-  // Test: expert mode toggle preserves/restores wizard state
+  // Test: setMode preserves wizard state when switching to expert
   state.currentNode = 'q-symptom';
   state.history = [ROOT];
-  state.expertMode = false;
-  toggleExpertMode();
-  assert(state.expertMode === true, 'toggleExpertMode() enables expert mode');
+  state.mode = 'wizard';
+  setMode('expert');
+  assert(state.mode === 'expert', 'setMode(expert) sets mode to expert');
   var hasRootSel = state.expertSelections[ROOT] !== undefined;
-  toggleExpertMode();
-  assert(state.expertMode === false, 'toggleExpertMode() disables expert mode');
+  setMode('wizard');
+  assert(state.mode === 'wizard', 'setMode(wizard) sets mode to wizard');
   assert(hasRootSel, 'Expert mode populated selections from wizard history');
 
   // Test: dependent dropdowns in expert mode disable when parent unset
@@ -1201,6 +1304,84 @@ function runTests() {
     else localStorage.removeItem(STORAGE_KEY);
   } catch(e) { assert(false, 'Corrupted localStorage crashed: ' + e.message); }
 
+  // ── Section 02: State Machine & Mode Selector Tests ──
+
+  // Test: state.mode defaults to 'wizard'
+  assert(state.mode === 'wizard', 'state.mode defaults to wizard');
+
+  // Test: setMode('expert') updates state.mode
+  var _prevMode = state.mode;
+  setMode('expert');
+  assert(state.mode === 'expert', 'setMode(expert) updates state.mode');
+  setMode('wizard');
+  assert(state.mode === 'wizard', 'setMode(wizard) restores wizard mode');
+  state.mode = _prevMode;
+
+  // Test: setMode('multi-dx') updates state.mode and initializes multiDxState
+  setMode('multi-dx');
+  assert(state.mode === 'multi-dx', 'setMode(multi-dx) updates state.mode');
+  assert(multiDxState.phase === 'select', 'multiDxState initialized to select phase');
+  assert(Array.isArray(multiDxState.selectedSymptoms), 'multiDxState.selectedSymptoms is array');
+  assert(multiDxState.selectedSymptoms.length === 0, 'multiDxState.selectedSymptoms starts empty');
+  setMode('wizard');
+
+  // Test: mode selector element has role="radiogroup" with 3 role="radio" children
+  var modeGroup = document.querySelector('[role="radiogroup"]');
+  assert(modeGroup !== null, 'Mode selector has role=radiogroup');
+  var radios = modeGroup ? modeGroup.querySelectorAll('[role="radio"]') : [];
+  assert(radios.length === 3, 'Mode selector has 3 radio options (found ' + radios.length + ')');
+
+  // Test: aria-checked updates correctly on mode switch
+  setMode('expert');
+  var expertRadio = document.querySelector('[role="radio"][data-mode="expert"]');
+  assert(expertRadio && expertRadio.getAttribute('aria-checked') === 'true', 'Expert radio has aria-checked=true when active');
+  var wizardRadio = document.querySelector('[role="radio"][data-mode="wizard"]');
+  assert(wizardRadio && wizardRadio.getAttribute('aria-checked') === 'false', 'Wizard radio has aria-checked=false when inactive');
+  setMode('wizard');
+
+  // Test: if SYMPTOMS is undefined, multi-dx tab is disabled
+  var multiDxRadio = document.querySelector('[role="radio"][data-mode="multi-dx"]');
+  if (typeof SYMPTOMS === 'undefined') {
+    assert(multiDxRadio && multiDxRadio.getAttribute('aria-disabled') === 'true', 'Multi-Dx disabled when SYMPTOMS undefined');
+  } else {
+    assert(multiDxRadio && multiDxRadio.getAttribute('aria-disabled') !== 'true', 'Multi-Dx enabled when SYMPTOMS defined');
+  }
+
+  // Test: mode switch preserves wizard history when switching to expert
+  state.mode = 'wizard';
+  state.currentNode = 'q-symptom';
+  state.history = [ROOT];
+  setMode('expert');
+  assert(state.expertSelections[ROOT] !== undefined, 'Expert mode populated selections from wizard history on switch');
+  setMode('wizard');
+  state.currentNode = ROOT;
+  state.history = [];
+
+  // Test: mode switch to multi-dx resets multiDxState
+  setMode('multi-dx');
+  multiDxState.selectedSymptoms = ['yellow-lower'];
+  multiDxState.phase = 'results';
+  setMode('wizard');
+  setMode('multi-dx');
+  assert(multiDxState.phase === 'select', 'Switching to multi-dx resets phase to select');
+  assert(multiDxState.selectedSymptoms.length === 0, 'Switching to multi-dx resets selectedSymptoms');
+  setMode('wizard');
+
+  // Test: render() dispatches to correct renderer based on state.mode
+  setMode('wizard');
+  render();
+  var wizardContent = document.getElementById('app').innerHTML;
+  setMode('expert');
+  render();
+  var expertContent = document.getElementById('app').innerHTML;
+  assert(wizardContent !== expertContent, 'render() produces different output for wizard vs expert');
+  setMode('wizard');
+  render();
+
+  // Test: journalState defaults are correct
+  assert(journalState.view === 'dashboard', 'journalState.view defaults to dashboard');
+  assert(journalState.activeEntryId === null, 'journalState.activeEntryId defaults to null');
+
   // ── Section 01: Knowledge Base Data File Tests ──
 
   // Test: SYMPTOMS is defined and is an object with at least 25 entries
@@ -1320,7 +1501,7 @@ function runTests() {
   // Restore state
   state.currentNode = savedState.currentNode;
   state.history = savedState.history;
-  state.expertMode = savedState.expertMode;
+  state.mode = savedState.mode;
   state.expertSelections = savedState.expertSelections;
   lastDiagnosis = savedDx;
   render();
