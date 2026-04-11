# Section 01 — Observation Schema, Projection, Store Hook

**Original plan section:** S1 (Observation schema + projection + store hook, Small)
**Batch:** 1 (parallel with `section-02-ui-scaffolding` — zero file overlap)
**Depends on:** nothing
**Blocks:** sections 03, 05, 07

## Goal

Stand up the data-layer foundation for the Note Contextualizer: JSDoc types, a pure `collectObservations(grow, profile, opts)` projection walking every existing note source, a singleton index with synchronous hash-check rebuild, store subscription wiring, a sidecar citations `Map`, and the first test file. `parseObservation` and `mergeNoteContext` land as stubs (empty ctx / empty merge) — section-03 ports the real keyword engine, section-04 implements real merge/weighting. No legacy files are touched in this section.

When this section ships, nothing visible changes for the user, but every downstream advisor section can import from `js/data/note-contextualizer/index.js` and start wiring.

## Background context (self-contained)

GrowDoc is a vanilla-JS cannabis cultivation Companion. No frameworks, no bundlers, no npm dependencies — ES modules load directly in the browser, and all state lives in `localStorage` through `js/store.js`. Tests run in the browser at the `/test-runner` route. Every test file exports `async function runTests()` returning `Array<{pass: boolean, msg: string}>` and is registered in `js/main.js:298`.

The Note Contextualizer exists because the user's primary pain is "notes feel ignored by the AI." Today, eleven of fourteen advisors consume notes as raw strings or not at all. We are building a unified projection that turns every existing note field (log entries, task notes, plant notes, profile wizard answers, stage transitions, cure tracker entries) into first-class `Observation` objects at runtime. **No data migration** — existing localStorage keys stay intact; this is a projection, never serialized to disk.

The `Observation` is produced on demand by `collectObservations(grow, profile, opts)`. The module-scoped singleton cache in `getObservationIndex()` rebuilds synchronously whenever a cheap composite hash of `grow + profile` changes, which is how a task engine call immediately following a new log commit can see the new observation without waiting on any debounce.

Section-01 is **pure plumbing**. Real keyword parsing arrives in section-03; real merge/weighting arrives in section-04. The stubs in this section must exist so that sections 03, 05, and 07 can import stable names and land incrementally.

## Files to create

All paths absolute.

1. `C:\GrowDoc\js\data\observation-schema.js` — JSDoc types only, no runtime exports required (an empty `export {};` is fine). Declares the three typedefs below.
2. `C:\GrowDoc\js\data\note-contextualizer\index.js` — public API surface, stubs where noted.
3. `C:\GrowDoc\js\data\note-contextualizer\merge.js` — stub exporting `mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince`. Real implementations land in section-04.
4. `C:\GrowDoc\js\tests\note-contextualizer.test.js` — first test file for this feature.

## Files to modify

1. `C:\GrowDoc\js\main.js` — call `initContextualizer(store)` once at startup; register the new test file in the module list near `js/main.js:298` (the existing test registration block).

No CSS, no HTML, no store schema changes in this section. (The `ui.activePlantId` slot is owned by section-05.)

## Core data shapes

These typedefs go in `js/data/observation-schema.js`. Preserve field names and the legacy severity enum exactly — later sections depend on the `'urgent'|'concern'|null` on-disk format.

```js
/**
 * @typedef {Object} Observation
 * @property {string}   id              stable hash of source+sourceRefId+rawText (deterministic across rebuilds)
 * @property {string}   createdAt       ISO
 * @property {string}   observedAt      ISO; inferred from log.timestamp, plant.stageStartDate, or createdAt
 * @property {string}   [plantId]       grow.plants[i].id; absent means grow-wide
 * @property {('log'|'task'|'plant'|'profile'|'stage-transition'|'cure'|'wizard'|'override'|'plant-doctor')} source
 * @property {string}   [sourceRefId]   id of the parent entity; REQUIRED for every source except 'profile'
 * @property {string}   [wizardStep]    'stage'|'medium'|'lighting'|'strain'|'space'|'priorities' — only when source==='profile'
 * @property {string}   [stageAtObs]    inferred stage at observedAt
 * @property {string}   [flowerWeek]    derived if stage in flower
 * @property {Array<('nutrients'|'environment'|'pest'|'training'|'phenotype'|'aroma'|'root'|'watering'|'health'|'action-taken'|'question'|'timeline'|'cure-burp'|'cure-dry')>} domains
 * @property {('urgent'|'concern'|null)} severityRaw        on-disk legacy enum
 * @property {('alert'|'watch'|'info')}  severity           display alias
 * @property {boolean}  severityAutoInferred
 * @property {string}   rawText         exact user input
 * @property {(ParsedNote|null)} parsed null ONLY if a rule closure threw; raw observations never fail to parse
 * @property {string[]} tags
 */

/**
 * @typedef {Object} ParsedNote
 * @property {Object}   ctx             extracted field map — filled in section-03
 * @property {Array<{type:string,value:string}>} observations
 * @property {Array<{type:string,value:string}>} actionsTaken
 * @property {string[]} questions
 * @property {string[]} keywords        KEYWORD_PATTERNS rule ids that fired
 * @property {string[]} frankoOverrides subset of keywords in FRANCO_OVERRIDE_RULE_IDS
 */

/**
 * @typedef {Object} ObservationIndex
 * @property {number}   version
 * @property {string}   builtAt
 * @property {string}   fromHash        cheap digest of grow + profile for staleness detection
 * @property {Object<string, Observation[]>} byPlant
 * @property {Object<string, Observation[]>} byDomain
 * @property {Observation[]} all
 * @property {Array<{obsId:string, ruleId:string, error:string, timestamp:string}>} ruleErrors
 */
```

### Severity display alias

The on-disk legacy enum `'urgent'|'concern'|null` must map to the display alias as follows:

- `'urgent'` → `severity: 'alert'`
- `'concern'` → `severity: 'watch'`
- `null` → `severity: 'info'`

Section-02 owns the chip UI that writes the legacy enum; section-01 only needs to honor the mapping when constructing an `Observation` from existing `log.details.severity` values. If a source field lacks any severity at all, default to `severityRaw: null`, `severity: 'info'`, `severityAutoInferred: false`.

### Stable IDs

```
Observation.id = hash(source + ':' + sourceRefId + ':' + rawText)
```

A rebuild on the same store state produces the same IDs — safe for citations. Editing a log's note text changes its id and orphans its prior citations (acceptable; the sidecar GCs orphans on rebuild). Every source except `'profile'` requires a non-null `sourceRefId`. Wizard-step observations use `wizardStep` as their de-facto key (the test assertion below uses this).

Use any simple deterministic string hash (djb2, FNV-1a, or a hex digest of `crypto.subtle.digest` if convenient). The exact algorithm does not matter as long as it is deterministic, stable across rebuilds of the same input, and differs on `rawText` change.

## Public API to implement in `js/data/note-contextualizer/index.js`

```js
// Pure projection — walks grow + profile and emits Observation[]. REAL in section-01.
// opts: { plantId?, since?: ISO, domains?: string[], limit?: number, minSeverity?: 'info'|'watch'|'alert' }
export function collectObservations(grow, profile, opts = {});

// STUB in section-01: sets obs.parsed to a ParsedNote with empty ctx, empty keywords, etc.
// Real keyword matching lands in section-03. The stub must never throw and must be idempotent.
export function parseObservation(obs);
export function parseAllObservations(obsArr);

// REAL in section-01. Subscribes a 300ms-debounced UI rebuild to 'grow' and 'profile' commits.
// Must be idempotent — calling twice installs one subscription, not two.
export function initContextualizer(store);

// REAL in section-01. Returns the current index. Synchronously rebuilds if the grow/profile
// hash has changed since the last build. Single-flight: a rebuild already in progress is
// shared by concurrent callers.
// Called before initContextualizer? Return an empty index.
export function getObservationIndex();

// REAL in section-01. Query helper over the current index. Applies plantId/since/domains
// filters client-side. minSeverity filter lands in section-04 (stub: pass-through).
export function getRelevantObservations(store, { plantId, since, domains, limit, minSeverity });

// STUB in section-01: returns an empty ctx object. Real merge logic lands in section-04.
export function mergeNoteContext(observations);

// STUB in section-01: always returns an empty array. Real logic in section-04.
export function findActionsTakenSince(observations, taskType, sinceHours);

// REAL in section-01. Writes to the sidecar Map<obsId, Set<consumerId>>.
export function recordReferencedIn(obsIds, consumerId);

// REAL in section-01. Reads the sidecar.
export function getCitationsFor(obsId);

// REAL in section-01. Clears singleton cache, sidecar Map, and any in-flight rebuild promise.
export function __resetForTests();
```

## `collectObservations` walker

Sources to walk (all fields from existing GrowDoc state):

1. **`profile.notes`** — each non-empty wizard-step note.
   - `source: 'profile'`, `wizardStep: <step name>`, no `sourceRefId`, `observedAt: profile.updatedAt || now`, no `plantId`.
2. **`grow.plants[i].notes`** — each plant with non-empty `notes`.
   - `source: 'plant'`, `sourceRefId: plant.id`, `plantId: plant.id`, `observedAt: plant.stageStartDate || plant.createdAt || now`.
3. **`grow.plants[i].logs[j].details.notes`** — each log with non-empty `details.notes`.
   - `source: 'log'`, `sourceRefId: log.id`, `plantId: plant.id`, `observedAt: log.timestamp`, `severityRaw: log.details.severity ?? null` mapped to display alias.
4. **`grow.tasks[k].notes`** — each task with non-empty `notes`.
   - `source: 'task'`, `sourceRefId: task.id`, `plantId: task.plantId`, `observedAt: task.updatedAt || task.createdAt`.
5. **`grow.plants[i].logs[j]` where `log.type === 'stage-transition'`** with notes.
   - `source: 'stage-transition'`, `sourceRefId: log.id`, `plantId: plant.id`, `observedAt: log.timestamp`.

Cure-tracker source is **deferred to section-09**. After constructing each Observation, call `parseObservation(obs)` (the stub). `domains` is an empty array for now.

`opts` filters: `plantId`, `since`, `domains` (intersection; empty in section-01 so filter removes everything when used — acceptable), `limit`, `minSeverity` (pass-through in section-01).

The function must be **pure** — no access to the singleton cache, no store reads. Callers pass `grow` and `profile` explicitly.

## Singleton index and synchronous rebuild

```js
let cache = null;               // ObservationIndex | null
let rebuildInFlight = null;     // Promise<ObservationIndex> | null
const citations = new Map();    // Map<obsId, Set<consumerId>>
let storeRef = null;
```

`getObservationIndex()`:
1. If `storeRef == null`, return empty index.
2. Compute `currentHash` cheaply (e.g. JSON.stringify length + profile.updatedAt + task count).
3. If `cache != null && cache.fromHash === currentHash`, return `cache`.
4. Otherwise rebuild synchronously: `parseAllObservations(collectObservations(grow, profile))`, build byPlant/byDomain maps.
5. Freeze `cache.all` with `Object.freeze`.

`initContextualizer(store)`: idempotent, subscribes 300ms-debounced handler to `'grow'` and `'profile'`.

`__resetForTests()`: clears cache, rebuildInFlight, citations, debounce timer, storeRef.

## Dependencies on other sections

- **parseObservation / domain extraction:** section-03 replaces the stub.
- **mergeNoteContext / weighting / findActionsTakenSince body:** section-04 replaces the stubs.
- **Severity chip UI:** section-02 owns. Section-01 never touches DOM.
- **`ui.activePlantId` store slot:** section-05 owns.
- **Cure-tracker walker:** section-09 extends `collectObservations`.

## Tests

New file `js/tests/note-contextualizer.test.js`, registered in `js/main.js:298`. Exports `async function runTests()`. Call `__resetForTests()` at top of every test.

```
# Test: collectObservations on empty grow state returns empty array, no errors
# Test: collectObservations walks profile.notes and emits one Observation per non-empty wizardStep
# Test: collectObservations walks plant.notes and emits one Observation per plant
# Test: collectObservations walks plant.logs[*].details.notes; observedAt = log.timestamp
# Test: collectObservations walks grow.tasks[*].notes; plantId from task.plantId
# Test: Observation.id is deterministic across two calls
# Test: Observation.id differs when rawText changes
# Test: Observation.observedAt inference for log/plant/task sources
# Test: Observations with source='profile' have wizardStep and no sourceRefId
# Test: Other sources have non-null sourceRefId
# Test: opts.plantId filter returns only that plant's observations
# Test: opts.since filter excludes older observations
# Test: opts.domains filter empties set in section-01 (stub has empty domains) — assert explicitly
# Test: initContextualizer installs subscriber, fires on 'grow' commits
# Test: initContextualizer is idempotent on re-init
# Test: __resetForTests clears cache and citations
# Test: getObservationIndex returns empty index before initContextualizer
# Test: getObservationIndex returns a frozen array (mutation throws in strict mode)
```

Fixtures are inline. Use `const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();` helper.

## Manual verification

1. `vercel dev` from `C:\GrowDoc`.
2. Open `http://localhost:3000/test-runner` with Ctrl+Shift+R.
3. Confirm note-contextualizer test group passes.
4. Confirm no other tests regressed.

Commit: `section-01: note contextualizer schema + projection + store hook`. No `vercel --prod` in this section.

## Critical constraints recap

- Vanilla JS only.
- `collectObservations` is **pure**.
- `getObservationIndex` does a **synchronous hash-check rebuild**.
- Observation arrays returned are **frozen**.
- `parseObservation` and `mergeNoteContext` are **stubs** in this section.
- `ui.activePlantId` is **not** touched.
- No CSS, no HTML, no sw.js bump, no deploy.

---

## Implementation log

**Commit:** section-01 (pending)
**Files created:**

- `js/data/observation-schema.js` — JSDoc typedefs only (`Observation`, `ParsedNote`, `ObservationIndex`, severity enums, domain enum).
- `js/data/note-contextualizer/index.js` — public API surface: `collectObservations`, `parseObservation` (stub), `parseAllObservations`, `initContextualizer`, `getObservationIndex`, `getRelevantObservations`, `mergeNoteContext` (re-export stub), `findActionsTakenSince` (re-export stub), `recordReferencedIn`, `getCitationsFor`, `__resetForTests`.
- `js/data/note-contextualizer/merge.js` — stubs for section-04 plus a usable pass-through filter body used by `index.js#getRelevantObservations`.
- `js/tests/note-contextualizer.test.js` — 25 behavioral tests covering walker, severity mapping (all three branches), observedAt fallbacks for plant and task sources, deterministic IDs, opts filters, singleton cache behavior, profile subscription path, subscription-count idempotency, sidecar citations, and `__resetForTests` clearing.

**Files modified:**

- `js/main.js` — added `import { initContextualizer } from './data/note-contextualizer/index.js';`, call `initContextualizer(store)` immediately after `window.__growdocStore = store`, and registered the new test module in the `/test-runner` view modules array.

**Deviations from plan:**

- `merge.js` holds a small pass-through filter body for `getRelevantObservations` so that section-01 doesn't duplicate filter logic inside `index.js`. Section-04 will replace the body with real severity/weighting filters.
- `computeHash` uses the full 8-char FNV-1a digest instead of a 4-char slice (review item: 16-bit entropy was collision-prone on same-length note edits).
- `initContextualizer` rejects re-init with a different store (console.warn + no-op) rather than silently rebinding the singleton — purely defensive; GrowDoc has one store.
- `rebuildInFlight` was dropped because the rebuild is synchronous and had no concurrency window.
- `parseObservation` JSDoc now explicitly states it mutates the argument in place.

**Hash algorithm:** FNV-1a 32-bit → 8-char hex. Fits the "cheap deterministic" requirement; single pass over string charcodes.

**Test coverage (25 asserts):** see list above. Pure-function branches (walker, severity, observedAt, filters, ids, stub shapes) smoke-verified under Node; store-hook branches (subscribe/commit/cache invalidation) require browser `/test-runner` pass.

**Manual verification status:** pending — user needs to `vercel dev`, open `http://localhost:3000/test-runner` with Ctrl+Shift+R, and confirm the `note-contextualizer` group passes and no prior tests regressed.
