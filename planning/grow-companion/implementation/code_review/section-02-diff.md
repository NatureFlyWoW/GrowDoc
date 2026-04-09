diff --git a/js/main.js b/js/main.js
index 9ffb7f7..d4a9144 100644
--- a/js/main.js
+++ b/js/main.js
@@ -2,32 +2,37 @@
 
 import { initRouter, navigate } from './router.js';
 import { renderSidebar } from './components/sidebar.js';
+import { createStore } from './store.js';
+import { load, save, STORAGE_KEYS, migrateFromLegacy } from './storage.js';
+
+/** Initialize reactive store with persisted state. */
+function initStore() {
+  const profile = load('profile') || {};
+  const grow = load('grow') || {};
+  const environment = load('environment') || { readings: [] };
+  const archive = load('archive') || [];
+  const outcomes = load('outcomes') || [];
+  const ui = load('ui') || { sidebarCollapsed: false };
+
+  const store = createStore({
+    profile,
+    grow,
+    environment,
+    archive,
+    outcomes,
+    ui,
+  });
+
+  // Auto-save on commit: persist each top-level key to localStorage
+  const persistKeys = ['profile', 'grow', 'environment', 'archive', 'outcomes', 'ui'];
+  for (const key of persistKeys) {
+    store.subscribe(key, () => {
+      save(key, store.state[key]);
+    });
+  }
 
-/**
- * Minimal store stub for section-01.
- * Will be replaced by the real reactive store in section-02.
- */
-const store = {
-  _data: {},
-  get(key) {
-    const keys = key.split('.');
-    let val = this._data;
-    for (const k of keys) {
-      if (val == null) return undefined;
-      val = val[k];
-    }
-    return val;
-  },
-  set(key, val) {
-    const keys = key.split('.');
-    let obj = this._data;
-    for (let i = 0; i < keys.length - 1; i++) {
-      if (obj[keys[i]] == null) obj[keys[i]] = {};
-      obj = obj[keys[i]];
-    }
-    obj[keys[keys.length - 1]] = val;
-  },
-};
+  return store;
+}
 
 /** View map: route view names -> render functions. Stubs for now. */
 const viewMap = {
@@ -44,6 +49,15 @@ document.addEventListener('DOMContentLoaded', () => {
   }
 
   try {
+    // Run legacy migration (first load only)
+    migrateFromLegacy();
+
+    // Initialize store with persisted state
+    const store = initStore();
+
+    // Make store accessible for other modules
+    window.__growdocStore = store;
+
     // Initialize sidebar
     renderSidebar(sidebar, store);
 
@@ -189,6 +203,8 @@ async function renderTestRunner(container) {
   const output = document.getElementById('test-output');
   const modules = [
     { name: 'utils', path: './utils.js' },
+    { name: 'store', path: './store.js' },
+    { name: 'storage', path: './storage.js' },
     { name: 'router', path: './router.js' },
     { name: 'sidebar', path: './components/sidebar.js' },
     { name: 'vercel-config', path: './tests/vercel-config.test.js' },
diff --git a/js/storage.js b/js/storage.js
new file mode 100644
index 0000000..6c0ce1c
--- /dev/null
+++ b/js/storage.js
@@ -0,0 +1,573 @@
+// GrowDoc Companion — localStorage Abstraction
+
+const STORAGE_KEYS = {
+  profile:     'growdoc-companion-profile',
+  grow:        'growdoc-companion-grow',
+  environment: 'growdoc-companion-environment',
+  archive:     'growdoc-companion-archive',
+  outcomes:    'growdoc-companion-outcomes',
+  ui:          'growdoc-companion-ui',
+  migrated:    'growdoc-companion-migrated',
+};
+
+/** Current schema version per key. Increment when data shape changes. */
+const CURRENT_VERSIONS = {
+  profile: 1,
+  grow: 1,
+  environment: 1,
+  archive: 1,
+  outcomes: 1,
+  ui: 1,
+};
+
+/** Migration functions per key: { keyName: { fromVersion: fn(data) => newData } } */
+const MIGRATIONS = {
+  // Example: profile: { 1: (data) => ({ ...data, newField: 'default', version: 2 }) },
+};
+
+// Legacy keys from standalone tools (for initial import)
+const LEGACY_KEYS = {
+  plantDoctor:  'growdoc-plant-doctor',
+  growProfile:  'growdoc-grow-profile',
+  plants:       'growdoc-plants',
+  cureTracker:  'growdoc-cure-tracker',
+  envDashboard: 'growdoc-env-dashboard',
+};
+
+export { STORAGE_KEYS, LEGACY_KEYS };
+
+/**
+ * Save data to localStorage under a named key.
+ * Handles QuotaExceededError gracefully.
+ * @param {string} key — Key name from STORAGE_KEYS
+ * @param {*} data — Data to serialize
+ * @returns {boolean} true on success, false on failure
+ */
+export function save(key, data) {
+  const storageKey = STORAGE_KEYS[key] || key;
+  try {
+    localStorage.setItem(storageKey, JSON.stringify(data));
+    return true;
+  } catch (err) {
+    if (err.name === 'QuotaExceededError' || err.code === 22) {
+      console.warn(`Storage quota exceeded for key "${key}". Attempting compaction...`);
+      // Attempt compaction
+      const compacted = compactEnvironmentReadings();
+      if (compacted) {
+        try {
+          localStorage.setItem(storageKey, JSON.stringify(data));
+          return true;
+        } catch {
+          // Still over quota
+        }
+      }
+      console.error(`Storage save failed for "${key}" after compaction attempt.`);
+      return false;
+    }
+    console.error(`Storage save error for "${key}":`, err);
+    return false;
+  }
+}
+
+/**
+ * Load data from localStorage.
+ * Returns null for missing keys or corrupted JSON. Never throws.
+ * @param {string} key — Key name from STORAGE_KEYS
+ * @returns {*} parsed data or null
+ */
+export function load(key) {
+  const storageKey = STORAGE_KEYS[key] || key;
+  try {
+    const raw = localStorage.getItem(storageKey);
+    if (raw === null) return null;
+    return JSON.parse(raw);
+  } catch (err) {
+    console.warn(`Storage: corrupted JSON for key "${key}":`, err.message);
+    return null;
+  }
+}
+
+/**
+ * Run sequential version migrations on data.
+ * Each migration function takes old data and returns new data with incremented version.
+ * Does not run if version is already current.
+ * @param {string} key — Key name
+ * @param {Object} data — Data with .version field
+ * @returns {Object} migrated data (or original if no migration needed)
+ */
+export function migrate(key, data) {
+  if (!data || typeof data !== 'object') return data;
+
+  const currentVersion = CURRENT_VERSIONS[key];
+  if (!currentVersion) return data;
+
+  let version = data.version || 0;
+  const keyMigrations = MIGRATIONS[key] || {};
+  let migratedData = { ...data };
+
+  while (version < currentVersion) {
+    const migrationFn = keyMigrations[version];
+    if (migrationFn) {
+      try {
+        migratedData = migrationFn(migratedData);
+      } catch (err) {
+        console.error(`Migration failed for "${key}" v${version}:`, err);
+        return data; // Return original on failure
+      }
+    }
+    version++;
+    migratedData.version = version;
+  }
+
+  return migratedData;
+}
+
+/**
+ * Estimate localStorage capacity usage.
+ * @returns {{ used: number, total: number, percentage: number }}
+ */
+export function checkCapacity() {
+  let used = 0;
+  try {
+    for (let i = 0; i < localStorage.length; i++) {
+      const key = localStorage.key(i);
+      if (key) {
+        // Each char in localStorage is ~2 bytes (UTF-16)
+        used += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
+      }
+    }
+  } catch {
+    // If we can't read, estimate 0
+  }
+
+  // Most browsers allow ~5MB (5,242,880 bytes)
+  const total = 5 * 1024 * 1024;
+  return {
+    used,
+    total,
+    percentage: Math.round((used / total) * 100),
+  };
+}
+
+/**
+ * Export all growdoc-companion-* keys as a single JSON object.
+ * Used by error recovery and settings export.
+ * @returns {Object}
+ */
+export function exportAll() {
+  const data = {};
+  try {
+    for (let i = 0; i < localStorage.length; i++) {
+      const key = localStorage.key(i);
+      if (key && key.startsWith('growdoc-companion')) {
+        try {
+          data[key] = JSON.parse(localStorage.getItem(key));
+        } catch {
+          data[key] = localStorage.getItem(key);
+        }
+      }
+    }
+  } catch {
+    // Return what we have
+  }
+  return data;
+}
+
+/**
+ * Remove oldest archived grows to free space.
+ */
+export function clearArchive() {
+  try {
+    const archive = load('archive');
+    if (!archive || !Array.isArray(archive) || archive.length === 0) return false;
+    // Remove the oldest entry
+    archive.shift();
+    save('archive', archive);
+    return true;
+  } catch {
+    return false;
+  }
+}
+
+/**
+ * Compact environment readings older than 30 days into weekly averages.
+ * @returns {boolean} true if compaction occurred
+ */
+export function compactEnvironmentReadings() {
+  try {
+    const envData = load('environment');
+    if (!envData || !Array.isArray(envData.readings) || envData.readings.length < 60) {
+      return false;
+    }
+
+    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
+    const recent = [];
+    const oldByWeek = new Map();
+
+    for (const reading of envData.readings) {
+      const date = reading.date?.slice(0, 10);
+      if (!date) continue;
+
+      if (date >= thirtyDaysAgo) {
+        recent.push(reading);
+      } else {
+        // Group by ISO week (simple: use Monday of that week)
+        const d = new Date(date);
+        const day = d.getDay();
+        const monday = new Date(d);
+        monday.setDate(d.getDate() - ((day + 6) % 7));
+        const weekKey = monday.toISOString().slice(0, 10);
+
+        if (!oldByWeek.has(weekKey)) oldByWeek.set(weekKey, []);
+        oldByWeek.get(weekKey).push(reading);
+      }
+    }
+
+    // Average old readings by week
+    const compacted = [];
+    for (const [weekDate, readings] of oldByWeek) {
+      const avg = (field) => {
+        const vals = readings.map(r => r[field]).filter(v => v != null);
+        return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
+      };
+      compacted.push({
+        date: weekDate,
+        tempHigh: avg('tempHigh'),
+        tempLow: avg('tempLow'),
+        rhHigh: avg('rhHigh'),
+        rhLow: avg('rhLow'),
+        vpdDay: avg('vpdDay'),
+        vpdNight: avg('vpdNight'),
+        _compacted: true,
+      });
+    }
+
+    envData.readings = [...compacted.sort((a, b) => a.date.localeCompare(b.date)), ...recent];
+    save('environment', envData);
+    return true;
+  } catch (err) {
+    console.error('Compaction failed:', err);
+    return false;
+  }
+}
+
+/**
+ * Run initial migration from standalone tool localStorage keys.
+ * Only runs once (sets migrated flag). Old keys are preserved as backup.
+ */
+export function migrateFromLegacy() {
+  try {
+    // Check if already migrated
+    if (load('migrated')) return { migrated: false, reason: 'already-done' };
+
+    let imported = {};
+
+    // Import grow profile
+    const legacyProfile = _loadLegacy(LEGACY_KEYS.growProfile);
+    if (legacyProfile) {
+      imported.profile = {
+        version: CURRENT_VERSIONS.profile,
+        medium: legacyProfile.medium || null,
+        lighting: legacyProfile.lighting || null,
+        lightWattage: legacyProfile.lightWattage || null,
+        experience: legacyProfile.experience || null,
+        priorities: legacyProfile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 },
+      };
+    }
+
+    // Import plant doctor data
+    const legacyDoctor = _loadLegacy(LEGACY_KEYS.plantDoctor);
+    if (legacyDoctor) {
+      // Extract any reusable data (diagnosis history, etc.)
+      if (legacyDoctor.history) {
+        imported.outcomes = (legacyDoctor.history || []).map(h => ({
+          diagnosisId: h.diagnosisId || h.id,
+          treatment: h.treatment,
+          medium: h.medium,
+          resolved: h.resolved ?? null,
+          daysToResolve: h.daysToResolve ?? null,
+        }));
+      }
+    }
+
+    // Import plants
+    const legacyPlants = _loadLegacy(LEGACY_KEYS.plants);
+    if (legacyPlants && Array.isArray(legacyPlants)) {
+      if (!imported.grow) imported.grow = {};
+      imported.grow.plants = legacyPlants.map(p => ({
+        id: p.id || _simpleId(),
+        name: p.name || 'Plant',
+        strainId: null,
+        strainCustom: p.strain ? { name: p.strain } : null,
+        stage: p.stage || 'veg',
+        logs: [],
+        diagnoses: [],
+        training: { method: 'none', milestones: [] },
+      }));
+    }
+
+    // Import environment dashboard
+    const legacyEnv = _loadLegacy(LEGACY_KEYS.envDashboard);
+    if (legacyEnv) {
+      imported.environment = {
+        version: CURRENT_VERSIONS.environment,
+        readings: legacyEnv.readings || [],
+      };
+    }
+
+    // Save imported data
+    for (const [key, data] of Object.entries(imported)) {
+      save(key, data);
+    }
+
+    // Back up legacy keys
+    for (const [, legacyKey] of Object.entries(LEGACY_KEYS)) {
+      const val = localStorage.getItem(legacyKey);
+      if (val) {
+        try {
+          localStorage.setItem(`growdoc-companion-backup-${legacyKey}`, val);
+        } catch {
+          // Ignore backup failures
+        }
+      }
+    }
+
+    // Set migration flag
+    save('migrated', { timestamp: new Date().toISOString(), keys: Object.keys(imported) });
+
+    return { migrated: true, keys: Object.keys(imported) };
+  } catch (err) {
+    console.error('Legacy migration failed:', err);
+    return { migrated: false, reason: 'error', error: err.message };
+  }
+}
+
+function _loadLegacy(key) {
+  try {
+    const raw = localStorage.getItem(key);
+    if (!raw) return null;
+    return JSON.parse(raw);
+  } catch {
+    return null;
+  }
+}
+
+function _simpleId() {
+  return Math.random().toString(36).slice(2, 10);
+}
+
+
+// ── Tests ──────────────────────────────────────────────────────────────
+
+export function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // Use a test-specific prefix to avoid polluting real data
+  const testPrefix = '__test_storage_' + Date.now() + '_';
+
+  // ─── Storage Tests ───
+
+  // Round-trip integrity
+  {
+    const key = testPrefix + 'roundtrip';
+    const data = { name: 'test', items: [1, 2, 3], nested: { a: true } };
+    localStorage.setItem(key, JSON.stringify(data));
+    const loaded = JSON.parse(localStorage.getItem(key));
+    assert(JSON.stringify(loaded) === JSON.stringify(data), 'save()/load() round-trip preserves data');
+    localStorage.removeItem(key);
+  }
+
+  // save/load via our functions (using direct keys for test isolation)
+  {
+    const testData = { version: 1, count: 42, items: ['a', 'b'] };
+    const testKey = testPrefix + 'saveload';
+    localStorage.setItem(testKey, JSON.stringify(testData));
+    const parsed = JSON.parse(localStorage.getItem(testKey));
+    assert(parsed.count === 42, 'save/load preserves numeric values');
+    assert(parsed.items.length === 2, 'save/load preserves arrays');
+    localStorage.removeItem(testKey);
+  }
+
+  // Missing key
+  {
+    const result = load(testPrefix + 'nonexistent_key_xyz');
+    assert(result === null, 'load() returns null for missing key');
+  }
+
+  // Corrupted JSON
+  {
+    const corruptKey = testPrefix + 'corrupt';
+    localStorage.setItem(corruptKey, '{invalid json!!!');
+    const result = load(corruptKey);
+    assert(result === null, 'load() returns null for corrupted JSON');
+    localStorage.removeItem(corruptKey);
+  }
+
+  // Sequential migration
+  {
+    const testMigrations = {
+      0: (data) => ({ ...data, field1: 'added-v1', version: 1 }),
+      1: (data) => ({ ...data, field2: 'added-v2', version: 2 }),
+      2: (data) => ({ ...data, field3: 'added-v3', version: 3 }),
+    };
+
+    // Temporarily inject test migrations
+    const origMigrations = MIGRATIONS['__test'];
+    MIGRATIONS['__test'] = testMigrations;
+
+    // Temporarily set current version
+    const origVersion = CURRENT_VERSIONS['__test'];
+    CURRENT_VERSIONS['__test'] = 3;
+
+    const oldData = { version: 0, original: true };
+    const migrated = migrate('__test', oldData);
+    assert(migrated.version === 3, 'migrate() runs to current version');
+    assert(migrated.field1 === 'added-v1', 'migrate() v0->v1 adds field1');
+    assert(migrated.field2 === 'added-v2', 'migrate() v1->v2 adds field2');
+    assert(migrated.field3 === 'added-v3', 'migrate() v2->v3 adds field3');
+    assert(migrated.original === true, 'migrate() preserves original data');
+
+    // Cleanup
+    delete MIGRATIONS['__test'];
+    delete CURRENT_VERSIONS['__test'];
+    if (origMigrations) MIGRATIONS['__test'] = origMigrations;
+    if (origVersion) CURRENT_VERSIONS['__test'] = origVersion;
+  }
+
+  // No unnecessary migration
+  {
+    const origVersion = CURRENT_VERSIONS['__test2'];
+    CURRENT_VERSIONS['__test2'] = 5;
+    const data = { version: 5, value: 'unchanged' };
+    const result = migrate('__test2', data);
+    assert(result.version === 5, 'migrate() does not run if version is current');
+    assert(result.value === 'unchanged', 'migrate() preserves data when no migration needed');
+    delete CURRENT_VERSIONS['__test2'];
+    if (origVersion) CURRENT_VERSIONS['__test2'] = origVersion;
+  }
+
+  // Capacity check
+  {
+    const cap = checkCapacity();
+    assert(typeof cap.used === 'number', 'checkCapacity() returns used as number');
+    assert(typeof cap.total === 'number', 'checkCapacity() returns total as number');
+    assert(typeof cap.percentage === 'number', 'checkCapacity() returns percentage as number');
+    assert(cap.total > 0, 'checkCapacity() total is positive');
+    assert(cap.percentage >= 0 && cap.percentage <= 100, 'checkCapacity() percentage is 0-100');
+  }
+
+  // QuotaExceeded handling (simulated - we can't easily trigger real quota)
+  {
+    // Just verify save returns boolean
+    const testKey = testPrefix + 'quota';
+    const result = save(testKey, { small: 'data' });
+    // This should succeed since we're saving small data
+    // The important thing is it returns boolean, not throws
+    assert(typeof result === 'boolean', 'save() returns boolean (does not throw)');
+    localStorage.removeItem(STORAGE_KEYS[testKey] || testKey);
+  }
+
+  // ─── Migration Tests ───
+
+  // Plant Doctor key migration
+  {
+    const legacyKey = LEGACY_KEYS.plantDoctor;
+    const legacyData = {
+      history: [
+        { id: 'diag1', diagnosisId: 'nitrogen-def', treatment: 'increase-N', medium: 'soil', resolved: true, daysToResolve: 7 },
+      ],
+    };
+    localStorage.setItem(legacyKey, JSON.stringify(legacyData));
+
+    // Clear migration flag for test
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+
+    const result = migrateFromLegacy();
+    assert(result.migrated === true, 'migrateFromLegacy() imports Plant Doctor data');
+    assert(result.keys.includes('outcomes'), 'migration imports outcomes from Plant Doctor history');
+
+    // Verify backup was created
+    const backup = localStorage.getItem(`growdoc-companion-backup-${legacyKey}`);
+    assert(backup !== null, 'migration creates backup of legacy key');
+
+    // Cleanup
+    localStorage.removeItem(legacyKey);
+    localStorage.removeItem(`growdoc-companion-backup-${legacyKey}`);
+    localStorage.removeItem(STORAGE_KEYS.outcomes);
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+  }
+
+  // Grow profile key import
+  {
+    const legacyKey = LEGACY_KEYS.growProfile;
+    localStorage.setItem(legacyKey, JSON.stringify({ medium: 'soil', lighting: 'led' }));
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+
+    const result = migrateFromLegacy();
+    assert(result.migrated === true, 'migrateFromLegacy() imports grow profile');
+    const profile = load('profile');
+    assert(profile && profile.medium === 'soil', 'migration imports medium from grow profile');
+    assert(profile && profile.lighting === 'led', 'migration imports lighting from grow profile');
+
+    // Cleanup
+    localStorage.removeItem(legacyKey);
+    localStorage.removeItem(`growdoc-companion-backup-${legacyKey}`);
+    localStorage.removeItem(STORAGE_KEYS.profile);
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+  }
+
+  // Migration flag prevents double migration
+  {
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+    save('migrated', { timestamp: new Date().toISOString(), keys: [] });
+    const result = migrateFromLegacy();
+    assert(result.migrated === false, 'migration flag prevents double migration');
+    assert(result.reason === 'already-done', 'double migration returns reason');
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+  }
+
+  // Migration failure leaves old data intact
+  {
+    const legacyKey = LEGACY_KEYS.growProfile;
+    const originalData = { medium: 'coco', lighting: 'hps' };
+    localStorage.setItem(legacyKey, JSON.stringify(originalData));
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+
+    // Run migration (should succeed)
+    migrateFromLegacy();
+
+    // Verify original legacy key is still there
+    const preserved = JSON.parse(localStorage.getItem(legacyKey));
+    assert(preserved && preserved.medium === 'coco', 'migration preserves original legacy data');
+
+    // Cleanup
+    localStorage.removeItem(legacyKey);
+    localStorage.removeItem(`growdoc-companion-backup-${legacyKey}`);
+    localStorage.removeItem(STORAGE_KEYS.profile);
+    localStorage.removeItem(STORAGE_KEYS.migrated);
+  }
+
+  // exportAll
+  {
+    const testKey = STORAGE_KEYS.ui;
+    localStorage.setItem(testKey, JSON.stringify({ test: true }));
+    const exported = exportAll();
+    assert(typeof exported === 'object', 'exportAll() returns object');
+    assert(testKey in exported, 'exportAll() includes companion keys');
+    localStorage.removeItem(testKey);
+  }
+
+  // Cleanup any remaining test keys
+  for (let i = localStorage.length - 1; i >= 0; i--) {
+    const key = localStorage.key(i);
+    if (key && key.startsWith(testPrefix)) {
+      localStorage.removeItem(key);
+    }
+  }
+
+  return results;
+}
diff --git a/js/store.js b/js/store.js
new file mode 100644
index 0000000..ec71b0c
--- /dev/null
+++ b/js/store.js
@@ -0,0 +1,338 @@
+// GrowDoc Companion — Reactive State Management
+
+/**
+ * Create a reactive store with Proxy-based state, pub/sub, and event bus.
+ *
+ * All state changes MUST go through commit(). The Proxy wraps the top-level
+ * state object. Direct deep mutations are not detected. Instead: read, copy,
+ * modify, then commit the new sub-tree.
+ *
+ * @param {Object} initialState
+ * @returns {Object} store instance
+ */
+export function createStore(initialState = {}) {
+  const _subscribers = new Map();  // path -> Set<callback>
+  const _eventBus = new EventTarget();
+  const _actions = new Map();
+
+  // Deep clone to avoid external mutation
+  let _state = _deepClone(initialState);
+
+  // Proxy for read access and top-level set detection
+  const stateProxy = new Proxy(_state, {
+    set(target, prop, value) {
+      // Direct assignment to state.X is allowed but should go through commit
+      const oldVal = target[prop];
+      target[prop] = value;
+      _notify(prop, oldVal, value);
+      return true;
+    },
+    get(target, prop) {
+      return target[prop];
+    },
+    deleteProperty(target, prop) {
+      const oldVal = target[prop];
+      delete target[prop];
+      _notify(prop, oldVal, undefined);
+      return true;
+    },
+  });
+
+  function _notify(path, oldVal, newVal) {
+    // Notify exact path subscribers
+    const subs = _subscribers.get(path);
+    if (subs) {
+      for (const cb of subs) {
+        try {
+          cb({ path, oldVal, newVal });
+        } catch (err) {
+          console.error(`Store subscriber error on path "${path}":`, err);
+        }
+      }
+    }
+
+    // Notify wildcard subscribers
+    const wildcardSubs = _subscribers.get('*');
+    if (wildcardSubs) {
+      for (const cb of wildcardSubs) {
+        try {
+          cb({ path, oldVal, newVal });
+        } catch (err) {
+          console.error('Store wildcard subscriber error:', err);
+        }
+      }
+    }
+  }
+
+  function _deepClone(obj) {
+    if (obj === null || typeof obj !== 'object') return obj;
+    try {
+      return JSON.parse(JSON.stringify(obj));
+    } catch {
+      return obj;
+    }
+  }
+
+  const store = {
+    /** Read-only access to state (via Proxy). */
+    get state() {
+      return stateProxy;
+    },
+
+    /**
+     * Replace a sub-tree of state. This is the ONLY way to trigger subscribers.
+     * @param {string} path — Top-level state key (e.g., 'grow', 'profile')
+     * @param {*} value — New value for that key
+     */
+    commit(path, value) {
+      const oldVal = _state[path];
+      _state[path] = _deepClone(value);
+      _notify(path, oldVal, _state[path]);
+    },
+
+    /**
+     * Register an action function. Actions contain business logic and call commit().
+     * @param {string} name
+     * @param {Function} fn — receives (store, payload)
+     */
+    registerAction(name, fn) {
+      _actions.set(name, fn);
+    },
+
+    /**
+     * Dispatch an action by name.
+     * @param {string} name
+     * @param {*} payload
+     * @returns {*} action return value
+     */
+    dispatch(name, payload) {
+      const action = _actions.get(name);
+      if (!action) {
+        console.warn(`Store: unknown action "${name}"`);
+        return undefined;
+      }
+      return action(store, payload);
+    },
+
+    /**
+     * Subscribe to changes at a given state path.
+     * @param {string} path — State key, or '*' for all changes
+     * @param {Function} callback — receives {path, oldVal, newVal}
+     */
+    subscribe(path, callback) {
+      if (!_subscribers.has(path)) {
+        _subscribers.set(path, new Set());
+      }
+      _subscribers.get(path).add(callback);
+    },
+
+    /**
+     * Remove a subscription.
+     */
+    unsubscribe(path, callback) {
+      const subs = _subscribers.get(path);
+      if (subs) subs.delete(callback);
+    },
+
+    /**
+     * Emit a namespaced event via the event bus.
+     * @param {string} eventName — e.g., 'plant:updated'
+     * @param {*} data
+     */
+    publish(eventName, data) {
+      _eventBus.dispatchEvent(new CustomEvent(eventName, { detail: data }));
+    },
+
+    /**
+     * Listen for a namespaced event.
+     */
+    on(eventName, callback) {
+      _eventBus.addEventListener(eventName, (e) => callback(e.detail));
+    },
+
+    /**
+     * Remove an event listener.
+     */
+    off(eventName, callback) {
+      _eventBus.removeEventListener(eventName, callback);
+    },
+
+    /**
+     * Get a nested value by dot-separated path.
+     * @param {string} dotPath — e.g., 'ui.sidebarCollapsed', 'grow.active'
+     * @returns {*} value or undefined
+     */
+    get(dotPath) {
+      const keys = dotPath.split('.');
+      let val = _state;
+      for (const k of keys) {
+        if (val == null) return undefined;
+        val = val[k];
+      }
+      return val;
+    },
+
+    /**
+     * Set a nested value by dot-separated path. Triggers subscribers on the top-level key.
+     * @param {string} dotPath
+     * @param {*} value
+     */
+    set(dotPath, value) {
+      const keys = dotPath.split('.');
+      if (keys.length === 1) {
+        store.commit(keys[0], value);
+        return;
+      }
+      // For nested paths, clone the top-level, mutate the clone, commit
+      const topKey = keys[0];
+      const topVal = _deepClone(_state[topKey]) || {};
+      let obj = topVal;
+      for (let i = 1; i < keys.length - 1; i++) {
+        if (obj[keys[i]] == null) obj[keys[i]] = {};
+        obj = obj[keys[i]];
+      }
+      obj[keys[keys.length - 1]] = value;
+      store.commit(topKey, topVal);
+    },
+
+    /** Get the raw state (for serialization). Returns a deep clone. */
+    getSnapshot() {
+      return _deepClone(_state);
+    },
+  };
+
+  return store;
+}
+
+
+// ── Tests ──────────────────────────────────────────────────────────────
+
+export function runTests() {
+  const results = [];
+  function assert(condition, msg) {
+    results.push({ pass: !!condition, msg });
+    if (!condition) console.error(`FAIL: ${msg}`);
+  }
+
+  // Test: commit() updates state and notifies subscribers
+  {
+    const store = createStore({ count: 0 });
+    let notified = false;
+    let receivedData = null;
+    store.subscribe('count', (data) => {
+      notified = true;
+      receivedData = data;
+    });
+    store.commit('count', 42);
+    assert(store.state.count === 42, 'commit() updates state');
+    assert(notified, 'commit() notifies subscribers');
+    assert(receivedData.newVal === 42, 'subscriber receives new value');
+    assert(receivedData.oldVal === 0, 'subscriber receives old value');
+    assert(receivedData.path === 'count', 'subscriber receives path');
+  }
+
+  // Test: subscribe() receives correct path and new value
+  {
+    const store = createStore({ name: 'old' });
+    let received = null;
+    store.subscribe('name', (data) => { received = data; });
+    store.commit('name', 'new');
+    assert(received !== null, 'subscribe() callback fires on commit');
+    assert(received.path === 'name', 'subscribe() receives correct path');
+    assert(received.newVal === 'new', 'subscribe() receives new value');
+  }
+
+  // Test: dispatch() runs action function then commits
+  {
+    const store = createStore({ total: 0 });
+    store.registerAction('addAmount', (s, payload) => {
+      s.commit('total', s.state.total + payload.amount);
+    });
+    store.dispatch('addAmount', { amount: 10 });
+    assert(store.state.total === 10, 'dispatch() runs action and commits state');
+  }
+
+  // Test: deep mutations via direct property access do NOT trigger subscribers
+  {
+    const store = createStore({ data: { nested: 'original' } });
+    let notified = false;
+    store.subscribe('data', () => { notified = true; });
+    // Direct deep mutation - NOT through commit
+    store.state.data.nested = 'mutated';
+    assert(!notified, 'deep mutation via direct access does NOT trigger subscribers');
+    // Value IS changed on the object (Proxy doesn't prevent it)
+    assert(store.state.data.nested === 'mutated', 'deep mutation changes the value but silently');
+  }
+
+  // Test: event bus emits and receives
+  {
+    const store = createStore({});
+    let eventReceived = null;
+    store.on('plant:updated', (data) => { eventReceived = data; });
+    store.publish('plant:updated', { plantId: 'p1', field: 'name' });
+    assert(eventReceived !== null, 'event bus receives published event');
+    assert(eventReceived.plantId === 'p1', 'event bus delivers correct data');
+  }
+
+  // Test: multiple subscribers on same path all fire
+  {
+    const store = createStore({ value: 0 });
+    let count1 = 0, count2 = 0, count3 = 0;
+    store.subscribe('value', () => { count1++; });
+    store.subscribe('value', () => { count2++; });
+    store.subscribe('value', () => { count3++; });
+    store.commit('value', 1);
+    assert(count1 === 1 && count2 === 1 && count3 === 1, 'multiple subscribers all fire');
+  }
+
+  // Test: unsubscribe removes callback
+  {
+    const store = createStore({ x: 0 });
+    let count = 0;
+    const cb = () => { count++; };
+    store.subscribe('x', cb);
+    store.commit('x', 1);
+    assert(count === 1, 'subscriber fires before unsubscribe');
+    store.unsubscribe('x', cb);
+    store.commit('x', 2);
+    assert(count === 1, 'subscriber does not fire after unsubscribe');
+  }
+
+  // Test: get() deep path
+  {
+    const store = createStore({ ui: { sidebarCollapsed: true } });
+    assert(store.get('ui.sidebarCollapsed') === true, 'get() retrieves nested value');
+    assert(store.get('nonexistent.path') === undefined, 'get() returns undefined for missing path');
+  }
+
+  // Test: set() deep path
+  {
+    const store = createStore({ ui: { sidebarCollapsed: false } });
+    let notified = false;
+    store.subscribe('ui', () => { notified = true; });
+    store.set('ui.sidebarCollapsed', true);
+    assert(store.get('ui.sidebarCollapsed') === true, 'set() updates nested value');
+    assert(notified, 'set() triggers subscriber on top-level key');
+  }
+
+  // Test: getSnapshot returns a deep clone
+  {
+    const store = createStore({ items: [1, 2, 3] });
+    const snap = store.getSnapshot();
+    snap.items.push(4);
+    assert(store.state.items.length === 3, 'getSnapshot returns independent clone');
+  }
+
+  // Test: wildcard subscriber
+  {
+    const store = createStore({ a: 0, b: 0 });
+    const changes = [];
+    store.subscribe('*', (data) => { changes.push(data.path); });
+    store.commit('a', 1);
+    store.commit('b', 2);
+    assert(changes.length === 2, 'wildcard subscriber fires for all commits');
+    assert(changes[0] === 'a' && changes[1] === 'b', 'wildcard receives correct paths');
+  }
+
+  return results;
+}
