// GrowDoc Companion — Data Migration from Legacy Tools

import { generateId } from './utils.js';

const MIGRATION_FLAG = 'growdoc-companion-v2-migrated';

/**
 * runMigration(store) — One-time migration from legacy localStorage keys.
 * Detects old data, transforms it, imports into companion format.
 */
export function runMigration(store) {
  if (localStorage.getItem(MIGRATION_FLAG)) return { migrated: false, reason: 'already-migrated' };

  const results = { migrated: false, imported: [] };

  try {
    // Plant Doctor data
    const doctorData = _readLegacyKey('growdoc-plant-doctor');
    if (doctorData) {
      _migratePlantDoctor(store, doctorData);
      results.imported.push('plant-doctor');
    }

    // Cure Tracker data
    const cureData = _readLegacyKey('growdoc-cure-tracker');
    if (cureData) {
      _migrateCureTracker(store, cureData);
      results.imported.push('cure-tracker');
    }

    // Environment Dashboard data
    const envData = _readLegacyKey('growdoc-env-dashboard');
    if (envData) {
      _migrateEnvironment(store, envData);
      results.imported.push('env-dashboard');
    }

    // Grow Profile data
    const profileData = _readLegacyKey('growdoc-grow-profile');
    if (profileData) {
      _migrateProfile(store, profileData);
      results.imported.push('grow-profile');
    }

    if (results.imported.length > 0) {
      results.migrated = true;
      localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    }
  } catch (err) {
    console.error('Migration error:', err);
    results.error = err.message;
  }

  return results;
}

function _readLegacyKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function _migratePlantDoctor(store, data) {
  // Legacy format: { sessions: [{ symptoms, results, timestamp }] }
  if (!data.sessions || !Array.isArray(data.sessions)) return;

  const grow = store.getSnapshot().grow;
  if (!grow || !grow.plants || grow.plants.length === 0) return;

  const plant = grow.plants[0]; // Assign to first plant
  if (!plant.diagnoses) plant.diagnoses = [];

  for (const session of data.sessions) {
    if (session.results && session.results.length > 0) {
      plant.diagnoses.push({
        name: session.results[0].condition || 'Imported diagnosis',
        confidence: session.results[0].confidence || 0,
        symptoms: session.symptoms || [],
        date: session.timestamp || new Date().toISOString(),
        outcome: 'pending',
        source: 'migration-v1',
      });
    }
  }

  store.commit('grow', grow);
}

function _migrateCureTracker(store, data) {
  // Legacy format: { jars: [{ name, entries: [{ date, rh, smell, burps }] }] }
  if (!data.jars || !Array.isArray(data.jars)) return;

  const grow = store.getSnapshot().grow;
  if (!grow || !grow.plants || grow.plants.length === 0) return;

  const plant = grow.plants[0];
  if (!plant.logs) plant.logs = [];

  for (const jar of data.jars) {
    for (const entry of (jar.entries || [])) {
      plant.logs.push({
        id: generateId(),
        date: entry.date || new Date().toISOString(),
        timestamp: entry.date || new Date().toISOString(),
        type: 'curing',
        jarRH: entry.rh || null,
        smell: entry.smell || null,
        burpCount: entry.burps || 0,
        source: 'migration-cure-tracker',
      });
    }
  }

  store.commit('grow', grow);
}

function _migrateEnvironment(store, data) {
  // Legacy format: { lastTemp, lastRH, lastVPD }
  const envSnap = store.getSnapshot().environment || { readings: [] };
  if (!envSnap.readings) envSnap.readings = [];

  if (data.lastTemp && data.lastRH) {
    envSnap.readings.push({
      date: new Date().toISOString().split('T')[0],
      tempHigh: data.lastTemp,
      tempLow: data.lastTemp - 4,
      rhHigh: data.lastRH + 5,
      rhLow: data.lastRH - 5,
      vpdDay: data.lastVPD || null,
      vpdNight: null,
      source: 'migration-env-dashboard',
    });
    store.commit('environment', envSnap);
  }
}

function _migrateProfile(store, data) {
  // Legacy format: { medium, lighting }
  const profile = store.getSnapshot().profile || {};
  if (data.medium && !profile.medium) profile.medium = data.medium;
  if (data.lighting && !profile.lighting) profile.lighting = data.lighting;
  store.commit('profile', profile);
}

/**
 * checkMigrationStatus() — Returns whether migration has been run.
 */
export function checkMigrationStatus() {
  return !!localStorage.getItem(MIGRATION_FLAG);
}
