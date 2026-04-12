diff --git a/css/components.css b/css/components.css
index 7fadd8a..db215cd 100644
--- a/css/components.css
+++ b/css/components.css
@@ -661,3 +661,33 @@ h4 { font-size: 1rem; margin-bottom: var(--space-2); }
   border: 1px dashed var(--bg-elevated);
   border-radius: var(--radius-md);
 }
+
+.critical-error-banner {
+  position: fixed;
+  top: 0;
+  left: 0;
+  right: 0;
+  z-index: 10000;
+  display: flex;
+  align-items: center;
+  gap: var(--space-3);
+  padding: var(--space-3) var(--space-4);
+  background: var(--status-urgent);
+  color: #fff;
+  font-family: var(--font-body);
+  font-size: 0.9rem;
+}
+
+.critical-error-banner .dismiss-btn {
+  margin-left: auto;
+  background: none;
+  border: none;
+  color: #fff;
+  font-size: 1.2rem;
+  cursor: pointer;
+  padding: var(--space-1) var(--space-2);
+}
+
+.critical-error-banner .dismiss-btn:hover {
+  opacity: 0.7;
+}
diff --git a/js/components/debug-waterfall.js b/js/components/debug-waterfall.js
index 387c7db..5659a15 100644
--- a/js/components/debug-waterfall.js
+++ b/js/components/debug-waterfall.js
@@ -36,7 +36,7 @@ export function renderDebugWaterfall(mountEl) {
   closeBtn.textContent = '×';
   closeBtn.title = 'Close waterfall';
   closeBtn.addEventListener('click', () => {
-    try { sessionStorage.removeItem('growdoc-debug-notes'); } catch {}
+    try { sessionStorage.removeItem('growdoc-debug-notes'); } catch (err) { console.error('[debug-waterfall:session-clear]', err); }
     if (mountEl.parentNode) mountEl.parentNode.removeChild(mountEl);
   });
   mountEl.appendChild(closeBtn);
@@ -47,7 +47,7 @@ export function renderDebugWaterfall(mountEl) {
   mountEl.appendChild(title);
 
   let index;
-  try { index = getObservationIndex(); } catch { index = null; }
+  try { index = getObservationIndex(); } catch (err) { console.error('[debug-waterfall:observation-index]', err); index = null; }
   const all = (index && Array.isArray(index.all)) ? index.all.slice() : [];
 
   all.sort((a, b) => (Date.parse(b.observedAt) || 0) - (Date.parse(a.observedAt) || 0));
@@ -86,7 +86,7 @@ export function renderDebugWaterfall(mountEl) {
     try {
       const merged = mergeNoteContext([obs]);
       tdCtx.textContent = JSON.stringify(merged.ctx || {});
-    } catch { tdCtx.textContent = '—'; }
+    } catch (err) { console.error('[debug-waterfall:context]', err); tdCtx.textContent = '—'; }
     tr.appendChild(tdCtx);
 
     const tdWeight = document.createElement('td');
@@ -96,7 +96,7 @@ export function renderDebugWaterfall(mountEl) {
 
     const tdCited = document.createElement('td');
     let cites;
-    try { cites = getCitationsFor(obs.id); } catch { cites = []; }
+    try { cites = getCitationsFor(obs.id); } catch (err) { console.error('[debug-waterfall:citations]', err); cites = []; }
     tdCited.textContent = (Array.isArray(cites) && cites.length > 0) ? cites.join(', ') : '—';
     tr.appendChild(tdCited);
 
diff --git a/js/components/error-banner.js b/js/components/error-banner.js
new file mode 100644
index 0000000..4166f93
--- /dev/null
+++ b/js/components/error-banner.js
@@ -0,0 +1,65 @@
+export function showCriticalError(message) {
+  const existing = document.querySelector('.critical-error-banner');
+  if (existing) existing.remove();
+
+  const banner = document.createElement('div');
+  banner.className = 'critical-error-banner';
+  banner.innerHTML = `<span>\u26A0</span><span>${message}</span>`;
+
+  const btn = document.createElement('button');
+  btn.className = 'dismiss-btn';
+  btn.textContent = '\u2715';
+  btn.addEventListener('click', dismissError);
+  banner.appendChild(btn);
+
+  const shell = document.getElementById('app-shell');
+  const target = shell || document.body;
+  target.insertBefore(banner, target.firstChild);
+  target.style.paddingTop = banner.offsetHeight + 'px';
+}
+
+export function dismissError() {
+  const banner = document.querySelector('.critical-error-banner');
+  if (!banner) return;
+  banner.remove();
+  const shell = document.getElementById('app-shell');
+  const target = shell || document.body;
+  target.style.paddingTop = '';
+}
+
+export async function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  showCriticalError('test message');
+  assert(document.querySelector('.critical-error-banner') !== null, 'showCriticalError creates banner element');
+  assert(document.querySelector('.critical-error-banner').textContent.includes('test message'), 'banner contains the message text');
+  assert(document.querySelector('.critical-error-banner .dismiss-btn') !== null, 'banner has dismiss button');
+
+  dismissError();
+  assert(document.querySelector('.critical-error-banner') === null, 'dismissError removes banner');
+  const shell = document.getElementById('app-shell');
+  assert(!shell || shell.style.paddingTop === '', 'dismissError resets app-shell paddingTop');
+
+  showCriticalError('first');
+  showCriticalError('second');
+  const banners = document.querySelectorAll('.critical-error-banner');
+  assert(banners.length === 1, 'duplicate calls produce only one banner');
+  assert(banners[0].textContent.includes('second'), 'latest message wins');
+  dismissError();
+
+  const savedShell = document.getElementById('app-shell');
+  if (savedShell) savedShell.remove();
+  showCriticalError('no shell');
+  assert(document.querySelector('.critical-error-banner').parentNode === document.body, 'banner falls back to document.body when #app-shell missing');
+  dismissError();
+  if (savedShell) document.body.appendChild(savedShell);
+
+  document.querySelectorAll('.critical-error-banner').forEach(el => el.remove());
+  if (shell) shell.style.paddingTop = '';
+
+  return results;
+}
diff --git a/js/components/parsed-signal-strip.js b/js/components/parsed-signal-strip.js
index 963f4fa..ee2eb35 100644
--- a/js/components/parsed-signal-strip.js
+++ b/js/components/parsed-signal-strip.js
@@ -74,7 +74,8 @@ export function mountParsedSignalStrip(anchor, options = {}) {
       parseObservation(obs);
       const kws = (obs.parsed && Array.isArray(obs.parsed.keywords)) ? obs.parsed.keywords : [];
       renderChips(kws);
-    } catch (_err) {
+    } catch (err) {
+      console.error('[signal-strip:parse]', err);
       strip.innerHTML = '';
       delete strip.dataset.placeholder;
     }
diff --git a/js/components/recent-observations-widget.js b/js/components/recent-observations-widget.js
index 70fe6c3..cfe280b 100644
--- a/js/components/recent-observations-widget.js
+++ b/js/components/recent-observations-widget.js
@@ -31,7 +31,7 @@ export function mountRecentObservationsWidget(mountEl, activePlantId) {
 
   function refresh() {
     let index;
-    try { index = getObservationIndex(); } catch { index = null; }
+    try { index = getObservationIndex(); } catch (err) { console.error('[recent-obs:observation-index]', err); index = null; }
     const all = (index && Array.isArray(index.all)) ? index.all : [];
     const relevant = all
       .filter(o => o && o.plantId === activePlantId)
diff --git a/js/components/strain-picker.js b/js/components/strain-picker.js
index 90370cc..de92f5d 100644
--- a/js/components/strain-picker.js
+++ b/js/components/strain-picker.js
@@ -29,7 +29,7 @@ export function searchStrains(query, database) {
 function getCustomStrains() {
   try {
     return JSON.parse(localStorage.getItem('growdoc-companion-custom-strains') || '{}');
-  } catch { return {}; }
+  } catch (err) { console.error('[strain-picker:load]', err); return {}; }
 }
 
 /** Save custom strain to localStorage. */
diff --git a/js/components/task-card.js b/js/components/task-card.js
index ed50eb1..4cdd32e 100644
--- a/js/components/task-card.js
+++ b/js/components/task-card.js
@@ -145,7 +145,8 @@ export function renderTaskCard(container, task, options = {}) {
           if (store.state.ui?.activePlantId !== task.plantId) {
             store.commit('ui', { ...store.state.ui, activePlantId: task.plantId });
           }
-        } catch (_err) {
+        } catch (err) {
+          console.error('[task-card:citation]', err);
           // non-fatal — navigation still proceeds
         }
       });
diff --git a/js/components/task-engine-note-guards.js b/js/components/task-engine-note-guards.js
index f29226a..18c8777 100644
--- a/js/components/task-engine-note-guards.js
+++ b/js/components/task-engine-note-guards.js
@@ -52,7 +52,8 @@ export function checkRedundancy(taskType, plantObservations, now = Date.now()) {
   let matches;
   try {
     matches = findActionsTakenSince(plantObservations, taskType, windowHours);
-  } catch (_err) {
+  } catch (err) {
+    console.error('[note-guards:observation]', err);
     return { suppressed: false, obsIds: [], noteRef: null };
   }
 
@@ -211,5 +212,5 @@ export function overrideSuppression(store, _taskId, plantId, taskType) {
  * reaching into the private contextualizer module.
  */
 export function _getRuleErrors() {
-  try { return getObservationIndex().ruleErrors || []; } catch { return []; }
+  try { return getObservationIndex().ruleErrors || []; } catch (err) { console.error('[note-guards:rule-errors]', err); return []; }
 }
diff --git a/js/components/task-engine.js b/js/components/task-engine.js
index 8aacf74..d726c98 100644
--- a/js/components/task-engine.js
+++ b/js/components/task-engine.js
@@ -42,7 +42,8 @@ if (!_getBlockedActions || !_getActiveWarnings) {
     try {
       const mod = await import('../data/edge-case-knowledge.js');
       _EDGE_CASES = mod.EDGE_CASES || [];
-    } catch (_e) {
+    } catch (err) {
+      console.error('[task-engine:suppression-init]', err);
       _EDGE_CASES = [];
     }
     return _EDGE_CASES;
@@ -167,7 +168,8 @@ function _collectPlantObservations(grow, profile) {
       byPlant[obs.plantId].push(obs);
     }
     return byPlant;
-  } catch (_err) {
+  } catch (err) {
+    console.error('[task-engine:suppression]', err);
     return {};
   }
 }
@@ -310,7 +312,7 @@ export function evaluateTimeTriggers(plant, profile, existingTasks, plantObserva
         // Section-10: citation for suppressed-task trail.
         try {
           recordReferencedIn(check.obsIds, `task-engine:suppress:${t.type}:${t.plantId}`);
-        } catch (_err) { /* best-effort */ }
+        } catch (err) { console.error('[task-engine:citation-write]', err); }
       }
     }
   }
@@ -498,7 +500,7 @@ function evaluateDiagnoseTaskTriggers(plant, existingTasks, plantObservations =
     // Section-10: citation for diagnose-trigger trail.
     try {
       recordReferencedIn(alertTrigger.obsIds, `task-engine:diagnose-trigger:${plant.id}`);
-    } catch (_err) { /* best-effort */ }
+    } catch (err) { console.error('[task-engine:observation-record]', err); }
   }
   tasks.push(task);
   return tasks.filter(t => !isDuplicate(t, existingTasks));
@@ -616,7 +618,7 @@ export function evaluateEnvironmentTriggers(readings, profile, existingTasks, ob
         // Section-10: citation for env-discrepancy trail.
         try {
           recordReferencedIn([conflict.obsId], `task-engine:env-discrepancy:${plantId}`);
-        } catch (_err) { /* best-effort */ }
+        } catch (err) { console.error('[task-engine:observation-record-2]', err); }
         tasks.push(task);
       }
     }
@@ -993,7 +995,8 @@ export async function applyEdgeCaseSuppression(tasks, plant, grow) {
     }));
 
     return [...warningTasks, ...surviving];
-  } catch (_err) {
+  } catch (err) {
+    console.error('[task-engine:run-tests]', err);
     // Edge-case suppression must never crash the task engine.
     return tasks;
   }
diff --git a/js/components/timeline-bar.js b/js/components/timeline-bar.js
index 2619a76..0e9d0e2 100644
--- a/js/components/timeline-bar.js
+++ b/js/components/timeline-bar.js
@@ -237,7 +237,7 @@ export function renderStageDetail(container, stageId, options = {}) {
   if (Array.isArray(edgeCasesOpt)) {
     edgeCases = edgeCasesOpt;
   } else if (getActiveEdgeCases && plant) {
-    try { edgeCases = getActiveEdgeCases(plant) || []; } catch { edgeCases = []; }
+    try { edgeCases = getActiveEdgeCases(plant) || []; } catch (err) { console.error('[timeline-bar:edge-cases]', err); edgeCases = []; }
   }
 
   // Stage history for past variant
diff --git a/js/data/note-contextualizer/index.js b/js/data/note-contextualizer/index.js
index ad98e95..015b678 100644
--- a/js/data/note-contextualizer/index.js
+++ b/js/data/note-contextualizer/index.js
@@ -412,7 +412,8 @@ export function collectObservations(grow, profile, opts = {}) {
   // observations are grow-wide (no plantId) and carry source:'cure'.
   try {
     _walkCureTracker(out, createdAt);
-  } catch (_err) {
+  } catch (err) {
+    console.error('[contextualizer:init]', err);
     // Malformed localStorage → skip silently, never break projection.
   }
 
@@ -450,10 +451,10 @@ export function collectObservations(grow, profile, opts = {}) {
 function _walkCureTracker(out, createdAt) {
   if (typeof localStorage === 'undefined') return;
   let raw;
-  try { raw = localStorage.getItem('growdoc-cure-tracker'); } catch { return; }
+  try { raw = localStorage.getItem('growdoc-cure-tracker'); } catch (err) { console.error('[contextualizer:cure-read]', err); return; }
   if (!raw) return;
   let state;
-  try { state = JSON.parse(raw); } catch { return; }
+  try { state = JSON.parse(raw); } catch (err) { console.error('[contextualizer:cure-parse]', err); return; }
   if (!state || typeof state !== 'object') return;
 
   const curingLogs = Array.isArray(state.curingLogs) ? state.curingLogs : [];
@@ -520,10 +521,10 @@ function computeHash(grow, profile) {
     }
   }
   const growJson = (() => {
-    try { return JSON.stringify(grow); } catch { return ''; }
+    try { return JSON.stringify(grow); } catch (err) { console.error('[contextualizer:grow-serialize]', err); return ''; }
   })();
   const profileJson = (() => {
-    try { return JSON.stringify(profile); } catch { return ''; }
+    try { return JSON.stringify(profile); } catch (err) { console.error('[contextualizer:profile-serialize]', err); return ''; }
   })();
   // Section-09: cure-tracker state participates in the hash so cure-only
   // edits invalidate the cache even though the cure tracker has no store
@@ -534,7 +535,7 @@ function computeHash(grow, profile) {
       const raw = localStorage.getItem('growdoc-cure-tracker') || '';
       cureDigest = raw.length + ':' + stringHash(raw);
     }
-  } catch { /* ignore */ }
+  } catch (err) { console.error('[contextualizer:subscribe]', err); }
   return [
     plantCount,
     taskCount,
diff --git a/js/data/note-contextualizer/rules-advice.js b/js/data/note-contextualizer/rules-advice.js
index ec88b0c..02aebb9 100644
--- a/js/data/note-contextualizer/rules-advice.js
+++ b/js/data/note-contextualizer/rules-advice.js
@@ -464,7 +464,8 @@ function _recordRuleError(ruleId, err) {
         source: 'advice',
       });
     }
-  } catch {
+  } catch (err) {
+    console.error('[rules-advice:test]', err);
     // Swallow — index may be unavailable in tests.
   }
 }
diff --git a/js/data/note-contextualizer/rules-score.js b/js/data/note-contextualizer/rules-score.js
index 0f5a24c..0a054a8 100644
--- a/js/data/note-contextualizer/rules-score.js
+++ b/js/data/note-contextualizer/rules-score.js
@@ -334,7 +334,8 @@ function _recordRuleError(ruleId, err) {
         source: 'score-adjust',
       });
     }
-  } catch {
+  } catch (err) {
+    console.error('[rules-score:test]', err);
     // Index may be unavailable during tests — swallow.
   }
 }
diff --git a/js/main.js b/js/main.js
index 9263e3d..cc76d2b 100644
--- a/js/main.js
+++ b/js/main.js
@@ -25,6 +25,7 @@ import { renderJournal } from './views/journal.js';
 import { renderFinish } from './views/finish.js';
 import { preInitMigration, postInitMigration } from './migration.js';
 import { initContextualizer } from './data/note-contextualizer/index.js';
+import { showCriticalError } from './components/error-banner.js';
 
 let getActiveEdgeCases = () => [];
 let _enginePromise = null;
@@ -70,7 +71,11 @@ function initStore() {
   // unrelated keys. 300ms debounce window.
   const persistKeys = ['profile', 'grow', 'environment', 'archive', 'outcomes', 'ui'];
   for (const key of persistKeys) {
-    const debouncedSave = debounce(() => save(key, store.state[key]), 300);
+    const debouncedSave = debounce(() => {
+      if (!save(key, store.state[key])) {
+        showCriticalError('Data save failed \u2014 storage may be full');
+      }
+    }, 300);
     store.subscribe(key, () => debouncedSave());
   }
 
@@ -122,7 +127,7 @@ const viewMap = {
     let edgeCases = [];
     try {
       edgeCases = getActiveEdgeCases({ plant: currentPlant, grow });
-    } catch { /* engine not ready */ }
+    } catch (err) { console.error('[main:edge-case-timeline]', err); }
 
     // Stage detail panel target — populated by showDetail()
     const detailTarget = document.createElement('div');
@@ -250,7 +255,8 @@ function boot() {
       });
     }
   } catch (err) {
-    console.error('App initialization failed:', err);
+    console.error('[main:boot]', err);
+    showCriticalError('App failed to start \u2014 try reloading');
     showErrorScreen('Something went wrong during startup.');
   }
 }
@@ -350,7 +356,7 @@ function _hasBackupKeys() {
       const key = localStorage.key(i);
       if (key && key.startsWith('growdoc-companion-backup')) return true;
     }
-  } catch { /* ignore */ }
+  } catch (err) { console.error('[main:backup-check]', err); }
   return false;
 }
 
@@ -426,6 +432,7 @@ async function renderTestRunner(container) {
     { name: 'vpd-widget', path: './components/vpd-widget.js' },
     { name: 'feeding-calculator', path: './data/feeding-calculator.js' },
     { name: 'question-matcher', path: './data/question-matcher.js' },
+    { name: 'error-banner', path: './components/error-banner.js' },
     { name: 'lazy-loader', path: './tests/lazy-loader.test.js' },
     { name: 'timeline-bar', path: './components/timeline-bar.js' },
     { name: 'doctor-ui', path: './plant-doctor/doctor-ui.js' },
diff --git a/js/migration.js b/js/migration.js
index 24411fd..d784f77 100644
--- a/js/migration.js
+++ b/js/migration.js
@@ -21,6 +21,7 @@
 
 import { generateId } from './utils.js';
 import { save, load, LEGACY_KEYS, STORAGE_KEYS } from './storage.js';
+import { showCriticalError } from './components/error-banner.js';
 
 const V1_FLAG = 'growdoc-companion-migrated';
 const V2_FLAG = 'growdoc-companion-v2-migrated';
@@ -37,7 +38,8 @@ function _readLegacyKey(key) {
   try {
     const raw = localStorage.getItem(key);
     return raw ? JSON.parse(raw) : null;
-  } catch {
+  } catch (err) {
+    console.error('[migration:read-legacy]', err);
     return null;
   }
 }
@@ -47,7 +49,8 @@ function _backupLegacyKey(key) {
   if (val === null) return;
   try {
     localStorage.setItem(`growdoc-legacy-backup-${key}`, val);
-  } catch {
+  } catch (err) {
+    console.error('[migration:backup-legacy]', err);
     // Ignore backup failures — original key is still intact.
   }
 }
@@ -205,7 +208,8 @@ export function preInitMigration() {
 
     return { migrated: importedKeys.length > 0, keys: importedKeys };
   } catch (err) {
-    console.error('preInitMigration error:', err);
+    console.error('[migration:pre-init]', err);
+    showCriticalError('Data migration failed \u2014 your data may need recovery');
     return { migrated: false, reason: 'error', error: err.message };
   }
 }
diff --git a/js/photos.js b/js/photos.js
index 123c8ff..339cb72 100644
--- a/js/photos.js
+++ b/js/photos.js
@@ -31,7 +31,8 @@ function _readPhotos() {
   try {
     const raw = localStorage.getItem(PHOTOS_KEY);
     return raw ? JSON.parse(raw) : {};
-  } catch {
+  } catch (err) {
+    console.error('[photos:load]', err);
     return {};
   }
 }
@@ -145,7 +146,8 @@ export function checkPhotoQuota() {
       const parsed = JSON.parse(raw);
       count = Object.keys(parsed).length;
     }
-  } catch {
+  } catch (err) {
+    console.error('[photos:save]', err);
     // ignore
   }
   const percent = used / PHOTO_BUDGET_BYTES;
diff --git a/js/plant-doctor/doctor-engine.js b/js/plant-doctor/doctor-engine.js
index 822be29..79b909e 100644
--- a/js/plant-doctor/doctor-engine.js
+++ b/js/plant-doctor/doctor-engine.js
@@ -47,7 +47,8 @@ export function runDiagnosis(symptoms, context = {}) {
   if (context && context.ctx && typeof context.ctx === 'object') {
     try {
       adjustScoresFromNotes(scores, context.ctx);
-    } catch (_err) {
+    } catch (err) {
+      console.error('[doctor-engine:note-adjust]', err);
       // adjustScoresFromNotes is defensive; this catch is insurance only.
     }
   }
@@ -71,7 +72,7 @@ export function runDiagnosis(symptoms, context = {}) {
       if (obsIds.length > 0) {
         recordReferencedIn(obsIds, `plant-doctor:runDiagnosis:${context.plantId}`);
       }
-    } catch (_err) { /* citation write is best-effort */ }
+    } catch (err) { console.error('[doctor-engine:citation-write]', err); }
   }
 
   return results.slice(0, 10); // Top 10
@@ -132,7 +133,8 @@ export function buildContext(store) {
       });
       const merged = mergeNoteContext(observations);
       ctx = (merged && merged.ctx) || {};
-    } catch (_err) {
+    } catch (err) {
+      console.error('[doctor-engine:observation]', err);
       observations = [];
       ctx = {};
     }
diff --git a/js/plant-doctor/doctor-ui.js b/js/plant-doctor/doctor-ui.js
index d95f19c..06db0e4 100644
--- a/js/plant-doctor/doctor-ui.js
+++ b/js/plant-doctor/doctor-ui.js
@@ -38,7 +38,8 @@ if (!_ecGetBlockedActions || !_ecGetActiveEdgeCases) {
     try {
       const mod = await import('../data/edge-case-knowledge.js');
       _EDGE_CASES_DOCTOR = mod.EDGE_CASES || [];
-    } catch (_e) {
+    } catch (err) {
+      console.error('[doctor-ui:suppression-init]', err);
       _EDGE_CASES_DOCTOR = [];
     }
     return _EDGE_CASES_DOCTOR;
@@ -544,7 +545,8 @@ async function applyDoctorSuppression(advice, plant, grow) {
     });
 
     return { advice: kept, suppressed };
-  } catch (_err) {
+  } catch (err) {
+    console.error('[doctor-ui:suppression]', err);
     // Suppression must never crash the plant doctor.
     return { advice, suppressed: [] };
   }
diff --git a/js/router.js b/js/router.js
index 39a6590..5c307dd 100644
--- a/js/router.js
+++ b/js/router.js
@@ -133,7 +133,8 @@ function _handleRoute() {
 function _hasProfile() {
   try {
     return !!localStorage.getItem('growdoc-companion-profile');
-  } catch {
+  } catch (err) {
+    console.error('[router:hash-parse]', err);
     return false;
   }
 }
diff --git a/js/storage.js b/js/storage.js
index e4305b9..cef8423 100644
--- a/js/storage.js
+++ b/js/storage.js
@@ -57,7 +57,8 @@ export function save(key, data) {
         try {
           localStorage.setItem(storageKey, JSON.stringify(data));
           return true;
-        } catch {
+        } catch (err) {
+          console.error('[storage:save-retry]', err);
           // Still over quota
         }
       }
@@ -136,7 +137,8 @@ export function checkCapacity() {
         used += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
       }
     }
-  } catch {
+  } catch (err) {
+    console.error('[storage:capacity-read]', err);
     // If we can't read, estimate 0
   }
 
@@ -167,7 +169,8 @@ export function exportAllData() {
       if (raw === null) continue;
       try {
         data[key] = JSON.parse(raw);
-      } catch {
+      } catch (err) {
+        console.error('[storage:export-parse]', err);
         data[key] = raw;
       }
     }
@@ -311,7 +314,8 @@ export function checkQuota() {
         used += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
       }
     }
-  } catch {
+  } catch (err) {
+    console.error('[storage:quota-read]', err);
     // Ignore — return zero usage on read failure
   }
   const percent = used / QUOTA_BUDGET;
@@ -378,12 +382,14 @@ export function exportAll() {
       if (key && key.startsWith('growdoc-companion')) {
         try {
           data[key] = JSON.parse(localStorage.getItem(key));
-        } catch {
+        } catch (err) {
+          console.error('[storage:export-all-parse]', err);
           data[key] = localStorage.getItem(key);
         }
       }
     }
-  } catch {
+  } catch (err) {
+    console.error('[storage:export-all]', err);
     // Return what we have
   }
   return data;
@@ -400,7 +406,8 @@ export function clearArchive() {
     archive.shift();
     save('archive', archive);
     return true;
-  } catch {
+  } catch (err) {
+    console.error('[storage:clear-archive]', err);
     return false;
   }
 }
diff --git a/js/store.js b/js/store.js
index 14a3cc5..759f261 100644
--- a/js/store.js
+++ b/js/store.js
@@ -92,7 +92,8 @@ export function createStore(initialState = {}) {
       console.warn('structuredClone failed, falling back to JSON:', err);
       try {
         return JSON.parse(JSON.stringify(obj));
-      } catch {
+      } catch (err) {
+        console.error('[store:listener]', err);
         // Last-resort: return original. Callers should never hit this.
         return obj;
       }
diff --git a/js/views/dashboard.js b/js/views/dashboard.js
index ec5fe74..0bac3d2 100644
--- a/js/views/dashboard.js
+++ b/js/views/dashboard.js
@@ -131,7 +131,7 @@ export function renderStatusBanner(container, store) {
     if (alertObs.length > 0) {
       const obs = alertObs[0];
       // Section-10: citation for dashboard banner trail.
-      try { recordReferencedIn([obs.id], 'dashboard:statusBanner'); } catch { /* best-effort */ }
+      try { recordReferencedIn([obs.id], 'dashboard:statusBanner'); } catch (err) { console.error('[dashboard:observation-record]', err); }
       const noteBanner = document.createElement('div');
       noteBanner.className = 'status-banner-note';
       const raw = typeof obs.rawText === 'string' ? obs.rawText.trim() : '';
@@ -176,7 +176,7 @@ function _collectAlertObservations(store, opts) {
     if (idx && Array.isArray(idx.all) && idx.all.length > 0) {
       return _filterObs(idx.all, opts);
     }
-  } catch (_) { /* fall through */ }
+  } catch (err) { console.error('[dashboard:status-check]', err); }
 
   // Fallback: project on the fly (tests path).
   if (!store || !store.state) return [];
diff --git a/js/views/knowledge.js b/js/views/knowledge.js
index 08aad85..aea8553 100644
--- a/js/views/knowledge.js
+++ b/js/views/knowledge.js
@@ -102,7 +102,8 @@ async function loadScienceData() {
   try {
     const mod = await import('../data/knowledge-science.js');
     return mod.KNOWLEDGE_SCIENCE || null;
-  } catch {
+  } catch (err) {
+    console.error('[knowledge:load]', err);
     return null;
   }
 }
@@ -691,7 +692,8 @@ export function renderMythsView(container) {
           shareBtn.classList.remove('copied');
           shareBtn.childNodes[1].textContent = 'Copy link';
         }, 2000);
-      } catch {
+      } catch (err) {
+        console.error('[knowledge:deep-dive]', err);
         // Fallback: prompt
         window.prompt('Copy this link:', url);
       }
diff --git a/js/views/onboarding.js b/js/views/onboarding.js
index 8eba405..f6d97aa 100644
--- a/js/views/onboarding.js
+++ b/js/views/onboarding.js
@@ -149,7 +149,8 @@ export function renderOnboarding(container, store) {
         }
       }
     }
-  } catch {
+  } catch (err) {
+    console.error('[onboarding:guard]', err);
     // If anything fails, fall through and run the wizard
   }
 
@@ -735,7 +736,7 @@ function _completeOnboarding({ skipNavigate = false } = {}) {
   // 5. Also persist profile key for router's first-visit detection
   try {
     localStorage.setItem('growdoc-companion-profile', JSON.stringify(profile));
-  } catch { /* handled by store auto-save */ }
+  } catch (err) { console.error('[onboarding:save]', err); }
 
   // 6. Redirect to dashboard
   if (!skipNavigate) navigate('/dashboard');
