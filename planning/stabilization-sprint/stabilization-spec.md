# GrowDoc Stabilization Sprint Spec

## Context

GrowDoc is a vanilla JS cannabis cultivation companion app (ES modules, no frameworks, no npm deps, no bundlers) deployed on Vercel. A 5-reviewer council just completed a deep review (`first_review/`) and the user answered 20 strategic interview questions (`first_review/interview-synthesis.md`). The user chose to stabilize before iterating.

## Problem

The recent Timeline v2 feature sprint introduced:
- A fragile async boot chain (top-level awaits) that already caused one production outage
- 15+ empty catch blocks that silently swallow errors
- 7 cultivation data contradictions across knowledge files
- ~45-50% test coverage with 10+ modules completely untested
- A dangerous advice rule (mites-raise-rh) that fires in flower stages where it could cause crop loss

## Stabilization Sprint Scope (7 items)

### 1. Remove all top-level awaits, lazy-load edge-case engine

**Files affected:** `js/main.js`, `js/components/timeline-bar.js`, `js/components/task-engine.js`, `js/plant-doctor/doctor-ui.js`

Three modules use `await import('../data/edge-case-engine.js')` at module top level, which delays module evaluation and caused the DOMContentLoaded race condition. Convert all to lazy-load on first use: the importing function calls a memoized async getter the first time it needs the engine, caches the result, and subsequent calls are sync from cache.

See: `first_review/errors-async-boundaries.md`, `first_review/arch-risks.md`

### 2. Add console.error to every empty catch block + critical-failure UI banner

**Files affected:** All files with empty catch blocks (15+ across codebase per `first_review/errors-silent-failures.md`)

Replace every `catch {}` and `catch { /* comment */ }` with `catch (err) { console.error('context:', err); }`. Then add a global critical-failure banner component that surfaces boot crashes and data-save failures to the user (non-intrusive, dismissible, only for critical errors).

See: `first_review/errors-silent-failures.md`, `first_review/errors-recommendations.md`

### 3. Franco resolves 7 cultivation contradictions

**Files affected:** `js/data/note-contextualizer/rules-advice.js`, `js/data/stage-content.js`, `js/data/grow-knowledge.js`, `js/data/knowledge-articles.js`, `js/data/stage-rules.js`

Seven parameter conflicts identified in `first_review/cultivation-contradictions.md`:
1. Spider mites RH vs late-flower RH (advice-mites-raise-rh fires without stage filter)
2. Drying temperature: three different ranges (15-18 vs 15-21 vs 18-21)
3. Seedling VPD: two different ranges (0.6-0.9 vs 0.4-0.8)
4. Harvest amber percentage (20-30% vs 10-20%)
5. Epsom foliar timing (lights-off vs before lights-on)
6. Cure burp schedule week 1 (3x vs 2x daily)
7. Late-flower RH for terpenes vs botrytis prevention (50-55% vs 35-45% vs 45-50%)

Franco resolves each authoritatively with a single canonical value/range, then ALL files are updated to match.

### 4. Expand /test runner to untested modules

**Files affected:** All modules that should have `runTests()` but don't (10+ per `first_review/qa-test-coverage.md`), plus `js/main.js` test runner module list

Add `runTests()` exports to every untested module that has meaningful logic. Register each in the test runner's module list in main.js. Target: raise assertion count from ~628 to ~900+ and file coverage from ~45% to ~70%+.

See: `first_review/qa-test-coverage.md`, `first_review/qa-critical-untested.md`

### 5. Add 1 Playwright smoke test

**Files affected:** New test file (e.g., `tests/smoke.spec.js` or similar), possibly `package.json` for a test script

One Playwright test that loads the app, waits for boot, and asserts `window.__growdocStore` is an object. This single assertion would have caught the DOMContentLoaded race. Keep it minimal — no test framework beyond Playwright itself.

See: `first_review/qa-testing-strategy.md`

### 6. Harden localStorage quota management and backup/restore

**Files affected:** `js/storage.js`, `js/views/settings.js`, possibly `js/main.js`

- Check `save()` return values everywhere they're called
- Add quota-exceeded handling that surfaces a warning before data loss
- Verify the backup/restore flow actually works (error detective found the backup namespace mismatch between migration.js and main.js makes the Restore Backup button inoperative after a migration crash)
- Add a "last successful save" timestamp to the quota dashboard

See: `first_review/errors-data-corruption.md`, `first_review/errors-recommendations.md`

### 7. Fix the mites-raise-rh advice rule

**Files affected:** `js/data/note-contextualizer/rules-advice.js`

The `advice-mites-raise-rh` rule tells growers to raise humidity above 50% to fight spider mites, but has NO stage filter. In mid-flower and late-flower, raising RH above 50% causes botrytis (bud rot) — a total crop loss. Add a stage guard so this rule only fires in seedling, early-veg, and late-veg stages. In flower stages, replace with predatory mite recommendation.

See: `first_review/cultivation-contradictions.md` item 1, `first_review/cultivation-accuracy.md`

## Technical Constraints

- Vanilla JS ES modules only — no React, Vue, bundlers, transpilers
- No npm dependencies (existing or new)
- Design system from `docs/_design-system.md` — use CSS custom properties
- GitHub is the database for docs; localStorage for companion app state
- Deploy via `vercel --prod` after each section
- Test runner is browser-based at `/test` route — no Node test framework

## Parallelization Notes

These items can be parallelized:
- Items 1 + 2 are independent (different files, different concerns)
- Item 3 (cultivation fixes) is independent of all technical items
- Item 7 is a subset of item 3 but can be done first as a quick win
- Items 4 + 5 (testing) depend on items 1 + 2 being done first (so tests cover the new patterns)
- Item 6 (localStorage) is independent of everything except item 2 (error handling patterns)

## Success Criteria

- Zero top-level awaits in the codebase
- Zero empty catch blocks
- Zero cultivation contradictions
- Test coverage ~70%+ (up from ~45%)
- Playwright smoke test passes on production
- localStorage save failures surface to user
- Mites advice never fires in flower stages
- Production stays green throughout (no regressions)
