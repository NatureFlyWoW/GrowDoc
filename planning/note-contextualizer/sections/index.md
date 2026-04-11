<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: echo "GrowDoc tests run in browser at /test-runner — manual verification required per claude-plan-tdd.md. Run vercel dev, navigate to /test-runner, confirm all sections pass."
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-schema-projection
section-02-ui-scaffolding
section-03-rules-keywords
section-04-merge-weighting
section-05-plant-doctor
section-06-advisors
section-07-task-engine
section-08-ui-finalization
section-09-cure-notes
section-10-traceability-deploy
END_MANIFEST -->

# Note Contextualizer — Implementation Sections Index

10 sections delivered in **four serialized batches**. The section numbers here are sequential (01–10) per the deep-plan manifest convention; the `claude-plan.md` refers to the same sections by their original logical numbers (S1–S9). The mapping is in the summaries below.

## Project context reminders

- **Vanilla JS only.** No frameworks, no bundlers, no npm dependencies. ES modules load directly in the browser.
- **Tests run in the browser** at the `/test-runner` route — there is no headless CI. Every new test file is registered in `js/main.js:298` and exports `async function runTests() → Array<{pass, msg}>`.
- **Manual test verification** is required after each section. Run `vercel dev`, open `http://localhost:3000/test-runner` in a hard-reload context (to bypass service worker cache), confirm all tests show `pass`.
- **Deploy is part of done.** Final section runs `vercel --prod` and bumps `sw.js` VERSION.
- **Design tokens** live in `css/variables.css`, NOT `docs/_design-system.md`.

## Dependency graph

| Section | Depends On | Blocks | Parallelizable | Batch |
|---|---|---|---|---|
| section-01-schema-projection | — | 03, 05, 07 | Yes (with 02) | 1 |
| section-02-ui-scaffolding | — | 08 | Yes (with 01) | 1 |
| section-03-rules-keywords | 01 | 04, 05 | Yes (with 04) | 2 |
| section-04-merge-weighting | 01, 03 | 05, 06, 07 | Yes (with 03) | 2 |
| section-05-plant-doctor | 01, 03, 04 | 07, 10 | Yes (with 06) | 3 |
| section-06-advisors | 01, 03, 04 | 07, 10 | Yes (with 05) | 3 |
| section-07-task-engine | 05, 06 | 08, 10 | No (serial after 05+06) | 3 |
| section-08-ui-finalization | 01, 02, 03, 04, 05, 07 | 10 | Yes (with 09) | 4 |
| section-09-cure-notes | 01, 03, 04 | 10 | Yes (with 08) | 4 |
| section-10-traceability-deploy | all prior | — | No (serial last) | 4 |

## Execution order

1. **Batch 1** — `section-01-schema-projection` and `section-02-ui-scaffolding` in parallel. No shared files; S1 touches data layer, S2 touches components and CSS.
2. **Batch 2** — `section-03-rules-keywords` and `section-04-merge-weighting` in parallel. Only after Batch 1 lands. S3 ports `KEYWORD_PATTERNS` and deletes legacy files; S4 implements merge/weighting and kills `profile-context-rules.js`. Both depend on S1's schema, but touch different files.
3. **Batch 3** — `section-05-plant-doctor` and `section-06-advisors` in parallel, then `section-07-task-engine` serial. S5 and S6 have zero file overlap. S7 (task engine) must run after both because it depends on the `getRelevantObservations` + `mergeNoteContext` surface S5 establishes and shares `task-engine.js` with S5's task-card edits.
4. **Batch 4** — `section-08-ui-finalization` and `section-09-cure-notes` in parallel, then `section-10-traceability-deploy` serial. S8 upgrades the stub UI, ships the debug waterfall, and lands the Recent Observations widget. S9 adds cure tracker note projection. S10 verifies, bumps `sw.js` VERSION, commits, deploys.

## Section summaries

### section-01-schema-projection
**Original plan section:** S1 (Observation schema + projection + store hook, S)
**Batch:** 1 (parallel with section-02)

Define `Observation`, `ParsedNote`, `ObservationIndex` JSDoc types in `js/data/observation-schema.js`. Implement `collectObservations(grow, profile, opts)` as a pure function walking every existing note source. Implement `initContextualizer(store)`, `getObservationIndex()` with synchronous hash-check rebuild path, `__resetForTests()`. Sidecar citations `Map<obsId, Set<consumerId>>`. First test file `js/tests/note-contextualizer.test.js` registered in `js/main.js:298`. Stubs for `parseObservation` (returns empty ctx) and `mergeNoteContext` (returns empty merged).

### section-02-ui-scaffolding
**Original plan section:** S7-stub (Severity chip + strip scaffolding, S)
**Batch:** 1 (parallel with section-01)

New reusable components `js/components/severity-chip.js` and `js/components/parsed-signal-strip.js`. Chip writes the LEGACY enum (`'urgent'|'concern'|null`) to `log.details.severity`; 3-label display (`alert|watch|info`) is presentation-only. Auto-infer severity from text via a placeholder heuristic (real `SEVERITY_HEURISTICS` arrives in section-03). Strip renders `[parsing soon…]` placeholder until section-03. Wired into `js/components/log-form.js`, `js/components/task-card.js`, `js/views/plant-detail.js` Context Notes textarea. New CSS file `css/note-contextualizer.css` imported in `index.html` after `variables.css`.

### section-03-rules-keywords
**Original plan section:** S2 (KEYWORD_PATTERNS port + golden fixtures + delete legacy, M)
**Batch:** 2 (parallel with section-04)

Port `KEYWORD_PATTERNS` (984 patterns) verbatim from `docs/note-context-rules.js` into `js/data/note-contextualizer/rules-keywords.js`. Preserve array order. Add `SEVERITY_HEURISTICS` (corrected regexes with proper grouping), `ACTION_TAKEN_PATTERNS`, `DOMAIN_BY_RULE_ID`, `FRANCO_OVERRIDE_RULE_IDS`. Implement `parseObservation(obs)` matching §4a field list of `claude-plan.md`. Capture golden fixtures — one-time manual browser run against 25 representative notes, committed to `js/tests/fixtures/note-context-legacy.json`. Parity test iterates fixtures. Sub-commit 03b deletes `docs/note-context-rules.js`, `docs/tool-plant-doctor.html`, `docs/plant-doctor-data.js` (if v3-only), and their `docs.json` entries. Grep for stale references.

### section-04-merge-weighting
**Original plan section:** S3 (Merge, weighting, kill profile-context-rules, M)
**Batch:** 2 (parallel with section-03)

Implement `merge.js` (`mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince` with `source !== 'profile'` guard) and `weighting.js` (half-life `resolveScalar` implementing the 4-step algorithm from `claude-plan.md §6`). Merge `js/data/profile-context-rules.js` rules into `rules-keywords.js` with `wizardStep` metadata — dedupe against existing patterns. Delete `profile-context-rules.js`. Update all callers (`onboarding.js`, `settings.js`, `plant-detail.js`, `my-grow.js`) to use the unified contextualizer API. Depends on section-01's schema and (logically) on section-03's `rules-keywords.js` — but since both land in the same batch and this section authors the merge/weighting code against the schema, it can proceed in parallel as long as section-03's exported names are committed early.

### section-05-plant-doctor
**Original plan section:** S4 (Plant Doctor wiring + authored rules + activePlantId, M)
**Batch:** 3 (parallel with section-06)

Author `rules-score.js` from scratch — ~30–40 condition-name-targeted adjustment rules matching Companion conditions (`'Nitrogen Deficiency'`, `'Overwatering'`, `'Heat Stress'`, etc.). Author `rules-advice.js` from scratch — ~40–50 advice rules keyed by Companion condition name, producing human-readable `{headline, detail, severity}`. Implement `adjustScoresFromNotes(scoresMap, ctx)` and `generateContextualAdvice(ctx, conditionName)`. Behavioral tests seed notes and assert scoresMap changes. Introduce `store.state.ui.activePlantId` slot in `js/store.js` UI_FIELDS, set from Plant Detail mount and Plant Doctor launch handlers, default to `plants[0]?.id`. Rewire `js/plant-doctor/doctor-engine.js:buildContext` to use the active plant. Update `doctor-ui.js` to render "Your Action Plan" block from `generateContextualAdvice`.

### section-06-advisors
**Original plan section:** S6 (Harvest/stage/priority/dashboard note-awareness, M)
**Batch:** 3 (parallel with section-05)

`js/data/harvest-advisor.js getHarvestRecommendation` accepts `notes = []` (default for backwards compat), runs `mergeNoteContext`, folds aroma/trichome/timeline signals into `tradeoffNote`. "User thinks early/late" rule ids shift confidence ±10%. `js/data/stage-rules.js` accepts `notes = []` and checks for `action-taken:transplanted` or `recovery` keywords before advancing stage. `js/data/priority-engine.js` accepts `notes = []` and adjusts weights from user-stated priorities. `js/views/dashboard.js` status banner shows top alert-severity observation (≤48h old) as a second-line banner when tasks array is empty. Zero file overlap with section-05 — safe to parallelize.

### section-07-task-engine
**Original plan section:** S5 (Task engine note-awareness + override API, L)
**Batch:** 3 (serial AFTER section-05 and section-06)

`js/components/task-engine.js` `generateTasks()` entry collects observations once. New helper `js/components/task-engine-note-guards.js` with `checkRedundancy`, `checkContradiction`, `inferAlertTrigger`. Anti-redundancy guards on water (12h), feed (24h), flush (48h), IPM (72h), defoliate (168h), top (336h). Suppressed tasks carry `suppressedBy: [obsId]`. `evaluateDiagnoseTriggers` fires on note severity OR worsening-keyword. `evaluateEnvironmentTriggers` emits `env-discrepancy` task on sensor-vs-note conflict. Override API: `overrideSuppression(taskId, plantId, taskType)` creates a REAL log entry with `type:'override'`, `details.notes:'Manual override: <taskType>'`, `details.severity:null` and commits grow state. Task card renders suppressed state with quoted-note banner and "Override" button. Serial because shares `task-engine.js` with section-05 dependencies.

### section-08-ui-finalization
**Original plan section:** S7-final (UI finalization + debug waterfall, M)
**Batch:** 4 (parallel with section-09)

Upgrade `parsed-signal-strip.js` from placeholder `[parsing soon…]` to real parsed output. Wire contradiction banner logic (when new note conflicts with recent structured value). Land Recent Observations widget on Plant Detail (last 5, collapsible, domain+severity chips). Journal domain filter. New `js/components/debug-waterfall.js` renders behind `?debugNotes=1` — table of raw text → parsed keywords → merged ctx → applied weight → citations per observation, row count capped at 200. `?debugNotes=1` persists across SPA route changes via `sessionStorage['growdoc-debug-notes']`. Fix `plant-detail.js` timeline to render parsed-keyword chips under log notes.

### section-09-cure-notes
**Original plan section:** S9a (Cure note projection + severity chip, S)
**Batch:** 4 (parallel with section-08)

Extend `collectObservations` to walk `localStorage['growdoc-cure-tracker']` and emit one Observation per cure note with `source:'cure'` and `domains:['cure-burp'|'cure-dry'|'aroma']`. Observed timestamp uses the cure-tracker entry timestamp. Minimal edit to `docs/tool-cure-tracker.html` to add severity chip + parsed-signal strip to the cure note input — NOT a full SPA rewrite. Full cure advisor with strain profiles and decision rules is deferred to `9b-future.md` (requires Franco consultation). Zero overlap with section-08's file set.

### section-10-traceability-deploy
**Original plan section:** S8 (Traceability, final verification, deploy, M)
**Batch:** 4 (serial AFTER section-08 and section-09)

Implement `recordReferencedIn` wiring across Plant Doctor (`doctor-engine.js` after `runDiagnosis` returns), task engine (per-task when suppressed or diagnose-triggered), harvest advisor, dashboard banner, and stage-rules — 5–10 call sites. Each call site collects the observation IDs it cited and writes to the sidecar map. Final grep for stale references to deleted files. Run full test suite via `/test-runner` in a hard-reload browser context to bypass SW cache. Manual verification of the six success criteria from `claude-spec.md §Success criteria`. Bump `sw.js:23 VERSION` from `'dev'` to a timestamped value like `'2026-04-nc1'`. Commit sequence complete. `vercel --prod`. Post-deploy: verify `/test-runner` passes in production. Update memory files if new patterns emerged. Explicitly: no new environment variables.

## Rollback notes

- Each section commits individually with message `section-NN: <description>` matching grow-companion-v2 convention.
- Section 03 commits twice: `section-03a: port KEYWORD_PATTERNS + fixtures` and `section-03b: delete legacy v3 tool`. This lets us revert integration regressions (sections 05–10) without also resurrecting legacy parser code, and lets us revert the port (03a) while leaving deletes (03b) intact.
- Full rollback path: `git revert <section-commit>` then `vercel --prod`. There is no feature flag; code paths are mutually exclusive.
- Service worker version bump in section-10 is mandatory — without it, installed PWAs will serve stale cached modules referencing deleted files.

## Cross-references

- `claude-plan.md` — full implementation plan
- `claude-plan-tdd.md` — test stubs per section
- `claude-spec.md` — feature spec with 24 locked decisions
- `claude-research.md` — test infra, store hooks, half-life rationale
- `claude-interview.md` — rollout + cure-advisor arbitration
- `claude-integration-notes.md` — Opus review integration decisions
- `reviews/iteration-1-opus.md` — the review
- `9b-future.md` — deferred cure advisor follow-up
- `01-audit.md` through `08-decisions.md` — pre-existing split spec
