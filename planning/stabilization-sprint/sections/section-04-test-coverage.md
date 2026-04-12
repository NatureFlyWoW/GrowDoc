# Section 4: Test Coverage Expansion

## Overview

This section adds `runTests()` exports to every module with meaningful logic that currently lacks tests, and registers them all in the test runner. It also fixes the existing `edge-case-engine.js` `runTests()` which returns a boolean instead of the expected `{pass, msg}[]` array. The target is approximately 900+ total assertions and approximately 70% file coverage across the browser-based test runner.

**Dependencies:** Sections 01, 02, 03, and 06 must be completed first. Those sections stabilize the async boot chain, add the error banner component, resolve cultivation data contradictions, and harden localStorage -- all of which produce the stable APIs this section tests against.

**Blocks:** Section 05 (Playwright smoke test) depends on this section being complete.

---

## Test Runner Convention

All tests in GrowDoc follow a browser-based pattern. Each module exports a `runTests()` function that returns `Array<{pass: boolean, msg: string}>`. The test runner at the `/test` route (rendered by `renderTestRunner()` in `js/main.js` starting at line 392) dynamically imports each module and calls `runTests()`, tallying pass/fail counts.

Helper pattern used in every test module:

```js
const results = [];
const assert = (cond, msg) => results.push({ pass: !!cond, msg });
// ... tests ...
return results;
```

---

## Files to Create

| File | Tests for |
|------|-----------|
| `js/tests/edge-case-engine-expanded.test.js` | Additional tests for `edge-case-engine.js` |
| `js/tests/stage-sources.test.js` | `js/data/note-contextualizer/stage-sources.js` |
| `js/tests/migration.test.js` | `js/migration.js` |
| `js/tests/plant-picker.test.js` | `js/components/plant-picker.js` |
| `js/tests/journal.test.js` | `js/views/journal.js` (`_aggregateNotes`) |
| `js/tests/data-schema.test.js` | Schema validation for all data-only modules |
| `js/tests/error-banner.test.js` | `js/components/error-banner.js` (created in Section 02) |

## Files to Modify

### `js/data/edge-case-engine.js`

**Problem:** The existing `runTests()` at line 588 returns `true` instead of `{pass, msg}[]`. The test runner calls `results.filter(r => r.pass)` which crashes.

**Fix:** Rewrite `runTests()` to use the standard pattern: `const results = []`, `assert = (cond, msg) => results.push({ pass: !!cond, msg })`, keep all 7 existing tests, `return results`.

Add new tests:
- `getActiveEdgeCases` is a function (type check)
- `getActiveEdgeCases` with valid plant + grow context returns an array
- `getActiveEdgeCases` with null plant returns empty array
- `getBlockedActions` with valid context returns an array or Set

### `js/main.js` (test runner module list)

Add entries to the `modules` array in `renderTestRunner()` at line 396 for every new test file:

- `{ name: 'edge-case-engine', path: './data/edge-case-engine.js' }` (was never registered)
- `{ name: 'edge-case-engine-expanded', path: './tests/edge-case-engine-expanded.test.js' }`
- `{ name: 'stage-sources', path: './tests/stage-sources.test.js' }`
- `{ name: 'migration', path: './tests/migration.test.js' }`
- `{ name: 'plant-picker', path: './tests/plant-picker.test.js' }`
- `{ name: 'journal', path: './tests/journal.test.js' }`
- `{ name: 'data-schema', path: './tests/data-schema.test.js' }`
- `{ name: 'error-banner', path: './tests/error-banner.test.js' }`

### `js/views/journal.js`

Export `_aggregateNotes` for testing: add `export { _aggregateNotes };` at the end.

---

## Test Specifications per Module

### 1. edge-case-engine.js (fix + expand)

- `getActiveEdgeCases` is exported and is a function
- `getActiveEdgeCases({ plant, grow, observations, nowMs })` with valid plant returns an array
- `getActiveEdgeCases` with `null` plant returns empty array
- `getBlockedActions` with valid context returns a non-empty Set/array
- Keep all 7 existing tests (transplant guardrail, autoflower, etc.)

### 2. question-matcher.js (already registered -- verify only)

Already exports `runTests()` returning correct format. Already registered. No new file needed.

### 3. stage-sources.js

- `createStageNote(store, { plantId, stageId, text })` returns object with required fields
- Empty text returns null
- `createStageQuestion(store, { plantId, stageId, text })` returns object with `type: 'stage-question'`
- `getStageObservations(store, { plantId, stageId })` returns array
- After creating a note, `getStageObservations` includes it

### 4. error-banner.js (created in Section 02)

- `showCriticalError('test')` inserts `.critical-error-banner`
- Banner contains message text
- Banner has dismiss button
- `dismissError()` removes banner
- `dismissError()` removes padding-top
- Calling `showCriticalError` twice replaces first (no duplicates)
- Works when `#app-shell` doesn't exist (falls back to `document.body`)
- Cleanup: remove banners and reset padding after tests

### 5. migration.js

- `preInitMigration()` on clean state returns `{ migrated: false }` or equivalent
- Does not crash when localStorage is empty
- When V1 flag is set, skips migration
- When V2 flag is set, skips migration
- Cleanup: remove all test keys from localStorage

### 6. plant-picker.js

- `renderPlantPicker(container, { plants, selectedPlantId, onSelect })` populates container
- Contains `.plant-picker-chip` elements
- Clicking chip fires `onSelect` with correct plant ID
- With empty `plants: []`, no chips rendered
- Cleanup: remove temporary container

### 7. journal.js aggregation

- Two entries with different timestamps are sorted newest-first
- Empty logs returns empty array
- Entries missing `details.notes` are excluded
- Each returned entry has required fields: `id`, `timestamp`, `source`, `body`

### 8. Data Module Schema Validation

Imports all data modules and validates:

**STAGE_CONTENT:** Non-null object, 5+ stage keys, every stage has `whatsHappening`, `whatToDo`, `whatToWatch`, `commonMistakes`, `readyToAdvance`

**STRAIN_CLASS_ADJUSTMENTS:** Has `autoflower` key, each class has `label` and `overrides`

**ADVISOR_MICROCOPY:** Frozen object, 5+ entries, every entry has `severity` (info/warning/urgent), `title` (<=35 chars), `body` (<=130 chars), `action`

**EDGE_CASES (primary and supplemental):** Non-null array, each entry has `id` (unique), `trigger`, `generalAdvice`, `correctAction`, `severity`, `confidence`, `blockActions`, `recommendActions`

**STAGE_DEEP_DIVES:** 5+ stage keys, every entry has `title`, `body` (non-empty array), `readingTime`

**STAGE_NOTE_PLACEHOLDERS:** 5+ stage keys, every entry has `stage` (non-empty array of strings)

**STAGE_QUESTION_STARTERS:** 5+ stage keys, every question starter has `text` and `keywords` (non-empty array)

---

## Implementation Notes

- **No npm dependencies.** All tests run in the browser via ES module imports.
- **Use `try/finally` for cleanup.** Tests that write to localStorage or append DOM elements must clean up.
- **The `assert` helper is local to each test file.** No shared test utility module.
- **Test isolation matters.** Each `runTests()` must be callable multiple times without side effects.
- **Mock store for journal tests.** A plain object with the right shape is sufficient; no need for `createStore()`.

---

## Verification Checklist

1. Navigate to `/test` route
2. All modules show as registered (no "no runTests() exported" errors)
3. All tests pass (green) -- zero failures
4. Total assertion count >= 900
5. `edge-case-engine` no longer crashes the test runner
6. Every data module has ID uniqueness + required field coverage
7. Every logic module has happy-path + one edge-case test
