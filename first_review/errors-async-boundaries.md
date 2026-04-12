# Async/Sync Boundary Mismatches

## Reference Cases (Known Bugs, Now Fixed)

- **main.js (prior version)** — Top-level `await import(...)` at line 34 deferred `DOMContentLoaded` registration. Fixed by the `document.readyState` guard at main.js:254-258.
- **dashboard.js (prior version)** — Sync call to async `generateTasks()` consumed the Promise as an array. Fixed by `Promise.resolve(generateTasks(store)).then(...)` at dashboard.js:51.

## Remaining Async Boundary Issues

### Top-Level Awaits That Delay Module Evaluation

- **task-engine.js:21** — `const eceMod = await import('../data/edge-case-engine.js')` is a top-level await. Any module that imports from `task-engine.js` has its own evaluation delayed until this resolves. `dashboard.js` imports `generateTasks` from `task-engine.js`, so the dashboard module is blocked on this import on every page load.

- **doctor-ui.js:17** — `const eceMod = await import('../data/edge-case-engine.js')` is a second independent top-level await. `main.js` imports `renderPlantDoctor` from `doctor-ui.js`, which means the entire `main.js` module evaluation is blocked on two sequential top-level awaits (its own at line 34, and this one transitively via the import chain). Total worst-case delay is doubled.

- **timeline-bar.js:17** — Third top-level await: `await import('../data/edge-case-engine.js')`. `main.js` imports from `timeline-bar.js` at line 14, adding a third serialized await to boot time.

### Async Function With Sync-Style Callers

- **task-engine.js:174** — `generateTasks` is `async`. `dashboard.js:51` wraps it in `Promise.resolve(...).then(...)` which correctly awaits. However, `renderTestRunner` in `main.js:435` calls `m.runTests()` with `await` — if any module's `runTests` calls `generateTasks` without awaiting, the returned Promise is used directly. The test at `main.js:435` does `await m.runTests()`, so the test runner itself is safe, but any internal test calling `generateTasks` synchronously would silently produce a Promise where an array is expected.

### Missing Await on Async Side Effects

- **doctor-ui.js:254** — `applyDoctorSuppression(rawAdvice, activePlant, grow).then(...).catch(...)` is called fire-and-forget. There is no top-level await and no mechanism to prevent `resultsArea` from being cleared (e.g. user clicks a different symptom) while the Promise is still in flight. The `.then` callback appends `planSection` to a potentially stale `resultsArea` DOM node that may already be detached or re-rendered.

- **doctor-ui.js:371** — `_tryLoadV3Data()` is called without `await` inside `renderPlantDoctor`. It is explicitly fire-and-forget by design, but if `setDiagnosticData` is called concurrently from two renders before `_v3Loaded = true` is set, both calls proceed to load and the second `setDiagnosticData` call overwrites the first (race window is the network fetch duration).

### Promise Chain That Loses Errors

- **main.js:214** — `import('./components/debug-waterfall.js').then(...).catch(err => console.warn(...))` — correctly logs. No issue here, listed for completeness.

- **dashboard.js:62** — `.catch((err) => { console.error('generateTasks failed:', err) })` — correctly surfaces the error. No silent swallow.

### Summary of Blast Radius

Three top-level awaits in `task-engine.js`, `doctor-ui.js`, and `timeline-bar.js` all import the same module (`edge-case-engine.js`). They run in parallel (ESM module cache), but the module-evaluation order ensures `main.js` is blocked on all three during initial page parse. Any exception in `edge-case-engine.js` itself would be swallowed by all three `catch` blocks before the readyState guard at main.js:254 even executes.
