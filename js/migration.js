// GrowDoc Companion — Data Migration from Legacy Tools
//
// Two-phase migration:
//
//   preInitMigration()       — runs BEFORE initStore(). Writes legacy
//                              v1 data directly into v2 localStorage
//                              keys via save(). No store parameter.
//
//   postInitMigration(store) — runs AFTER initStore(). Handles anything
//                              that requires a live store instance.
//                              Currently a placeholder for future
//                              store-dependent migration steps.
//
// Both phases honor BOTH legacy completion flags:
//   - growdoc-companion-migrated     (old v1 flag, pre-split)
//   - growdoc-companion-v2-migrated  (new unified flag)
//
// If either flag is already set, migration refuses to run — preventing
// duplicate imports when a user has partially migrated data from an
// earlier build of the app.

import { generateId } from './utils.js';
import { save, load, LEGACY_KEYS, STORAGE_KEYS } from './storage.js';
import { showCriticalError } from './components/error-banner.js';

const V1_FLAG = 'growdoc-companion-migrated';
const V2_FLAG = 'growdoc-companion-v2-migrated';

/**
 * Check both legacy completion flags. Returns true if EITHER is set,
 * meaning migration has already run in some form and must not re-run.
 */
function _alreadyMigrated() {
  return !!(localStorage.getItem(V1_FLAG) || localStorage.getItem(V2_FLAG));
}

function _readLegacyKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[migration:read-legacy]', err);
    return null;
  }
}

function _backupLegacyKey(key) {
  const val = localStorage.getItem(key);
  if (val === null) return;
  try {
    localStorage.setItem(`growdoc-legacy-backup-${key}`, val);
  } catch (err) {
    console.error('[migration:backup-legacy]', err);
    // Ignore backup failures — original key is still intact.
  }
}

/**
 * Phase 1: Direct localStorage rewrite of legacy v1 data into v2 keys.
 * Runs BEFORE initStore(). Idempotent — no-op if either legacy
 * completion flag is already set. On success, sets V2_FLAG so both
 * phases refuse to re-run.
 *
 * Imports: profile, plants, plant-doctor diagnoses & history,
 *          cure-tracker entries, env-dashboard readings.
 * Backs up each legacy key it reads from.
 */
export function preInitMigration() {
  if (_alreadyMigrated()) {
    return { migrated: false, reason: 'already-done' };
  }

  const imported = {};
  const importedKeys = [];

  try {
    // ── Grow profile ────────────────────────────────────────────
    const legacyProfile = _readLegacyKey(LEGACY_KEYS.growProfile);
    if (legacyProfile) {
      imported.profile = {
        version: 1,
        medium: legacyProfile.medium || null,
        lighting: legacyProfile.lighting || null,
        lightWattage: legacyProfile.lightWattage || null,
        experience: legacyProfile.experience || null,
        priorities: legacyProfile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 },
      };
      _backupLegacyKey(LEGACY_KEYS.growProfile);
      importedKeys.push('profile');
    }

    // ── Plants roster ───────────────────────────────────────────
    const legacyPlants = _readLegacyKey(LEGACY_KEYS.plants);
    if (legacyPlants && Array.isArray(legacyPlants)) {
      imported.grow = imported.grow || {};
      imported.grow.plants = legacyPlants.map(p => ({
        id: p.id || generateId(),
        name: p.name || 'Plant',
        strainId: null,
        strainCustom: p.strain ? { name: p.strain } : null,
        stage: p.stage || 'veg',
        stageStartDate: p.stageStartDate || new Date().toISOString(),
        logs: [],
        diagnoses: [],
        training: { method: 'none', milestones: [] },
      }));
      _backupLegacyKey(LEGACY_KEYS.plants);
      importedKeys.push('plants');
    }

    // ── Plant Doctor diagnoses and outcomes ─────────────────────
    const legacyDoctor = _readLegacyKey(LEGACY_KEYS.plantDoctor);
    if (legacyDoctor) {
      // Pull reusable outcome history for the outcomes store
      if (legacyDoctor.history && Array.isArray(legacyDoctor.history)) {
        imported.outcomes = legacyDoctor.history.map(h => ({
          diagnosisId: h.diagnosisId || h.id,
          treatment: h.treatment,
          medium: h.medium,
          resolved: h.resolved ?? null,
          daysToResolve: h.daysToResolve ?? null,
        }));
        importedKeys.push('outcomes');
      }

      // Attach session results as diagnoses to the first plant, if any
      if (legacyDoctor.sessions && Array.isArray(legacyDoctor.sessions) && imported.grow?.plants?.length > 0) {
        const firstPlant = imported.grow.plants[0];
        firstPlant.diagnoses = firstPlant.diagnoses || [];
        for (const session of legacyDoctor.sessions) {
          if (session.results && session.results.length > 0) {
            firstPlant.diagnoses.push({
              name: session.results[0].condition || 'Imported diagnosis',
              confidence: session.results[0].confidence || 0,
              symptoms: session.symptoms || [],
              date: session.timestamp || new Date().toISOString(),
              outcome: 'pending',
              source: 'migration-v1',
            });
          }
        }
      }

      _backupLegacyKey(LEGACY_KEYS.plantDoctor);
    }

    // ── Cure Tracker entries → logs on first plant ──────────────
    const legacyCure = _readLegacyKey(LEGACY_KEYS.cureTracker);
    if (legacyCure) {
      imported.grow = imported.grow || {};
      imported.grow.cureData = {
        entries: legacyCure.entries || [],
        settings: legacyCure.settings || {},
      };
      if (legacyCure.jars && Array.isArray(legacyCure.jars) && imported.grow.plants?.length > 0) {
        const firstPlant = imported.grow.plants[0];
        firstPlant.logs = firstPlant.logs || [];
        for (const jar of legacyCure.jars) {
          for (const entry of (jar.entries || [])) {
            firstPlant.logs.push({
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
      }
      _backupLegacyKey(LEGACY_KEYS.cureTracker);
      importedKeys.push('cure');
    }

    // ── Environment Dashboard readings ──────────────────────────
    const legacyEnv = _readLegacyKey(LEGACY_KEYS.envDashboard);
    if (legacyEnv) {
      const readings = Array.isArray(legacyEnv.readings) ? legacyEnv.readings.slice() : [];
      // One-shot snapshot from lastTemp/lastRH if no readings array
      if (readings.length === 0 && legacyEnv.lastTemp && legacyEnv.lastRH) {
        readings.push({
          date: new Date().toISOString().split('T')[0],
          tempHigh: legacyEnv.lastTemp,
          tempLow: legacyEnv.lastTemp - 4,
          rhHigh: legacyEnv.lastRH + 5,
          rhLow: legacyEnv.lastRH - 5,
          vpdDay: legacyEnv.lastVPD || null,
          vpdNight: null,
          source: 'migration-env-dashboard',
        });
      }
      imported.environment = { version: 1, readings };
      _backupLegacyKey(LEGACY_KEYS.envDashboard);
      importedKeys.push('environment');
    }

    // ── Write everything to v2 localStorage keys ───────────────
    for (const [key, data] of Object.entries(imported)) {
      save(key, data);
    }

    // Set unified flag so neither phase ever runs again
    if (importedKeys.length > 0) {
      localStorage.setItem(V2_FLAG, new Date().toISOString());
    }

    return { migrated: importedKeys.length > 0, keys: importedKeys };
  } catch (err) {
    console.error('[migration:pre-init]', err);
    showCriticalError('Data migration failed \u2014 your data may need recovery');
    return { migrated: false, reason: 'error', error: err.message };
  }
}

/**
 * Phase 2: Store-dependent migration steps. Runs AFTER initStore().
 * Currently a placeholder — all legacy imports happen in preInit.
 * Kept as an extension point so future migrations that need to
 * touch the reactive store have a canonical hook.
 *
 * Also honors both legacy flags so it cannot run twice.
 */
// eslint-disable-next-line no-unused-vars
export function postInitMigration(store) {
  // No-op for now. Future migrations that need store.commit() live here.
  // We intentionally do NOT re-read legacy keys in this phase — that's
  // what caused the duplication bug the old runMigration() had.
  return { migrated: false, reason: 'noop' };
}

/**
 * checkMigrationStatus() — Returns whether migration has been run.
 */
export function checkMigrationStatus() {
  return _alreadyMigrated();
}
