# Section 06: localStorage Hardening

## Overview

This section fixes three localStorage-related reliability issues: (1) callers discard `save()`'s return value, (2) the Restore Backup button is broken due to a namespace mismatch, and (3) there is no "last saved" indicator. These changes touch `js/main.js`, `js/storage.js`, and `js/views/settings.js`.

**Dependencies:** Section 01 (remove top-level awaits) must be completed first.

**File coordination with Section 02:** Both sections modify `js/main.js`. This section owns the backup/restore functions (`_hasBackupKeys`, `restoreBackup`) and the auto-save wiring (around line 65). Section 02 owns the boot/error paths. Do not modify each other's regions.

## Background

### Current State of `save()` in `storage.js`

The `save()` function at `js/storage.js:46-70` already returns `true` on success and `false` on failure. It handles `QuotaExceededError` with a compaction attempt. This part is already correct.

### Callers That Discard the Return Value

The critical caller is the debounced auto-save in `js/main.js:64-67`:

```js
const debouncedSave = debounce(() => save(key, store.state[key]), 300);
```

The return value is discarded. Save failures are invisible.

### Backup Namespace Mismatch

- `migration.js:49` writes: `growdoc-legacy-backup-{key}`
- `main.js:345` (`_hasBackupKeys`) searches for: `growdoc-companion-backup`
- `main.js:357` (`restoreBackup`) searches for: `growdoc-companion-backup-`

These prefixes never match. The Restore Backup button never works.

### Migration Flag Clearing is Incomplete

`restoreBackup()` at line 367 only clears `growdoc-companion-migrated` (V1 flag). But `_alreadyMigrated()` checks BOTH V1 and V2 (`growdoc-companion-v2-migrated`). After restore, re-migration won't run.

---

## Tests (Write BEFORE Implementing)

### Part A -- save() Return Value Tests (add to `js/storage.js` `runTests()`)

- `save('test-key', circularRef)` returns `false` on serialization error
- Cleanup: remove test keys

### Part B -- Restore Backup Tests

- `_hasBackupKeys()` returns `true` when `growdoc-legacy-backup-*` keys exist
- `_hasBackupKeys()` returns `false` when no backup keys exist
- `restoreBackup()` restores keys written by `_backupLegacyKey()`
- `restoreBackup()` clears BOTH V1 and V2 migration flags
- Cleanup: remove all test backup/migration keys

### Part C -- lastSavedAt Tests

- `getLastSavedAt()` is `null` before any save
- After successful `save()`, `getLastSavedAt()` returns recent timestamp
- `store.state.ui.lastSavedAt` is `undefined` (NOT in reactive store -- guards against infinite loop)

---

## Implementation Details

### Part A: Wire Error Banner into Auto-Save Failures

**File:** `C:/GrowDoc/js/main.js` (around line 63-67)

Change the debounced auto-save callback to check return value:

```js
const debouncedSave = debounce(() => {
  const ok = save(key, store.state[key]);
  if (ok) {
    _lastSavedAt = Date.now();
  } else {
    showCriticalError('Data save failed -- storage may be full');
  }
}, 300);
```

Requires importing `showCriticalError` from `js/components/error-banner.js` (Section 02). If Section 02 is not yet landed, use `console.error()` placeholder.

### Part B: Fix Restore Backup Namespace

**File:** `C:/GrowDoc/js/main.js`

1. In `_hasBackupKeys()` (line 341): Change `'growdoc-companion-backup'` to `'growdoc-legacy-backup-'`:

```js
function _hasBackupKeys() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-legacy-backup-')) return true;
    }
  } catch { /* ignore */ }
  return false;
}
```

2. In `restoreBackup()` (line 351): Change prefix and clear both flags:

```js
function restoreBackup() {
  if (!confirm('...')) return;
  try {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('growdoc-legacy-backup-')) backupKeys.push(key);
    }
    for (const bk of backupKeys) {
      const originalKey = bk.replace('growdoc-legacy-backup-', '');
      const val = localStorage.getItem(bk);
      if (val) localStorage.setItem(originalKey, val);
    }
    // Clear BOTH migration flags so re-import runs on reload
    localStorage.removeItem('growdoc-companion-migrated');
    localStorage.removeItem('growdoc-companion-v2-migrated');
    location.reload();
  } catch (err) {
    alert('Restore failed: ' + err.message);
  }
}
```

### Part C: Add lastSavedAt Module-Level Variable

**File:** `C:/GrowDoc/js/main.js`

Add near the top (after imports, before `initStore()`):

```js
let _lastSavedAt = null;

export function getLastSavedAt() {
  return _lastSavedAt;
}
```

Updated inside debounced auto-save (Part A above) when `save()` returns `true`.

**Do NOT** store in `store.state.ui` -- would create infinite loop: save -> update lastSavedAt -> commit ui -> trigger debounced save -> save -> ...

### Part C (continued): Display in Settings View

**File:** `C:/GrowDoc/js/views/settings.js`

Import `getLastSavedAt` from `../main.js`. In `_renderStorageUsage()`, after the storage bar, add:

```js
const lastSaved = getLastSavedAt();
const savedLabel = document.createElement('div');
savedLabel.style.marginTop = '8px';
savedLabel.style.fontSize = '0.85rem';
savedLabel.style.color = 'var(--text-muted)';
if (lastSaved) {
  const ago = Math.round((Date.now() - lastSaved) / 1000);
  if (ago < 5) savedLabel.textContent = 'Last saved: just now';
  else if (ago < 60) savedLabel.textContent = `Last saved: ${ago}s ago`;
  else savedLabel.textContent = `Last saved: ${Math.round(ago / 60)}m ago`;
} else {
  savedLabel.textContent = 'Last saved: not yet this session';
}
section.appendChild(savedLabel);
```

Static display -- shows value at render time. No live-update timer.

---

## Files Modified Summary

| File | Change |
|------|--------|
| `js/main.js` | Fix `_hasBackupKeys()` prefix, fix `restoreBackup()` prefix + clear V2 flag, add `_lastSavedAt` + `getLastSavedAt()`, wire save-failure handling |
| `js/views/settings.js` | Import `getLastSavedAt`, add "Last saved" display |
| `js/storage.js` | No changes -- already returns `true`/`false` correctly |
| `js/migration.js` | No changes -- `_backupLegacyKey()` prefix is correct |
| `js/components/error-banner.js` | Import only (dependency from Section 02) |

---

## Verification Checklist

1. `save()` returns `false` when localStorage is full
2. Critical error banner appears on save failure (requires Section 02)
3. Restore Backup correctly detects `growdoc-legacy-backup-*` keys
4. Restore Backup restores data and clears BOTH V1 and V2 flags
5. After restore + reload, `preInitMigration()` runs again
6. Settings shows "Last saved: just now" after a state change
7. `store.state.ui.lastSavedAt` is `undefined` (no infinite loop)
8. No regressions in existing `storage.js` tests
