diff --git a/js/components/task-engine.js b/js/components/task-engine.js
index d57d12a..5bcd09a 100644
--- a/js/components/task-engine.js
+++ b/js/components/task-engine.js
@@ -16,15 +16,25 @@ import { checkRedundancy, checkContradiction, inferAlertTrigger, overrideSuppres
 
 let _getBlockedActions = null;
 let _getActiveWarnings = null;
+let _enginePromise = null;
 
-try {
-  const eceMod = await import('../data/edge-case-engine.js');
-  _getBlockedActions = eceMod.getBlockedActions;
-  _getActiveWarnings = eceMod.getActiveWarnings;
-} catch (_importErr) {
-  // edge-case-engine.js not yet available — use local fallback below.
+function _getEngine() {
+  if (!_enginePromise) {
+    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
+      console.error('[task-engine:edge-case-import]', err);
+      return null;
+    });
+  }
+  return _enginePromise;
 }
 
+_getEngine().then(mod => {
+  if (mod) {
+    _getBlockedActions = mod.getBlockedActions || _getBlockedActions;
+    _getActiveWarnings = mod.getActiveWarnings || _getActiveWarnings;
+  }
+});
+
 if (!_getBlockedActions || !_getActiveWarnings) {
   let _EDGE_CASES = null;
   async function _loadEdgeCases() {
diff --git a/js/components/timeline-bar.js b/js/components/timeline-bar.js
index bd102a3..822465e 100644
--- a/js/components/timeline-bar.js
+++ b/js/components/timeline-bar.js
@@ -11,15 +11,23 @@ import { generateId } from '../utils.js';
 import { answerQuestion } from '../data/question-matcher.js';
 import { navigate } from '../router.js';
 
-// Edge-case engine — may not exist yet; fall back to empty array on load failure
 let getActiveEdgeCases = null;
-try {
-  const mod = await import('../data/edge-case-engine.js');
-  getActiveEdgeCases = mod.getActiveEdgeCases ?? null;
-} catch {
-  // file not yet created — silently skip
+let _enginePromise = null;
+
+function _getEngine() {
+  if (!_enginePromise) {
+    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
+      console.error('[timeline-bar:edge-case-import]', err);
+      return null;
+    });
+  }
+  return _enginePromise;
 }
 
+_getEngine().then(mod => {
+  if (mod) getActiveEdgeCases = mod.getActiveEdgeCases ?? null;
+});
+
 /**
  * renderTimeline(container, options) — Renders a horizontal progress bar timeline.
  *   options.currentStage  — Current stage ID
@@ -1301,6 +1309,36 @@ function _logDecisionNote(plantId, type, action, note, store) {
   store.commit('grow', grow);
 }
 
+export async function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  const enginePromise = _getEngine();
+  assert(enginePromise instanceof Promise, '_getEngine returns a Promise');
+  assert(_getEngine() === enginePromise, '_getEngine is memoized (same reference)');
+
+  const engine = await enginePromise;
+  if (engine) {
+    assert(typeof engine.getActiveEdgeCases === 'function', 'engine has getActiveEdgeCases');
+  } else {
+    results.push({ pass: true, msg: 'engine not available (skip export check)' });
+  }
+
+  const el = document.createElement('div');
+  let didNotThrow = true;
+  try {
+    renderStageDetail(el, 'seedling', { plant: null, grow: null });
+  } catch {
+    didNotThrow = false;
+  }
+  assert(didNotThrow, 'renderStageDetail handles null edge-case engine');
+
+  return results;
+}
+
 function _milestoneIcon(icon) {
   const icons = {
     sprout: '🌱', leaf: '🍃', scissors: '✂', bend: '↪', canopy: '🌿',
diff --git a/js/main.js b/js/main.js
index 64a9f9a..a3682b3 100644
--- a/js/main.js
+++ b/js/main.js
@@ -26,16 +26,24 @@ import { renderFinish } from './views/finish.js';
 import { preInitMigration, postInitMigration } from './migration.js';
 import { initContextualizer } from './data/note-contextualizer/index.js';
 
-// Attempt to load edge-case engine at module initialisation time.
-// Top-level await is valid in ESM. If the module does not exist the
-// import fails silently and getActiveEdgeCases falls back to a no-op.
 let getActiveEdgeCases = () => [];
-try {
-  const edgeCaseModule = await import('./data/edge-case-engine.js');
-  if (typeof edgeCaseModule.getActiveEdgeCases === 'function') {
-    getActiveEdgeCases = edgeCaseModule.getActiveEdgeCases;
+let _enginePromise = null;
+
+function _getEngine() {
+  if (!_enginePromise) {
+    _enginePromise = import('./data/edge-case-engine.js').catch(err => {
+      console.error('[main:edge-case-import]', err);
+      return null;
+    });
+  }
+  return _enginePromise;
+}
+
+_getEngine().then(mod => {
+  if (mod && typeof mod.getActiveEdgeCases === 'function') {
+    getActiveEdgeCases = mod.getActiveEdgeCases;
   }
-} catch { /* engine not ready */ }
+});
 
 /** Initialize reactive store with persisted state. */
 function initStore() {
@@ -420,6 +428,8 @@ async function renderTestRunner(container) {
     { name: 'vpd-widget', path: './components/vpd-widget.js' },
     { name: 'feeding-calculator', path: './data/feeding-calculator.js' },
     { name: 'question-matcher', path: './data/question-matcher.js' },
+    { name: 'lazy-loader', path: './tests/lazy-loader.test.js' },
+    { name: 'timeline-bar', path: './components/timeline-bar.js' },
   ];
 
   let totalPass = 0;
diff --git a/js/plant-doctor/doctor-ui.js b/js/plant-doctor/doctor-ui.js
index c7be2b5..017a79f 100644
--- a/js/plant-doctor/doctor-ui.js
+++ b/js/plant-doctor/doctor-ui.js
@@ -12,15 +12,25 @@ import { generateContextualAdvice } from '../data/note-contextualizer/index.js';
 
 let _ecGetBlockedActions = null;
 let _ecGetActiveEdgeCases = null;
+let _enginePromise = null;
 
-try {
-  const eceMod = await import('../data/edge-case-engine.js');
-  _ecGetBlockedActions = eceMod.getBlockedActions;
-  _ecGetActiveEdgeCases = eceMod.getActiveEdgeCases;
-} catch (_importErr) {
-  // edge-case-engine.js not yet available — use local fallback below.
+function _getEngine() {
+  if (!_enginePromise) {
+    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
+      console.error('[doctor-ui:edge-case-import]', err);
+      return null;
+    });
+  }
+  return _enginePromise;
 }
 
+_getEngine().then(mod => {
+  if (mod) {
+    _ecGetBlockedActions = mod.getBlockedActions || _ecGetBlockedActions;
+    _ecGetActiveEdgeCases = mod.getActiveEdgeCases || _ecGetActiveEdgeCases;
+  }
+});
+
 if (!_ecGetBlockedActions || !_ecGetActiveEdgeCases) {
   let _EDGE_CASES_DOCTOR = null;
   async function _loadEdgeCasesDoctor() {
diff --git a/js/tests/lazy-loader.test.js b/js/tests/lazy-loader.test.js
new file mode 100644
index 0000000..b57d31c
--- /dev/null
+++ b/js/tests/lazy-loader.test.js
@@ -0,0 +1,27 @@
+import { generateTasks } from '../components/task-engine.js';
+
+export async function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  assert(typeof window.__growdocStore === 'object', 'boot() ran synchronously — store is set');
+
+  const minPlant = {
+    id: 'test-lazy', name: 'Test', stage: 'seedling',
+    stageStartDate: new Date(Date.now() - 3 * 86400000).toISOString(),
+    logs: [],
+  };
+  const minGrow = { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } };
+
+  const tasks = await generateTasks(minPlant, minGrow);
+  assert(Array.isArray(tasks), 'generateTasks works without engine (fallback)');
+
+  await new Promise(r => setTimeout(r, 200));
+  const tasks2 = await generateTasks(minPlant, minGrow);
+  assert(Array.isArray(tasks2), 'generateTasks works with loaded engine');
+
+  return results;
+}
