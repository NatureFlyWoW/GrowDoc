# QA Test Coverage Map

## Test Runner Infrastructure

`js/main.js:396-423` — `renderTestRunner()` imports 25 modules, calls `runTests()`, aggregates `{pass,msg}[]`. Browser-only; no CI hook. Two modules with `runTests()` are excluded from the runner: `edge-case-engine.js` (uses throw pattern, not `{pass,msg}[]`) and `pattern-tracker.js` (has correct shape but not listed in `main.js:396`).

---

## Modules With runTests() — Coverage Summary

| Module | File | Assertions | What Is Tested |
|---|---|---|---|
| utils | `js/utils.js:72` | 16 | escapeHtml, formatDate, daysSince, generateId, debounce (type-only) |
| store | `js/store.js:245` | 34 | commit, subscribe, dispatch, freeze, getSnapshot, WeakMap cache |
| storage | `js/storage.js:479` | 23 | save/load round-trip, missing key, corrupted JSON, migration chain, version skip |
| router | `js/router.js:175` | 26 | matchRoute basics, params, unknown routes, trailing slash, auth guard flags |
| sidebar | `js/components/sidebar.js:365` | ~12 | NAV_ITEMS shape, My Grow/Tools children count, collapsed state DOM |
| onboarding | `js/views/onboarding.js:751` | 37 | Wizard step 1 state, progress dots, back button, plant count validation |
| dashboard | `js/views/dashboard.js:504` | 7 | Status banner green/red, between-grows button, task sort order |
| vpd-widget | `js/components/vpd-widget.js:172` | 9 | VPD formula, leaf-temp offsets, optimal/high/low status, DLI math |
| feeding-calculator | `js/data/feeding-calculator.js:113` | 11 | soil/coco schedules, priority-EC relationship, EC/pH status advice |
| question-matcher | `js/data/question-matcher.js:441` | 8 | Matcher function exists and returns answers for stage questions |
| grow-knowledge | `js/tests/grow-knowledge.test.js` | 35 | STAGES enum, VPD/DLI/NUTRIENT_TARGETS shape, TEMP_DIF, WATERING_FREQUENCY, EVIDENCE integrity |
| strain-database | `js/tests/strain-database.test.js` | 25 | 500+ strains, required fields, flower weeks, stretch ratio, autoflowers, duplicates, search, picker render |
| priority-system | `js/tests/priority-system.test.js` | 32 | StarRating click/toggle/onChange, EffectSelector show/hide, calculateWeights, blendTarget, getRecommendation |
| priority-engine | `js/tests/priority-engine.test.js` | 18 | Note-biased calculateWeights, conflict resolution, getRecommendation forwarding, all-zero edge |
| harvest-advisor | `js/tests/harvest-advisor.test.js` | 26 | Baseline shape, notes=[] equivalence, growerIntent override, confidence bumps, citedObsIds, aroma enrichment |
| stage-rules | `js/tests/stage-rules.test.js` | 9 | shouldAutoAdvance with/without notes, transplant block, recovery keywords, plant-scoping |
| stage-timeline | `js/tests/stage-timeline.test.js` | 25 | Timeline render, current/completed markers, stage order/durations, auto-advance, advancePlantStage, burp schedule |
| task-engine | `js/tests/task-engine.test.js` | 49 | Time/stage/experience triggers, task card render, isDuplicate, note-guard suppression (12 S07 cases) |
| note-contextualizer | `js/tests/note-contextualizer.test.js` | 66 | All source walkers, observedAt fallbacks, ID determinism, opts filters, initContextualizer idempotency, citations, cure-tracker S09 (12 cases) |
| note-contextualizer-merge | `js/tests/note-contextualizer-merge.test.js` | 38 | mergeNoteContext scalar/array/keyword merge, half-life decay, severity-first ordering, getRelevantObservations filters, findActionsTakenSince, parseProfileText |
| note-contextualizer-rules | `js/tests/note-contextualizer-rules.test.js` | 46 | KEYWORD_PATTERNS shape/uniqueness, DOMAIN_BY_RULE_ID totality, FRANCO_OVERRIDE_RULE_IDS, SEVERITY_HEURISTICS, ACTION_TAKEN_PATTERNS smoke, parseObservation idempotency/severity/profile guard, fixture round-trip |
| doctor-engine | `js/tests/doctor-engine.test.js` | 17 | SCORE_ADJUSTMENTS/ADVICE_RULES shapes, adjustScoresFromNotes boosts, generateContextualAdvice, rule error isolation, buildContext plant selection, runDiagnosis E2E, cross-plant isolation, activePlantId persistence |
| severity-chip | `js/tests/severity-chip.test.js` | 23 | Chip render/click, autoInferSeverity, blur trigger, user-override clearing flag, dual-mount independence, signal-strip placeholder canary |
| ui-note-contextualizer | `js/tests/ui-note-contextualizer.test.js` | 10 | Signal-strip placeholder regression, empty draft clear, recent-obs widget, debug waterfall row cap/close/headers |
| dashboard-banner | `js/tests/dashboard-banner.test.js` | 16 | Banner text/color, alert-obs second-line, 48h cutoff, urgent-task suppression, truncation, click target |
| vercel-config | `js/tests/vercel-config.test.js` | 5 | SPA rewrite exclusions (skips in prod) |

**Total assertions in runner: ~628**

---

## Modules With runTests() NOT In Runner

- `js/data/edge-case-engine.js:588` — 7 tests using throw-on-fail pattern; incompatible with runner's `{pass,msg}[]` contract. Not listed in `main.js:396`.
- `js/data/pattern-tracker.js:79` — 8 assertions, correct return format, but absent from `main.js:396`.

---

## Modules That Should Have Tests But Do Not

- `js/api/login.js`, `api/save.js`, `api/state.js`, `api/_lib/auth.js`, `api/_lib/github.js` — zero test coverage; serverless functions handle auth, JWT, and GitHub writes.
- `js/components/log-form.js` — primary data entry UI; no tests.
- `js/components/trichome-sliders.js` — drives harvest advisor input; no tests.
- `js/components/plant-picker.js` — cross-plant navigation; no tests.
- `js/components/env-chart.js` — environment rendering; no tests.
- `js/views/plant-detail.js`, `views/journal.js`, `views/my-grow.js`, `views/harvest.js`, `views/finish.js` — major views with zero test coverage.
- `js/data/calculators.js` — exposed calculator logic; no tests.
- `js/data/training-protocols.js`, `data/knowledge-articles.js`, `data/myths-data.js` — data integrity untested.

---

## Overall Coverage Estimate

Tested modules: ~25 of ~55 significant JS files. Core business logic (task engine, note contextualizer, plant doctor, stage rules, data integrity) is well-covered. Zero coverage on: all API functions, all secondary views, log-form, trichome-sliders, calculators, and knowledge data files.

**Estimated coverage: 45-50% of files; ~65% of lines in tested modules.**
