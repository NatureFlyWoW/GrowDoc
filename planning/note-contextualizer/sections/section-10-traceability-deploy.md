# section-10-traceability-deploy

**Original plan section:** S8 (Traceability, final verification, deploy, M)
**Batch:** 4 (serial — runs LAST, after section-08 and section-09)
**Complexity:** M

## Purpose

Closing section. Sections 01–09 built schema, rules, merge/weighting, advisors, task engine, UI, cure projection. All machinery exists. What remains:

1. **Wire `recordReferencedIn` into every downstream consumer** so the citations map gets populated during real runs.
2. **Final repo hygiene** — grep for stale references to files deleted in sections 03/04.
3. **Run full `/test-runner` suite** in hard-reload context.
4. **Manual verification** of six success criteria from spec.
5. **Service worker VERSION bump** from `'dev'` to timestamped token.
6. **Commit, `vercel --prod`, post-deploy verification.**
7. **Update memory files** if new patterns emerged.

No new UI. Debug waterfall (section-08) gets data; this section ensures the citations are written.

## Dependencies

**Serial LAST in batch 4.** Cannot begin until sections 01–09 are committed and tests green locally.

- **section-01** — `recordReferencedIn`, `getCitationsFor`, citations sidecar Map.
- **section-05** — Plant Doctor path for citation wiring.
- **section-06** — `harvest-advisor.js`, `stage-rules.js`, `priority-engine.js`, dashboard banner.
- **section-07** — task engine suppression + diagnose + env-discrepancy paths.
- **section-08** — debug waterfall component reads sidecar.
- **section-09** — cure note projection.

## Background

### Sidecar citations map

`js/data/note-contextualizer/index.js` holds `Map<observationId, Set<consumerId>>`. Sidecar because:
- Observations are recomputed and re-hashed on every commit. Mutable state on them would be erased.
- Consumers call `recordReferencedIn(obsIds, consumerId)` with IDs they used and a consumer identifier string.
- `getCitationsFor(obsId) → Set<consumerId> | undefined` reads.
- Orphaned entries GC'd during rebuild (section-01).

### Consumer ID convention

Stable, colon-separated IDs:

- `plant-doctor:runDiagnosis:<plantId>`
- `task-engine:suppress:<taskType>:<plantId>`
- `task-engine:diagnose-trigger:<plantId>`
- `task-engine:env-discrepancy:<plantId>`
- `harvest-advisor:getHarvestRecommendation:<plantId>`
- `stage-rules:shouldAdvanceStage:<plantId>`
- `priority-engine:computeWeights:<plantId>`
- `dashboard:statusBanner`

### Why VERSION bump is mandatory

Section-03 deletes `docs/note-context-rules.js`, `docs/tool-plant-doctor.html`, `docs/plant-doctor-data.js`. The service worker pre-caches modules on install. Existing PWA users loading after deploy would get stale cached HTML importing deleted JS → blank screen or 404.

Bumping `sw.js:23 VERSION` forces new SW install → `activate` → old caches purged. Format: `'2026-04-nc1'` (YYYY-MM-iteration).

## Tests FIRST

Add to `js/tests/note-contextualizer.test.js`. `__resetForTests()` on every test.

```
# Test: recordReferencedIn adds consumerId to citations sidecar for given obsIds
# Test: recordReferencedIn accepts string or 1-element array
# Test: recordReferencedIn is additive — two calls with different consumerIds yield both
# Test: getCitationsFor returns undefined/empty set for obsId with no citations
# Test: getCitationsFor returns Set of consumerIds
# Test: Citations sidecar GCs orphaned entries on rebuild
# Test: After runDiagnosis end-to-end, citations has entries with 'plant-doctor:' prefix
# Test: After generateTasks on seeded grow with 'just watered', suppressed water task's obsId has 'task-engine:suppress:water' citation
# Test: After generateTasks with alert observation, diagnose task's obsId has 'task-engine:diagnose-trigger' citation
# Test: After getHarvestRecommendation with aroma/trichome notes, cited obsIds have 'harvest-advisor:' citation
# Test: After dashboard statusBanner with alert obs ≤48h, obs has 'dashboard:statusBanner' citation
# Test: [DEPLOY-GATE] sw.js VERSION string is NOT 'dev'
# Test: (smoke) all registered test files report complete — no cross-test contamination
```

The `sw.js VERSION ≠ 'dev'` test is allowed to fail locally during dev and must pass only at commit time. Mark with `msg: 'DEPLOY-GATE: sw.js VERSION bumped'`.

## Implementation steps

### Step 1 — Wire Plant Doctor citations

**File:** `js/plant-doctor/doctor-engine.js`

After `runDiagnosis` computes result but before return, collect observation IDs that influenced top condition. Either have `adjustScoresFromNotes` return cited IDs alongside adjusted scores, OR walk `ctx.observations` here and filter by domain intersection with top condition.

```js
import { recordReferencedIn } from '../data/note-contextualizer/index.js';
recordReferencedIn(citedIds, `plant-doctor:runDiagnosis:${plantId}`);
```

### Step 2 — Wire task engine citations

**File:** `js/components/task-engine.js`

For each suppressed task:
```js
recordReferencedIn(task.suppressedBy, `task-engine:suppress:${task.type}:${task.plantId}`);
```

For `evaluateDiagnoseTriggers` alert-fired tasks:
```js
recordReferencedIn(task.triggeredBy, `task-engine:diagnose-trigger:${task.plantId}`);
```

For `evaluateEnvironmentTriggers` conflicts:
```js
recordReferencedIn([conflictingObs.id], `task-engine:env-discrepancy:${task.plantId}`);
```

**Do NOT cite** tasks that are neither suppressed nor triggered by notes. Routine scheduled tasks have no citation.

### Step 3 — Wire advisor citations

**`js/data/harvest-advisor.js`** — after `tradeoffNote` built, collect obs IDs whose parsed fields contributed (aroma/trichomes/timeline domains within 14d):
```js
recordReferencedIn(citedIds, `harvest-advisor:getHarvestRecommendation:${plantId}`);
```

**`js/data/stage-rules.js`** — when action-taken:transplanted or recovery keyword blocks advance:
```js
recordReferencedIn([obs.id], `stage-rules:shouldAdvanceStage:${plantId}`);
```

**`js/data/priority-engine.js`** — when user-priority observation shifts weight:
```js
recordReferencedIn([obs.id], `priority-engine:computeWeights:${plantId}`);
```

### Step 4 — Wire dashboard banner citation

**`js/views/dashboard.js`** — when the top alert-obs second-line banner renders:
```js
recordReferencedIn([topAlertObs.id], 'dashboard:statusBanner');
```

### Step 5 — Final stale-reference grep

Zero matches expected (cleaned up in 03/04):
- `note-context-rules` in `docs/`, `js/`, `index.html`, `admin.html`, `sw.js`, `docs.json`
- `plant-doctor-data` (unless section-03 kept it)
- `tool-plant-doctor` in `docs.json`, HTML files
- `profile-context-rules` in `js/`

If found, remove. Commit separately if more than one-liner.

Also grep `sw.js` for deleted filenames in precache array — remove if found.

### Step 6 — Run full test suite

1. `vercel dev` from repo root.
2. Hard-reload `http://localhost:3000/test-runner` (Ctrl+Shift+R) to bypass SW cache.
3. Confirm **every row** across **every** registered test file shows `pass`. Not only `note-contextualizer.test.js`.
4. Known acceptable failure: `sw.js VERSION ≠ 'dev'` deploy-gate test. Goes green in Step 8.

### Step 7 — Manual verification against six success criteria

From `claude-spec.md §Success criteria`. Write note on plant: `"just flushed at 6.0 pH, tips still burning"`. Verify:

1. **Observation creation** — DevTools `getObservationIndex()` shows Observation with `source:'log'`, `domains` includes `'action-taken'` + `'nutrients'`, `severity:'watch'`, parsed signals `action-flushed`, `ph-extracted=6.0`, `tip-burn`.
2. **Task suppression** — Next water task renders suppressed state with quoted note + relative timestamp + Override button.
3. **Plant Doctor advice** — Launch Plant Doctor. `r-ph-lockout`/`pH Imbalance` score boosted; "Your Action Plan" cites the flush observation.
4. **Dashboard banner** — Status banner shows observation as second-line alert.
5. **Recent Observations widget** — Top of widget on Plant Detail.
6. **Debug waterfall** — `?debugNotes=1` + reload. Row shows raw text, parsed keywords, merged ctx, weight ~`0.9` for watch at 2h, citation column lists `task-engine:suppress:water:<plantId>` and `plant-doctor:runDiagnosis:<plantId>`.

**If any fail, STOP.** Fix forward against appropriate prior section or against this section. Do not deploy.

### Step 8 — Bump `sw.js` VERSION

**File:** `sw.js:23`

```js
const VERSION = 'dev';  // old
const VERSION = '2026-04-nc1';  // new
```

Re-run test suite, confirm deploy-gate test now green.

### Step 9 — Commit

```bash
git add -A
git commit -m "section-10: note contextualizer traceability + deploy"
```

Match existing project commit style (see `3d25c13 section-11: data export/import`).

### Step 10 — Deploy

```bash
vercel --prod
```

Project already linked via `.vercel/`. If prompts for linking, STOP and check state. No new env vars — if prompted for any, something wrong.

### Step 11 — Post-deploy verification

1. Wait for deploy, production URL serving new build.
2. Navigate to `https://<production-url>/test-runner` in incognito. Every row `pass`.
3. Re-run steps 1–6 of Step 7 against production with throwaway plant. Confirm debug waterfall populates citations in prod.
4. If an existing PWA installation is available, open it and confirm SW update completes and boots into new build without white-screening. Validates Step 8.

### Step 12 — Memory updates

Only if new patterns emerged. Update `C:\Users\Caus\.claude\projects\C--GrowDoc\memory\MEMORY.md` with a `project_note_contextualizer.md` entry if one doesn't exist. Summarize what shipped. Don't duplicate existing entries (`feedback_franco_priority`, `feedback_notes_everywhere`, `feedback_vercel_deployment` already cover related ground).

## Files touched

**Modified (citation wiring):**
- `js/plant-doctor/doctor-engine.js`
- `js/components/task-engine.js`
- `js/data/harvest-advisor.js`
- `js/data/stage-rules.js`
- `js/data/priority-engine.js`
- `js/views/dashboard.js`

**Modified (deploy gate):**
- `sw.js` (VERSION bump + possibly precache list)

**Modified (tests):**
- `js/tests/note-contextualizer.test.js`

**Possibly modified (stale-ref cleanup):** any file grep hits.

**No new files created.**

## Rollback

Production regresses caught in Step 11:
1. `git revert <this-commit>` reverts citations + VERSION + straggler cleanups.
2. `vercel --prod` redeploys pre-section-10 state. SW `VERSION` reverting to `'dev'` still triggers install (different value from `'2026-04-nc1'`), so old SW fires `activate`.
3. Diagnose, fix forward in new commit.

Deeper regressions (test failure from earlier section undetected until Step 6) follow `sections/index.md § Rollback notes` — revert the offending section commit, not this one.

## Out of scope

- No new env vars. Uses only localStorage + existing Vercel config.
- No cure advisor. Full matrix deferred to `9b-future.md`.
- No CI setup. Tests remain browser-based.
- No rewrites of debug waterfall (section-08 shipped it).

Commit: `section-10: note contextualizer traceability + deploy`
