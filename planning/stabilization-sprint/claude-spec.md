# GrowDoc Stabilization Sprint — Combined Specification

## 1. Project Context

GrowDoc is a vanilla JS (ES modules, zero npm deps, no bundlers) cannabis cultivation companion app deployed on Vercel. It uses localStorage for state persistence and a reactive store (`store.js`) for in-memory state management. The app recently underwent a major Timeline v2 feature sprint that introduced rich stage panels, an edge-case engine, multi-plant support, and a question-answering system.

A 5-reviewer council (architect, product manager, cultivation expert, QA, error detective) completed a deep review of the entire codebase, producing 24 findings files in `first_review/`. The user then answered 20 strategic questions, establishing that GrowDoc is a passion project for an EU solo grower who wants to stabilize before iterating.

## 2. Problem Statement

The Timeline v2 sprint shipped significant functionality but introduced structural fragility:

1. **Fragile async boot chain** — Top-level `await import()` in 3 modules caused a production outage (DOMContentLoaded race — boot() never ran, zero errors)
2. **Silent error swallowing** — 15+ empty catch blocks across the codebase hide failures
3. **Cultivation data contradictions** — 7 parameter conflicts where different files give conflicting advice (VPD ranges, drying temps, amber %, etc.)
4. **Low test coverage** — ~45-50% with 10+ modules completely untested
5. **Dangerous advice rules** — `advice-mites-raise-rh` tells growers to raise humidity in flower, causing bud rot; `advice-mites-spray` recommends neem without stage filter
6. **localStorage fragility** — save failures go undetected, Restore Backup button is broken after migration (namespace mismatch)

## 3. Sprint Scope — 7 Items

### 3.1 Remove All Top-Level Awaits

**Files:** `js/main.js:34`, `js/components/timeline-bar.js:16-17`, `js/components/task-engine.js:20-26`, `js/plant-doctor/doctor-ui.js:17`

**What:** Replace every `await import('../data/edge-case-engine.js')` at module top-level with a memoized lazy-loader called on first use.

**Pattern:**
```
// Before (module top-level — blocks boot):
let fn = null;
try { const mod = await import('./engine.js'); fn = mod.fn; } catch {}

// After (lazy, first-call):
let _engineCache = null;
function _getEngine() {
  if (!_engineCache) {
    _engineCache = import('./engine.js').then(m => m).catch(() => null);
  }
  return _engineCache;
}
// At call site: const engine = await _getEngine(); if (engine) engine.fn(...)
```

**Why:** Top-level await delays module evaluation. When main.js's DOMContentLoaded listener registration sits below a top-level await, the event fires during the await and is missed forever. Zero errors, complete app failure.

**Success:** Zero top-level `await` statements outside of function bodies in the entire codebase. App boots synchronously. Edge-case engine loads on first Timeline/doctor/task-engine use (~50ms one-time delay).

### 3.2 Error Handling: Console Logging + Critical UI Banner

**Files:** All files with empty catch blocks (see `first_review/errors-silent-failures.md` for the full list of 15+ locations)

**What — Part A:** Replace every `catch {}`, `catch { /* comment */ }`, and `catch (_e) {}` with `catch (err) { console.error('[module:context]', err); }`. The context string identifies where the error was caught (e.g., `'[main:edge-case-import]'`, `'[task-engine:suppression]'`).

**What — Part B:** Create a global critical-failure banner component. A fixed-position bar below the sidebar header that appears only for critical errors: boot failure, data save failure, migration crash. Non-intrusive, dismissible, red background. Uses existing CSS custom properties.

**Implementation:**
- New file: `js/components/error-banner.js` — exports `showCriticalError(message)` and `dismissError()`
- DOM: `div.critical-error-banner` inserted as first child of `#app-shell`, above `#sidebar` and `#content`
- Triggered by: `storage.js save()` failures, `main.js boot()` catch, `migration.js` failures
- CSS: append to `css/components.css`

**Success:** Zero empty catch blocks. Every error is logged with context. Boot crashes and save failures surface a visible banner.

### 3.3 Cultivation Contradiction Resolution

**Files:** `js/data/note-contextualizer/rules-advice.js`, `js/data/stage-content.js`, `js/data/grow-knowledge.js`, `js/data/knowledge-articles.js`, `js/data/stage-rules.js`

**What:** Franco resolves all 7 contradictions from `first_review/cultivation-contradictions.md` plus the neem-in-flower advice rule from `first_review/cultivation-accuracy.md`. Each resolution picks ONE canonical value and updates ALL files to match.

**The 7+1 contradictions:**

1. **advice-mites-raise-rh** — Add stage filter: only fire in seedling/early-veg/late-veg. In flower stages, replace body with predatory mite recommendation.
2. **Drying temp** — Canonical: 15-18C optimal, 15-21C acceptable range. Update stage-rules.js DRYING_TARGETS and knowledge-articles.js.
3. **Seedling VPD** — Canonical: 0.4-0.8 kPa (matches grow-knowledge.js data layer). Update stage-content.js from 0.6-0.9 to 0.4-0.8.
4. **Harvest amber %** — Canonical: 20-30% amber for balanced effect (Franco's practitioner call). Update knowledge-articles.js from 10-20%.
5. **Epsom foliar timing** — Canonical: 30 minutes before lights-on (stomatal absorption). Update rules-advice.js from "lights-off".
6. **Cure burp schedule** — Canonical: 3x daily in week 1 (Franco's recommendation). Update knowledge-articles.js from 2x.
7. **Late-flower RH** — Canonical: 45-50% (balance terpene preservation and botrytis prevention). Update grow-knowledge.js from 35-45% and knowledge-articles.js from 50-55%.
8. **advice-mites-spray (neem)** — Add stage filter: only fire in seedling/early-veg/late-veg. In flower stages, suppress entirely (neem residue on trichomes).

**Success:** Zero contradictions between any knowledge source files. All ranges internally consistent.

### 3.4 Test Coverage Expansion

**Files:** Every module with meaningful logic that lacks `runTests()`, plus `js/main.js` test runner module list (~line 395)

**What:** Add `runTests()` exports to every untested module. Register each in the test runner's module list. Target: every module with logic gets at least basic assertions covering the happy path + one edge case.

**Modules to add tests to (per `first_review/qa-test-coverage.md` and `qa-critical-untested.md`):**
- `js/data/edge-case-engine.js` — already has tests, verify they're registered
- `js/data/question-matcher.js` — already has tests, verify registered
- `js/components/plant-picker.js` — new, needs tests
- `js/data/note-contextualizer/stage-sources.js` — needs tests
- `js/data/stage-content.js` — needs validation tests (every stage has all required fields)
- `js/data/strain-class-adjustments.js` — needs validation tests
- `js/data/advisor-microcopy.js` — needs validation tests
- `js/data/edge-case-knowledge.js` — needs validation tests (all entries have required fields)
- `js/data/edge-case-knowledge-supplemental.js` — needs validation tests
- `js/data/knowledge-deep-dives.js` — needs validation tests
- `js/data/stage-note-placeholders.js` — needs basic tests
- `js/data/stage-question-starters.js` — needs basic tests
- `js/views/journal.js` — needs aggregation logic tests
- `js/components/error-banner.js` — new (from 3.2), needs tests
- `js/migration.js` — needs tests for the pre/post migration paths

**Success:** All modules with meaningful logic export `runTests()`. All registered in test runner. Assertion count ~900+ (up from ~628). File coverage ~70%+ (up from ~45%).

### 3.5 Playwright Smoke Test

**Files:** New `tests/smoke.spec.js`, new `playwright.config.js`

**What:** One Playwright test that:
1. Navigates to `http://localhost:3000` (or production URL)
2. Waits for the page to settle (no pending network, DOM stable)
3. Asserts `window.__growdocStore` is an object (boot completed)
4. Asserts `document.getElementById('sidebar').children.length > 0` (sidebar rendered)
5. Asserts `document.getElementById('content').children.length > 0` (content rendered)
6. Asserts zero console errors

**Run manually:** `npx playwright test` (no CI, no GitHub Actions).

**Dependencies:** Playwright is the ONE npm dev dependency allowed for this. Add to `package.json` devDependencies. Does NOT violate the "no npm deps" rule since it's dev-only and not bundled/shipped.

**Success:** `npx playwright test` passes on production. Would have caught the DOMContentLoaded race.

### 3.6 localStorage Hardening

**Files:** `js/storage.js`, `js/views/settings.js`, `js/main.js`, `js/migration.js`

**What — Part A:** Make `save()` return a boolean success indicator. Every caller checks the return value. On failure, trigger the critical error banner with "Your data couldn't be saved — storage may be full."

**What — Part B:** Fix the Restore Backup namespace mismatch. Error detective found that `migration.js` writes backup keys with prefix `growdoc-companion-backup-` but `main.js restoreBackup()` looks for `growdoc-companion-backup-{original-legacy-key}` — the two never match after migration, making the Restore Backup button permanently inoperative.

**What — Part C:** Add a "last successful save" timestamp to the quota dashboard in settings. Displayed as "Last saved: X minutes ago" so the user can tell if saves are stalling.

**Success:** `save()` returns boolean. All callers handle failure. Restore Backup works after migration. Settings shows last-save timestamp. Quota warnings surface before data loss.

### 3.7 Mites-Raise-RH Stage Guard (bundled into 3.3)

This item is fully covered by item 3.3 (cultivation contradiction #1). Listed separately in the original sprint scope for visibility but implemented as part of the cultivation pass.

## 4. Technical Constraints

- Vanilla JS ES modules — no React, Vue, bundlers, transpilers
- No npm dependencies except Playwright as devDependency
- Design system from `docs/_design-system.md` — CSS custom properties only
- Test runner is browser-based at `/test` route
- Deploy via `vercel --prod` after each section
- localStorage for companion app state, GitHub API for docs

## 5. Parallelization Plan

```
Batch 1 (independent, parallel):
  - 3.1 Remove top-level awaits (js/main.js, timeline-bar, task-engine, doctor-ui)
  - 3.3 Cultivation contradictions (rules-advice, stage-content, grow-knowledge, knowledge-articles)
  
Batch 2 (depends on 3.1):
  - 3.2 Error handling (touches many files, but after async cleanup to avoid conflicts)
  - 3.6 localStorage hardening (touches storage.js, settings.js)

Batch 3 (depends on 3.1, 3.2):
  - 3.4 Test expansion (needs stable APIs to test against)
  - 3.5 Playwright smoke test (needs stable boot to pass)
```

## 6. Success Criteria

- [ ] Zero top-level `await` statements outside function bodies
- [ ] Zero empty catch blocks
- [ ] Zero cultivation contradictions between knowledge files
- [ ] Every catch logs to console with `[module:context]` prefix
- [ ] Critical failures (boot, save, migration) show UI banner
- [ ] `advice-mites-raise-rh` only fires in veg stages
- [ ] `advice-mites-spray` only fires in veg stages
- [ ] All modules with logic export `runTests()`
- [ ] Test assertion count >= 900
- [ ] `npx playwright test` passes
- [ ] `save()` returns boolean, callers handle failure
- [ ] Restore Backup button works after migration
- [ ] Settings shows "last saved" timestamp
- [ ] Production stays green (no regressions)
