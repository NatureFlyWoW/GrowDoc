# Data Corruption Paths

## CRITICAL

### Concurrent Snapshot Mutation (Multiple Active Callsites)

- **dashboard.js:44-49 vs 53-56** — `pruneTasks` mutates `growSnap` in place, then the async `generateTasks` callback independently calls `store.getSnapshot().grow` and pushes to `snap.tasks`. If `renderDashboard` is called twice in rapid succession (e.g., two quick task completions), two concurrent Promises each hold separate snapshots of `grow`. Both call `store.commit('grow', snap)`. The second commit silently overwrites all mutations made by the first, including any tasks or stats written by `recordTaskCompletion`.

- **dashboard.js:385-405 (`_updateTask`)** — `store.getSnapshot().grow` is called inside the event handler, which runs synchronously. However, if a task update triggers `renderDashboard` (line 404) which triggers another `generateTasks` Promise, a new snapshot is taken. Any intervening commit (e.g., from another task card's snooze handler) between `getSnapshot` and `store.commit` at line 402 is lost. No optimistic lock or version check guards the commit.

### Migration Partial-Write Corruption

- **migration.js:197-203** — `preInitMigration` writes multiple keys in a `for...of` loop (`save('profile', ...)`, `save('grow', ...)`, etc.) without atomicity. If the browser crashes or the tab is closed between writes, some keys contain migrated v2 data and others still hold nothing (not yet migrated). On next boot, `_alreadyMigrated()` returns false (V2_FLAG not yet set) and migration re-runs, but some keys now already have v2 data. The migration will overwrite `grow` with a freshly-imported version while `profile` already holds v2 data, potentially creating an inconsistent cross-key state.

- **migration.js:202** — `localStorage.setItem(V2_FLAG, ...)` only runs if `importedKeys.length > 0`. If all legacy keys are absent (fresh install), the flag is never set. This is correct, but means the first time any legacy key appears later (import), migration will re-run. Not a corruption risk today, but fragile.

## HIGH

### QuotaExceededError Leaves State Half-Written

- **storage.js:46-70** — `save()` on quota overflow attempts compaction and retries. If the retry also fails, `save()` returns `false` and logs an error, but the caller (the debounced subscriber in main.js:65) discards the return value. The in-memory store remains updated while localStorage is stale. On reload the user gets the old version of data — silent rollback with no user notification.

- **main.js:65** — `debounce(() => save(key, store.state[key]), 300)` — return value of `save()` is never checked. Failed writes are invisible to the application.

### archive-then-new-grow Race Condition

- **storage.js** — `clearArchive()` directly loads, shifts, and saves `archive` without going through the store. If a store subscriber is mid-flight saving the same `archive` key (via the 300ms debounce), `clearArchive()` reads an older copy, removes one entry, and saves. The debounced save then fires with the pre-clearArchive snapshot, restoring the deleted entry. No version guard or SHA check exists on local storage writes.

### JSON Malformation on Interrupted Stringify

- **storage.js:49** — `localStorage.setItem(storageKey, JSON.stringify(data))` — if `data` contains a circular reference or a non-serializable value (e.g., a live DOM node accidentally stored in grow state), `JSON.stringify` throws. The catch block at line 51 checks only for `QuotaExceededError`. Any other serialization error falls to line 64 (`console.error`), returns `false`, and the key holds stale data. The `store.js` `_deepClone` fallback at line 96 returns the original object on `JSON.parse(JSON.stringify(...))` failure, which can introduce non-serializable references into state.

## MEDIUM

### Doctor-UI Saves to First Plant Regardless of Context

- **doctor-ui.js:219** — `const plant = grow.plants[0]` — Save Diagnosis always writes to the first plant in the array, even when the user is on a multi-plant grow and the displayed context plant is a different index. No confirmation; silent mis-attribution.

### Note Contextualizer Cache Staleness Window

- **note-contextualizer/index.js:612-616** — The debounce timer is 300ms. During that window, `getObservationIndex()` returns a stale cache. Any task generation or doctor suppression triggered within 300ms of a note write will operate on pre-write observations. Not a hard corruption, but can produce duplicate tasks or miss suppressions.

### Migration Backup Key Namespace Collision

- **migration.js:48** — Backup key format is `growdoc-legacy-backup-{original-key}`. If a legacy key is `growdoc-companion-grow`, the backup key becomes `growdoc-legacy-backup-growdoc-companion-grow`. The `exportAll()` in storage.js collects keys starting with `growdoc-companion`, so backup keys are not included. However, the `restoreBackup()` in main.js:354 looks for `growdoc-companion-backup-*`, which is a different prefix than `growdoc-legacy-backup-*`. These two backup namespaces are inconsistent — `_hasBackupKeys()` will never find migration-phase backups.
