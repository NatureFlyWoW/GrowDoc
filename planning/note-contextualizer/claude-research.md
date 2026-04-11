# Research Findings — Note Contextualizer

Collected 2026-04-11 via Explore subagent (codebase) + search-specialist subagent (web). These findings supplement the pre-existing audit in `01-audit.md`–`07-open-questions.md`.

---

## Part A — Codebase Scan (Test Infra, Store Hooks, Gaps)

### A1. Test infrastructure

**Runner.** In-browser, not Node. Entry at `js/main.js:298 renderTestRunner`. Navigate to the `/test-runner` route in the Companion app to execute tests.

**Test files.** 6 files in `js/tests/*.test.js` (~886 lines total). Each exports `async function runTests()` returning `Array<{pass: boolean, msg: string}>`.

**Test shape.**
```js
// js/tests/note-contextualizer.test.js (new file, must follow this pattern)
export async function runTests() {
  const results = [];
  // assertion
  results.push({ pass: actual === expected, msg: `should fuse signals when ...` });
  return results;
}
```

**Fixtures.** No dedicated fixture library. Tests construct minimal objects inline. See `task-engine.test.js:20-56` `daysAgo()` helper for the common pattern.

**Registering a new test file.** Add it to the hardcoded module list in `js/main.js:298-358`. The test runner dynamic-imports each module and calls `runTests()`.

**ES module + Node compat.** `package.json:6` sets `"type": "module"`. Tests use `import`/`export`, no `.mjs`. All imports are relative: `import { fn } from './sibling.js'`.

**Gotcha — pattern-tracker.js is self-testing, not registered.** `js/data/pattern-tracker.js:79-156` has inline `runTests()` assertions but is NOT in the test runner module list. The memory claim of "7 tests pass" likely refers to inline assertions + another registered file. Don't follow the pattern-tracker model — always register new test files in `main.js:298`.

**Headless/CI.** None exists. Running tests headlessly would require a Node wrapper (stub `document`, `localStorage`) OR Playwright hitting `/test-runner`. **Out of scope for this plan** — we'll use the in-browser runner and manual verification.

### A2. Store subscription model (for cache rebuilds)

**File:** `js/store.js` (~432 lines).

**Subscribe API:**
```js
store.subscribe('grow',    (event) => { /* fires on any commit('grow', ...) */ });
store.subscribe('profile', (event) => { /* fires on any commit('profile', ...) */ });
store.subscribe('*',       (event) => { /* fires on any top-level commit */ });
// event shape: { path, oldVal, newVal }
```

**Commit pattern (critical — frozen state).** `store.state.grow` returns a frozen object. Callers MUST clone via `getSnapshot()`, mutate, then `commit()`:

```js
const snap = store.getSnapshot().grow;   // mutable clone
snap.plants.push(...);
store.commit('grow', snap);                // triggers subscribers + debounced save
```

**Debounced save.** Per-key 300ms debounce via `js/main.js:53` (confirmed from grow-companion-v2 memory).

**How the contextualizer will use this:**
- Subscribe to `'grow'` and `'profile'` at module init.
- Callback is a debounced rebuild (300–500ms, see web research A5).
- Rebuild writes into a module-scoped `{hash, index}` singleton, NOT into store state (keeps the cache non-persistent and avoids contaminating the frozen state).
- Consumers call `getObservationIndex()` → returns the current index synchronously, rebuilding inline if hash is stale.

### A3. Storage keys

```js
// js/storage.js:3-11
const STORAGE_KEYS = {
  profile:     'growdoc-companion-profile',
  grow:        'growdoc-companion-grow',
  environment: 'growdoc-companion-environment',
  archive:     'growdoc-companion-archive',
  outcomes:    'growdoc-companion-outcomes',
  ui:          'growdoc-companion-ui',
};
```

All schemas at v1. Migrations dict is empty. **No derived-state pattern exists yet.** The observation cache will be the first module-scoped derived view.

### A4. Note sources — audit confirmed complete

The prior agent's A–K note-source map in `01-audit.md` was 100% accurate. No additional note surfaces were found. The only clarification:

**Log `details` shape varies by log type (must be handled in the collector):**
- `water` / `feed`: `{pH, ec, volume, notes, nutrients}`
- `train`: `{action, notes}`
- `observe`: `{condition, severity, notes}`

The contextualizer's `collectObservations` must handle this union.

### A5. Module loading + deployment

- `index.html:37` → `<script type="module" src="/js/main.js"></script>`
- Modulepreload hints in HTML head for critical path (main, store, router, storage).
- No bundler. Files served as-is from `/js/` root by Vercel. Works out-of-box.
- Modern browsers only (ES2020+). No IE11.

### A6. Design system tokens (`css/variables.css`)

The Companion uses `css/variables.css`, **not** `docs/_design-system.md`. The latter is for the standalone docs tools. Keep them separate.

**Tokens to reuse for severity chips, contradiction banners, parsed-signal strips:**
```css
/* Status colors — map to severity */
--status-good:    #8fb856  /* → severity 'info'  */
--status-action:  #d4a843  /* → severity 'watch' */
--status-urgent:  #c0392b  /* → severity 'alert' */

/* Evidence levels — map to signal confidence */
--evidence-strong:     #8fb856
--evidence-moderate:   #d4a843
--evidence-emerging:   #5c6bc0
--evidence-anecdotal:  #a09880

/* Spacing, radius, shadows, transitions — reuse as-is */
--space-2,3,4,6 | --radius-sm,md | --shadow-sm,md | --transition-fast,base
```

**Recommendation.** Create `css/note-contextualizer.css` extending these tokens with classes like `.signal-severity-alert`, `.contradiction-banner`, `.parsed-note-strip`. Import it in `index.html` after `variables.css`. **Do NOT reference `docs/_design-system.md` tokens** — the Companion's variables.css is authoritative.

### A7. Surprises / gotchas

1. **Frozen store state** — all callers must clone-mutate-commit.
2. **No TypeScript, JSDoc only** — contextualizer needs comprehensive JSDoc since there's no type checker.
3. **No event bus** — `store.publish/on` exist but are rarely used. Use `subscribe` callbacks.
4. **Log `details` timestamp is `log.timestamp`**, not a separate field.
5. **Plant / profile notes have no timestamp at all** — must infer `observedAt` from `plant.stageStartDate` (for plant/profile notes) or `log.timestamp` (for log notes). For task notes, use `task.updatedAt` if present else `task.createdAt`.

---

## Part B — Web Research

### B1. Recency-weighted signal fusion

**Bottom line — replace manual weight buckets with exponential decay by half-life.**

Instead of:
```js
// buckets (from 03-design.md, original)
if (severity==='alert' && ageH<24) w=1.00;
else if (severity==='watch' && ageH<48) w=0.90;
else if (ageH<168) w=0.70;
else w=0.30;
```

Use:
```js
// half-life decay, per severity tier
const HALF_LIFE = { alert: 24, watch: 48, info: 168 };  // hours
function weight(severity, ageHours) {
  const h = HALF_LIFE[severity];
  return Math.pow(0.5, ageHours / h);
}
```

**Why better:**
- Single tunable parameter per severity tier — easier to test.
- No step discontinuities (a note at age 23.9h vs 24.1h shouldn't jump from 1.0 to 0.7).
- Industry standard (Stanford EWMM, Kalman literature).
- The `03-design.md` buckets become the *initial* half-life calibration; the API stays the same.

**Severity-first ordering.** Compute severity first, *then* apply time decay per severity tier. This avoids "severity inversion" (a fresh info-level note outranking a day-old alert). Source: Datadog tiered-alert pattern.

**Action-taken signals must block, not just weight down.** Store explicit `action_at` timestamp on action-taken observations. Within a debounce window (e.g. water: 12h, feed: 24h, IPM: 72h), suppress task generation entirely rather than letting sensors re-win via weight. This matches option Q6(c) decision (suppression + quoted note + override).

**Composite-monitor pattern (Datadog).** For env-discrepancy detection (Section 5 I7): only fire when multiple conditions meet (VPD in-range AND user-note says "tent feels hot" AND note age < 24h AND severity ≥ watch). Prevents false positives from a single drowsy log.

**Pitfalls:**
- Recomputing the full index on every commit locks UI at ~1000s of observations. **Must debounce rebuild 300–500ms.**
- Unbounded singleton cache leaks memory. Keep only the *latest* `{hash, index}` pair.
- If severity and freshness are baked into one score, a fresh low-severity drowns an old high-severity. Split them.

**Sources (full list at end of file).**

### B2. ES module port from ES5 globals

**Bottom line — direct `export const` works. No IIFE wrapper needed.**

Conversion recipe:
```js
// old: docs/note-context-rules.js (ES5, var-globals)
var KEYWORD_PATTERNS = [ ... ];
var ADVICE_RULES     = [ ... ];
var SCORE_ADJUSTMENTS = [ ... ];

// new: js/data/note-contextualizer/rules-keywords.js
export const KEYWORD_PATTERNS = [ ... ];
// new: js/data/note-contextualizer/rules-advice.js
export const ADVICE_RULES = [ ... ];
// new: js/data/note-contextualizer/rules-score.js
export const SCORE_ADJUSTMENTS = [ ... ];
```

**Parity test strategy (Section 2 TDD).** Run old `extractNoteContext()` (manually invoked in a test harness that loads the legacy file via `<script>`) and new `parseObservation()` against a fixed list of ~20 sample notes. Compare via `JSON.stringify(ctxA) === JSON.stringify(ctxB)`. Log any divergence. Since we're forking (not bridging — Q1 decided FORK), the legacy file can be deleted once parity passes.

**Actually, since Q1 = FORK and Q8 says v3 is DEPRECATED:** there's no dual-load concern. Port the data, run parity tests once, delete `docs/note-context-rules.js` + `docs/tool-plant-doctor.html` (or leave them as an unused archive).

**Pitfalls:**
- ES6 imports are **live read-only bindings**, not copies. No circular deps (not a risk here since rules-*.js are leaf modules).
- Top-level `import` is async. If a consumer needs something immediately, wrap init in an async IIFE.
- `<script type="module">` requires HTTP, not `file://`. Tests must run via the `/test-runner` route served by Vercel dev, not by opening HTML directly.
- Vercel serves same-origin modules fine — no CORS config needed.

**Sources.** MDN modules, exploringjs.com, fireship.dev, Vercel docs.

### B3. localStorage projection cache

**Bottom line — this is the "materialized view" pattern. Debounce rebuild 300–500ms. Use a single-slot `{hash, index}` memoization.**

**Pattern name.** Materialized view (Microsoft Azure pattern docs). Also called "derived state" or "projection" in CQRS contexts.

**Metadata to carry.** `{version: 1, builtAt: timestamp, fromHash: sha}`. On access, compute current hash from `grow + profile` (cheap — can be a JSON length + updatedAt composite). If hash matches, return cached index. If not, rebuild.

**Debounce pattern.**
```js
let rebuildTimer = null;
store.subscribe('grow', () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(rebuildIndex, 300);
});
```

**Single-flight coalescing.** If multiple UI consumers request the index while a rebuild is in progress, return the same Promise to all. Use a `pendingRebuild` promise slot.

**Cache shape.** A module-scoped singleton, not a WeakMap:
```js
let cache = null;  // { hash, builtAt, byPlant: {}, byDomain: {} }
```

WeakMap is overkill — we only need the latest snapshot. Old snapshots should be garbage-collected automatically.

**Threshold for persistence upgrade.** Real projects persist materialized views when rebuild cost > 5–10 seconds. Our expected cost at 1000 observations is under 50ms. **Projection-only is safe for the foreseeable future.** Revisit if rebuild exceeds 200ms in user timing.

**Pitfalls:**
- Rebuilding on every commit without debounce → UI lag.
- Stale projections from forgetting to invalidate on hash change.
- Multiple concurrent rebuilds from rapid-fire commits → single-flight coalescing fixes this.

**Sources.** Microsoft Azure materialized-view pattern, Materialize guide, CQRS write-ups, GeeksForGeeks cache-invalidation guide.

---

## Revisions to the Design (Derived from Research)

These will feed into `claude-plan.md` at step 11:

1. **Weighting algorithm** (Section 3 scope) — replace bucket formula in `03-design.md` §Weighting with half-life exponential decay. Parameters `HALF_LIFE = {alert:24, watch:48, info:168}` hours. Severity-first ordering.
2. **Rebuild debouncing** (Section 1/3 scope) — add 300ms debounce on `store.subscribe('grow'|'profile')` callbacks. Single-flight promise slot for concurrent consumers.
3. **Test registration** (every section) — new test file must be added to `js/main.js:298` module list, follow `runTests()` contract, render in browser.
4. **Test runner access** (Section 8 scope) — add a note in the deploy section: "manual verification = navigate to `/test-runner`". No CI.
5. **CSS file placement** (Section 7 scope) — create `css/note-contextualizer.css` referencing `css/variables.css` tokens. NOT `docs/_design-system.md`.
6. **`observedAt` inference** (Section 1 scope) — make the fallback rules explicit: log → `log.timestamp`; plant/profile → `plant.stageStartDate` or `Date.now() - 24h` if no stage; task → `task.updatedAt || task.createdAt`.
7. **Action-taken debounce windows** (Section 3 scope) — explicit per-task-type windows: water 12h, feed 24h, IPM 72h, defoliate 168h (7d), flush 48h.
8. **Delete legacy files** (Section 2 scope) — after parity tests pass, delete `docs/note-context-rules.js`. Per Q8, `docs/tool-plant-doctor.html` can also be removed since v3 is deprecated — but leave that as an open question for Section 2, since it may still be referenced from `docs.json`.

---

## Sources

**Codebase scan** (Explore subagent, direct file reads):
- `js/main.js:298-358`, `js/store.js:102-240`, `js/storage.js:3-35`, `css/variables.css`, `package.json`, `js/tests/*.test.js`

**Web research** (search-specialist subagent):
- Kalman sensor fusion for smart agriculture — https://www.tandfonline.com/doi/full/10.1080/00051144.2023.2284033
- Exponentially Weighted Moving Models (Stanford, Boyd) — https://web.stanford.edu/~boyd/papers/pdf/ewmm.pdf
- Datadog tiered alerts — https://www.datadoghq.com/blog/tiered-alerts-urgency-aware-alerting/
- Managing Datadog alert fatigue — https://drdroid.io/engineering-tools/managing-datadog-alerts-from-setup-to-avoiding-alert-fatigue/
- ES6 Modules (Exploring JS) — https://exploringjs.com/es6/ch_modules.html
- JavaScript module systems — https://fireship.dev/javascript-modules-iifes-commonjs-esmodules/
- CORS requirements for modules (WHATWG) — https://github.com/whatwg/html/issues/1888
- Vercel CORS config — https://vercel.com/kb/guide/how-to-enable-cors
- Parity testing in data migration — https://www.datafold.com/data-migration-guide/validate-prove-parity/
- Materialized view pattern (Microsoft Azure) — https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view
- Materialized views guide (Materialize) — https://materialize.com/guides/materialized-views/
- Cache invalidation strategies — https://geeksforgeeks.org/system-design/cache-invalidation-and-the-methods-to-invalidate-cache/
- Cache invalidation best practices — https://oneuptime.com/blog/post/2026-01-30-cache-invalidation-strategies-and-best-practices/
