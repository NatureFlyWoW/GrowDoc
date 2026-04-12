// GrowDoc Companion — Migration Tests
//
// Tests for js/migration.js
// Covers preInitMigration() and postInitMigration() across the flag-guard
// paths, clean-localStorage path, and idempotency invariants.
//
// All tests clean up every localStorage key they touch via try/finally so
// the suite is fully isolated and leaves no state behind.

import { preInitMigration, postInitMigration, checkMigrationStatus } from '../migration.js';
import { LEGACY_KEYS } from '../storage.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const V1_FLAG = 'growdoc-companion-migrated';
const V2_FLAG = 'growdoc-companion-v2-migrated';

/** Remove both migration flags and all legacy / backup keys set during tests. */
function cleanupMigrationKeys() {
  localStorage.removeItem(V1_FLAG);
  localStorage.removeItem(V2_FLAG);

  // Remove any legacy backup keys written by _backupLegacyKey()
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('growdoc-legacy-')) toRemove.push(key);
  }
  toRemove.forEach(k => localStorage.removeItem(k));

  // Remove all known legacy source keys
  Object.values(LEGACY_KEYS).forEach(k => localStorage.removeItem(k));
}

/** Run fn() with guaranteed cleanup regardless of thrown errors. */
function withCleanup(fn) {
  try {
    return fn();
  } finally {
    cleanupMigrationKeys();
  }
}

// ── Test runner ────────────────────────────────────────────────────────────

export async function runTests() {
  const results = [];

  function assert(cond, msg) {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  }

  // ── preInitMigration — clean localStorage ────────────────────────────────

  // 1. Does not crash when localStorage is empty
  {
    withCleanup(() => {
      let threw = false;
      try {
        preInitMigration();
      } catch (_) {
        threw = true;
      }
      assert(!threw, 'preInitMigration: does not throw on empty localStorage');
    });
  }

  // 2. Returns a result object (non-null) on clean localStorage
  {
    withCleanup(() => {
      const result = preInitMigration();
      assert(result !== null && typeof result === 'object', 'preInitMigration: returns an object on clean localStorage');
    });
  }

  // 3. Returns { migrated: false } when no legacy data exists (nothing to migrate)
  {
    withCleanup(() => {
      const result = preInitMigration();
      assert(result && result.migrated === false, 'preInitMigration: returns migrated:false when no legacy keys present');
    });
  }

  // 4. Does NOT set the V2_FLAG when nothing was migrated
  {
    withCleanup(() => {
      preInitMigration();
      assert(localStorage.getItem(V2_FLAG) === null, 'preInitMigration: V2_FLAG not set when no legacy data found');
    });
  }

  // ── preInitMigration — V1_FLAG guard ─────────────────────────────────────

  // 5. When V1_FLAG is set, returns { migrated: false, reason: 'already-done' }
  {
    withCleanup(() => {
      localStorage.setItem(V1_FLAG, 'true');
      const result = preInitMigration();
      assert(result && result.migrated === false, 'preInitMigration: migrated:false when V1_FLAG is set');
      assert(result && result.reason === 'already-done', 'preInitMigration: reason is "already-done" when V1_FLAG is set');
    });
  }

  // 6. When V1_FLAG is set, does not touch or add any localStorage keys
  {
    withCleanup(() => {
      localStorage.setItem(V1_FLAG, 'true');
      const keysBefore = localStorage.length;
      preInitMigration();
      assert(localStorage.length === keysBefore, 'preInitMigration: does not add localStorage keys when V1_FLAG already set');
    });
  }

  // ── preInitMigration — V2_FLAG guard ─────────────────────────────────────

  // 7. When V2_FLAG is set, returns { migrated: false, reason: 'already-done' }
  {
    withCleanup(() => {
      localStorage.setItem(V2_FLAG, new Date().toISOString());
      const result = preInitMigration();
      assert(result && result.migrated === false, 'preInitMigration: migrated:false when V2_FLAG is set');
      assert(result && result.reason === 'already-done', 'preInitMigration: reason is "already-done" when V2_FLAG is set');
    });
  }

  // 8. When V2_FLAG is set, does not run migration logic (no extra writes)
  {
    withCleanup(() => {
      localStorage.setItem(V2_FLAG, new Date().toISOString());
      const keysBefore = localStorage.length;
      preInitMigration();
      assert(localStorage.length === keysBefore, 'preInitMigration: does not add localStorage keys when V2_FLAG already set');
    });
  }

  // ── preInitMigration — idempotency ───────────────────────────────────────

  // 9. Calling preInitMigration twice on clean state is safe (second call is no-op)
  {
    withCleanup(() => {
      preInitMigration(); // first call — may or may not migrate
      let threw = false;
      try {
        preInitMigration(); // second call — must not crash
      } catch (_) {
        threw = true;
      }
      assert(!threw, 'preInitMigration: second call on clean state does not throw');
    });
  }

  // 10. With legacy profile data present, sets V2_FLAG and reports migrated:true
  {
    withCleanup(() => {
      const profileData = JSON.stringify({ medium: 'soil', lighting: 'LED', experience: 'beginner' });
      localStorage.setItem(LEGACY_KEYS.growProfile, profileData);

      const result = preInitMigration();
      assert(result && result.migrated === true, 'preInitMigration: migrated:true when legacy grow-profile key exists');
      assert(localStorage.getItem(V2_FLAG) !== null, 'preInitMigration: sets V2_FLAG after successfully migrating legacy data');
    });
  }

  // 11. After migrating once, a second call is blocked by V2_FLAG
  {
    withCleanup(() => {
      const profileData = JSON.stringify({ medium: 'coco', lighting: 'HPS', experience: 'intermediate' });
      localStorage.setItem(LEGACY_KEYS.growProfile, profileData);

      preInitMigration(); // migrates
      const second = preInitMigration(); // should be blocked
      assert(second && second.migrated === false && second.reason === 'already-done',
        'preInitMigration: blocked on second call after V2_FLAG was set by first call');
    });
  }

  // ── postInitMigration ─────────────────────────────────────────────────────

  // 12. Returns an object (no crash) with a null/undefined store
  {
    withCleanup(() => {
      let threw = false;
      let result;
      try {
        result = postInitMigration(null);
      } catch (_) {
        threw = true;
      }
      assert(!threw, 'postInitMigration: does not throw when called with null store');
      assert(result !== undefined, 'postInitMigration: returns a value when called with null store');
    });
  }

  // 13. Returns { migrated: false, reason: 'noop' } (current implementation is a placeholder)
  {
    withCleanup(() => {
      const result = postInitMigration({});
      assert(result && result.migrated === false, 'postInitMigration: returns migrated:false (noop placeholder)');
      assert(result && result.reason === 'noop', 'postInitMigration: returns reason:"noop"');
    });
  }

  // 14. postInitMigration does not write any keys to localStorage
  {
    withCleanup(() => {
      const before = localStorage.length;
      postInitMigration({});
      assert(localStorage.length === before, 'postInitMigration: does not write to localStorage');
    });
  }

  // ── checkMigrationStatus ─────────────────────────────────────────────────

  // 15. Returns false when no flags are set
  {
    withCleanup(() => {
      const status = checkMigrationStatus();
      assert(status === false, 'checkMigrationStatus: returns false when neither flag is set');
    });
  }

  // 16. Returns true when V1_FLAG is set
  {
    withCleanup(() => {
      localStorage.setItem(V1_FLAG, 'true');
      assert(checkMigrationStatus() === true, 'checkMigrationStatus: returns true when V1_FLAG is set');
    });
  }

  // 17. Returns true when V2_FLAG is set
  {
    withCleanup(() => {
      localStorage.setItem(V2_FLAG, new Date().toISOString());
      assert(checkMigrationStatus() === true, 'checkMigrationStatus: returns true when V2_FLAG is set');
    });
  }

  return results;
}
