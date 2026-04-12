# Architectural Risks

Top 10 risks ranked by severity. Each includes blast radius and recommended fix.

## 1. Circular dependency in note-contextualizer [CRITICAL]

- **What:** `rules-score.js:15` and `rules-advice.js:15` both `import { getObservationIndex } from './index.js'`, while `index.js` imports from both files. This creates a circular ESM dependency.
- **Why it matters:** ESM circular imports resolve to partially-initialized module bindings. `getObservationIndex` may be `undefined` at call time during the first module evaluation pass, producing silent failures in `_recordRuleError`.
- **Blast radius:** Plant Doctor score adjustments and advice generation silently drop rule errors instead of recording them.
- **Fix:** Extract `getObservationIndex` into a separate `accessor.js` file that both `rules-*.js` and `index.js` import, breaking the cycle.

## 2. Top-level await chains block app boot [HIGH]

- **What:** `main.js:34`, `task-engine.js:21`, `timeline-bar.js:17`, `doctor-ui.js:17` all use `await import(...)` at the top level for `edge-case-engine.js`.
- **Why it matters:** Top-level await in ESM blocks the entire module graph evaluation. If `edge-case-engine.js` or its transitive imports are slow or fail, boot stalls. The try/catch only catches errors, not timeouts.
- **Blast radius:** Complete app hang on slow networks. Four independent modules each independently load the same file, creating redundant network requests.
- **Fix:** Centralize edge-case loading in a shared lazy-loader module with a single `Promise` that all consumers await. Add a timeout guard (2s) with fallback.

## 3. localStorage 5MB ceiling with no guardrail enforcement [HIGH]

- **What:** `storage.js` has `checkQuota()` but it only logs warnings. No mechanism prevents writes from exceeding the limit. Photo data (`growdoc-photos-v1` in `getStorageBreakdown`) can silently consume the entire budget.
- **Why it matters:** A single large grow with photos and environment readings can hit the 5MB wall. The `save()` function catches `QuotaExceededError` but its only recovery is `compactEnvironmentReadings()`, which does not address the largest consumer (photos).
- **Blast radius:** Complete data loss prevention failure -- new data silently fails to persist.
- **Fix:** Enforce a per-key byte budget in `save()`. Move photo storage to IndexedDB. Surface quota warnings in the UI before critical threshold.

## 4. Global store via window.__growdocStore [HIGH]

- **What:** `main.js:200` assigns the store to `window.__growdocStore`. The viewMap (`main.js:77-164`) reads it 17 times from the global.
- **Why it matters:** Any script on the page can read/mutate the store. Breaks encapsulation and makes the store a de-facto global singleton accessible from the console and any injected script.
- **Blast radius:** Any XSS vector or browser extension can corrupt all user data.
- **Fix:** Pass store through the router's view-render contract instead of relying on the global. Use a `WeakRef` or module-scoped variable.

## 5. innerHTML usage across 25 files (100 occurrences) [HIGH]

- **What:** `innerHTML +=` and `innerHTML =` used extensively across views and components.
- **Why it matters:** Every innerHTML assignment is a potential XSS vector unless all interpolated values pass through `escapeHtml()`. Audit coverage is unknown. `sidebar.js:184` uses `innerHTML` with entity references but not dynamic data; other files like `main.js:442-448` embed dynamic test results via innerHTML.
- **Blast radius:** Stored XSS via plant names, notes, or strain data that flows into innerHTML.
- **Fix:** Audit every innerHTML site. Replace with `textContent` or `createElement` where possible. For template-heavy renders, adopt a tagged-template sanitizer.

## 6. 429 inline style assignments across 26 files [MEDIUM]

- **What:** `element.style.X = Y` used 429 times, concentrated in `sidebar.js`, `plant-detail.js`, `settings.js`, `my-grow.js`, `journal.js`.
- **Why it matters:** Inline styles override CSS custom properties and make the design system ineffective. Specificity conflicts are inevitable when CSS classes compete with inline assignments. The mobile bottom-nav in `sidebar.js:299-310` sets 10 inline styles per tab button.
- **Blast radius:** Design system changes have no effect on inline-styled elements. Inconsistent visual appearance.
- **Fix:** Move inline styles to CSS classes in the appropriate stylesheet. Use BEM or data-attribute selectors.

## 7. No error boundaries between views [MEDIUM]

- **What:** `router.js:141-157` calls `viewFn(contentEl, params)` with no try/catch. A rendering error in any view crashes the whole app with no recovery.
- **Why it matters:** Any null-reference in a view function propagates up and leaves the user on a blank screen.
- **Blast radius:** Single broken view renders the entire app unusable.
- **Fix:** Wrap `_renderView` in try/catch with a fallback "This view encountered an error" message and a link back to the dashboard.

## 8. CORS allows all origins on API [MEDIUM]

- **What:** `cors.js:2` sets `Access-Control-Allow-Origin: *`.
- **Why it matters:** Any website can call the authenticated API endpoints if a user's JWT is leaked. Combined with the team-password auth model, this means any site can probe for valid tokens.
- **Blast radius:** Token theft enables unauthorized document modification via GitHub API.
- **Fix:** Restrict CORS to the production domain and localhost for development.

## 9. Synchronous full-state JSON.stringify in computeHash [MEDIUM]

- **What:** `note-contextualizer/index.js:522-527` calls `JSON.stringify(grow)` and `JSON.stringify(profile)` on every `getObservationIndex()` call.
- **Why it matters:** For a grow with many plants, logs, and tasks, this serializes the entire state tree into a throwaway string just to compute a hash. This blocks the main thread on every navigation.
- **Blast radius:** UI jank proportional to state size. Grows with 100+ log entries will see noticeable lag.
- **Fix:** Replace full JSON.stringify with a structural counter hash (plant count + total log count + latest timestamp). The `fromHash` already includes these counts -- remove the JSON.stringify legs.

## 10. No service worker cache invalidation strategy [LOW]

- **What:** `main.js:239` registers `/sw.js` but no cache-busting or versioning strategy is visible in the architecture.
- **Why it matters:** Stale cached JS modules after a deployment will run old code against new data shapes, potentially corrupting localStorage state.
- **Blast radius:** Users on cached service workers see broken behavior until they manually clear caches.
- **Fix:** Implement a version-stamped cache name in `sw.js` with a `skipWaiting` + `clients.claim` update flow.
