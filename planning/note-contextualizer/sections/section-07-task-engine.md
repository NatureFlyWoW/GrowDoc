# Section 07 — Task Engine Note-Awareness & Override API

**Original plan section:** S5 (Task engine note-awareness + override API, Large)
**Batch:** 3 (serial AFTER section-05 and section-06)

## Goal

Wire the Note Contextualizer into the task engine so notes suppress redundant tasks, trigger diagnose tasks on alert observations, flag env/note conflicts, and support a user-initiated "Override" flow that writes a real log entry back into grow state.

## Why serial

Shares `js/components/task-engine.js` with section-05's Plant Doctor edits. Must run AFTER section-05 and section-06 to avoid merge conflicts and consume finalized `getRelevantObservations` + `mergeNoteContext`.

## Dependencies

- **section-01** — `collectObservations`, `initContextualizer`, `getObservationIndex`, `__resetForTests`, Observation schema.
- **section-03** — `KEYWORD_PATTERNS`, `SEVERITY_HEURISTICS`, `ACTION_TAKEN_PATTERNS`, `DOMAIN_BY_RULE_ID`, `parseObservation`.
- **section-04** — `merge.js` with `mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince` (enforces `source !== 'profile'` guard).
- **section-05** — `task-engine.js` already imports contextualizer baseline; `store.state.ui.activePlantId` exists.
- **section-06** — `priority-engine.js`, `stage-rules.js`, `harvest-advisor.js` note-aware (no file overlap, but must exist).

## Files

**Create:**
- `js/components/task-engine-note-guards.js` — NEW. Exports `checkRedundancy`, `checkContradiction`, `inferAlertTrigger`, `overrideSuppression`.

**Modify:**
- `js/components/task-engine.js` — collect obs once at `generateTasks` entry, thread into evaluators, suppressed task metadata, re-export `overrideSuppression`.
- `js/components/task-card.js` — render suppressed state (quoted-note banner + relative timestamp + Override button), wire click to `overrideSuppression`.
- `js/tests/task-engine.test.js` — add tests listed below.

## Background

- **Observations** from section-01 have `id`, `source`, `observedAt`, `plantId`, `severity` ('alert'|'watch'|'info'), `parsed.keywords[]`, `parsed.ctx`.
- Task engine reads `obs.severity` (display alias), not `obs.severityRaw`.
- `findActionsTakenSince` already filters `source==='profile'`. Task engine does not re-filter.
- **Task shape pre-section-07:** `{id, plantId, type, title, dueAt, ...details}`. This section adds optional `suppressedBy?: string[]` and `suppressedNoteRef?: {obsId, rawText, observedAt, source}`. Emission of suppressed tasks is new — previously engine skipped them; now it emits with a suppressed marker so the card renders the banner + Override button.
- **Override cascade is intentional.** Clicking Override writes a real log with `type:'override'` → new action-taken observation on rebuild → re-blocks task for standard debounce window. Button label must be explicit: `Water now (re-blocks for 12h)`.

## Tests FIRST

All tests in `js/tests/task-engine.test.js`. Use existing `daysAgo(n)` helper at lines 20–56. Call `__resetForTests()` at top of every test.

```
# Test: generateTasks collects observations once at entry (seed 3 plants, assert all three
#   see suppression behavior in a single generateTasks call)

# Test: Anti-redundancy — water (12h)
#   Log {timestamp: daysAgo(0.2), details:{notes:'just flushed with 6.0'}}
#   → water task suppressed, suppressedBy: [obsId] populated

# Test: Anti-redundancy — feed (24h)
#   Log 'fed at full strength' at daysAgo(0.5) → feed task suppressed

# Test: Anti-redundancy — flush (48h)
# Test: Anti-redundancy — IPM (72h)
# Test: Anti-redundancy — defoliate (168h / 7d)
# Test: Anti-redundancy — top (336h / 14d)

# Test: Suppressed task metadata shape
#   suppressedBy: non-empty string[]
#   suppressedNoteRef: {obsId, rawText, observedAt, source}

# Test: Wizard observation does NOT suppress
#   profile.notes.water = 'I flush weekly' → normal un-suppressed water task emitted

# Test: Env discrepancy
#   In-range sensor VPD + recent alert 'tent feels hot' at daysAgo(0.5)
#   → emits type:'env-discrepancy' citing conflicting obsId

# Test: Env discrepancy requires alert severity
#   Same with info severity → no task

# Test: Diagnose trigger from note severity
#   Note 'leaves look terrible' where heuristic marks alert, log.details.severity null
#   → diagnose task emitted

# Test: Diagnose trigger from worsening-keyword
#   'getting worse every day' at daysAgo(0.3) → diagnose task

# Test: overrideSuppression creates real log entry
#   grow.plants[i].logs contains new entry type:'override', details.notes:'Manual override: water',
#   details.severity:null, timestamp ~Date.now()

# Test: overrideSuppression commits grow state

# Test: Override observation appears in index after commit
#   findActionsTakenSince('water', 12) returns the new obs

# Test: Override re-blocks for standard window
#   Next generateTasks suppresses same task again, suppressedBy points to NEW override obsId

# Test: Override isolation across plants
#   Override on plantA does not suppress plantB tasks

# Test: Regression — zero observations, pre-section-07 behavior preserved
#   plant.logs=[], profile.notes={} → identical task list by type, count, order
```

## Implementation

### `js/components/task-engine-note-guards.js` (new)

```js
/**
 * Anti-redundancy. Returns { suppressed, obsIds, noteRef }.
 * Windows: water 12h, feed 24h, flush 48h, ipm 72h, defoliate 168h, top 336h.
 * Uses findActionsTakenSince (excludes source:'profile').
 */
export function checkRedundancy(taskType, plantObservations, now = Date.now());

/**
 * Env/note conflict. envSnapshot = {temp, rh, vpd} in-range booleans.
 * Returns {conflict, obsId}. Fires when ≥1 obs has severity:'alert' AND
 * mentions environment domain AND sensor says in-range.
 */
export function checkContradiction(envSnapshot, plantObservations, now = Date.now());

/**
 * Diagnose-trigger. Returns {trigger, obsIds}. Fires if recent (≤48h) obs
 * has severity:'alert' OR parsed.keywords contains worsening rule id.
 */
export function inferAlertTrigger(plantObservations, now = Date.now());

/**
 * Public override API. Writes real log entry with type:'override',
 * details.notes:`Manual override: ${taskType}`, details.severity:null, timestamp:Date.now().
 * Commits store.state.grow. Returns new log id.
 * Does NOT mutate task directly — next generateTasks pass re-runs findActionsTakenSince.
 */
export function overrideSuppression(taskId, plantId, taskType);
```

### `js/components/task-engine.js` edits

1. At top of `generateTasks(grow, profile, envSnapshot)`, collect once:
   ```js
   const observations = collectObservations(grow, profile, { since: daysAgo(14) });
   ```
   Pass into every evaluator. Do not call more than once per pass.

2. **`evaluateTimeTriggers`** (water/feed/flush/IPM/defoliate/top): before emitting, `checkRedundancy(taskType, plantObservations)`. If suppressed, emit the task anyway with `suppressedBy` and `suppressedNoteRef`. Do NOT skip silently — card needs to render suppressed state.

3. **`evaluateDiagnoseTriggers`**: in addition to existing triggers, call `inferAlertTrigger`. If trigger, emit diagnose task with `triggeredBy: string[]`.

4. **`evaluateEnvironmentTriggers`**: call `checkContradiction`. If conflict, emit `type:'env-discrepancy'` with `title:'Sensor disagrees with your note'` citing obsId.

5. Re-export `overrideSuppression` from the helper so `task-card.js` imports via `import { overrideSuppression } from './task-engine.js'`.

### `js/components/task-card.js` edits

When `task.suppressedBy?.length > 0`:
- Muted card via `task-card--suppressed` class (style in `css/note-contextualizer.css` from section-02).
- Quoted-note banner showing `task.suppressedNoteRef.rawText` with relative timestamp from `observedAt`. Use same `formatRelativeTime` as dashboard or inline small formatter.
- Override button labeled explicitly: `Water now (re-blocks for 12h)`, `Feed now (re-blocks for 24h)`, etc. Label window MUST match `checkRedundancy` window.
- Click handler: `overrideSuppression(task.id, task.plantId, task.type)`. After call, store commit triggers rebuild automatically.

## Anti-redundancy windows (canonical)

| Task type | Window | Source keywords |
|---|---|---|
| water | 12h | `action-watered`, `action-flushed` |
| feed | 24h | `action-fed` |
| flush | 48h | `action-flushed` |
| ipm | 72h | `action-ipm`, `action-sprayed-*` |
| defoliate | 168h (7d) | `action-defoliated` |
| top | 336h (14d) | `action-topped`, `action-fimmed` |

Exact rule ids come from `ACTION_TAKEN_PATTERNS` in section-03. `findActionsTakenSince` is the integration point.

## Manual verification

1. `vercel dev`, `/test-runner` hard reload, all task-engine.test.js entries pass.
2. Seed plant with `just flushed` log via log form. Water task card renders suppressed banner with Override button.
3. Click Override: task re-appears suppressed immediately with new obsId, override log visible in plant timeline, no duplicate tasks.

Commit: `section-07: task engine note-awareness + override API`

No `sw.js` bump (section-10).
