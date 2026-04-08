# Section 02: Store, Storage & Data Migration -- Code Review

## Summary

The implementation delivers a functional reactive store and localStorage abstraction that covers the majority of the section plan. The core architecture (Proxy-based state, commit/subscribe pattern, event bus, localStorage with versioning) is sound. However, there are two bugs that will cause issues at runtime, several missing plan features, and a handful of test coverage gaps that should be addressed before moving on.

---

## CRITICAL

### C1. `store.off()` can never remove an event listener

**File:** `C:/GrowDoc/js/store.js`, lines 149-158

The `on()` method wraps the user's callback in an anonymous arrow function before passing it to `addEventListener`:

```js
on(eventName, callback) {
  _eventBus.addEventListener(eventName, (e) => callback(e.detail));
},
```

But `off()` passes the original unwrapped `callback` to `removeEventListener`:

```js
off(eventName, callback) {
  _eventBus.removeEventListener(eventName, callback);
},
```

Since the wrapper function `(e) => callback(e.detail)` is a different reference from `callback`, `removeEventListener` will never find a match. Event listeners registered via `on()` can never be removed. This is a memory leak and correctness bug that will compound as components mount/unmount during navigation.

**Recommended fix:** Store the wrapper reference so `off()` can pass the same function to `removeEventListener`:

```js
const _eventListeners = new Map(); // callback -> wrapper

on(eventName, callback) {
  const wrapper = (e) => callback(e.detail);
  if (!_eventListeners.has(callback)) _eventListeners.set(callback, new Map());
  _eventListeners.get(callback).set(eventName, wrapper);
  _eventBus.addEventListener(eventName, wrapper);
},

off(eventName, callback) {
  const wrappers = _eventListeners.get(callback);
  if (wrappers) {
    const wrapper = wrappers.get(eventName);
    if (wrapper) {
      _eventBus.removeEventListener(eventName, wrapper);
      wrappers.delete(eventName);
    }
  }
},
```

### C2. `restoreBackup()` in main.js produces invalid target keys

**File:** `C:/GrowDoc/js/main.js`, lines 163-180

The backup keys are formatted as `growdoc-companion-backup-growdoc-plant-doctor` (the literal legacy key is appended). The restore logic does:

```js
const targetKey = bk.replace('-backup-', '-');
```

For a backup key like `growdoc-companion-backup-growdoc-plant-doctor`, this produces `growdoc-companion-growdoc-plant-doctor`, which is not a valid companion key and not the original legacy key. The restore function silently writes data to meaningless keys.

**Recommended fix:** Either store metadata about the original key alongside the backup, or parse the backup key format differently. The simplest approach: the backup naming convention includes the full legacy key after `growdoc-companion-backup-`, so extract that:

```js
for (const bk of backupKeys) {
  const originalLegacyKey = bk.replace('growdoc-companion-backup-', '');
  const val = localStorage.getItem(bk);
  if (val) localStorage.setItem(originalLegacyKey, val);
}
```

This restores data back to the original legacy keys, which is the stated intent in the plan: "Restore old data option that reverts to pre-migration backup."

---

## IMPORTANT

### I1. `migrate()` is never called during data loading

**File:** `C:/GrowDoc/js/storage.js` and `C:/GrowDoc/js/main.js`

The plan states: "At startup, `storage.load()` detects version mismatches and runs migration functions sequentially." The `migrate()` function exists and is tested, but it is never integrated into the `load()` function or called in `initStore()`. When schema versions increment in the future, loaded data will not be migrated.

**Recommended fix:** Either call `migrate()` inside `load()` and re-save if the version changed, or call it in `initStore()` after loading each key:

```js
function initStore() {
  const profile = migrate('profile', load('profile') || {});
  const grow = migrate('grow', load('grow') || {});
  // ... etc
}
```

### I2. Cure tracker legacy migration is missing

**File:** `C:/GrowDoc/js/storage.js`, `migrateFromLegacy()` function

The plan specifies five legacy key sources: plant-doctor, grow-profile, plants, cure-tracker, and env-dashboard. The `LEGACY_KEYS` constant includes `cureTracker: 'growdoc-cure-tracker'`, but `migrateFromLegacy()` never reads or processes it. Users with existing cure tracker data will not have it imported.

**Recommended fix:** Add a cure tracker import block in `migrateFromLegacy()` that maps cure tracker data to the appropriate companion format (likely grow stage data or a dedicated section).

### I3. Round-trip test does not use `save()` and `load()` functions

**File:** `C:/GrowDoc/js/storage.js`, lines 374-381

The test labeled "save()/load() round-trip preserves data" uses raw `localStorage.setItem()` and `localStorage.getItem()` calls instead of the actual `save()` and `load()` functions. This means the round-trip test does not actually exercise the code it claims to test -- specifically the key mapping through `STORAGE_KEYS`, the `JSON.parse`/`JSON.stringify` handling in `save()`/`load()`, and the QuotaExceeded error path.

**Recommended fix:**

```js
{
  const testKey = testPrefix + 'roundtrip';
  const data = { name: 'test', items: [1, 2, 3], nested: { a: true } };
  const saved = save(testKey, data);
  assert(saved === true, 'save() returns true on success');
  const loaded = load(testKey);
  assert(JSON.stringify(loaded) === JSON.stringify(data), 'save()/load() round-trip preserves data');
  localStorage.removeItem(STORAGE_KEYS[testKey] || testKey);
}
```

### I4. Proxy `set` trap allows uncontrolled top-level mutation without deep-cloning

**File:** `C:/GrowDoc/js/store.js`, lines 22-28

The Proxy `set` trap allows `store.state.foo = bar` to succeed and triggers notification. But unlike `commit()`, this path does not deep-clone the value, so the stored state holds a reference to the caller's object. This creates two mutation paths with different safety guarantees, which can lead to subtle bugs.

**Recommended fix:** Either (a) make the `set` trap throw or warn to enforce commit-only mutations, or (b) deep-clone in the `set` trap as well:

Option A (preferred -- enforces the documented pattern):
```js
set(target, prop, value) {
  console.warn(`Direct state assignment to "${prop}" detected. Use store.commit() instead.`);
  // Still allow it but deep-clone for safety
  const oldVal = target[prop];
  target[prop] = _deepClone(value);
  _notify(prop, oldVal, target[prop]);
  return true;
},
```

### I5. No test for `off()` / event bus listener removal

**File:** `C:/GrowDoc/js/store.js`, tests section

There is a test for `unsubscribe()` on state subscribers, but no test verifying that `off()` actually removes event bus listeners. Given the bug in C1, a test here would have caught it immediately.

**Recommended fix:** Add a test:

```js
{
  const store = createStore({});
  let count = 0;
  const handler = (data) => { count++; };
  store.on('test:event', handler);
  store.publish('test:event', {});
  assert(count === 1, 'event listener fires');
  store.off('test:event', handler);
  store.publish('test:event', {});
  assert(count === 1, 'event listener removed by off()');
}
```

### I6. Migration does not overwrite existing companion data

**File:** `C:/GrowDoc/js/storage.js`, `migrateFromLegacy()` lines 317-319

When `migrateFromLegacy()` imports legacy data, it saves it unconditionally:

```js
for (const [key, data] of Object.entries(imported)) {
  save(key, data);
}
```

If the user already has companion data (from a previous partial migration or manual setup) but the migration flag was somehow cleared, this overwrites their existing companion data with potentially older legacy data. The function should check whether companion data already exists for each key before overwriting.

---

## SUGGESTION

### S1. `window.__growdocStore` is a global escape hatch

**File:** `C:/GrowDoc/js/main.js`, line 59

Exposing the store on `window` works for bootstrapping but bypasses module boundaries. Consider documenting this as temporary and planning to replace it with a proper module import or dependency injection pattern (e.g., a `getStore()` singleton export from `store.js`) before downstream sections start depending on it.

### S2. `_deepClone` silently returns the original on failure

**File:** `C:/GrowDoc/js/store.js`, lines 67-74

The `_deepClone` function catches errors and returns the original un-cloned object. This means data with circular references or non-serializable values (functions, DOM nodes, `undefined` values) will bypass cloning silently, leading to shared references that could cause mutation bugs. Consider at least logging a warning when the clone fails.

### S3. `compactEnvironmentReadings()` threshold of 60 readings may be too high

**File:** `C:/GrowDoc/js/storage.js`, line 199

The compaction guard `envData.readings.length < 60` means compaction only runs when there are 60+ readings. Since compaction is called as a recovery strategy when quota is exceeded, a lower threshold (or no threshold) would be more helpful in an emergency. When called from the quota-exceeded handler, the priority is freeing space, not preserving granularity.

### S4. Missing plan features: recovery screen with migration failure, 80% capacity warning

**File:** `C:/GrowDoc/js/storage.js`

The plan specifies:
1. Migration failure triggers a recovery screen with "Restore old data" / "Start fresh" / "Export" options. The implementation returns an error object but does not render a recovery screen.
2. `checkCapacity()` should warn the UI at 80% capacity. The function returns data but never triggers a warning.

These may be deferred to later sections, but they should be tracked.

### S5. Second save/load test also bypasses `save()`/`load()`

**File:** `C:/GrowDoc/js/storage.js`, lines 384-392

Same issue as I3 -- the test labeled "save/load preserves numeric values" uses raw `localStorage` calls, not the `save()` and `load()` functions.

### S6. `exportAll()` prefix match is slightly too broad

**File:** `C:/GrowDoc/js/storage.js`, line 162

The `key.startsWith('growdoc-companion')` prefix also matches backup keys (`growdoc-companion-backup-*`). This may or may not be desired. If the export is meant for data recovery, including backups is fine. If it's for data portability, the backups add noise. Consider using `growdoc-companion-` (with trailing hyphen) or explicitly filtering out backup keys.

---

## POSITIVE

### P1. Clean architecture and separation of concerns

The store and storage modules are properly separated. The store handles reactivity and event bus; the storage handles persistence. Neither knows about the other's internals. The wiring happens in `main.js` which is the correct location.

### P2. Commit pattern enforces immutable updates

The `commit()` method deep-clones incoming values, preventing external mutation of stored state. This is a solid defensive practice that will prevent subtle bugs as the app grows.

### P3. Thorough test coverage for core paths

The tests cover all six store test cases from the plan plus additional cases (unsubscribe, get/set deep path, getSnapshot, wildcard). The migration tests cover all four specified cases. Test isolation with unique prefixes and cleanup is well done.

### P4. Compaction logic is well-implemented

The environment reading compaction properly groups by ISO week, averages numeric fields, preserves recent readings, marks compacted entries with `_compacted: true` for downstream awareness, and sorts the final array. This is a thoughtful implementation.

### P5. Error boundaries are consistent

Every public function in both modules catches exceptions and returns safe defaults (null, false, empty objects). Console warnings distinguish between expected issues (missing keys) and unexpected errors. No function can crash the app.

### P6. Legacy migration preserves original data

The `migrateFromLegacy()` function creates backups of legacy keys before saving companion data, never deletes originals, and uses an idempotent migration flag. The data preservation design is correct.

---

## Summary Checklist

| Category | Count | Items |
|----------|-------|-------|
| CRITICAL | 2 | C1 (off() broken), C2 (restoreBackup invalid keys) |
| IMPORTANT | 6 | I1-I6 |
| SUGGESTION | 6 | S1-S6 |
| POSITIVE | 6 | P1-P6 |

**Recommendation:** Fix C1 and C2 before proceeding. I1 (migrate integration), I3 (round-trip test), and I5 (off() test) should also be addressed in this section since they affect the data backbone's reliability. I2 (cure tracker) and I4 (proxy set trap) can be deferred if needed but should be tracked.
