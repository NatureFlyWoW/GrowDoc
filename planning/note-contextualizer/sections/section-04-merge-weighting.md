# section-04-merge-weighting

**Original plan section:** S3 — Merge, weighting, kill profile-context-rules (M)
**Batch:** 2 (parallel with section-03-rules-keywords)

Implement the pure-function merge and weighting layer: code that takes a bag of `Observation` objects and decides which user note wins when computing the current value of a scalar field. Finalize anti-redundancy helper (task engine will call it in section-07). Fold wizard-era `profile-context-rules.js` into unified keyword base with `wizardStep` tag. Delete `profile-context-rules.js`. Migrate three callers (`onboarding.js`, `settings.js`, `plant-detail.js`).

This section is the **heart of "notes outrank stale structured data."**

## Dependencies

- **section-01** — types in `js/data/observation-schema.js`, `collectObservations`, `initContextualizer`, `getObservationIndex`, stubbed `mergeNoteContext`/`findActionsTakenSince` in `merge.js`/`index.js`.
- **section-03** (parallel in same batch) — authors `rules-keywords.js` with `KEYWORD_PATTERNS`, `SEVERITY_HEURISTICS`, `ACTION_TAKEN_PATTERNS`, `DOMAIN_BY_RULE_ID`, `FRANCO_OVERRIDE_RULE_IDS`. Section-04 imports `FRANCO_OVERRIDE_RULE_IDS` (Set) and `KEYWORD_PATTERNS` (appends wizard-tagged rules to bottom). Coordinate so exported symbols are committed early.

## Background

### Observation shape (from section-01)

```js
{
  id: 'hash',
  observedAt: 'ISO',
  plantId: 'uuid'|undefined,
  source: 'log'|'task'|'plant'|'profile'|'stage-transition'|'cure'|'wizard'|'override'|'plant-doctor',
  domains: ['nutrients','action-taken', ...],
  severityRaw: 'urgent'|'concern'|null,    // legacy on-disk
  severity: 'alert'|'watch'|'info',        // display alias
  parsed: { ctx: {...}, keywords: [...], frankoOverrides: [...] }|null,
  rawText: 'exact user input',
}
```

Frozen arrays returned from `getRelevantObservations()`. Merge code must not mutate — build fresh objects.

### Wizard rules to absorb

`js/data/profile-context-rules.js` exports `parseProfileNotes(notes)` and `NOTE_PLACEHOLDERS`. Current callers:

- `js/views/onboarding.js:7` — `import { parseProfileNotes, NOTE_PLACEHOLDERS }`; line 686: `const context = parseProfileNotes(rawNotes)`
- `js/views/settings.js:5` — same import; line 255: `profileSnap.context = parseProfileNotes(profileSnap.notes)`
- `js/views/plant-detail.js:5` — `import { parseProfileNotes }`; line 552: `p.context = parseProfileNotes({ plant: raw })`

All three migrate to unified API here. `my-grow.js` has no current dependency — leave alone unless grep finds an import.

### Four-step weighting algorithm

```
Step 1 — Collect Franco-override candidates.
  franco = candidates.filter(c => c.parsed?.frankoOverrides?.length > 0)
  if franco.length > 0:
    return franco.sortBy(observedAt desc)[0]

Step 2 — Partition remaining by severity.
  groups = { alert: [], watch: [], info: [] }

Step 3 — Pick top non-empty group (severity-first).

Step 4 — Within top group, pick highest weight by half-life decay.
  HALF_LIFE = { alert: 24, watch: 48, info: 168 }
  weight = Math.pow(0.5, ageHours / HALF_LIFE[severity])
```

Non-note sources use simpler non-decay weighting:
- log-structured fresh (<24h): 0.85
- sensor fresh (<2h): 0.80
- profile default: 0.20

A non-Franco note at any severity wins over sensor/structured/profile.

### Action-taken detection (separate from scalar merging)

- Observation with `domains` containing `'action-taken'` within task-specific window blocks the task.
- **Wizard observations (`source === 'profile'`) excluded.** Preferences, not events.
- Windows: water 12h, feed 24h, flush 48h, IPM 72h, defoliate 168h, top 336h.
- TaskType → keyword mapping uses `DOMAIN_BY_RULE_ID`/`ACTION_TAKEN_PATTERNS` from section-03. Do not hard-code rule ids.

## Files

**Create:**
- `js/data/note-contextualizer/weighting.js` — `resolveScalar`, `computeWeight`, `halfLifeHours`, `HALF_LIFE` map.
- `js/data/note-contextualizer/merge.js` — real `mergeNoteContext`, `getRelevantObservations`, `findActionsTakenSince`.

**Modify:**
- `js/data/note-contextualizer/index.js` — flip stub re-exports to real.
- `js/data/note-contextualizer/rules-keywords.js` — append "Wizard rules (merged from profile-context-rules.js)" block at bottom of `KEYWORD_PATTERNS`. Each entry: `{ id, pattern, domains, wizardStep }`.
- `js/views/onboarding.js`, `settings.js`, `plant-detail.js` — migrate imports/call sites.
- `js/tests/note-contextualizer.test.js` — append Section 04 tests.

**Delete:**
- `js/data/profile-context-rules.js` — after all three callers migrated and tests pass. `NOTE_PLACEHOLDERS` inlined into callers or moved to `js/data/note-contextualizer/placeholders.js`.

## Implementation

### `weighting.js`

```js
import { FRANCO_OVERRIDE_RULE_IDS } from './rules-keywords.js';

export const HALF_LIFE = { alert: 24, watch: 48, info: 168 };

export function computeWeight(obs, now = Date.now());

export function resolveScalar(candidates, now = Date.now());
// Implements 4-step algorithm. Pure. Returns null on empty input.
// Candidates may be Observations OR synthetic {source, severity, observedAt, value}.
```

Edge cases: empty list → null; single candidate → returned directly; Franco ties → deterministic stable sort; unknown severity → `info`.

### `merge.js`

```js
import { resolveScalar, computeWeight } from './weighting.js';
import { getObservationIndex } from './index.js';

export function mergeNoteContext(observations);
// Returns: { ctx, keywords, frankoOverrides, citationsFor, sources }
// Each scalar ctx field: collects candidates, runs resolveScalar, takes winner.
// Array fields: union.
// Keywords: deduped union.

export function getRelevantObservations(store, { plantId, since, domains, limit, minSeverity } = {});
// Scopes singleton index. Returns FROZEN array.
// minSeverity: 'watch' excludes info; 'alert' excludes info+watch.
// since: accepts ISO, relative '14d', or ms timestamp — normalize internally.

export function findActionsTakenSince(observations, taskType, sinceHours);
// CRITICAL: filters source === 'profile'.
// Maps taskType via small internal table keyed off ACTION_TAKEN_PATTERNS.
```

### Wizard rule merge

Read `js/data/profile-context-rules.js`. Map each rule to `KEYWORD_PATTERNS` entry: `{ id: 'wizard-<step>-<value>', pattern, domains: ['<domain>'], wizardStep: '<step>' }`.

**Dedupe:** if id already exists in section-03 base, do NOT add duplicate. Modify existing entry to carry `wizardStep` metadata so same rule carries both tags. `parseObservation` fires once; `sources` set records both.

### Caller migration

Helper in `index.js`:
```js
export function parseProfileText(text, opts) {
  // Constructs temporary Observation with source:'profile' and given wizardStep,
  // runs parseObservation, returns { ...obs.parsed.ctx, _obs: obs }
}
```

- `onboarding.js:686`: `const context = parseProfileText(rawNotes, { wizardStep: 'strain' })` (or active step — inspect surrounding code). Inline `NOTE_PLACEHOLDERS` or move to placeholders.js.
- `settings.js:255`: `profileSnap.context = parseProfileText(profileSnap.notes)`.
- `plant-detail.js:552`: `p.context = parseProfileText(raw, { source: 'plant' })` (preserve existing behavior — may need variant helper or inline construction).

Grep after migration: zero hits for `profile-context-rules`, `parseProfileNotes`, `NOTE_PLACEHOLDERS` (or one hit in placeholders.js sidecar). Then delete `js/data/profile-context-rules.js`.

## Tests

Append to `js/tests/note-contextualizer.test.js`:

```
# Test: mergeNoteContext with empty array returns empty ctx
# Test: mergeNoteContext with one observation returns its ctx
# Test: mergeNoteContext severity-first — alert@6h outranks info@1h
# Test: mergeNoteContext within-tier recency — alert@2h outranks alert@8h via half-life
# Test: mergeNoteContext Franco override — stress-heat-severe@30h wins, ignoring decay
# Test: mergeNoteContext Franco override — freshest wins if multiple
# Test: mergeNoteContext array fields — keywords union with source attribution
# Test: findActionsTakenSince returns matching 'water' obs within 12h
# Test: findActionsTakenSince EXCLUDES source==='profile'
# Test: findActionsTakenSince returns empty when no match
# Test: getRelevantObservations scopes by plantId and since
# Test: getRelevantObservations minSeverity='watch' excludes info
# Test: resolveScalar — weight === 0.5 for 24h-old alert (half-life 24)
# Test: resolveScalar — weight ~0.97 for 1h-old watch (|result-0.97|<0.01)
# Test: Merged wizard rule — stage-clone fires with source:'profile', wizardStep:'stage'
# Test: Wizard dedupe — 'clone' mention in both wizard and general fires once, sources has both
# Test: profile-context-rules.js is gone — try/catch dynamic import, pass if throws
```

**Implementation notes:**
- Most tests build inline Observation arrays, call merge/resolveScalar/findActionsTakenSince directly.
- `getRelevantObservations` tests need a store — seed `store.state.grow`, `__resetForTests()`, `getObservationIndex()`.
- "profile-context-rules.js is gone" test: `await import('../data/profile-context-rules.js')` inside try/catch; pass if throws.
- Wizard dedupe test: seed grow with both `profile.notes` entry and `plant.logs[0].details.notes` mentioning "clone". Assert `mergeNoteContext([obsProfile, obsLog]).keywords` contains `wizard-stage-clone` exactly once; `sources[obsProfile.id].source === 'profile'`, `sources[obsLog.id].source === 'log'`.
- Franco override ordering: two alert obs both tagged `frankoOverrides: ['stress-heat-severe']` at 30h and 40h — 30h wins.
- Half-life math: pick fixed `now`, `observedAt = now - 24*3600*1000`, severity alert → `computeWeight === 0.5`. For 1h watch at half-life 48: `0.5^(1/48) ≈ 0.9856`.

## Manual verification

1. `vercel dev`, `/test-runner` hard reload. All Section 04 tests pass.
2. Companion in separate tab — onboarding wizard, settings, plant detail pages behave identically to pre-section-04.

Commit: `section-04: merge, weighting, kill profile-context-rules`.

## Out of scope

- Score/advice rule authoring (section-05)
- Task engine wiring (section-07)
- Plant Doctor rewire (section-05)
- Harvest/stage/priority/dashboard (section-06)
- UI surface (sections 02, 08)
- Cure tracker projection (section-09)
- `recordReferencedIn` wiring, `sw.js` bump, deploy (section-10)
