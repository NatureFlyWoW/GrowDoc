# Architectural Recommendations

Top 5 improvements ranked by impact/effort ratio.

## 1. Break the circular dependency in note-contextualizer

- **What:** Extract `getObservationIndex` and `cache`/`storeRef` access into a new `js/data/note-contextualizer/accessor.js`. Have `index.js`, `rules-score.js`, and `rules-advice.js` all import from `accessor.js` instead of from each other.
- **Why:** Eliminates the only circular import in the codebase. Prevents silent initialization-order bugs and makes the module graph statically analyzable.
- **Effort:** 2 hours. Move ~30 lines, update 3 import statements.
- **Dependencies:** None.

## 2. Centralize edge-case engine loading

- **What:** Create `js/data/edge-case-loader.js` that exports a single `getEdgeCaseEngine()` returning a cached `Promise<module>`. Replace the 4 independent top-level `await import()` calls in `main.js`, `task-engine.js`, `timeline-bar.js`, and `doctor-ui.js` with imports from the loader. Delete ~120 lines of duplicated fallback code.
- **Why:** Eliminates the highest-impact boot performance risk (top-level await blocking module graph), removes 120 lines of duplicated code, and ensures a single network fetch.
- **Effort:** 3 hours. New 30-line module + 4 file edits.
- **Dependencies:** None.

## 3. Add error boundaries to the router

- **What:** Wrap `viewFn(_contentEl, params)` in `router.js:_renderView` with a try/catch. On error, render a recovery card with the error message, a "Go to Dashboard" link, and an "Export Data" button. Log the error with view name and params for debugging.
- **Why:** A single null-reference in any of 14 view modules currently renders the entire app unusable. This is the cheapest resilience improvement available.
- **Effort:** 1 hour. ~25 lines added to `router.js`.
- **Dependencies:** None.

## 4. Replace window.__growdocStore with router-injected store

- **What:** Modify `initRouter` to accept a `store` parameter. Pass it through to `_renderView`, which passes it to each `viewFn(container, store, params)`. Update all 17 viewMap entries in `main.js` to accept store as an argument instead of reading from `window.__growdocStore`. Remove the global assignment.
- **Why:** Eliminates the global mutable reference that any script or extension can access. Makes store dependencies explicit and testable.
- **Effort:** 4 hours. Touch `router.js`, `main.js`, and each view's function signature.
- **Dependencies:** Recommendation 3 (error boundaries) should land first so the refactor has safety nets.

## 5. Move test runner to a dev-only route with lazy loading

- **What:** Remove `renderTestRunner` and all 26 test module imports from `main.js`. Create `js/test-runner.js` as a standalone module. In the viewMap, make the `test-runner` entry a lazy `await import('./test-runner.js')` that only loads on `/test`. Exclude the test files from the service worker cache manifest.
- **Why:** Removes ~70 lines and 26 import references from the production entry point. Test modules currently add to parse time for every user on every page load even though only developers visit `/test`.
- **Effort:** 2 hours. Extract function, update 1 viewMap entry, update sw.js exclude list.
- **Dependencies:** None.
