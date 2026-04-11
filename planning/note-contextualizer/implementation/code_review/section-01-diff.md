diff --git a/js/data/note-contextualizer/index.js b/js/data/note-contextualizer/index.js
new file mode 100644
index 0000000..5e3fa0b
--- /dev/null
+++ b/js/data/note-contextualizer/index.js
@@ -0,0 +1,408 @@
+// GrowDoc Companion — Note Contextualizer (public API, section-01)
+//
+// Pure projection over every existing note source in GrowDoc state.
+// No serialization — Observations are built on demand and cached in
+// a module-scoped singleton invalidated by a cheap composite hash.
+//
+// Stubs in this section: `parseObservation` (empty parsed) and
+// `mergeNoteContext` (empty ctx) — real implementations land in
+// sections 03 and 04 respectively.
+
+import {
+  mergeNoteContext as _mergeNoteContext,
+  getRelevantObservations as _getRelevantObservations,
+  findActionsTakenSince as _findActionsTakenSince,
+} from './merge.js';
+
+const INDEX_VERSION = 1;
+
+// ── Module state (singleton + sidecar) ─────────────────────────────
+/** @type {import('../observation-schema.js').ObservationIndex | null} */
+let cache = null;
+/** @type {Promise<import('../observation-schema.js').ObservationIndex> | null} */
+let rebuildInFlight = null;
+/** @type {Map<string, Set<string>>} obsId -> Set<consumerId> */
+const citations = new Map();
+let storeRef = null;
+let subscribed = false;
+let debounceTimer = null;
+
+// ── Severity mapping ──────────────────────────────────────────────
+const SEVERITY_DISPLAY = {
+  urgent: 'alert',
+  concern: 'watch',
+  // null / undefined / anything else -> 'info'
+};
+
+function mapSeverity(rawInput) {
+  if (rawInput === 'urgent' || rawInput === 'concern') {
+    return { severityRaw: rawInput, severity: SEVERITY_DISPLAY[rawInput] };
+  }
+  return { severityRaw: null, severity: 'info' };
+}
+
+// ── Deterministic string hash (FNV-1a 32-bit → hex) ───────────────
+function stringHash(str) {
+  let h = 0x811c9dc5;
+  for (let i = 0; i < str.length; i++) {
+    h ^= str.charCodeAt(i);
+    h = Math.imul(h, 0x01000193);
+  }
+  return (h >>> 0).toString(16).padStart(8, '0');
+}
+
+function makeObservationId(source, sourceRefId, rawText) {
+  return stringHash(`${source}:${sourceRefId ?? ''}:${rawText ?? ''}`);
+}
+
+function nowIso() {
+  return new Date().toISOString();
+}
+
+function isNonEmpty(s) {
+  return typeof s === 'string' && s.trim().length > 0;
+}
+
+// ── Stub parseObservation (real impl in section-03) ───────────────
+
+/**
+ * STUB (section-01). Assigns an empty `ParsedNote` to `obs.parsed`.
+ * Real KEYWORD_PATTERNS matching arrives in section-03. Must not throw.
+ * @param {import('../observation-schema.js').Observation} obs
+ * @returns {import('../observation-schema.js').Observation}
+ */
+export function parseObservation(obs) {
+  if (!obs) return obs;
+  obs.parsed = {
+    ctx: {},
+    observations: [],
+    actionsTaken: [],
+    questions: [],
+    keywords: [],
+    frankoOverrides: [],
+  };
+  return obs;
+}
+
+/**
+ * Stub bulk-parser — mutates and returns the same array for section-01.
+ * @param {import('../observation-schema.js').Observation[]} obsArr
+ */
+export function parseAllObservations(obsArr) {
+  if (!Array.isArray(obsArr)) return [];
+  for (const o of obsArr) parseObservation(o);
+  return obsArr;
+}
+
+// ── Pure projection walker ────────────────────────────────────────
+
+/**
+ * Walks grow + profile and emits Observation[]. Pure: no store access,
+ * no singleton reads, no side effects.
+ *
+ * @param {Object} grow
+ * @param {Object} profile
+ * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
+ * @returns {import('../observation-schema.js').Observation[]}
+ */
+export function collectObservations(grow, profile, opts = {}) {
+  const out = [];
+  const createdAt = nowIso();
+
+  // 1. profile.notes — wizard-step free text
+  if (profile && profile.notes && typeof profile.notes === 'object') {
+    const profileObservedAt = profile.updatedAt || createdAt;
+    for (const [wizardStep, rawText] of Object.entries(profile.notes)) {
+      if (!isNonEmpty(rawText)) continue;
+      out.push({
+        id: makeObservationId('profile', wizardStep, rawText),
+        createdAt,
+        observedAt: profileObservedAt,
+        // no plantId, no sourceRefId for profile sources
+        source: 'profile',
+        wizardStep,
+        domains: [],
+        ...mapSeverity(null),
+        severityAutoInferred: false,
+        rawText,
+        parsed: null,
+        tags: [],
+      });
+    }
+  }
+
+  const plants = (grow && Array.isArray(grow.plants)) ? grow.plants : [];
+
+  for (const plant of plants) {
+    if (!plant || !plant.id) continue;
+
+    // 2. plant.notes
+    if (isNonEmpty(plant.notes)) {
+      const observedAt = plant.stageStartDate || plant.createdAt || createdAt;
+      out.push({
+        id: makeObservationId('plant', plant.id, plant.notes),
+        createdAt,
+        observedAt,
+        plantId: plant.id,
+        source: 'plant',
+        sourceRefId: plant.id,
+        domains: [],
+        ...mapSeverity(null),
+        severityAutoInferred: false,
+        rawText: plant.notes,
+        parsed: null,
+        tags: [],
+      });
+    }
+
+    // 3 + 5. plant.logs[*]
+    const logs = Array.isArray(plant.logs) ? plant.logs : [];
+    for (const log of logs) {
+      if (!log || !log.id) continue;
+      const notes = log.details && log.details.notes;
+      if (!isNonEmpty(notes)) continue;
+
+      const isStageTransition = log.type === 'stage-transition';
+      const source = isStageTransition ? 'stage-transition' : 'log';
+      const rawSeverity = log.details ? log.details.severity : null;
+      out.push({
+        id: makeObservationId(source, log.id, notes),
+        createdAt,
+        observedAt: log.timestamp || createdAt,
+        plantId: plant.id,
+        source,
+        sourceRefId: log.id,
+        domains: [],
+        ...mapSeverity(rawSeverity),
+        severityAutoInferred: false,
+        rawText: notes,
+        parsed: null,
+        tags: [],
+      });
+    }
+  }
+
+  // 4. grow.tasks[*]
+  const tasks = (grow && Array.isArray(grow.tasks)) ? grow.tasks : [];
+  for (const task of tasks) {
+    if (!task || !task.id) continue;
+    if (!isNonEmpty(task.notes)) continue;
+    out.push({
+      id: makeObservationId('task', task.id, task.notes),
+      createdAt,
+      observedAt: task.updatedAt || task.createdAt || createdAt,
+      plantId: task.plantId,
+      source: 'task',
+      sourceRefId: task.id,
+      domains: [],
+      ...mapSeverity(null),
+      severityAutoInferred: false,
+      rawText: task.notes,
+      parsed: null,
+      tags: [],
+    });
+  }
+
+  // Apply opts filters (domains/minSeverity pass-through in section-01)
+  let filtered = out;
+  if (opts.plantId) {
+    filtered = filtered.filter(o => o.plantId === opts.plantId);
+  }
+  if (opts.since) {
+    const sinceMs = Date.parse(opts.since);
+    if (!Number.isNaN(sinceMs)) {
+      filtered = filtered.filter(o => Date.parse(o.observedAt) >= sinceMs);
+    }
+  }
+  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
+    const wanted = new Set(opts.domains);
+    // Section-01 observations all have empty domains, so this returns []
+    filtered = filtered.filter(o => o.domains.some(d => wanted.has(d)));
+  }
+  if (typeof opts.limit === 'number' && opts.limit >= 0) {
+    filtered = filtered.slice(0, opts.limit);
+  }
+
+  return filtered;
+}
+
+// ── Cheap composite hash for staleness detection ──────────────────
+function computeHash(grow, profile) {
+  const plantCount = (grow && Array.isArray(grow.plants)) ? grow.plants.length : 0;
+  const taskCount = (grow && Array.isArray(grow.tasks)) ? grow.tasks.length : 0;
+  let logTotal = 0;
+  if (grow && Array.isArray(grow.plants)) {
+    for (const p of grow.plants) {
+      if (p && Array.isArray(p.logs)) logTotal += p.logs.length;
+    }
+  }
+  const growJson = (() => {
+    try { return JSON.stringify(grow); } catch { return ''; }
+  })();
+  const profileJson = (() => {
+    try { return JSON.stringify(profile); } catch { return ''; }
+  })();
+  return [
+    plantCount,
+    taskCount,
+    logTotal,
+    growJson.length,
+    profileJson.length,
+    profile && profile.updatedAt,
+    stringHash(growJson).slice(0, 4),
+    stringHash(profileJson).slice(0, 4),
+  ].join('|');
+}
+
+function buildIndex(grow, profile) {
+  const all = parseAllObservations(collectObservations(grow, profile));
+  const byPlant = {};
+  const byDomain = {};
+  for (const o of all) {
+    if (o.plantId) {
+      (byPlant[o.plantId] = byPlant[o.plantId] || []).push(o);
+    }
+    for (const d of o.domains) {
+      (byDomain[d] = byDomain[d] || []).push(o);
+    }
+  }
+  const index = {
+    version: INDEX_VERSION,
+    builtAt: nowIso(),
+    fromHash: computeHash(grow, profile),
+    byPlant,
+    byDomain,
+    all: Object.freeze(all),
+    ruleErrors: [],
+  };
+  return index;
+}
+
+function emptyIndex() {
+  return {
+    version: INDEX_VERSION,
+    builtAt: nowIso(),
+    fromHash: '',
+    byPlant: {},
+    byDomain: {},
+    all: Object.freeze([]),
+    ruleErrors: [],
+  };
+}
+
+// ── Store hook ────────────────────────────────────────────────────
+
+/**
+ * Idempotent store subscription. Subscribes a 300ms-debounced invalidator
+ * to both `grow` and `profile` commits. The invalidator clears the cache;
+ * the next `getObservationIndex()` call does the rebuild synchronously.
+ *
+ * @param {Object} store — createStore() instance from store.js
+ */
+export function initContextualizer(store) {
+  storeRef = store;
+  if (subscribed) return;
+  const invalidate = () => {
+    if (debounceTimer) clearTimeout(debounceTimer);
+    debounceTimer = setTimeout(() => {
+      cache = null;
+      debounceTimer = null;
+    }, 300);
+  };
+  store.subscribe('grow', invalidate);
+  store.subscribe('profile', invalidate);
+  subscribed = true;
+}
+
+/**
+ * Synchronous index accessor with hash-check rebuild. Safe to call
+ * before `initContextualizer` — returns an empty frozen index.
+ *
+ * @returns {import('../observation-schema.js').ObservationIndex}
+ */
+export function getObservationIndex() {
+  if (!storeRef) return emptyIndex();
+  const grow = storeRef.state.grow;
+  const profile = storeRef.state.profile;
+  const currentHash = computeHash(grow, profile);
+  if (cache && cache.fromHash === currentHash) return cache;
+  cache = buildIndex(grow, profile);
+  return cache;
+}
+
+/**
+ * Query helper. In section-01 this delegates to the `merge.js` helper,
+ * which applies plantId/since/domains/limit filters client-side.
+ * minSeverity is a pass-through until section-04.
+ *
+ * @param {Object} store
+ * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
+ */
+export function getRelevantObservations(store, opts = {}) {
+  if (store && store !== storeRef) storeRef = store;
+  const index = getObservationIndex();
+  return _getRelevantObservations(index.all, opts);
+}
+
+/**
+ * Re-export stubs so callers can import everything from index.js.
+ * Real bodies arrive in section-04.
+ */
+export function mergeNoteContext(observations) {
+  return _mergeNoteContext(observations);
+}
+
+export function findActionsTakenSince(observations, taskType, sinceHours) {
+  return _findActionsTakenSince(observations, taskType, sinceHours);
+}
+
+// ── Sidecar citations ─────────────────────────────────────────────
+
+/**
+ * Record that `consumerId` cited these observation IDs. The sidecar
+ * is a plain in-memory Map<obsId, Set<consumerId>> — not serialized.
+ *
+ * @param {string[]} obsIds
+ * @param {string}   consumerId
+ */
+export function recordReferencedIn(obsIds, consumerId) {
+  if (!Array.isArray(obsIds) || !consumerId) return;
+  for (const id of obsIds) {
+    if (!id) continue;
+    let set = citations.get(id);
+    if (!set) {
+      set = new Set();
+      citations.set(id, set);
+    }
+    set.add(consumerId);
+  }
+}
+
+/**
+ * Read consumers for an observation id.
+ * @param {string} obsId
+ * @returns {string[]}
+ */
+export function getCitationsFor(obsId) {
+  const set = citations.get(obsId);
+  return set ? Array.from(set) : [];
+}
+
+// ── Test helper ───────────────────────────────────────────────────
+
+/**
+ * Clears singleton cache, in-flight promise, sidecar, debounce timer
+ * and store reference. Tests MUST call this before each case so the
+ * module has no leaked state between runs.
+ */
+export function __resetForTests() {
+  cache = null;
+  rebuildInFlight = null;
+  citations.clear();
+  if (debounceTimer) {
+    clearTimeout(debounceTimer);
+    debounceTimer = null;
+  }
+  storeRef = null;
+  subscribed = false;
+}
diff --git a/js/data/note-contextualizer/merge.js b/js/data/note-contextualizer/merge.js
new file mode 100644
index 0000000..7ee0917
--- /dev/null
+++ b/js/data/note-contextualizer/merge.js
@@ -0,0 +1,50 @@
+// GrowDoc Companion — Note Contextualizer: merge & weighting (section-01 stubs)
+//
+// Real implementations land in section-04. These stubs exist so that
+// sections 03, 05, 07 can import stable names during incremental landing.
+
+/**
+ * STUB. Real merge logic arrives in section-04.
+ * @param {import('../observation-schema.js').Observation[]} _observations
+ * @returns {Object} empty ctx map
+ */
+export function mergeNoteContext(_observations) {
+  return {};
+}
+
+/**
+ * STUB. Real filtered query arrives in section-04's weighting pass.
+ * Section-01 uses a pass-through implementation so the public
+ * `getRelevantObservations` export in `index.js` can delegate here.
+ * @param {import('../observation-schema.js').Observation[]} observations
+ * @param {{plantId?:string, since?:string, domains?:string[], limit?:number, minSeverity?:string}} [opts]
+ * @returns {import('../observation-schema.js').Observation[]}
+ */
+export function getRelevantObservations(observations, opts = {}) {
+  if (!Array.isArray(observations)) return [];
+  let out = observations;
+  if (opts.plantId) out = out.filter(o => o.plantId === opts.plantId);
+  if (opts.since) {
+    const sinceMs = Date.parse(opts.since);
+    if (!Number.isNaN(sinceMs)) {
+      out = out.filter(o => Date.parse(o.observedAt) >= sinceMs);
+    }
+  }
+  if (Array.isArray(opts.domains) && opts.domains.length > 0) {
+    const wanted = new Set(opts.domains);
+    out = out.filter(o => Array.isArray(o.domains) && o.domains.some(d => wanted.has(d)));
+  }
+  // minSeverity is a pass-through in section-01 (real filter in section-04)
+  if (typeof opts.limit === 'number' && opts.limit >= 0) {
+    out = out.slice(0, opts.limit);
+  }
+  return out;
+}
+
+/**
+ * STUB. Real action-trace logic arrives in section-04.
+ * @returns {Array}
+ */
+export function findActionsTakenSince(_observations, _taskType, _sinceHours) {
+  return [];
+}
diff --git a/js/data/observation-schema.js b/js/data/observation-schema.js
new file mode 100644
index 0000000..6222329
--- /dev/null
+++ b/js/data/observation-schema.js
@@ -0,0 +1,68 @@
+// GrowDoc Companion — Observation Schema (JSDoc types only)
+//
+// Defines the shape of Observations produced by the Note Contextualizer
+// projection. This is a type-only module: no runtime exports. Every note
+// source in GrowDoc (logs, tasks, plant notes, profile wizard answers,
+// stage transitions, cure entries) is projected into one of these at
+// runtime by `collectObservations` in `note-contextualizer/index.js`.
+//
+// NOT serialized. No migration. The on-disk data shape is untouched.
+
+/**
+ * @typedef {('log'|'task'|'plant'|'profile'|'stage-transition'|'cure'|'wizard'|'override'|'plant-doctor')} ObservationSource
+ */
+
+/**
+ * @typedef {('nutrients'|'environment'|'pest'|'training'|'phenotype'|'aroma'|'root'|'watering'|'health'|'action-taken'|'question'|'timeline'|'cure-burp'|'cure-dry')} ObservationDomain
+ */
+
+/**
+ * @typedef {('urgent'|'concern'|null)} SeverityRaw  legacy on-disk enum
+ */
+
+/**
+ * @typedef {('alert'|'watch'|'info')} SeverityDisplay
+ */
+
+/**
+ * @typedef {Object} ParsedNote
+ * @property {Object}   ctx              extracted field map — filled in section-03
+ * @property {Array<{type:string,value:string}>} observations
+ * @property {Array<{type:string,value:string}>} actionsTaken
+ * @property {string[]} questions
+ * @property {string[]} keywords         KEYWORD_PATTERNS rule ids that fired
+ * @property {string[]} frankoOverrides  subset of keywords in FRANCO_OVERRIDE_RULE_IDS
+ */
+
+/**
+ * @typedef {Object} Observation
+ * @property {string}           id                    stable hash of source+sourceRefId+rawText
+ * @property {string}           createdAt             ISO
+ * @property {string}           observedAt            ISO; inferred from log.timestamp, plant.stageStartDate, or createdAt
+ * @property {string}           [plantId]             grow.plants[i].id; absent means grow-wide
+ * @property {ObservationSource} source
+ * @property {string}           [sourceRefId]         id of the parent entity; REQUIRED for every source except 'profile'
+ * @property {string}           [wizardStep]          'stage'|'medium'|'lighting'|'strain'|'space'|'priorities' — only when source==='profile'
+ * @property {string}           [stageAtObs]          inferred stage at observedAt
+ * @property {string}           [flowerWeek]          derived if stage in flower
+ * @property {ObservationDomain[]} domains
+ * @property {SeverityRaw}      severityRaw
+ * @property {SeverityDisplay}  severity
+ * @property {boolean}          severityAutoInferred
+ * @property {string}           rawText
+ * @property {(ParsedNote|null)} parsed               null ONLY if a rule closure threw
+ * @property {string[]}         tags
+ */
+
+/**
+ * @typedef {Object} ObservationIndex
+ * @property {number}   version
+ * @property {string}   builtAt
+ * @property {string}   fromHash        cheap digest of grow + profile for staleness detection
+ * @property {Object<string, Observation[]>} byPlant
+ * @property {Object<string, Observation[]>} byDomain
+ * @property {Observation[]} all
+ * @property {Array<{obsId:string, ruleId:string, error:string, timestamp:string}>} ruleErrors
+ */
+
+export {};
diff --git a/js/main.js b/js/main.js
index de5d2f0..3da025e 100644
--- a/js/main.js
+++ b/js/main.js
@@ -23,6 +23,7 @@ import { renderSettingsView } from './views/settings.js';
 import { renderJournal } from './views/journal.js';
 import { renderFinish } from './views/finish.js';
 import { preInitMigration, postInitMigration } from './migration.js';
+import { initContextualizer } from './data/note-contextualizer/index.js';
 
 /** Initialize reactive store with persisted state. */
 function initStore() {
@@ -141,6 +142,10 @@ document.addEventListener('DOMContentLoaded', () => {
     // Make store accessible for other modules
     window.__growdocStore = store;
 
+    // Note Contextualizer: subscribe to grow/profile commits so the
+    // Observation index invalidates on note edits. Idempotent.
+    initContextualizer(store);
+
     // Initialize sidebar
     renderSidebar(sidebar, store);
 
@@ -312,6 +317,7 @@ async function renderTestRunner(container) {
     { name: 'priority-system', path: './tests/priority-system.test.js' },
     { name: 'stage-timeline', path: './tests/stage-timeline.test.js' },
     { name: 'task-engine', path: './tests/task-engine.test.js' },
+    { name: 'note-contextualizer', path: './tests/note-contextualizer.test.js' },
     { name: 'dashboard', path: './views/dashboard.js' },
     { name: 'vpd-widget', path: './components/vpd-widget.js' },
     { name: 'feeding-calculator', path: './data/feeding-calculator.js' },
diff --git a/js/tests/note-contextualizer.test.js b/js/tests/note-contextualizer.test.js
new file mode 100644
index 0000000..c985d34
--- /dev/null
+++ b/js/tests/note-contextualizer.test.js
@@ -0,0 +1,317 @@
+// GrowDoc Companion — Note Contextualizer Tests (section-01)
+//
+// Covers the Observation schema, pure projection walker, singleton index,
+// store hook, sidecar citations, and test reset helper. Stubs for
+// parseObservation / mergeNoteContext are asserted to return empty shapes.
+
+import {
+  collectObservations,
+  parseObservation,
+  initContextualizer,
+  getObservationIndex,
+  getRelevantObservations,
+  mergeNoteContext,
+  findActionsTakenSince,
+  recordReferencedIn,
+  getCitationsFor,
+  __resetForTests,
+} from '../data/note-contextualizer/index.js';
+import { createStore } from '../store.js';
+
+const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
+
+function makeStore(initial = {}) {
+  return createStore({
+    profile: initial.profile || {},
+    grow: initial.grow || { plants: [], tasks: [] },
+    environment: { readings: [] },
+    archive: [],
+    outcomes: [],
+    ui: { sidebarCollapsed: false },
+  });
+}
+
+export async function runTests() {
+  const results = [];
+  const assert = (cond, msg) => {
+    results.push({ pass: !!cond, msg });
+    if (!cond) console.error(`FAIL: ${msg}`);
+  };
+
+  // 1 — Empty grow yields empty array
+  {
+    __resetForTests();
+    const out = collectObservations({}, {});
+    assert(Array.isArray(out) && out.length === 0, 'collectObservations: empty grow yields empty array');
+  }
+
+  // 2 — profile.notes walker
+  {
+    __resetForTests();
+    const profile = {
+      updatedAt: daysAgo(1),
+      notes: {
+        stage: 'wk3 veg',
+        medium: '',        // empty should be skipped
+        lighting: 'LED 400w',
+      },
+    };
+    const out = collectObservations({}, profile);
+    const steps = out.filter(o => o.source === 'profile').map(o => o.wizardStep).sort();
+    assert(out.length === 2, 'profile.notes: emits one obs per non-empty wizardStep');
+    assert(steps.join(',') === 'lighting,stage', 'profile.notes: wizardStep names correct');
+    assert(out.every(o => o.source === 'profile' && !o.sourceRefId), 'profile source has no sourceRefId');
+  }
+
+  // 3 — plant.notes walker
+  {
+    __resetForTests();
+    const grow = {
+      plants: [
+        { id: 'p1', notes: 'tall pheno', stageStartDate: daysAgo(5) },
+        { id: 'p2', notes: '' },
+        { id: 'p3', notes: 'yellowing' },
+      ],
+    };
+    const out = collectObservations(grow, {});
+    const plantObs = out.filter(o => o.source === 'plant');
+    assert(plantObs.length === 2, 'plant.notes: emits one obs per plant with non-empty notes');
+    assert(plantObs.every(o => o.sourceRefId === o.plantId), 'plant source: sourceRefId === plantId');
+  }
+
+  // 4 — plant.logs[*].details.notes walker + observedAt from log.timestamp
+  {
+    __resetForTests();
+    const ts = daysAgo(2);
+    const grow = {
+      plants: [{
+        id: 'p1',
+        logs: [
+          { id: 'l1', type: 'water', timestamp: ts, details: { notes: 'gave 500ml', severity: null } },
+          { id: 'l2', type: 'observation', timestamp: daysAgo(1), details: { notes: 'looks happy', severity: 'urgent' } },
+          { id: 'l3', type: 'water', timestamp: daysAgo(1), details: { notes: '' } },
+        ],
+      }],
+    };
+    const out = collectObservations(grow, {});
+    const logObs = out.filter(o => o.source === 'log');
+    assert(logObs.length === 2, 'logs: emits one obs per non-empty details.notes');
+    const l1 = logObs.find(o => o.sourceRefId === 'l1');
+    assert(l1 && l1.observedAt === ts, 'logs: observedAt == log.timestamp');
+    const l2 = logObs.find(o => o.sourceRefId === 'l2');
+    assert(l2 && l2.severityRaw === 'urgent' && l2.severity === 'alert', 'logs: urgent severity maps to alert');
+  }
+
+  // 5 — grow.tasks[*].notes walker
+  {
+    __resetForTests();
+    const grow = {
+      plants: [],
+      tasks: [
+        { id: 't1', plantId: 'p1', notes: 'topped today', updatedAt: daysAgo(1) },
+        { id: 't2', plantId: 'p2', notes: '' },
+      ],
+    };
+    const out = collectObservations(grow, {});
+    const taskObs = out.filter(o => o.source === 'task');
+    assert(taskObs.length === 1, 'tasks: emits one obs per non-empty task.notes');
+    assert(taskObs[0].plantId === 'p1', 'tasks: plantId from task.plantId');
+  }
+
+  // 6 — Stage-transition source
+  {
+    __resetForTests();
+    const grow = {
+      plants: [{
+        id: 'p1',
+        logs: [
+          { id: 'lx', type: 'stage-transition', timestamp: daysAgo(3), details: { notes: 'moved to flower' } },
+        ],
+      }],
+    };
+    const out = collectObservations(grow, {});
+    const st = out.find(o => o.source === 'stage-transition');
+    assert(st && st.sourceRefId === 'lx', 'stage-transition: source + sourceRefId correct');
+  }
+
+  // 7 — Deterministic ID across two calls on identical input
+  {
+    __resetForTests();
+    const grow = { plants: [{ id: 'p1', notes: 'same text' }] };
+    const a = collectObservations(grow, {});
+    const b = collectObservations(grow, {});
+    assert(a[0].id === b[0].id, 'Observation.id is deterministic across two calls');
+  }
+
+  // 8 — ID differs when rawText changes
+  {
+    __resetForTests();
+    const a = collectObservations({ plants: [{ id: 'p1', notes: 'v1' }] }, {});
+    const b = collectObservations({ plants: [{ id: 'p1', notes: 'v2' }] }, {});
+    assert(a[0].id !== b[0].id, 'Observation.id differs when rawText changes');
+  }
+
+  // 9 — Non-profile sources require sourceRefId
+  {
+    __resetForTests();
+    const grow = {
+      plants: [{ id: 'p1', notes: 'A', logs: [{ id: 'l1', timestamp: daysAgo(1), details: { notes: 'B' } }] }],
+      tasks: [{ id: 't1', plantId: 'p1', notes: 'C' }],
+    };
+    const out = collectObservations(grow, {});
+    const nonProfile = out.filter(o => o.source !== 'profile');
+    assert(nonProfile.every(o => !!o.sourceRefId), 'non-profile sources all carry sourceRefId');
+  }
+
+  // 10 — opts.plantId filter
+  {
+    __resetForTests();
+    const grow = {
+      plants: [
+        { id: 'p1', notes: 'A' },
+        { id: 'p2', notes: 'B' },
+      ],
+    };
+    const out = collectObservations(grow, {}, { plantId: 'p2' });
+    assert(out.length === 1 && out[0].plantId === 'p2', 'opts.plantId filter works');
+  }
+
+  // 11 — opts.since filter
+  {
+    __resetForTests();
+    const grow = {
+      plants: [{
+        id: 'p1',
+        logs: [
+          { id: 'l-old', timestamp: daysAgo(30), details: { notes: 'old' } },
+          { id: 'l-new', timestamp: daysAgo(1), details: { notes: 'new' } },
+        ],
+      }],
+    };
+    const out = collectObservations(grow, {}, { since: daysAgo(7) });
+    assert(out.length === 1 && out[0].sourceRefId === 'l-new', 'opts.since excludes older observations');
+  }
+
+  // 12 — opts.domains filter empties result in section-01
+  {
+    __resetForTests();
+    const grow = { plants: [{ id: 'p1', notes: 'anything' }] };
+    const out = collectObservations(grow, {}, { domains: ['pest'] });
+    assert(out.length === 0, 'opts.domains filter empties result in section-01 (stub domains are empty)');
+  }
+
+  // 13 — parseObservation stub returns empty ParsedNote
+  {
+    __resetForTests();
+    const obs = {
+      id: 'x', createdAt: '', observedAt: '', source: 'log', sourceRefId: 'l1',
+      domains: [], severityRaw: null, severity: 'info', severityAutoInferred: false,
+      rawText: 'hi', parsed: null, tags: [],
+    };
+    parseObservation(obs);
+    assert(obs.parsed && typeof obs.parsed.ctx === 'object', 'parseObservation: assigns ctx object');
+    assert(Array.isArray(obs.parsed.keywords) && obs.parsed.keywords.length === 0, 'parseObservation: keywords empty');
+    assert(Array.isArray(obs.parsed.frankoOverrides) && obs.parsed.frankoOverrides.length === 0, 'parseObservation: overrides empty');
+  }
+
+  // 14 — mergeNoteContext stub returns empty object
+  {
+    assert(JSON.stringify(mergeNoteContext([])) === '{}', 'mergeNoteContext stub returns empty object');
+  }
+
+  // 15 — findActionsTakenSince stub returns empty array
+  {
+    assert(Array.isArray(findActionsTakenSince([], 'water', 24)) && findActionsTakenSince([], 'water', 24).length === 0, 'findActionsTakenSince stub returns empty array');
+  }
+
+  // 16 — getObservationIndex before initContextualizer returns empty frozen array
+  {
+    __resetForTests();
+    const idx = getObservationIndex();
+    assert(idx && Array.isArray(idx.all) && idx.all.length === 0, 'getObservationIndex pre-init: empty array');
+    assert(Object.isFrozen(idx.all), 'getObservationIndex pre-init: all is frozen');
+  }
+
+  // 17 — initContextualizer is idempotent; rebuild on grow commit
+  {
+    __resetForTests();
+    const store = makeStore();
+    initContextualizer(store);
+    initContextualizer(store); // second call must be a no-op
+    const emptyIdx = getObservationIndex();
+    assert(emptyIdx.all.length === 0, 'idempotent init: no obs initially');
+
+    // Commit a plant with a note
+    const snap = store.getSnapshot().grow || { plants: [], tasks: [] };
+    snap.plants = [{ id: 'p1', notes: 'hello' }];
+    store.commit('grow', snap);
+
+    const idx = getObservationIndex();
+    assert(idx.all.length === 1 && idx.all[0].rawText === 'hello', 'rebuild after grow commit picks up new note');
+  }
+
+  // 18 — Returned array is frozen
+  {
+    __resetForTests();
+    const store = makeStore({ grow: { plants: [{ id: 'p1', notes: 'frozen-test' }], tasks: [] } });
+    initContextualizer(store);
+    const idx = getObservationIndex();
+    assert(Object.isFrozen(idx.all), 'getObservationIndex.all is frozen');
+    let threw = false;
+    try { idx.all.push({}); } catch { threw = true; }
+    assert(threw || idx.all.length === 1, 'mutating frozen array throws or silently fails');
+  }
+
+  // 19 — Hash-check skips rebuild on identical state
+  {
+    __resetForTests();
+    const store = makeStore({ grow: { plants: [{ id: 'p1', notes: 'x' }], tasks: [] } });
+    initContextualizer(store);
+    const idx1 = getObservationIndex();
+    const idx2 = getObservationIndex();
+    assert(idx1 === idx2, 'hash-check: second call returns cached reference');
+  }
+
+  // 20 — getRelevantObservations delegates filter through the cache
+  {
+    __resetForTests();
+    const store = makeStore({
+      grow: {
+        plants: [
+          { id: 'p1', notes: 'A' },
+          { id: 'p2', notes: 'B' },
+        ],
+        tasks: [],
+      },
+    });
+    initContextualizer(store);
+    const rel = getRelevantObservations(store, { plantId: 'p2' });
+    assert(rel.length === 1 && rel[0].plantId === 'p2', 'getRelevantObservations: plantId filter');
+  }
+
+  // 21 — Sidecar citations: recordReferencedIn + getCitationsFor
+  {
+    __resetForTests();
+    recordReferencedIn(['obs-a', 'obs-b'], 'consumer-1');
+    recordReferencedIn(['obs-a'], 'consumer-2');
+    const aCites = getCitationsFor('obs-a').sort();
+    const bCites = getCitationsFor('obs-b');
+    const missing = getCitationsFor('obs-missing');
+    assert(aCites.length === 2 && aCites[0] === 'consumer-1', 'citations: multiple consumers recorded');
+    assert(bCites.length === 1 && bCites[0] === 'consumer-1', 'citations: single consumer recorded');
+    assert(missing.length === 0, 'citations: unknown obsId returns empty');
+  }
+
+  // 22 — __resetForTests clears cache + citations
+  {
+    __resetForTests();
+    recordReferencedIn(['foo'], 'consumer');
+    assert(getCitationsFor('foo').length === 1, 'pre-reset: citation present');
+    __resetForTests();
+    assert(getCitationsFor('foo').length === 0, '__resetForTests clears citations');
+    const idxAfter = getObservationIndex();
+    assert(idxAfter.all.length === 0, '__resetForTests clears cache');
+  }
+
+  return results;
+}
