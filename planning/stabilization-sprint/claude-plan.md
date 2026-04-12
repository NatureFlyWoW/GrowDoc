# GrowDoc Stabilization Sprint — Implementation Plan

## Overview

GrowDoc is a vanilla JavaScript (ES modules, zero npm dependencies) cannabis cultivation companion app deployed on Vercel. A recent feature sprint (Timeline v2) shipped rich stage panels, an edge-case guardrail engine, multi-plant support, and a knowledge-base question matcher. A 5-reviewer council then audited the codebase and found structural fragility: a brittle async boot chain, silent error swallowing, cultivation data contradictions, low test coverage, and a dangerous advice rule. This sprint stabilizes the foundation before any new features.

The codebase uses no frameworks — pure DOM manipulation, ES module imports, a reactive store backed by localStorage, and Vercel serverless functions for the GitHub-based document backend. The design system lives in CSS custom properties. The test runner is a browser-based `/test` route that imports modules and runs their exported `runTests()` functions.

## Section 1: Remove All Top-Level Awaits

### Problem

Four modules use `await import('../data/edge-case-engine.js')` at module top-level:
- `js/main.js:34` — blocks boot sequence, caused production outage
- `js/components/timeline-bar.js:16-17` — blocks timeline rendering
- `js/components/task-engine.js:20-26` — blocks task generation  
- `js/plant-doctor/doctor-ui.js:17` — blocks plant doctor

Top-level await delays module evaluation. In `main.js`, the `boot()` function registration sits below the await. If `DOMContentLoaded` fires during the import (which it does in every browser), the listener is never registered and the entire app renders empty with zero console errors.

### Approach

Replace every top-level await with a memoized lazy-loader pattern. Each module gets an internal `_getEngine()` function that returns a Promise (resolved on first call, cached thereafter). Call sites that need the engine `await _getEngine()` inside their function body — never at module top-level.

**Pattern for each file:**

Module-level: declare `let _enginePromise = null;` and a `_getEngine()` helper that sets `_enginePromise = import(...).catch(err => { console.error('[lazy:edge-case-engine]', err); return null; })` on first call and returns the cached Promise on subsequent calls. The catch MUST log (not silently return null) to avoid contradicting Section 2's goal of eliminating silent failures.

Call-site level: every function that uses the engine becomes async (if not already) and does `const engine = await _getEngine();` with a null check before using. If engine is null, the function operates without edge-case data (graceful degradation — the app works, just without guardrails).

**File-specific notes:**

- `js/main.js` — The `getActiveEdgeCases` variable at line 32 must remain a **synchronous** function. The timeline view calls it synchronously at line 116 inside a sync `viewMap` function — making it async would return a Promise instead of an array, silently breaking edge-case display. Approach: keep `getActiveEdgeCases = () => []` as the initial value. Call `_getEngine()` eagerly (fire-and-forget) at module load time. When the Promise resolves, replace `getActiveEdgeCases` with the real engine function. The first timeline render may miss edge cases (acceptable); subsequent renders get them. The `boot()` function and its `document.readyState` guard remain synchronous — they were the fix for the production outage and must not be touched.

- `js/components/task-engine.js` — The `_getBlockedActions` and `_getActiveWarnings` variables (lines 17-23) become lazy-loaded via `_getEngine()`. The fallback path (lines 28-80) stays as-is — it provides sync alternatives when the engine is unavailable, using a direct static import of `edge-case-knowledge.js` (which is a data-only module with no async behavior).

- `js/components/timeline-bar.js` — The `getActiveEdgeCases` variable (line 14) becomes a lazy getter. The `renderStageDetail` function already null-checks it (line 230), so no downstream changes needed.

- `js/plant-doctor/doctor-ui.js` — Same pattern. The `_ecGetBlockedActions` and `_ecGetActiveEdgeCases` variables become lazy-loaded. The `applyDoctorSuppression` function is already async (line 514), so it can await the getter with no signature change.

### Verification

- `grep -r "^.*await import" js/ --include="*.js"` returns zero matches outside function bodies
- App boots with sidebar and content rendered within 500ms (no delayed module evaluation)
- Edge-case warnings still appear in Timeline after first panel open
- Task engine still suppresses blocked tasks after first dashboard render

## Section 2: Error Handling — Console Logging + Critical Banner

### Problem

15+ empty catch blocks silently swallow errors, making failures invisible. The DOMContentLoaded race produced zero console output. Save failures, migration crashes, and import errors all vanish silently.

### Part A: Console Error Logging

Walk every file listed in `first_review/errors-silent-failures.md` and replace each empty catch with a labeled `console.error`. Labels follow the pattern `[module:context]`:
- `[main:edge-case-import]`
- `[main:debug-waterfall]`
- `[task-engine:import]`
- `[task-engine:suppression]`
- `[doctor-ui:import]`
- `[doctor-ui:suppression]`
- `[timeline-bar:import]`
- `[storage:save]`
- `[storage:load]`
- `[migration:pre-init]`
- `[migration:post-init]`
- `[onboarding:guard]`
- `[journal:aggregation]`
- (and every other instance found by grep)

Each label is unique enough to locate the exact catch block from a console log.

### Part B: Critical Error Banner

Create `js/components/error-banner.js` exporting `showCriticalError(message)` and `dismissError()`.

**DOM:** A `div.critical-error-banner` inserted as the first child of `#app-shell`. Fixed position at top of viewport, below any browser chrome, above sidebar and content. Red background using `var(--status-urgent)` or a dedicated `var(--error-bg)` if the design system has one. Contains: error icon (unicode, not emoji), message text, dismiss button (X). When banner is visible, add `padding-top` to `#app-shell` to prevent content occlusion; remove padding on dismiss. If `#app-shell` does not yet exist (e.g., `showCriticalError` called during early boot before DOM is ready), fall back to `document.body.prepend()`.

**Triggers:** 
- `storage.js save()` returns false → `showCriticalError('Data save failed — storage may be full')`
- `main.js boot()` catch block → `showCriticalError('App failed to start — try reloading')`
- `migration.js` failure → `showCriticalError('Data migration failed — your data may need recovery')`
- Debounced auto-save in `main.js:65` — the debounced callback must capture `save()`'s return value and call `showCriticalError()` on false. Currently the arrow function `() => save(key, store.state[key])` discards the return value. This is the most critical call site as it handles ALL reactive state persistence.

**CSS:** Append to `css/components.css`. Minimal: red bar, white text, fixed top, z-index above everything, dismiss button right-aligned.

### Verification

- `grep -rn "catch\s*{" js/ --include="*.js"` returns zero matches (no empty catches)
- `grep -rn "catch\s*(_" js/ --include="*.js"` returns zero matches (no underscore-suppressed catches)
- Comprehensive check: grep for all `catch` blocks and verify each contains a `console.error` call (the simple regex misses catches with only comments but no logging)
- Every catch block contains a `console.error` call
- Banner appears when localStorage is full (can test by filling storage then triggering a save)
- Banner is dismissible
- Banner works when called before `#app-shell` exists (falls back to `document.body`)

## Section 3: Cultivation Contradiction Resolution

### Problem

Seven data contradictions and one dangerous advice rule across the knowledge files. Different files give conflicting numbers for the same parameter. The mites-raise-rh and mites-spray rules fire in flower stages where they cause crop loss.

### Approach

Franco (the cultivation expert agent) resolves each contradiction authoritatively. The canonical value is picked based on practitioner consensus and plant safety, then ALL files are updated to match.

### The 8 Resolutions

**1. advice-mites-raise-rh (rules-advice.js)**
- **Current:** Fires in all stages, says "Raise humidity above 50%"
- **Resolution:** Add stage filter — only fire in `['seedling', 'early-veg', 'late-veg']`. For flower stages, replace the advice body with: "In flower, use predatory mites (Phytoseiulus persimilis) instead of raising humidity. RH above 50% in flower causes bud rot."
- **Files:** `js/data/note-contextualizer/rules-advice.js`
- **Note:** The condition function receives a `ctx` object. Verify `ctx.stage` is populated — `rules-keywords.js:515-518` sets it, but confirm the same `ctx` flows to advice rule conditions.

**2. Drying temperature**
- **Current:** stage-content says 15-18C, stage-rules says 15-21C, knowledge-articles says 18-21C
- **Canonical:** 15-18C optimal for terpene preservation. 15-21C acceptable range.
- **Files:** `js/data/stage-rules.js` (DRYING_TARGETS), `js/data/knowledge-articles.js`, `js/data/stage-content.js`

**3. Seedling VPD**
- **Current:** stage-content says 0.6-0.9 kPa, grow-knowledge says 0.4-0.8 kPa
- **Canonical:** 0.4-0.8 kPa (matches the data layer, wider range is safer for beginners)
- **Files:** `js/data/stage-content.js`

**4. Harvest amber percentage**
- **Current:** stage-content says 20-30% amber, knowledge-articles says 10-20%
- **Canonical:** 20-30% amber for balanced effect (Franco's practitioner call — more amber gives the body effect most home growers want)
- **Files:** `js/data/knowledge-articles.js`

**5. Epsom foliar timing**
- **Current:** rules-advice says lights-off, edge-case-supplemental says before lights-on
- **Canonical:** 30 minutes before lights-on (stomatal absorption requires open stomata)
- **Files:** `js/data/note-contextualizer/rules-advice.js`

**6. Cure burp schedule week 1**
- **Current:** stage-content says 3x daily, knowledge-articles says 2x daily
- **Canonical:** 3x daily in week 1 (Franco's recommendation — more gas exchange prevents ammonia)
- **Files:** `js/data/knowledge-articles.js`

**7. Late-flower RH**
- **Current:** grow-knowledge says 35-45%, stage-content says 45-50%, knowledge-articles says 50-55%
- **Canonical:** 45-50% (terpene-safe floor with botrytis protection ceiling)
- **Files:** `js/data/grow-knowledge.js`, `js/data/knowledge-articles.js`

**8. advice-mites-spray / neem (rules-advice.js)**
- **Current:** Fires in all stages, recommends neem foliar
- **Resolution:** Add stage filter — only fire in `['seedling', 'early-veg', 'late-veg']`. In flower stages, suppress entirely (neem contaminates trichomes).
- **Files:** `js/data/note-contextualizer/rules-advice.js`

**Additional file:** `js/data/edge-case-knowledge-supplemental.js` — contains epsom timing guidance (lines 426-440) and harvest amber references (lines 216-218). Grep this file for all 8 contradiction parameters and update any stale values to match canonical resolutions.

### Verification

- For each of the 8 items: grep the canonical value across all knowledge files AND `edge-case-knowledge-supplemental.js` to confirm consistency
- `advice-mites-raise-rh` does NOT fire when stage is `mid-flower`, `late-flower`, or `ripening`
- `advice-mites-spray` does NOT fire when stage is `mid-flower`, `late-flower`, or `ripening`
- Run existing cultivation-related tests to confirm no regressions

## Section 4: Test Coverage Expansion

### Problem

~45-50% test coverage with ~628 assertions across 25 modules. 10+ modules have no tests at all. The async boot race would have been caught by a single test asserting `window.__growdocStore` is set.

### Approach

Add `runTests()` exports to every module with meaningful logic. Each `runTests()` function returns an array of `{ pass: boolean, msg: string }` objects (matching the existing test runner convention). Register each in the test runner's module list in `js/main.js` (around line 395).

**Test scope per module:**

For data-only modules (stage-content, strain-class-adjustments, advisor-microcopy, edge-case-knowledge, knowledge-deep-dives, stage-note-placeholders, stage-question-starters): validate schema completeness — every entry has all required fields, no nulls where strings are expected, arrays are non-empty, IDs are unique.

For logic modules (edge-case-engine, question-matcher, stage-sources, plant-picker, journal aggregation, error-banner, migration): test the primary function's happy path + one error/edge case.

**Priority order (highest-risk first):**
1. `edge-case-engine.js` — verify tests are registered and pass
2. `question-matcher.js` — verify tests are registered and pass
3. `stage-sources.js` — createStageNote, createStageQuestion, getStageObservations
4. `error-banner.js` — showCriticalError renders, dismissError removes
5. `migration.js` — preInitMigration doesn't crash on clean state
6. `plant-picker.js` — renders chips, selection callback fires
7. `journal.js` — aggregation returns entries sorted by time
8. Data validation tests for all data modules

### Verification

- `/test` route shows all modules passing
- Total assertion count >= 900
- Zero modules with meaningful logic lack `runTests()`

## Section 5: Playwright Smoke Test

### Problem

No automated way to verify the app boots correctly. The DOMContentLoaded race produced a completely empty page with zero errors — only a human opening a browser would notice.

### Approach

Add Playwright as a devDependency (the ONE allowed npm dev dep). Create a minimal config and one test file.

**Files:**
- `playwright.config.js` — minimal config: `baseURL` from env `BASE_URL` or default `http://localhost:3000`, one project (chromium), no retries, timeout 10s. Include `webServer` config that starts a local static server (e.g., `npx -y serve . -l 3000`) so `npx playwright test` is self-contained with no manual server start needed.
- `tests/smoke.spec.js` — one test with 4 assertions:
  1. `window.__growdocStore` is an object
  2. Sidebar has children
  3. Content has children  
  4. Zero unexpected console errors (filter out expected `console.error` from non-critical catch blocks added in Section 2 — only fail on errors containing "failed to start", "quota", or uncaught exceptions)

**Running:** `npx playwright test` (webServer config handles the local server). To test against production: `BASE_URL=https://growdoc.vercel.app npx playwright test`. Manual only — no CI pipeline.

**package.json:** Add `@playwright/test` to devDependencies. Add a `"test:smoke"` script. After `npm install`, run `npx playwright install chromium` to download the browser binary.

**Housekeeping:**
- Add `node_modules/` to `.gitignore` (currently missing)
- Update `CLAUDE.md` to document the Playwright exception: "Playwright is the only allowed npm devDependency — used for smoke testing only."

### Verification

- `npx playwright test` passes locally
- `BASE_URL=<production-url> npx playwright test` passes against production
- Test would fail if the DOMContentLoaded race were reintroduced (can verify by temporarily adding a top-level await back)

## Section 6: localStorage Hardening

### Problem

`save()` in `storage.js` doesn't return success/failure. Callers never know if data was actually persisted. The Restore Backup button is broken after migration (namespace mismatch in `migration.js` vs `main.js`). No "last saved" indicator exists.

### Part A: Save Return Value

Modify `save(key, value)` in `storage.js` to return `true` on success, `false` on failure (quota exceeded, serialization error). Every caller that uses `save()` — the debounced auto-save subscribers in `main.js`, the manual saves in `settings.js`, the migration writes — checks the return value and calls `showCriticalError()` on failure.

**Critical: debounced auto-save.** The callback at `main.js:65` (`debounce(() => save(key, store.state[key]), 300)`) wraps `save()` in an arrow function whose return value is discarded by the debounce wrapper. The callback must be updated to capture and act on the return: `debounce(() => { if (!save(key, store.state[key])) showCriticalError('...'); }, 300)`.

### Part B: Restore Backup Fix

In `migration.js`, backup keys are written with prefix `growdoc-legacy-backup-{key}` (line 49). In `main.js`, `_hasBackupKeys()` (line 345) searches for `growdoc-companion-backup` and `restoreBackup()` (line 357) searches for `growdoc-companion-backup-`. These prefixes don't match — restore will never find the backup keys.

**Fix direction:** Update `main.js _hasBackupKeys()` to search for `growdoc-legacy-backup-` prefix. Update `restoreBackup()` to match the same prefix and strip it correctly when restoring.

**Also fix:** `restoreBackup()` at line 367 only clears `growdoc-companion-migrated` (V1 flag), but `_alreadyMigrated()` in `migration.js` checks BOTH `V1_FLAG` and `V2_FLAG` (`growdoc-companion-v2-migrated`). After restore + reload, re-migration won't run because V2 flag is still set. Fix: clear both flags in `restoreBackup()`.

Test by: running a migration, then clicking Restore Backup and confirming data is restored and re-migration runs on reload.

### Part C: Last-Saved Timestamp

Store `lastSavedAt` as a **module-level variable** (`let _lastSavedAt = null`) in `main.js`, NOT in the reactive `ui` store key. Storing it in the reactive store would create an infinite loop: save succeeds → update lastSavedAt in ui → commit triggers debounced save for ui → save succeeds → update lastSavedAt → infinite recursion.

Export `_lastSavedAt` (or a getter) so Settings view can read it. Updated every time any `save()` call succeeds. Displayed in the Settings view's quota dashboard section as "Last saved: X minutes ago" using a relative-time formatter.

### Verification

- `save()` returns `false` when localStorage is full (can test by filling storage)
- Critical error banner appears on save failure
- Restore Backup button restores data after a migration (manual test)
- Settings shows "Last saved: just now" after a state change

## Parallelization Strategy

The 6 sections are organized into 3 batches for maximum parallelism:

**Batch 1 (parallel, no dependencies):**
- Section 1: Remove top-level awaits
- Section 3: Cultivation contradictions

**Batch 2 (depends on Section 1):**
- Section 2: Error handling (touches many files; needs async cleanup done first to avoid merge conflicts)
- Section 6: localStorage hardening (touches storage.js; independent of Section 2 but benefits from the error banner being available)
- **File coordination:** Both Section 2 and Section 6 touch `main.js`. Section 2 owns boot/error paths (top of file, `boot()` function). Section 6 owns backup/restore functions and auto-save setup (bottom half). Implementers must respect these boundaries to avoid merge conflicts.

**Batch 3 (depends on Sections 1, 2, 6):**
- Section 4: Test expansion (needs stable APIs and error patterns to test against)
- Section 5: Playwright smoke test (needs stable boot to pass)

**Post-deploy step:** After all sections are deployed, bump `sw.js VERSION` string (currently `'2026-04-nc2'`) to force cache invalidation. Without this, returning users with cached JS will continue hitting the pre-fix boot race. This should be the final deploy of the sprint.
