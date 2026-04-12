// GrowDoc Companion — localStorage Abstraction

const STORAGE_KEYS = {
  profile:     'growdoc-companion-profile',
  grow:        'growdoc-companion-grow',
  environment: 'growdoc-companion-environment',
  archive:     'growdoc-companion-archive',
  outcomes:    'growdoc-companion-outcomes',
  ui:          'growdoc-companion-ui',
  migrated:    'growdoc-companion-migrated',
};

/** Current schema version per key. Increment when data shape changes. */
const CURRENT_VERSIONS = {
  profile: 1,
  grow: 1,
  environment: 1,
  archive: 1,
  outcomes: 1,
  ui: 1,
};

/** Migration functions per key: { keyName: { fromVersion: fn(data) => newData } } */
const MIGRATIONS = {
  // Example: profile: { 1: (data) => ({ ...data, newField: 'default', version: 2 }) },
};

// Legacy keys from standalone tools (for initial import)
const LEGACY_KEYS = {
  plantDoctor:  'growdoc-plant-doctor',
  growProfile:  'growdoc-grow-profile',
  plants:       'growdoc-plants',
  cureTracker:  'growdoc-cure-tracker',
  envDashboard: 'growdoc-env-dashboard',
};

export { STORAGE_KEYS, LEGACY_KEYS };

/**
 * Save data to localStorage under a named key.
 * Handles QuotaExceededError gracefully.
 * @param {string} key — Key name from STORAGE_KEYS
 * @param {*} data — Data to serialize
 * @returns {boolean} true on success, false on failure
 */
export function save(key, data) {
  const storageKey = STORAGE_KEYS[key] || key;
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      console.warn(`Storage quota exceeded for key "${key}". Attempting compaction...`);
      // Attempt compaction
      const compacted = compactEnvironmentReadings();
      if (compacted) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
          return true;
        } catch (err) {
          console.error('[storage:save-retry]', err);
          // Still over quota
        }
      }
      console.error(`Storage save failed for "${key}" after compaction attempt.`);
      return false;
    }
    console.error(`Storage save error for "${key}":`, err);
    return false;
  }
}

/**
 * Load data from localStorage.
 * Returns null for missing keys or corrupted JSON. Never throws.
 * @param {string} key — Key name from STORAGE_KEYS
 * @returns {*} parsed data or null
 */
export function load(key) {
  const storageKey = STORAGE_KEYS[key] || key;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Storage: corrupted JSON for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Run sequential version migrations on data.
 * Each migration function takes old data and returns new data with incremented version.
 * Does not run if version is already current.
 * @param {string} key — Key name
 * @param {Object} data — Data with .version field
 * @returns {Object} migrated data (or original if no migration needed)
 */
export function migrate(key, data) {
  if (!data || typeof data !== 'object') return data;

  const currentVersion = CURRENT_VERSIONS[key];
  if (!currentVersion) return data;

  let version = data.version || 0;
  const keyMigrations = MIGRATIONS[key] || {};
  let migratedData = { ...data };

  while (version < currentVersion) {
    const migrationFn = keyMigrations[version];
    if (migrationFn) {
      try {
        migratedData = migrationFn(migratedData);
      } catch (err) {
        console.error(`Migration failed for "${key}" v${version}:`, err);
        return data; // Return original on failure
      }
    }
    version++;
    migratedData.version = version;
  }

  return migratedData;
}

/**
 * Estimate localStorage capacity usage.
 * @returns {{ used: number, total: number, percentage: number }}
 */
export function checkCapacity() {
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Each char in localStorage is ~2 bytes (UTF-16)
        used += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
  } catch (err) {
    console.error('[storage:capacity-read]', err);
    // If we can't read, estimate 0
  }

  // Most browsers allow ~5MB (5,242,880 bytes)
  const total = 5 * 1024 * 1024;
  return {
    used,
    total,
    percentage: Math.round((used / total) * 100),
  };
}

/**
 * Section 11: Full v2 backup. Walks every localStorage key starting
 * with 'growdoc-' and serializes them into a versioned envelope.
 * Each value is parsed to JSON when possible (preserves types) or
 * kept as a raw string (legacy plain entries).
 *
 * @returns {{version: 'v2', exportedAt: string, data: Record<string, unknown>}}
 */
export function exportAllData() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('growdoc-')) continue;
      const raw = localStorage.getItem(key);
      if (raw === null) continue;
      try {
        data[key] = JSON.parse(raw);
      } catch (err) {
        console.error('[storage:export-parse]', err);
        data[key] = raw;
      }
    }
  } catch (err) {
    console.error('exportAllData failed:', err);
  }
  return {
    version: 'v2',
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Section 11: Validate a parsed object against the v2 backup schema.
 * Throws an Error with a human-readable message on failure.
 */
export function validateBackupSchema(parsed) {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid backup: must be a JSON object.');
  }
  if (parsed.version !== 'v2') {
    throw new Error(`Invalid backup: version must be 'v2' (got '${parsed.version}').`);
  }
  if (typeof parsed.data !== 'object' || parsed.data === null) {
    throw new Error('Invalid backup: missing data object.');
  }
  // Spot-check critical shape: if grow exists and has plants, it must be array
  const grow = parsed.data['growdoc-companion-grow'];
  if (grow && typeof grow === 'object' && 'plants' in grow && !Array.isArray(grow.plants)) {
    throw new Error('Invalid backup: grow.plants must be an array.');
  }
  return true;
}

/**
 * Section 11: Atomically replace all growdoc-* localStorage keys with
 * the contents of a validated backup envelope. Writes a preimport
 * backup first so the user can roll back.
 *
 * @returns {{restored: number, preimportKey: string}}
 */
export function importAllData(envelope) {
  validateBackupSchema(envelope);

  // Pre-import backup of current state
  const preimport = exportAllData();
  const preimportKey = 'growdoc-preimport-backup';
  try {
    localStorage.setItem(preimportKey, JSON.stringify(preimport));
  } catch (err) {
    console.warn('preimport backup failed (continuing):', err);
  }

  // Clear all existing growdoc-* keys (except preimport backup)
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('growdoc-') && key !== preimportKey) {
      toRemove.push(key);
    }
  }
  for (const k of toRemove) localStorage.removeItem(k);

  // Write each key from the envelope
  let restored = 0;
  for (const [key, value] of Object.entries(envelope.data || {})) {
    if (!key.startsWith('growdoc-')) continue;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      restored++;
    } catch (err) {
      console.warn(`Import failed to write ${key}:`, err);
    }
  }

  return { restored, preimportKey };
}

/**
 * Section 11: Storage breakdown by category for the Settings dashboard.
 */
export function getStorageBreakdown() {
  const categories = [
    { name: 'Plants & Logs', keys: ['growdoc-companion-grow'], bytes: 0 },
    { name: 'Photos',        keys: ['growdoc-photos-v1'], bytes: 0 },
    { name: 'Past Grows',    keys: ['growdoc-companion-archive'], bytes: 0 },
    { name: 'Environment',   keys: ['growdoc-companion-environment'], bytes: 0 },
    { name: 'Profile',       keys: ['growdoc-companion-profile'], bytes: 0 },
    { name: 'Other',         keys: [], bytes: 0 },
  ];

  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('growdoc-')) continue;
      const value = localStorage.getItem(key) || '';
      const bytes = (key.length + value.length) * 2; // UTF-16 approx
      totalBytes += bytes;

      const matched = categories.find(c => c.keys.includes(key));
      if (matched) {
        matched.bytes += bytes;
      } else {
        const other = categories.find(c => c.name === 'Other');
        other.bytes += bytes;
        other.keys.push(key);
      }
    }
  } catch (err) {
    console.warn('getStorageBreakdown failed:', err);
  }

  const estimatedLimitBytes = 5 * 1024 * 1024;
  const percentUsed = totalBytes / estimatedLimitBytes * 100;
  return {
    totalBytes,
    estimatedLimitBytes,
    percentUsed: Math.round(percentUsed),
    categories: categories.filter(c => c.bytes > 0),
  };
}

/**
 * Quota monitor for growdoc-* keys. Sums character lengths of every
 * key starting with 'growdoc-' and compares to a 4.5MB safety budget
 * (under the typical 5MB browser limit).
 *
 * @returns {{used: number, total: number, percent: number, status: 'ok'|'warning'|'critical'}}
 */
export function checkQuota() {
  const QUOTA_BUDGET = 4_500_000; // 4.5MB safety margin under 5MB browser limit
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-')) {
        // Approximate UTF-16 byte count
        used += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
      }
    }
  } catch (err) {
    console.error('[storage:quota-read]', err);
    // Ignore — return zero usage on read failure
  }
  const percent = used / QUOTA_BUDGET;
  let status = 'ok';
  if (percent >= 0.95) status = 'critical';
  else if (percent >= 0.80) status = 'warning';
  return { used, total: QUOTA_BUDGET, percent: Math.round(percent * 100), status };
}

/**
 * Lightweight schema validation. Returns a safe default if the input
 * fails the per-key shape contract. NEVER throws — corruption results
 * in falling back to defaults so the app can boot.
 *
 * @param {string} key - Top-level state key (profile|grow|environment|archive|outcomes|ui)
 * @param {*} data
 * @returns {*}
 */
export function validateShape(key, data) {
  switch (key) {
    case 'grow': {
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { plants: [], tasks: [], profile: {} };
      }
      const out = { ...data };
      if (!Array.isArray(out.plants)) out.plants = [];
      if (!Array.isArray(out.tasks)) out.tasks = [];
      if (out.profile == null || typeof out.profile !== 'object') out.profile = {};
      return out;
    }
    case 'profile': {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
      return data;
    }
    case 'environment': {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { readings: [] };
      const out = { ...data };
      if (!Array.isArray(out.readings)) out.readings = [];
      return out;
    }
    case 'archive':
    case 'outcomes': {
      return Array.isArray(data) ? data : [];
    }
    case 'ui': {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { sidebarCollapsed: false };
      return data;
    }
    default:
      return data;
  }
}

/**
 * Export all growdoc-companion-* keys as a single JSON object.
 * Used by error recovery and settings export.
 * @returns {Object}
 */
export function exportAll() {
  const data = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-companion')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (err) {
          console.error('[storage:export-all-parse]', err);
          data[key] = localStorage.getItem(key);
        }
      }
    }
  } catch (err) {
    console.error('[storage:export-all]', err);
    // Return what we have
  }
  return data;
}

/**
 * Remove oldest archived grows to free space.
 */
export function clearArchive() {
  try {
    const archive = load('archive');
    if (!archive || !Array.isArray(archive) || archive.length === 0) return false;
    // Remove the oldest entry
    archive.shift();
    save('archive', archive);
    return true;
  } catch (err) {
    console.error('[storage:clear-archive]', err);
    return false;
  }
}

/**
 * Compact environment readings older than 30 days into weekly averages.
 * @returns {boolean} true if compaction occurred
 */
export function compactEnvironmentReadings() {
  try {
    const envData = load('environment');
    if (!envData || !Array.isArray(envData.readings) || envData.readings.length < 60) {
      return false;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const recent = [];
    const oldByWeek = new Map();

    for (const reading of envData.readings) {
      const date = reading.date?.slice(0, 10);
      if (!date) continue;

      if (date >= thirtyDaysAgo) {
        recent.push(reading);
      } else {
        // Group by ISO week (simple: use Monday of that week)
        const d = new Date(date);
        const day = d.getDay();
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((day + 6) % 7));
        const weekKey = monday.toISOString().slice(0, 10);

        if (!oldByWeek.has(weekKey)) oldByWeek.set(weekKey, []);
        oldByWeek.get(weekKey).push(reading);
      }
    }

    // Average old readings by week
    const compacted = [];
    for (const [weekDate, readings] of oldByWeek) {
      const avg = (field) => {
        const vals = readings.map(r => r[field]).filter(v => v != null);
        return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
      };
      compacted.push({
        date: weekDate,
        tempHigh: avg('tempHigh'),
        tempLow: avg('tempLow'),
        rhHigh: avg('rhHigh'),
        rhLow: avg('rhLow'),
        vpdDay: avg('vpdDay'),
        vpdNight: avg('vpdNight'),
        _compacted: true,
      });
    }

    envData.readings = [...compacted.sort((a, b) => a.date.localeCompare(b.date)), ...recent];
    save('environment', envData);
    return true;
  } catch (err) {
    console.error('Compaction failed:', err);
    return false;
  }
}

// Legacy migration is now handled exclusively by js/migration.js
// (preInitMigration + postInitMigration). The old migrateFromLegacy
// function was removed to eliminate a double-import bug where
// migrateFromLegacy() and runMigration() would both read the same
// legacy localStorage keys and create duplicate data.


// ── Tests ──────────────────────────────────────────────────────────────

export function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  // Use a test-specific prefix to avoid polluting real data
  const testPrefix = '__test_storage_' + Date.now() + '_';

  // ─── Storage Tests ───

  // Round-trip integrity (using actual save/load functions)
  {
    // Temporarily add a test key to STORAGE_KEYS
    const testStorageKey = testPrefix + 'roundtrip';
    STORAGE_KEYS['__test_rt'] = testStorageKey;
    const data = { name: 'test', items: [1, 2, 3], nested: { a: true } };
    const saved = save('__test_rt', data);
    assert(saved === true, 'save() returns true on success');
    const loaded = load('__test_rt');
    assert(JSON.stringify(loaded) === JSON.stringify(data), 'save()/load() round-trip preserves data');
    assert(loaded.name === 'test', 'round-trip preserves string values');
    assert(loaded.items.length === 3, 'round-trip preserves arrays');
    assert(loaded.nested.a === true, 'round-trip preserves nested objects');
    localStorage.removeItem(testStorageKey);
    delete STORAGE_KEYS['__test_rt'];
  }

  // Missing key
  {
    const result = load(testPrefix + 'nonexistent_key_xyz');
    assert(result === null, 'load() returns null for missing key');
  }

  // Corrupted JSON
  {
    const corruptKey = testPrefix + 'corrupt';
    localStorage.setItem(corruptKey, '{invalid json!!!');
    const result = load(corruptKey);
    assert(result === null, 'load() returns null for corrupted JSON');
    localStorage.removeItem(corruptKey);
  }

  // Sequential migration
  {
    const testMigrations = {
      0: (data) => ({ ...data, field1: 'added-v1', version: 1 }),
      1: (data) => ({ ...data, field2: 'added-v2', version: 2 }),
      2: (data) => ({ ...data, field3: 'added-v3', version: 3 }),
    };

    // Temporarily inject test migrations
    const origMigrations = MIGRATIONS['__test'];
    MIGRATIONS['__test'] = testMigrations;

    // Temporarily set current version
    const origVersion = CURRENT_VERSIONS['__test'];
    CURRENT_VERSIONS['__test'] = 3;

    const oldData = { version: 0, original: true };
    const migrated = migrate('__test', oldData);
    assert(migrated.version === 3, 'migrate() runs to current version');
    assert(migrated.field1 === 'added-v1', 'migrate() v0->v1 adds field1');
    assert(migrated.field2 === 'added-v2', 'migrate() v1->v2 adds field2');
    assert(migrated.field3 === 'added-v3', 'migrate() v2->v3 adds field3');
    assert(migrated.original === true, 'migrate() preserves original data');

    // Cleanup
    delete MIGRATIONS['__test'];
    delete CURRENT_VERSIONS['__test'];
    if (origMigrations) MIGRATIONS['__test'] = origMigrations;
    if (origVersion) CURRENT_VERSIONS['__test'] = origVersion;
  }

  // No unnecessary migration
  {
    const origVersion = CURRENT_VERSIONS['__test2'];
    CURRENT_VERSIONS['__test2'] = 5;
    const data = { version: 5, value: 'unchanged' };
    const result = migrate('__test2', data);
    assert(result.version === 5, 'migrate() does not run if version is current');
    assert(result.value === 'unchanged', 'migrate() preserves data when no migration needed');
    delete CURRENT_VERSIONS['__test2'];
    if (origVersion) CURRENT_VERSIONS['__test2'] = origVersion;
  }

  // Capacity check
  {
    const cap = checkCapacity();
    assert(typeof cap.used === 'number', 'checkCapacity() returns used as number');
    assert(typeof cap.total === 'number', 'checkCapacity() returns total as number');
    assert(typeof cap.percentage === 'number', 'checkCapacity() returns percentage as number');
    assert(cap.total > 0, 'checkCapacity() total is positive');
    assert(cap.percentage >= 0 && cap.percentage <= 100, 'checkCapacity() percentage is 0-100');
  }

  // QuotaExceeded handling (simulated - we can't easily trigger real quota)
  {
    // Just verify save returns boolean
    const testKey = testPrefix + 'quota';
    const result = save(testKey, { small: 'data' });
    // This should succeed since we're saving small data
    // The important thing is it returns boolean, not throws
    assert(typeof result === 'boolean', 'save() returns boolean (does not throw)');
    localStorage.removeItem(STORAGE_KEYS[testKey] || testKey);
  }

  // Migration tests now live in js/migration.js (preInit/postInit phases).

  // exportAll
  {
    const testKey = STORAGE_KEYS.ui;
    localStorage.setItem(testKey, JSON.stringify({ test: true }));
    const exported = exportAll();
    assert(typeof exported === 'object', 'exportAll() returns object');
    assert(testKey in exported, 'exportAll() includes companion keys');
    localStorage.removeItem(testKey);
  }

  // Cleanup any remaining test keys
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(testPrefix)) {
      localStorage.removeItem(key);
    }
  }

  return results;
}
