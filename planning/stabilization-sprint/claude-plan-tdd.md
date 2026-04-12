# GrowDoc Stabilization Sprint — TDD Plan

Testing context: Browser-based test runner at `/test` route. Each module exports `runTests()` returning `[{ pass: boolean, msg: string }]`. No Node test framework. Playwright is the only npm devDependency (smoke test only).

---

## Section 1: Remove All Top-Level Awaits

### Tests to write BEFORE implementing

**In each affected module's `runTests()`:**

- Test: `_getEngine()` returns a Promise (not undefined or a raw value)
- Test: `_getEngine()` called twice returns the same Promise (memoization)
- Test: when engine import succeeds, returned module has expected exports (`getActiveEdgeCases`, `getBlockedActions`)
- Test: when engine is null (simulated failure), dependent functions return graceful defaults (empty arrays, no-ops)

**main.js specific:**
- Test: `getActiveEdgeCases` is a synchronous function (returns array, not Promise)
- Test: `getActiveEdgeCases` returns `[]` before engine loads
- Test: after engine loads (simulated), `getActiveEdgeCases` returns real edge-case data
- Test: `boot()` registration happens synchronously — `document.readyState` guard is called immediately at module evaluation

**timeline-bar.js specific:**
- Test: `renderStageDetail` handles null/missing edge-case engine gracefully

**task-engine.js specific:**
- Test: `generateTasks` works when engine is null (uses fallback path)
- Test: `generateTasks` works when engine is loaded (uses engine path)

**doctor-ui.js specific:**
- Test: `applyDoctorSuppression` works when engine is null

### Verification tests (run after implementation)
- Test: grep confirms zero top-level awaits outside function bodies
- Test: app boots with sidebar visible (Playwright smoke covers this)

---

## Section 2: Error Handling — Console Logging + Critical Banner

### Tests to write BEFORE implementing

**Part A — Console error logging:**

No dedicated tests needed for `console.error` additions — these are verified by grep in verification step. The test is the grep itself: zero empty catch blocks.

**Part B — error-banner.js `runTests()`:**

- Test: `showCriticalError('test message')` inserts a `.critical-error-banner` element into the DOM
- Test: banner contains the provided message text
- Test: banner has a dismiss button
- Test: `dismissError()` removes the banner from the DOM
- Test: `dismissError()` removes padding-top from `#app-shell`
- Test: calling `showCriticalError` twice replaces the first banner (no duplicates)
- Test: `showCriticalError` works when `#app-shell` doesn't exist (falls back to `document.body`)
- Test: cleanup — banner is removed after test to avoid visual side effects in the test runner

---

## Section 3: Cultivation Contradiction Resolution

### Tests to write BEFORE implementing

**advice-mites-raise-rh rule:**
- Test: rule does NOT fire when `ctx.stage` is `'mid-flower'`
- Test: rule does NOT fire when `ctx.stage` is `'late-flower'`
- Test: rule does NOT fire when `ctx.stage` is `'ripening'`
- Test: rule fires when `ctx.stage` is `'seedling'`
- Test: rule fires when `ctx.stage` is `'early-veg'`
- Test: rule fires when `ctx.stage` is `'late-veg'`

**advice-mites-spray rule:**
- Test: rule does NOT fire when `ctx.stage` is `'mid-flower'`
- Test: rule does NOT fire when `ctx.stage` is `'late-flower'`
- Test: rule fires when `ctx.stage` is `'early-veg'`

**Data consistency tests (per contradiction):**
- Test: drying temperature — all files referencing drying temp use 15-18C optimal / 15-21C acceptable
- Test: seedling VPD — all files referencing seedling VPD use 0.4-0.8 kPa
- Test: harvest amber — all files referencing harvest amber use 20-30%
- Test: epsom foliar timing — all files reference "before lights-on" (not "lights-off")
- Test: cure burp week 1 — all files reference 3x daily
- Test: late-flower RH — all files referencing late-flower RH use 45-50%

**Supplemental file:**
- Test: `edge-case-knowledge-supplemental.js` epsom entry (id containing "epsom") references "before lights-on"
- Test: `edge-case-knowledge-supplemental.js` harvest/amber entries use 20-30% range

---

## Section 4: Test Coverage Expansion

### Tests to write BEFORE implementing

This section IS the test-writing section. The TDD approach here means: for each module getting a new `runTests()`, define the test stubs before writing the test implementation.

**edge-case-engine.js:**
- Test: exported `getActiveEdgeCases` is a function
- Test: `getActiveEdgeCases` with valid plant + grow context returns an array
- Test: `getActiveEdgeCases` with null plant returns empty array
- Test: `getBlockedActions` with valid context returns an array

**question-matcher.js:**
- Test: exported `matchQuestion` is a function
- Test: matching a known keyword returns relevant questions
- Test: matching an unknown keyword returns empty or fallback

**stage-sources.js:**
- Test: `createStageNote` returns an object with required fields (text, timestamp)
- Test: `createStageQuestion` returns an object with required fields
- Test: `getStageObservations` returns an array

**error-banner.js:** (covered in Section 2 TDD above)

**migration.js:**
- Test: `preInitMigration` on clean state (no legacy keys) returns `{ migrated: false }`
- Test: `preInitMigration` does not crash when localStorage is empty
- Test: `_alreadyMigrated` returns true when V1 flag is set
- Test: `_alreadyMigrated` returns true when V2 flag is set
- Test: cleanup — remove any test flags/keys from localStorage after test

**plant-picker.js:**
- Test: `renderPlantPicker` creates DOM elements (chips)
- Test: selection callback fires with correct plant ID
- Test: cleanup — remove test DOM after test

**journal.js:**
- Test: aggregation returns entries sorted by timestamp (newest first)
- Test: aggregation handles empty log array

**Data modules (schema validation pattern for each):**
- Test: every entry has an `id` field (string, non-empty)
- Test: all IDs are unique (no duplicates)
- Test: required string fields are non-null, non-empty
- Test: required array fields are arrays with length > 0

---

## Section 5: Playwright Smoke Test

### Tests to write BEFORE implementing

This section creates the Playwright test itself. The test stubs ARE the implementation spec:

**tests/smoke.spec.js:**
- Test: page loads and `window.__growdocStore` is an object (not null/undefined)
- Test: sidebar element (`#sidebar` or `.sidebar`) has child elements
- Test: content element (`#content` or `.content`) has child elements
- Test: no unexpected console errors during boot (ignore non-critical catch logs from Section 2)

**Regression guard:**
- Test: reintroducing a top-level await would cause `__growdocStore` to be undefined (documented as a manual verification step, not an automated test)

---

## Section 6: localStorage Hardening

### Tests to write BEFORE implementing

**Part A — save() return value (in storage.js `runTests()`):**
- Test: `save('test-key', { a: 1 })` returns `true` on success
- Test: `save('test-key', value)` returns `false` when quota is exceeded (fill storage first)
- Test: `save('test-key', circularRef)` returns `false` on serialization error
- Test: cleanup — remove test keys from localStorage

**Part B — restore backup (in main.js or migration.js `runTests()`):**
- Test: `_hasBackupKeys()` returns `true` when `growdoc-legacy-backup-*` keys exist
- Test: `_hasBackupKeys()` returns `false` when no backup keys exist
- Test: `restoreBackup()` restores keys written by `_backupLegacyKey()`
- Test: `restoreBackup()` clears both V1 and V2 migration flags
- Test: cleanup — remove all test backup/migration keys

**Part C — lastSavedAt (in main.js `runTests()`):**
- Test: `_lastSavedAt` (or getter) is null before any save
- Test: after a successful `save()`, `_lastSavedAt` is a recent timestamp (within last second)
- Test: `_lastSavedAt` is NOT stored in the reactive store (verify `store.state.ui.lastSavedAt` is undefined)
