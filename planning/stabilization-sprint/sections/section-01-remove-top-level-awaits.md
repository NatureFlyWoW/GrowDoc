# Section 1: Remove All Top-Level Awaits

## Background

GrowDoc is a vanilla JavaScript (ES modules, zero npm dependencies) cannabis cultivation companion app. Four modules use `await import('../data/edge-case-engine.js')` at module top-level. Top-level `await` delays module evaluation: in `main.js`, the `boot()` function registration sits below the await, and when `DOMContentLoaded` fires during the long import, the listener is never registered. The app renders completely empty with zero console errors. This caused a production outage and must be fixed first.

The four affected files and their top-level await locations:

| File | Line(s) | What it blocks |
|------|---------|----------------|
| `C:/GrowDoc/js/main.js` | 34 | App boot sequence |
| `C:/GrowDoc/js/components/timeline-bar.js` | 16-17 | Timeline rendering |
| `C:/GrowDoc/js/components/task-engine.js` | 20-26 | Task generation |
| `C:/GrowDoc/js/plant-doctor/doctor-ui.js` | 17 | Plant doctor UI |

All four import `edge-case-engine.js` (which itself imports `edge-case-knowledge.js`, `advisor-microcopy.js`, and `edge-case-knowledge-supplemental.js` -- a data-heavy module graph).

## Dependencies

None. This is Batch 1 (parallelizable with Section 3). Sections 2, 4, 5, and 6 depend on this being completed first.

## Tests (Write BEFORE Implementing)

Tests use the existing browser-based test runner convention: each module exports `runTests()` returning `[{ pass: boolean, msg: string }]`.

Since this section modifies internal module patterns (lazy loaders that are not exported), testing must happen via the public behavior each module exposes. The tests below verify observable outcomes of the refactor.

### main.js tests (add to existing test infrastructure or inline)

```js
// Test: getActiveEdgeCases is a synchronous function that returns an array, not a Promise
{ pass: !isPromise(getActiveEdgeCases({ plant: {}, grow: {} })), msg: 'getActiveEdgeCases returns array not Promise' }

// Test: getActiveEdgeCases returns [] before engine loads (initial value)
{ pass: Array.isArray(getActiveEdgeCases({ plant: {}, grow: {} })), msg: 'getActiveEdgeCases returns [] when engine not ready' }

// Test: boot() registration happens synchronously -- document.readyState guard
//       is evaluated at module evaluation time (not deferred by await)
{ pass: typeof window.__growdocStore === 'object', msg: 'boot() ran synchronously -- store is set' }
```

### timeline-bar.js tests

```js
// Test: renderStageDetail handles null/missing edge-case engine gracefully
// (call renderStageDetail with no edgeCases option and verify it does not throw)
{ pass: didNotThrow, msg: 'renderStageDetail handles null edge-case engine' }
```

### task-engine.js tests

```js
// Test: generateTasks works when engine is null (uses fallback path)
{ pass: Array.isArray(result), msg: 'generateTasks works without engine (fallback)' }

// Test: generateTasks works when engine is loaded (uses engine path)
{ pass: Array.isArray(result), msg: 'generateTasks works with loaded engine' }
```

### doctor-ui.js tests

```js
// Test: applyDoctorSuppression works when engine is null (returns advice unmodified)
{ pass: result.advice.length === inputAdvice.length, msg: 'applyDoctorSuppression passes through when engine null' }
```

### Memoization tests (in any one of the affected modules)

```js
// Test: _getEngine() returns a Promise (not undefined or raw value)
{ pass: enginePromise instanceof Promise, msg: '_getEngine returns a Promise' }

// Test: _getEngine() called twice returns the same Promise (memoization)
{ pass: _getEngine() === _getEngine(), msg: '_getEngine is memoized' }

// Test: when engine import succeeds, returned module has expected exports
{ pass: typeof engine.getActiveEdgeCases === 'function', msg: 'engine has getActiveEdgeCases' }
```

### Verification tests (run after implementation)

```bash
# Zero top-level awaits outside function bodies
grep -r "^.*await import" js/ --include="*.js"
# Should return zero matches
```

## Implementation

### The Lazy-Loader Pattern

Every file gets the same structural pattern. At module top-level, declare:

```js
let _enginePromise = null;

function _getEngine() {
  if (!_enginePromise) {
    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
      console.error('[module:edge-case-import]', err);
      return null;
    });
  }
  return _enginePromise;
}
```

The `catch` MUST log the error (not silently return null). This is required by Section 2's error-visibility goals. The label follows `[module:context]` convention (e.g., `[main:edge-case-import]`, `[timeline-bar:edge-case-import]`).

Call sites that need the engine become async (if not already) and do:

```js
const engine = await _getEngine();
if (!engine) { /* graceful degradation -- operate without edge-case data */ }
```

### File 1: `C:/GrowDoc/js/main.js`

**Current code (lines 29-38):**
```js
let getActiveEdgeCases = () => [];
try {
  const edgeCaseModule = await import('./data/edge-case-engine.js');
  if (typeof edgeCaseModule.getActiveEdgeCases === 'function') {
    getActiveEdgeCases = edgeCaseModule.getActiveEdgeCases;
  }
} catch { /* engine not ready */ }
```

**Replacement approach:**

`getActiveEdgeCases` MUST remain a synchronous function. It is called synchronously at line 116 inside a sync `viewMap` function (`'timeline'` view handler). Making it async would return a Promise instead of an array, silently breaking edge-case display.

Replace the top-level await block with:

1. Keep `let getActiveEdgeCases = () => [];` as the initial synchronous default.
2. Add a `_getEngine()` lazy-loader (same pattern as above) with label `[main:edge-case-import]`.
3. Fire-and-forget eager load at module level: call `_getEngine().then(mod => { ... })` immediately. When the Promise resolves, replace `getActiveEdgeCases` with `mod.getActiveEdgeCases` if it is a function.
4. The first timeline render may miss edge cases (returns `[]`) -- this is acceptable. Subsequent renders get the real data after the module loads.

**Critical constraint:** The `boot()` function (line 167) and its `document.readyState` guard (lines 254-257) remain exactly as they are. These were the fix for the production outage. They must execute synchronously at module evaluation time, which is now guaranteed because no `await` precedes them.

```js
// Replace lines 29-38 with:
let getActiveEdgeCases = () => [];
let _enginePromise = null;

function _getEngine() {
  if (!_enginePromise) {
    _enginePromise = import('./data/edge-case-engine.js').catch(err => {
      console.error('[main:edge-case-import]', err);
      return null;
    });
  }
  return _enginePromise;
}

// Fire-and-forget: replace the sync stub once engine loads
_getEngine().then(mod => {
  if (mod && typeof mod.getActiveEdgeCases === 'function') {
    getActiveEdgeCases = mod.getActiveEdgeCases;
  }
});
```

The `document.readyState` guard at lines 254-257 stays untouched:

```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
```

### File 2: `C:/GrowDoc/js/components/timeline-bar.js`

**Current code (lines 14-21):**
```js
let getActiveEdgeCases = null;
try {
  const mod = await import('../data/edge-case-engine.js');
  getActiveEdgeCases = mod.getActiveEdgeCases ?? null;
} catch {
  // file not yet created -- silently skip
}
```

**Replacement approach:**

Replace with the lazy-loader pattern. The `getActiveEdgeCases` variable becomes a lazy getter. The `renderStageDetail` function already null-checks it at line 231 (`if (getActiveEdgeCases && plant)`), so no downstream changes are needed.

```js
// Replace lines 14-21 with:
let getActiveEdgeCases = null;
let _enginePromise = null;

function _getEngine() {
  if (!_enginePromise) {
    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
      console.error('[timeline-bar:edge-case-import]', err);
      return null;
    });
  }
  return _enginePromise;
}

// Eager fire-and-forget to populate the sync variable
_getEngine().then(mod => {
  if (mod) getActiveEdgeCases = mod.getActiveEdgeCases ?? null;
});
```

The `renderStageDetail` function at line 228-232 already handles null safely:
```js
if (Array.isArray(edgeCasesOpt)) {
  edgeCases = edgeCasesOpt;
} else if (getActiveEdgeCases && plant) {
  try { edgeCases = getActiveEdgeCases(plant) || []; } catch { edgeCases = []; }
}
```

No change needed to `renderStageDetail`, but the empty `catch` at line 232 should have a `console.error` added (that will happen in Section 2, which depends on this section being done first).

### File 3: `C:/GrowDoc/js/components/task-engine.js`

**Current code (lines 17-26):**
```js
let _getBlockedActions = null;
let _getActiveWarnings = null;

try {
  const eceMod = await import('../data/edge-case-engine.js');
  _getBlockedActions = eceMod.getBlockedActions;
  _getActiveWarnings = eceMod.getActiveWarnings;
} catch (_importErr) {
  // edge-case-engine.js not yet available -- use local fallback below.
}
```

**Replacement approach:**

Replace the top-level await with the lazy-loader pattern. The fallback path at lines 28-86 stays exactly as-is -- it provides sync alternatives using a direct static import of `edge-case-knowledge.js` (a data-only module with no async behavior). The fallback activates when `_getBlockedActions` or `_getActiveWarnings` is still null after engine load.

```js
// Replace lines 17-26 with:
let _getBlockedActions = null;
let _getActiveWarnings = null;
let _enginePromise = null;

function _getEngine() {
  if (!_enginePromise) {
    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
      console.error('[task-engine:edge-case-import]', err);
      return null;
    });
  }
  return _enginePromise;
}

// Eager fire-and-forget: populate variables once engine loads
_getEngine().then(mod => {
  if (mod) {
    _getBlockedActions = mod.getBlockedActions || _getBlockedActions;
    _getActiveWarnings = mod.getActiveWarnings || _getActiveWarnings;
  }
});
```

The conditional block starting at line 28 (`if (!_getBlockedActions || !_getActiveWarnings) { ... }`) continues to work: at module evaluation time, both variables are `null`, so the fallback definitions are assigned. When the engine import eventually resolves (in the `.then`), the variables are overwritten with the engine's versions. This is safe because `generateTasks` (the main exported function) is always called asynchronously from render functions, well after module evaluation completes.

### File 4: `C:/GrowDoc/js/plant-doctor/doctor-ui.js`

**Current code (lines 13-22):**
```js
let _ecGetBlockedActions = null;
let _ecGetActiveEdgeCases = null;

try {
  const eceMod = await import('../data/edge-case-engine.js');
  _ecGetBlockedActions = eceMod.getBlockedActions;
  _ecGetActiveEdgeCases = eceMod.getActiveEdgeCases;
} catch (_importErr) {
  // edge-case-engine.js not yet available -- use local fallback below.
}
```

**Replacement approach:**

Same lazy-loader pattern. The fallback block at lines 24-96 stays as-is. `applyDoctorSuppression` is already async (line 514), so it can await the getter if needed -- but since we use fire-and-forget eager loading, the variables will be populated before any user interaction triggers the doctor.

```js
// Replace lines 13-22 with:
let _ecGetBlockedActions = null;
let _ecGetActiveEdgeCases = null;
let _enginePromise = null;

function _getEngine() {
  if (!_enginePromise) {
    _enginePromise = import('../data/edge-case-engine.js').catch(err => {
      console.error('[doctor-ui:edge-case-import]', err);
      return null;
    });
  }
  return _enginePromise;
}

// Eager fire-and-forget
_getEngine().then(mod => {
  if (mod) {
    _ecGetBlockedActions = mod.getBlockedActions || _ecGetBlockedActions;
    _ecGetActiveEdgeCases = mod.getActiveEdgeCases || _ecGetActiveEdgeCases;
  }
});
```

The fallback block at lines 24-96 (`if (!_ecGetBlockedActions || !_ecGetActiveEdgeCases) { ... }`) still assigns fallback functions because both variables are `null` during synchronous module evaluation. When the engine import resolves, the `.then` overwrites them with the real engine functions.

## Verification Checklist

After implementation, verify each of these:

1. **No top-level awaits remain:**
   ```bash
   grep -rn "^[^/]*await import" js/ --include="*.js"
   ```
   Should return zero matches (comments starting with `//` are okay, actual `await import` at top-level is not).

2. **App boots correctly:** Load the app in a browser. The sidebar and content area should render within 500ms. `window.__growdocStore` should be a valid object.

3. **Edge-case warnings appear in Timeline:** Open the Timeline view, open a stage detail panel. If the grow has edge-case conditions, warnings should appear (they may be missing on the very first render if the engine hasn't loaded yet, but should appear on any subsequent navigation).

4. **Task engine suppresses blocked tasks:** The dashboard task list should reflect edge-case suppressions after the first render cycle.

5. **Plant Doctor works:** Navigate to the Plant Doctor, run a diagnosis. Edge-case suppression should work (blocked advice items appear in the "Hidden by edge-case guard" disclosure).

6. **Test runner passes:** Navigate to the `/test` route and confirm all existing tests still pass. If memoization tests were added to any module's `runTests()`, confirm they pass too.

## Implementation Notes (Actual)

### Files modified
- `js/main.js` — lazy-loader pattern + `export { getActiveEdgeCases }` for testing + stale comment fix + test runner registration (lazy-loader, timeline-bar, doctor-ui)
- `js/components/timeline-bar.js` — lazy-loader pattern + `runTests()` export (memoization + null-safety)
- `js/components/task-engine.js` — lazy-loader pattern
- `js/plant-doctor/doctor-ui.js` — lazy-loader pattern + `runTests()` export (applyDoctorSuppression null-plant test)

### Files created
- `js/tests/lazy-loader.test.js` — boot verification, getActiveEdgeCases sync tests, generateTasks tests

### Deviations from plan
1. All fire-and-forget `.then()` chains have trailing `.catch(() => {})` (not in original plan — added per code review to prevent unhandled rejections)
2. `getActiveEdgeCases` exported from main.js for external testing (plan assumed inline tests)
3. `applyDoctorSuppression` tested via `runTests()` on doctor-ui.js rather than separate test file (function is module-private)
4. Flaky `setTimeout(200)` pattern from original test design replaced with sequential calls
5. renderStageDetail test uses minimal valid plant `{ id: 't', stage: 'seedling', logs: [] }` instead of null

### Test count
- lazy-loader.test.js: 4 assertions
- timeline-bar.js runTests: 4 assertions
- doctor-ui.js runTests: 2 assertions
- Total new: 10 assertions

## Key Risks and Mitigations

- **Race condition on first render:** The fire-and-forget eager load means edge-case data might not be available for the very first timeline render. This is acceptable -- the app functions without guardrails, and subsequent renders pick up the loaded engine. The production outage (empty page, zero errors) is far worse than temporarily missing edge-case warnings.

- **Fallback blocks still work:** In `task-engine.js` and `doctor-ui.js`, the fallback code (lines 28-86 and 24-96 respectively) defines full local reimplementations of `_getBlockedActions` and `_getActiveWarnings` using direct data imports. These are assigned synchronously during module evaluation when the engine variables are still `null`. The fire-and-forget `.then` later overwrites them with the real engine versions. The fallback blocks must NOT be removed or reordered.

- **`main.js` getActiveEdgeCases must stay synchronous:** The timeline view handler at line 116 calls `getActiveEdgeCases({ plant, grow })` synchronously. It expects an array return, not a Promise. The fire-and-forget pattern (replace the function reference on resolve) preserves this contract.
