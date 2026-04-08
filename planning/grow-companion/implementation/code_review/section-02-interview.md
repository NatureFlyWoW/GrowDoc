# Section 02 Code Review Interview

## Triage Summary

| Finding | Category | Action | Status |
|---------|----------|--------|--------|
| C1: store.off() broken | CRITICAL | Auto-fix | Applied |
| C2: restoreBackup() bad key mapping | CRITICAL | Auto-fix | Applied |
| I1: migrate() not called at load | IMPORTANT | Auto-fix | Applied |
| I2: Cure tracker migration missing | IMPORTANT | Auto-fix | Applied |
| I3: Round-trip test uses raw localStorage | IMPORTANT | Auto-fix | Applied |
| I4: Proxy set lacks deep-clone | IMPORTANT | Auto-fix | Applied |
| I5: No off() test | IMPORTANT | Auto-fix | Applied |
| I6: migrateFromLegacy overwrite | IMPORTANT | Let go | By design - flag check prevents re-run |

## Auto-fixes Applied

### C1: store.off() listener removal
- Added `_eventListeners` Map to store `originalCallback -> wrappedCallback` mapping
- `on()` stores the mapping using `eventName::callback` as key
- `off()` looks up the wrapped callback and removes it correctly

### C2: restoreBackup() key mapping
- Backup keys are `growdoc-companion-backup-{legacy-key}` (e.g., `growdoc-companion-backup-growdoc-plant-doctor`)
- Fixed to extract the original legacy key name and restore it
- Also clears the migration flag so the next load re-imports from the restored legacy keys

### I1: Schema migrations at load time
- Added `migrate()` call for each key in `initStore()` before creating the store
- Each key is loaded, migrated if version is stale, then passed to createStore

### I2: Cure tracker migration
- Added import block for `LEGACY_KEYS.cureTracker` in `migrateFromLegacy()`
- Maps cure entries and settings into `grow.cureData`

### I3: Round-trip test
- Rewrote to use actual `save()`/`load()` functions with a temporary test key in STORAGE_KEYS

### I4: Proxy set deep-clone
- `set` trap now calls `_deepClone(value)` before assigning, matching `commit()` behavior

### I5: Event bus off() test
- Added test: registers listener, fires event (count=1), calls off(), fires again (count still 1)

## Items Let Go

### I6: Overwrite concern
The migration flag check at the top of `migrateFromLegacy()` prevents re-running. If the flag is deliberately cleared (e.g., by restoreBackup), overwriting is the intended behavior.
