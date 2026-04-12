# Technical Debt Inventory

Shortcuts, stubs, fragile patterns, and dead code grouped by severity.

## Critical

- **Circular import cycle:** `note-contextualizer/index.js` <-> `rules-score.js` and `rules-advice.js`. Both child modules import `getObservationIndex` from the parent. Works by accident because `getObservationIndex` is only called at runtime (not during module init), but any refactor that touches evaluation order will break silently.
- **Quadruplicated edge-case loading:** `main.js:34`, `task-engine.js:21`, `timeline-bar.js:17`, `doctor-ui.js:17` each independently `await import('../data/edge-case-engine.js')` with identical try/catch fallback logic. The fallback implementation in `task-engine.js:28-86` and `doctor-ui.js:24-80` is copy-pasted (~60 lines each).
- **49 empty/swallowed catch blocks** across 21 files. Many use `catch { }` or `catch (_e) { }` with no logging, making production debugging nearly impossible.

## High

- **`window.__growdocStore` global:** Used 20 times in `main.js` viewMap and twice in `onboarding.js` as fallback. Bypasses module encapsulation entirely.
- **Duplicated `_extractRecentEvents` / `_extractPlantFlags` / `_edgeCaseMatches`:** Identical helper functions copy-pasted in `task-engine.js:89-160` and `doctor-ui.js:37-80`. Should be extracted to a shared module.
- **`postInitMigration` is a no-op placeholder:** `migration.js:222-227` does nothing. The function signature and two-phase hook are kept "for future migrations" but add indirection with no current value.
- **Dead `exportAll()` function:** `storage.js:373-390` duplicates `exportAllData()` at line 160. Both iterate localStorage with nearly identical logic. Only `exportAllData` is used in settings; `exportAll` is used only in `main.js` error recovery and tests.

## Medium

- **Hardcoded 5MB localStorage limit:** `storage.js:143` uses `5 * 1024 * 1024` and `storage.js:304` uses `4_500_000` as the quota budget. These differ (5MB vs 4.5MB) and neither queries actual browser limits.
- **Test runner embedded in production bundle:** `main.js:392-461` defines `renderTestRunner` which imports 26 test modules. This code ships to every production user, adding dead weight to the module graph.
- **Inline styles dominate mobile bottom-nav:** `sidebar.js:299-310` applies 10+ `element.style.*` assignments per button instead of CSS classes, making the bottom nav unstyleable by the design system.
- **`checkCapacity()` vs `checkQuota()` duplication:** `storage.js` exports both `checkCapacity()` (line 129) and `checkQuota()` (line 303). They compute nearly the same metric with different budget constants and return shapes.
- **Frozen state shallow only:** `store.js:50` calls `Object.freeze(obj)` but this is shallow. Nested objects within state are not recursively frozen, so `store.state.grow.plants[0].name = 'x'` silently succeeds in non-strict mode.
- **`_hasProfile()` in router reads localStorage directly:** `router.js:133-138` bypasses the store to check localStorage, creating a read path outside the reactive system.

## Low

- **`CURRENT_VERSIONS` all set to 1:** `storage.js:14-20` defines schema versions but no migrations exist in `MIGRATIONS`. The migration framework is scaffolded but unused.
- **`_store` fallback to `window.__growdocStore` in onboarding:** `onboarding.js:131` and `onboarding.js:673` use `window.__growdocStore` as a fallback when the store parameter is not passed.
- **`generateId()` produces 8-hex-char IDs:** `utils.js:37-40` uses 4 random bytes (32 bits), giving ~4 billion possible IDs. For a single-user app this is adequate but provides no collision resistance across imported/merged datasets.
- **Date comparison by string in `compactEnvironmentReadings`:** `storage.js:419` compares ISO date strings via `>=` which works for ISO format but is fragile if date formats vary.
- **Magic number 300ms debounce:** Used in `main.js:63` (store save) and `note-contextualizer/index.js:614` (cache invalidation) without a named constant.
