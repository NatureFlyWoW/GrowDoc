# Implementation Plan — Note Contextualizer for GrowDoc

**Version.** Iteration 2 — integrates Opus review feedback (see `claude-integration-notes.md`).
**Audience.** An engineer or LLM with no prior context. Read this document plus `claude-spec.md` and you should have everything you need to begin implementation.

---

## 1. What we are building

GrowDoc is a vanilla JavaScript cannabis-cultivation Companion app. No frameworks, no bundlers, no npm dependencies — just ES modules loaded directly by the browser, with all state living in localStorage. It is deployed on Vercel as a static site plus serverless API.

The app's most important feature is its ability to advise growers on their plants: diagnose problems, generate daily tasks, recommend harvest timing, and tune environment settings. Today, those recommendations are driven almost entirely by structured data: numeric sensor readings, dropdown selections, and checkbox symptoms. Users can type free-text notes in many places (log entries, task cards, plant profiles, onboarding wizard, cure tracker, stage transitions), but those notes almost never reach the advisors. Eleven of fourteen advice/task-generation surfaces in the Companion read their notes as raw strings or not at all.

The result is the user's primary pain: **"notes feel ignored by the AI."** A user who writes "just flushed with 6.0 pH, tips still burning" still gets a water task queued fifteen minutes later, and still gets a diagnostic score that doesn't know the runoff was 6.0.

The Note Contextualizer fixes this. It is a unified module that (a) wraps every existing note source as a first-class `Observation` object without migrating any data, (b) forks the keyword rule base out of a deprecated proof-of-concept tool into importable ES modules, (c) authors fresh diagnosis-targeted score and advice rules against the Companion's condition taxonomy (not the legacy v3 rule IDs), (d) applies half-life recency decay with severity-first ordering so user observations outrank stale sensor readings, and (e) wires every advisor and task generator to consume the unified view. It also integrates cure-tracker notes into the observation projection and ships a debug waterfall behind a query parameter.

When the feature ships, writing a plant note will visibly change what the app recommends the next time any advisor runs. The user will be able to see, trace, and override every signal the system extracted.

---

## 2. Why this design

Five constraints shape every decision:

1. **No migration.** Six localStorage keys exist today plus roughly A–K existing note fields scattered across plants, logs, tasks, profile, and the cure tracker. Forcing a schema migration would risk data loss for existing v1 users. The plan treats every existing note field as source-of-truth and projects it into a uniform `Observation` view at runtime, never on disk.
2. **No frameworks.** State flows through `js/store.js`, which exposes `subscribe(path, callback)` and a frozen-snapshot commit pattern. The contextualizer subscribes to `'grow'` and `'profile'` commits and maintains a module-scoped index. There is no event bus, no reactive framework, no build step.
3. **Notes outrank stale structured data.** Per Franco-priority memory, user observations must beat sensor readings when the sensor is stale and the note is fresh and severe. The plan uses half-life exponential decay per severity tier, severity-first partitioning, and a Franco-override rule-ID set that bypasses decay entirely for survival-critical signals (heat stress, overwatering, severe wilt, hermies).
4. **Traceability is mandatory.** Every downstream consumer must be able to answer "why did this advice appear?" — which observation(s) drove it, what weight they received, and what the user can do to override. This is why every advisor records citations into a sidecar `Map<observationId, Set<consumerId>>` (not onto the observation objects, which stay immutable) and why `?debugNotes=1` renders a full waterfall.
5. **Companion taxonomy is the single source of truth for diagnoses.** The legacy v3 rule base (deprecated as of Q8) scored against IDs like `r-n-def` and `r-overwater`. The Companion's plant doctor scores against human-readable condition names like `'Nitrogen Deficiency'` and `'Overwatering'`. Instead of building a bridge and maintaining two taxonomies, the plan **rewrites** `SCORE_ADJUSTMENTS` and `ADVICE_RULES` as fresh ES modules targeted at Companion condition names. Only `KEYWORD_PATTERNS` (the pure-data note parser) is ported verbatim from the legacy file with parity tests.

The design rejects several alternatives considered during spec work: a bridge pattern keeping the ES5 rule base alive (rejected because v3 is deprecated), a persistent observation store (rejected for migration cost), WeakMap-keyed cache slots (rejected as over-engineered for hundreds-of-observations scale), NLP/embedding approaches (rejected for determinism and lack of dependencies), and building a v3-ID-to-Companion-condition mapping layer (rejected because it ships two taxonomies forever when one suffices).

---

## 3. Architecture at a glance

Data-layer modules under `js/data/note-contextualizer/` plus a small cure sidecar and UI-layer components.

### Directory structure after the change

```
js/data/
  note-contextualizer/
    index.js              # public API: collectObservations, parseObservation, getObservationIndex, getRelevantObservations, mergeNoteContext, generateContextualAdvice, adjustScoresFromNotes, findActionsTakenSince, recordReferencedIn, initContextualizer, __resetForTests
    rules-keywords.js     # PORTED: KEYWORD_PATTERNS (984 patterns, pure data, parity-tested against legacy) + SEVERITY_HEURISTICS + ACTION_TAKEN_PATTERNS
    rules-score.js        # REWRITTEN from scratch: ~30-40 adjustment rules targeting Companion condition names (Nitrogen Deficiency, Overwatering, Heat Stress, ...)
    rules-advice.js       # REWRITTEN from scratch: ~40-50 advice rules targeting Companion conditions, producing human-readable advice
    rules-domains.js      # DOMAIN_BY_RULE_ID + FRANCO_OVERRIDE_RULE_IDS set
    merge.js              # mergeNoteContext, getRelevantObservations, findActionsTakenSince — pure functions
    weighting.js          # half-life decay, severity-first ordering, resolveScalar — pure functions
  observation-schema.js   # JSDoc types: Observation, ParsedNote, ObservationIndex
  profile-context-rules.js  # DELETED in Section 3 (rules merged into rules-keywords.js with wizardStep tag)

js/tests/
  note-contextualizer.test.js  # registered in js/main.js:298 module list
  fixtures/
    note-context-legacy.json   # golden fixtures captured once from legacy extractNoteContext

js/components/
  log-form.js                  # severity chip (writes LEGACY enum) + parsed-signal strip (edit)
  task-card.js                 # override button + quoted-note banner (edit)
  task-engine.js               # note-awareness wiring (edit)
  task-engine-note-guards.js   # NEW helper: anti-redundancy + contradiction detection + override API
  debug-waterfall.js           # NEW: ?debugNotes=1 rendering
  severity-chip.js             # NEW reusable component
  parsed-signal-strip.js       # NEW reusable component

js/views/
  plant-detail.js        # Recent observations widget + parsed signal chips (edit)
  dashboard.js           # alert-severity banner (edit)
  journal.js             # domain filter (edit)
  settings.js            # profileSnap.context via contextualizer (edit)
  cure-view.js           # NEW or edit: cure note severity chip + parsed strip (Section 9a)

js/plant-doctor/
  doctor-engine.js       # buildContext uses store.state.ui.activePlantId; runDiagnosis calls adjustScoresFromNotes (edit)
  doctor-ui.js           # "Your Action Plan" block from generateContextualAdvice (edit)

js/store.js              # add ui.activePlantId slot (minimal edit)
js/main.js               # initContextualizer(store); register tests; hook ?debugNotes=1 (edit)

css/
  variables.css           # unchanged
  note-contextualizer.css # NEW: chips, strips, banner, waterfall styles

sw.js                     # VERSION bumped in Section 8 deploy commit

docs/
  note-context-rules.js   # DELETED in Section 2b (AFTER parity tests pass)
  tool-plant-doctor.html  # DELETED in Section 2b
  docs.json               # entries for deleted tool removed in Section 2b
```

---

## 4. Core data shapes

The `Observation` is the only new first-class type. It is produced on demand; it is never serialized to localStorage.

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
 * @property {Object}   ctx             extracted field map — see §4a for the full shape
 * @property {Array<{type:string,value:string}>} observations
 * @property {Array<{type:string,value:string}>} actionsTaken
 * @property {string[]} questions
 * @property {string[]} keywords        KEYWORD_PATTERNS rule ids that fired
 * @property {string[]} frankoOverrides subset of keywords that are in FRANCO_OVERRIDE_RULE_IDS
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

### 4a. `ParsedNote.ctx` field list (concrete, not hand-waved)

The port of `extractNoteContext` produces a ctx object with these fields. Any fork or rewrite must preserve every field name and type for parity.

```js
{
  plantType: 'clone'|'seed'|'mother'|'autoflower'|null,
  medium:    'soil'|'coco'|'hydro'|'living-soil'|null,
  waterSource: 'tap'|'ro'|'distilled'|'rainwater'|null,
  lighting:  'led'|'hps'|'cmh'|'fluorescent'|null,
  phExtracted: number|null,         // from "pH was 6.2" style phrases
  ecExtracted: number|null,
  tempExtracted: number|null,
  rhExtracted: number|null,
  vpdExtracted: number|null,
  severity:  'worsening'|'stable'|'improving'|null,
  rootHealth: 'healthy'|'suspect'|'rotting'|null,
  growerIntent: 'max-yield'|'max-terps'|'learn'|null,
  timelineDays: number|null,        // "3 days ago" → 3
  amendments: string[],             // ['worm-castings','bat-guano',...]
  previousProblems: string[],       // ['mites-last-run','pH-drift']
  actions: string[],                // historical actions from text, e.g. 'flushed','topped','defoliated'
}
```

Any ctx field consumed by a rewritten `rules-score.js` or `rules-advice.js` must come from this list. Section 2's parity test asserts every field round-trips for every golden fixture.

### 4b. Stable IDs and citation semantics

`Observation.id = hash(source + ':' + sourceRefId + ':' + rawText)`. This means:

- A rebuild on the same store state produces the same IDs. Safe for citations.
- Editing a log's note text changes its id. **Editing a note orphans its prior citations.** Acceptable — the prior advice was generated from the pre-edit text, so its citations no longer apply. Orphaned entries in the sidecar Map are GC'd on rebuild.
- Every source except `'profile'` requires a non-null `sourceRefId`. Wizard-step observations use `wizardStep` as their de-facto key.

Citations live in a module-scoped sidecar:
```js
// sidecar, not on the Observation objects themselves
const citations = new Map();  // Map<obsId, Set<consumerId>>
```

Observation arrays returned from `getRelevantObservations()` are frozen. Mutating them is an error.

---

## 5. The public API contract

```js
// index.js — public surface

/**
 * Walk grow + profile and emit Observation objects. PURE FUNCTION — no singleton access.
 * Use this for tests and for any caller that wants to pass explicit state.
 */
export function collectObservations(grow, profile, opts = {});
// opts: { plantId?, since?: ISO, domains?: string[], limit?: number, minSeverity?: 'info'|'watch'|'alert' }

/**
 * Mutate obs.parsed from obs.rawText. Idempotent. Cannot throw — catches and records in index.ruleErrors.
 */
export function parseObservation(obs);
export function parseAllObservations(obsArr);

/**
 * Subscribe the contextualizer to store commits. Called once from js/main.js at init.
 * Installs a 300ms-debounced subscriber on 'grow' and 'profile' — the debounce applies ONLY
 * to UI-facing reactive listeners, NOT to getObservationIndex() callers.
 */
export function initContextualizer(store);

/**
 * Return the current index. Synchronously rebuilds if the grow/profile hash has changed
 * since the last build — this is how advisors see fresh state immediately after a commit.
 * Single-flight: concurrent callers during a rebuild share the same return value.
 */
export function getObservationIndex();

/**
 * Query helper. Pure function over the current index.
 */
export function getRelevantObservations(store, { plantId, since, domains, limit, minSeverity });

/**
 * Fold observations into merged ctx. PURE FUNCTION.
 */
export function mergeNoteContext(observations);

/**
 * Advisor-facing helpers. PURE FUNCTIONS.
 * Both operate against the rewritten rules-score.js / rules-advice.js that target
 * Companion condition names like 'Nitrogen Deficiency'.
 */
export function generateContextualAdvice(noteContext, conditionName);
export function adjustScoresFromNotes(scoresMap, noteContext);
//   scoresMap: { [conditionName]: { condition, score, ... } }  — in-place mutation of the map

/**
 * Anti-redundancy guard for task engine.
 * IGNORES observations with source === 'profile' (wizard priors are not events).
 */
export function findActionsTakenSince(observations, taskType, sinceHours);

/**
 * Record that a consumer cited a set of observations. Writes to the sidecar Map
 * (not to the Observation objects themselves).
 */
export function recordReferencedIn(obsIds, consumerId);

/**
 * Retrieve citations for debug waterfall.
 */
export function getCitationsFor(obsId);

/**
 * Test-only reset. Clears the singleton cache + sidecar map.
 */
export function __resetForTests();
```

---

## 6. Weighting algorithm (unambiguous)

The merge step uses a 4-step algorithm. Given a list of candidate values for a single scalar field (e.g. `ph`), the resolver picks one winner:

```
Step 1 — Collect Franco-override candidates.
  franco = candidates.filter(c => c.parsed?.frankoOverrides.length > 0)
  if franco.length > 0:
    return franco.sortBy(observedAt desc)[0]        // freshest Franco override wins, no decay

Step 2 — Partition remaining candidates by severity.
  groups = { alert: [], watch: [], info: [] }
  for c in candidates: groups[c.severity].push(c)

Step 3 — Pick the top non-empty group (severity-first).
  topGroup = groups.alert.length ? groups.alert
           : groups.watch.length ? groups.watch
           : groups.info

Step 4 — Within the top group, pick highest weight by half-life decay.
  HALF_LIFE = { alert: 24, watch: 48, info: 168 }   // hours
  for c in topGroup:
    ageHours = (now - observedAt) / 3600000
    c.weight = Math.pow(0.5, ageHours / HALF_LIFE[severity])
  return topGroup.sortBy(weight desc)[0]
```

Structured log values, sensor readings, and profile defaults use a simpler non-decay weighting that only wins when no note is present:
- log-structured fresh (<24h): weight 0.85
- sensor fresh (<2h): weight 0.80
- profile default: weight 0.20

A note at any severity within the Franco override set always wins. A non-Franco note at any severity wins over any sensor or structured value that competes with it.

Action-taken detection is SEPARATE from scalar merging. An observation with `domains` containing `'action-taken'` within the task-specific window blocks the corresponding task type outright — no weighting, no comparison. **Wizard-sourced observations (`source === 'profile'`) are excluded** from action-taken guards because they represent preferences, not events.

**Task debounce windows:**
- water: 12h
- feed: 24h
- flush: 48h
- IPM spray: 72h
- defoliate: 168h (7d)
- top/fim: 336h (14d)

---

## 7. Store integration and synchronous rebuild

Contextualizer is initialized once from `js/main.js`:

```js
initContextualizer(store);
```

This:
1. Subscribes to `store.subscribe('grow', uiRebuildDebounced)` and `store.subscribe('profile', uiRebuildDebounced)`.
2. `uiRebuildDebounced` is a 300ms debounced function that triggers UI consumers that reactively re-render (Recent Observations widget, dashboard banner). These are nice-to-have reactive updates.
3. The index itself lives in a module-scoped singleton `let cache = null`.

Advisor callers (plant doctor, task engine, harvest advisor, etc.) call `getObservationIndex()` directly. That function:
1. Computes the current `fromHash` of `grow + profile` (cheap composite of `JSON.stringify(grow).length + profile.updatedAt || 0 + grow.tasks.length`).
2. If `cache === null` or `cache.fromHash !== currentHash`, rebuilds synchronously.
3. Rebuild walks `collectObservations(grow, profile)`, parses each observation, indexes by plant and domain.
4. Returns the rebuilt index.

**This is why the success-criteria scenario works:** a user commits a new log note, the task engine immediately calls `generateTasks()`, which calls `getObservationIndex()`, which sees the hash changed, rebuilds inline (<50ms at hundreds scale), and the new observation is visible before any task is created.

Single-flight coalescing: if a rebuild is already in progress (e.g. triggered by the UI debounce), concurrent callers wait for the same result. Implemented as a `let rebuildInFlight = null` promise slot.

`__resetForTests()` clears `cache`, the sidecar citations Map, and any in-flight promise.

---

## 8. Integration points

Every wiring is a single-file, additive-import change. No existing function signatures break — the advisors that grow a `notes` parameter get it with `notes = []` default.

Full file-level detail is in `04-integration-points.md` (I1–I14). Summary with ownership:

**Owned by Section 4 (Plant Doctor + active plant):**
- I1: `js/plant-doctor/doctor-engine.js:buildContext` switches from `grow.plants[0]` to `grow.plants.find(p => p.id === store.state.ui.activePlantId) ?? grow.plants[0]`. Calls `getRelevantObservations` + `mergeNoteContext`.
- I2: `runDiagnosis` calls `adjustScoresFromNotes(scoresMap, ctx)` after scoring. `scoresMap` uses Companion condition name keys; the rewritten `rules-score.js` targets those names directly.
- I3: `doctor-ui.js` renders "Your Action Plan" from `generateContextualAdvice(ctx, topCondition)`. Each advice item tagged with its source observation id for the debug waterfall.
- Section 4 sub-scope: add `ui.activePlantId` to `js/store.js` UI_FIELDS, set it from `js/views/plant-detail.js` on mount and from Plant Doctor launch handlers. Default to `plants[0]?.id`.

**Owned by Section 5 (task engine, serialized after Section 4):**
- I4: `generateTasks()` builds `const observations = collectObservations(grow, profile, { since: '14d' })` once at entry.
- I5: `evaluateTimeTriggers` water/feed/flush blocks call `findActionsTakenSince(observations, 'water', 12)` etc. Suppressed tasks get `suppressedBy: [obsId]`.
- I6: `evaluateDiagnoseTriggers` fires on `obs.severity === 'alert'` OR on `worsening`-severity keyword in any recent log note.
- I7: `evaluateEnvironmentTriggers` emits `env-discrepancy` when a fresh in-range sensor reading contradicts an alert-severity note from the past 24h.
- I11: `task-card.js` override button calls `taskEngine.overrideSuppression(taskId)`, which creates a **real log entry** with `type:'override'`, `details.notes:'Manual override: water'`, `details.severity:null` on the plant's log list and commits grow. The re-built index picks up the override log as a new action-taken observation matching the task's debounce window, re-blocking the task for its normal interval after the user's explicit tap.

**Owned by Section 6 (harvest/stage/priority/dashboard):**
- I8: `harvest-advisor.js getHarvestRecommendation` accepts `notes = []`, runs `mergeNoteContext`, folds aroma/trichome signals into `tradeoffNote`. "User thinks early/late" rule ids shift confidence ±10%.
- Stage rules accept `notes = []`. Priority engine accepts `notes = []`.
- I9: Dashboard status banner shows top alert-severity observation ≤48h old when tasks are empty.

**Owned by Section 7 (UI):**
- I10: Plant-detail timeline renders parsed-keyword chips under each log's notes.
- Recent Observations widget (last 5, collapsible, domain+severity chips).
- Log-form severity chip (writes `'urgent'|'concern'|null` to `log.details.severity` — legacy enum for backwards compat). 3-label display is presentation-only.
- Parsed-signal preview strip updates on blur.
- Contradiction banner when a new note conflicts with a recent structured value.
- Task card suppressed-state rendering + override button + quoted-note banner.
- Journal domain filter.
- I12: `settings.js` replaces `parseProfileNotes` with contextualizer call.
- I13: log-form adds severity dropdown alongside existing condition field.
- I14: Journal filter UI.

**Owned by Section 8 (traceability + deploy):**
- `recordReferencedIn` wiring from Plant Doctor, task engine, harvest advisor, dashboard banner — ~5–10 call sites.
- Debug waterfall component reads citations and walks raw→parsed→merged→weight→output for each observation.
- `?debugNotes=1` URL hook in `js/main.js`; persists in `sessionStorage['growdoc-debug-notes']` across SPA route changes.
- `sw.js` VERSION bump from `'dev'` to a timestamped value (e.g. `'2026-04-nc1'`).
- Final grep for stale references to deleted files.
- Run test suite via `/test-runner` route in a hard-reload browser context.
- Manual verification script hitting the six success criteria from `claude-spec.md`.
- `vercel --prod` deploy.

**Owned by Section 9a (cure notes as Observations):**
- `collectObservations` adds a cure-tracker source, walking `localStorage['growdoc-cure-tracker']`.
- Severity chip + parsed-signal strip on the existing cure tracker note field.
- Cure notes become Observations with `source:'cure'`, `domains:['cure-burp'|'cure-dry'|'aroma']`.

**Deferred to follow-up plan (Section 9b-future):**
- Full cure advisor with decision rules, strain profiles, cure-view rewrite. See `9b-future.md` for the captured intent.

---

## 9. Section breakdown and batching

Nine sections delivered in **four serialized batches**. Opus review corrected the original batching; Sections within a batch have no file overlap.

### Batch 1 — Data contract and UI scaffolding (parallel)

**Section 1. Observation schema, projection, store hook (S).**
JSDoc types. `collectObservations` pure function. `initContextualizer` installs debounced UI subscription + singleton cache. `getObservationIndex` synchronous hash-check rebuild path. `__resetForTests` export. Sidecar citations Map. First test file registered in `js/main.js:298`.
*Files:* `js/data/observation-schema.js`, `js/data/note-contextualizer/index.js` (stub — returns empty ctx from parseObservation), `js/data/note-contextualizer/merge.js` (stub), `js/tests/note-contextualizer.test.js`.

**Section 7-stub. Severity chip + strip scaffolding (S).**
New reusable components `js/components/severity-chip.js`, `js/components/parsed-signal-strip.js`. Wired into `log-form.js`, `task-card.js`, `plant-detail.js` Context Notes textarea. Chip writes legacy enum. Strip renders placeholder `[parsing soon…]` until Section 2 ships the real parser. New CSS file `css/note-contextualizer.css` imported in `index.html` after `variables.css`.
*Files:* two new components, `css/note-contextualizer.css`, edits to `index.html`, `log-form.js`, `task-card.js`, `plant-detail.js`.

### Batch 2 — Rule base and merge logic (parallel)

**Section 2. Port KEYWORD_PATTERNS + author small rule sets + golden fixtures + delete legacy (M).**
Sub-section 2a:
- Port `KEYWORD_PATTERNS` (984 patterns) verbatim from `docs/note-context-rules.js` into `js/data/note-contextualizer/rules-keywords.js` as `export const`. Preserve array order.
- Implement `parseObservation(obs)` producing `ParsedNote.ctx` matching §4a field list. Matches legacy `extractNoteContext` for the ctx fields.
- Capture **golden fixtures**: run the legacy `extractNoteContext` in a browser (one-time manual step using a small harness HTML file) against ~25 representative notes covering every ctx field and common domain. Commit `{input, expected_ctx}` pairs to `js/tests/fixtures/note-context-legacy.json`.
- Parity test iterates the fixtures and asserts `parseObservation({rawText:fixture.input}).parsed.ctx` deep-equals `fixture.expected_ctx`.
- Add `SEVERITY_HEURISTICS` (corrected regexes — `/\b(bad|terrible|worst)\b/i` with grouping), `ACTION_TAKEN_PATTERNS`, `DOMAIN_BY_RULE_ID`, `FRANCO_OVERRIDE_RULE_IDS` set to rules matching `stress-heat-*`, `stress-overwater-*`, `root-rot-*`, `stress-drought-severe`, `hermie-*`, `bananas-spotted`.
- Regex-lint test walks `SEVERITY_HEURISTICS` and `ACTION_TAKEN_PATTERNS` and asserts each regex compiles + matches its documented trigger phrases.

Sub-section 2b (separate commit):
- Delete `docs/note-context-rules.js`.
- Delete `docs/tool-plant-doctor.html` + `docs/plant-doctor-data.js` if confirmed v3-only.
- Remove v3 tool entries from `docs/docs.json`.
- Grep for any stale reference to deleted files; fix any found.
- No `vercel.json` change — v3 tool's 404 is acceptable.

**Section 3. Merge, weighting, kill profile-context-rules (M).**
- `merge.js`: `mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince` (with `source !== 'profile'` guard).
- `weighting.js`: half-life `resolveScalar` implementing the 4-step algorithm from §6.
- Merge `js/data/profile-context-rules.js` rules into `rules-keywords.js` with `wizardStep` metadata. Dedupe against existing `KEYWORD_PATTERNS` — a rule that matches both wizard and general patterns fires once, tagged with both sources.
- Delete `js/data/profile-context-rules.js`. Update all callers (`onboarding.js`, `settings.js`, `plant-detail.js`, `my-grow.js`) to use the unified API.

### Batch 3 — Advisor wiring (mostly parallel)

**Section 4. Plant Doctor wiring + active plant + authored rules-score/advice (M).** *Parallel with S6*
- Author `rules-score.js` from scratch: ~30–40 condition-name-targeted adjustment rules matching Companion's 44 conditions. Example shape:
  ```js
  {
    id: 'score-ph-lockout',
    appliesTo: 'pH Imbalance',
    condition: (ctx) => ctx.phExtracted != null && (ctx.phExtracted < 5.5 || ctx.phExtracted > 7.0),
    adjustment: +25,
  }
  ```
- Author `rules-advice.js` from scratch: ~40–50 advice rules, each keyed by a Companion condition name and producing human-readable `{headline, detail, severity}` advice.
- Implement `adjustScoresFromNotes(scoresMap, ctx)` iterating `rules-score.js` and mutating the scoresMap.
- Implement `generateContextualAdvice(ctx, conditionName)` filtering `rules-advice.js` by condition and returning top-5 advice items.
- Behavioral tests: seed a plant with notes, run diagnosis, assert the scoresMap's top condition changes and the advice output cites the right rule.
- Active plant plumbing: add `ui.activePlantId` slot to `js/store.js`, set from Plant Detail mount and Plant Doctor launch handlers, default to `plants[0]?.id`.
- Rewire `doctor-engine.js buildContext` to use the active plant.

**Section 6. Harvest / stage / priority / dashboard note-awareness (M).** *Parallel with S4*
- `harvest-advisor.js getHarvestRecommendation` accepts `notes = []`, runs `mergeNoteContext`, folds signals.
- `stage-rules.js` accepts `notes = []` — checks for `action-taken:transplanted`, `recovery`, etc. before advancing.
- `priority-engine.js` accepts `notes = []` — adjusts weights based on user stated priorities from observations.
- `dashboard.js` status banner upgrade.

**Section 5. Task engine note-awareness + override API (L).** *Serial AFTER S4 and S6*
- `task-engine.js` collects observations at `generateTasks()` entry.
- `task-engine-note-guards.js`: `checkRedundancy(taskType, plantObs)`, `checkContradiction(envSnapshot, plantObs)`, `inferAlertTrigger(plantObs)`.
- Anti-redundancy guards on water/feed/flush/IPM/defoliate/top.
- Env-discrepancy task emission.
- Diagnose trigger extended to note-severity.
- Override API: `overrideSuppression(taskId, plantId, taskType)` creates a real log entry `{type:'override', details:{notes:'Manual override: <taskType>', severity:null}, timestamp:Date.now()}` on the plant's logs and commits grow state. The re-built index picks up the override observation on the next tick, re-blocking the task for its standard debounce window.
- Task card renders suppressed state with quoted-note banner + "Override" button.

### Batch 4 — UI finalization, cure notes, deploy

**Section 7-final. UI finalization + debug waterfall (M).** *Parallel with S9a*
- Parsed-signal strip upgrades from placeholder to real parsed output.
- Contradiction banner logic wired.
- Recent Observations widget on Plant Detail.
- Journal domain filter.
- `js/components/debug-waterfall.js` — renders full waterfall panel behind `?debugNotes=1`. Reads citations sidecar. Table format: one row per observation, columns for raw text, parsed signals, merged ctx, applied weight, consumer citations. DOM row count capped at 200 (oldest pruned) to avoid runaway memory.
- `js/main.js` hooks `?debugNotes=1` parameter; stores in `sessionStorage['growdoc-debug-notes']` across SPA route changes.
- Fix `plant-detail.js` timeline to render parsed-keyword chips under log notes.

**Section 9a. Cure note projection + severity chip (S).** *Parallel with S7-final*
- `collectObservations` adds a cure-tracker walker reading `localStorage['growdoc-cure-tracker']`. Each cure note becomes `Observation { source:'cure', domains:['cure-burp'|'cure-dry'|'aroma'], ... }`.
- Severity chip + parsed-signal strip added to `docs/tool-cure-tracker.html` note input (minimal edit — not a full SPA rewrite).
- Test: two seeded cure notes appear in the observation index with correct domains and parsed keywords.
- **Section 9b (full cure advisor with decision rules, strain profiles, cure-view rewrite) is DEFERRED** to a follow-up plan captured in `9b-future.md`. Requires Franco consultation for the decision-rule matrix. Not blocking this iteration.

**Section 8. Traceability, final verification, deploy (M).** *Serial AFTER S7-final and S9a*
- `recordReferencedIn` call sites in Plant Doctor, task engine (per-task), harvest advisor, dashboard banner, stage-rules. 5–10 sites total.
- Final grep for stale references.
- Full test suite run in `/test-runner` (hard-reload browser context to bypass SW cache).
- Manual verification script `scripts/verify-notes.mjs` or equivalent.
- `sw.js` VERSION bump from `'dev'` to a timestamped value.
- `git commit` with message `section-NN: note contextualizer`.
- `vercel --prod`.
- Post-deploy: navigate to `/test-runner` in production to confirm tests pass in the deployed environment.
- Update memory files (`feedback_*.md`) if any new patterns emerged.
- **No new environment variables.** Explicitly noted in the deploy checklist.

### Complexity and ownership summary

| Section | Complexity | Batch | Parallel with |
|---|---|---|---|
| 1. Schema + projection + store hook | S | 1 | 7-stub |
| 7-stub. Chip + strip scaffolding | S | 1 | 1 |
| 2. KEYWORD_PATTERNS port + delete legacy | M | 2 | 3 |
| 3. Merge + weighting + kill profile-context-rules | M | 2 | 2 |
| 4. Plant Doctor + authored rules + activePlantId | M | 3 | 6 |
| 6. Harvest/stage/priority/dashboard | M | 3 | 4 |
| 5. Task engine + override | L | 3 | — (serial after 4, 6) |
| 7-final. UI + debug waterfall | M | 4 | 9a |
| 9a. Cure note projection | S | 4 | 7-final |
| 8. Traceability + deploy | M | 4 | — (serial last) |

One L, five M, three S. Work fits in roughly 4–5 deep-implement sessions.

---

## 10. Testing strategy

Tests run in the browser at the `/test-runner` route. No headless CI. Every new test file exports `async function runTests()` returning `Array<{pass: boolean, msg: string}>` and is registered in `js/main.js:298`. Fixtures are inline minimal grow states using a `daysAgo(n)` helper.

### High-value scenarios

All of these are concrete and implementable as-is:

1. **Empty grow.** An untouched grow state produces an empty observation index with no errors.
2. **Anti-redundancy — water.** A log note `{timestamp: daysAgo(0.5), details:{notes:'just flushed with 6.0'}}` causes the next `evaluateTimeTriggers` pass to skip water/flush tasks for that plant. The task is emitted with `suppressedBy: [obsId]`.
3. **Cross-plant isolation.** An alert-severity note on plantA does not appear in advice for plantB.
4. **Severity-first ordering.** Given an alert-severity note at 6h age and an info-severity note at 1h age, the merge resolver returns the alert. (This is the corrected test — severity beats recency within the merge algorithm.)
5. **Within-tier recency.** Given two alert-severity notes at 2h and 8h age, the 2h note wins via half-life decay.
6. **Franco override.** A `stress-heat-severe` observation at 30h age wins over an in-range sensor reading at 1h age.
7. **Rule error capture.** A deliberately throwing rule closure in `rules-score.js` produces an entry in `index.ruleErrors[]`; the score application continues for all other rules.
8. **Parity fixtures.** Every fixture in `note-context-legacy.json` round-trips through `parseObservation` with deep-equal ctx.
9. **Wizard-skip for action-taken.** An observation with `source:'profile'` containing `'flushed'` does NOT block future water tasks.
10. **Debug waterfall.** A seeded grow with three observations and one diagnose trigger produces a waterfall DOM containing three distinct raw→parsed→merged→weight→output chains, each citing one observation id.
11. **Debounce + synchronous rebuild.** Subscribe to UI updates, commit a grow state, immediately call `getObservationIndex()` — the returned index reflects the new state synchronously (despite the UI debounce being pending). After 300ms, the UI subscriber also fires.
12. **`observedAt` inference.** Three fixtures: log-sourced (uses log.timestamp), plant-sourced (uses plant.stageStartDate), task-sourced (uses task.updatedAt). Assert each observation has the expected `observedAt`.
13. **Override creates real log.** Calling `overrideSuppression(taskId)` appends a log entry to `grow.plants[i].logs` with `type:'override'`. After commit + rebuild, the new observation appears in the index and re-blocks the task for 12h (water debounce).
14. **Stub → final upgrade regression.** Before Section 7-final lands, the parsed-signal strip renders `[parsing soon…]`. A test asserts this placeholder is gone after Section 7-final; the same test fails if Section 7-final accidentally ships with the stub.

Each test spec in the section files includes concrete input fixtures and expected outputs. No hand-wave assertions.

---

## 11. Rollout and deployment

Deployment is part of "done." Section 8 is the final section; it runs `vercel --prod` after the full test suite passes in the browser.

**Commit sequence.** Each section commits with a message matching the v2 convention (`section-NN: <short description>`). Section 2 commits twice: `section-02a: port KEYWORD_PATTERNS + fixtures` and `section-02b: delete legacy v3 tool`.

**No feature flag.** The contextualizer is the only note-aware code path after Section 2 lands; legacy paths are deleted. If a regression is discovered, rollback is:
- For Section 5/6/7/8 regressions: `git revert <section-commit>` + `vercel --prod`. Section 2a is preserved because it's a separate commit.
- For Section 2a regressions: `git revert <section-02a>` — this restores `profile-context-rules.js` from git history and the old callers; Section 2b's deletes are also preserved because they're a separate commit, so the old files stay gone. This is why 2a/2b are separate commits.
- If a catastrophic issue in Section 2 requires restoring the v3 tool: `git revert <section-02b>` restores the deleted files. This should never be necessary but preserves the option.

**Service worker.** Section 8 bumps `sw.js:23 VERSION` to a timestamped value (e.g. `'2026-04-nc1'`). Without this bump, installed PWAs will serve stale cached files and the new code will run against old deleted file references.

**Branches.** None required. Commits go directly on `main` per the grow-companion-v2 convention.

---

## 12. Risks and mitigations

- **Authored rule-set drift.** Because `rules-score.js` and `rules-advice.js` are authored from scratch against Companion conditions, there's no parity oracle. Mitigation: Section 4's behavioral tests cover every authored rule with a fixture grow. New rules added later must come with a new test.
- **Rebuild cost at scale.** At hundreds of observations, in-memory rebuild is well under 50ms. If the user writes thousands, the synchronous path locks the UI for ~200ms. Mitigation: Section 8 adds `window.__observationIndexRebuildMs` counter for field measurement. If p95 exceeds 150ms, upgrade to incremental rebuild in a follow-up.
- **Auto-severity false positives.** Aggressive heuristics will occasionally mark casual mentions as `alert`. Mitigation: chip is one-tap override, `severityAutoInferred:true` shows a subtle "auto-detected" hint, override rate tracked in debug panel.
- **Override cascade.** User overrides → override log → action-taken observation → task re-blocked for 12h. This is the intended behavior but could confuse users who override then expect immediate unblocking. Mitigation: override button text is "Water now (re-blocks for 12h)" so the cascade is explicit.
- **Cure profile cold-start.** 9a ships cure note projection only. No advisor-side personalization lands in this plan. Mitigation: `9b-future.md` captures the full cure advisor design for a follow-up.
- **Deprecated v3 tool 404.** Users who deep-linked to `docs/tool-plant-doctor.html` get a browser 404. Mitigation: deliberately accepted — v3 was a POC, the Companion plant doctor is the replacement. No redirect.
- **Golden fixture drift.** If the legacy `extractNoteContext` is ever updated before the fixtures are captured, the fixtures bake in stale behavior. Mitigation: the fixtures are captured ONCE at the start of Section 2, from the current HEAD of the legacy file, then frozen. The legacy file is deleted in 2b, so there's no risk of drift after that.
- **`activePlantId` regression.** Introducing a new store slot might break existing v1 users who don't have the slot. Mitigation: `store.state.ui.activePlantId` defaults to `null`, and `doctor-engine.js:buildContext` falls back to `plants[0]?.id` when `activePlantId` is null. Never breaks existing users.

---

## 13. Out of scope

- IndexedDB or server-side persistence.
- NLP/embedding-based note parsing.
- Cross-grow historical analysis beyond what cure notes already surface.
- Multi-user / multi-device sync.
- Mobile-specific UX beyond the existing Section-10 bottom nav from v2.
- CI / headless automation.
- **Full cure advisor with strain profiles and decision rules — deferred to `9b-future.md` as a follow-up plan.**

---

## 14. Where to read next

- `claude-spec.md` — full feature spec with all 24 locked decisions
- `claude-research.md` — test infra, store hooks, half-life rationale, ES module patterns
- `claude-interview.md` — rollout + cure-advisor arbitration transcript
- `claude-integration-notes.md` — Opus review integration decisions (why the plan looks like this)
- `reviews/iteration-1-opus.md` — the review itself
- `01-audit.md` through `08-decisions.md` — the pre-existing split spec
- `claude-plan-tdd.md` — test stubs per section (generated at step 16)
- `sections/index.md` — generated at step 18, links to per-section implementation briefs
- `9b-future.md` — captured intent for the deferred cure advisor follow-up
