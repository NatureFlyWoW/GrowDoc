# section-06-advisors

**Original plan section:** S6 (Harvest/stage/priority/dashboard note-awareness, M)
**Batch:** 3 (parallel with section-05, serial before section-07)

Extend GrowDoc's four existing advisors to consume the Observation stream. Zero file overlap with section-05.

## Dependencies

- **section-01** — `Observation`/`ParsedNote`, `collectObservations`, `initContextualizer`, `getObservationIndex`, `__resetForTests`.
- **section-03** — `KEYWORD_PATTERNS` ported, `parseObservation` populates `parsed.ctx`, `parsed.keywords`, `parsed.domains`, `parsed.frankoOverrides`. Section-06 keys on rule ids: `user-thinks-early`, `user-thinks-late`, `action-taken:transplanted`, `recovery-*`, `aroma-*`, `trichome-*`, `timeline-*`, `priority-yield`, `priority-terps`, `priority-quality`, `priority-effect`.
- **section-04** — `mergeNoteContext(observations) → ctx`, `getRelevantObservations(store, {plantId, since, domains, minSeverity})`, half-life `resolveScalar` used inside `mergeNoteContext`.

## Background

**Backwards compatibility non-negotiable.** Every exported function signature grows a trailing `notes = []` parameter. Existing callers passing no `notes` produce byte-identical output. First test case for each file is a "notes=[] regression fixture."

**`ParsedNote.ctx` shape** (same field list as §4a claude-plan.md).

Observations carry top-level `severity: 'alert'|'watch'|'info'|null`, `observedAt` ISO, `plantId`, `source` ∈ `'log'|'plant'|'task'|'profile'|'cure'`. `mergeNoteContext` returns merged ctx plus `_citedObsIds: string[]` provenance from section-04.

## Files

**Edit:**
- `js/data/harvest-advisor.js` — `getHarvestRecommendation(trichomes, priorities, notes = [])`
- `js/data/stage-rules.js` — `shouldAutoAdvance(plant, notes = [])`
- `js/data/priority-engine.js` — `calculateWeights(priorities, notes = [])`, `getRecommendation(param, stage, medium, priorities, notes = [])`
- `js/views/dashboard.js` — `renderStatusBanner(container, store)` second-line alert-obs banner

**New test files (register in `js/main.js:298`):**
- `js/tests/harvest-advisor.test.js`
- `js/tests/stage-rules.test.js`
- `js/tests/priority-engine.test.js`

If a test file already exists, append to it.

No CSS, store, or HTML changes.

## Tests FIRST

Seed fixture grow/profile, pass pre-built observation arrays. No mocking. Always call `__resetForTests()`.

### `js/tests/harvest-advisor.test.js`

```
# Test: getHarvestRecommendation(trichomes, priorities) omitted notes produces byte-identical output
# Test: notes=[] explicit empty array equivalent to omitted
# Test: note 'smells amazing, want max terps' → growerIntent='max-terps', shifts toward harvest-now for peak-milky
# Test: note 'wait for more amber' → shifts toward keep-waiting/harvest-soon for harvest-now mix
# Test: 'user-thinks-early' rule shifts confidence UP one step (low→medium→high→high)
# Test: 'user-thinks-late' rule shifts confidence DOWN one step
# Test: tradeoffNote has citedObsIds: string[] populated from merged obs (empty when notes=[])
# Test: aroma keyword 'citrusy terpene explosion' + harvest-now does NOT flip — enhances tradeoffNote only
# Test: note-derived growerIntent wins over conflicting star-priority
```

Confidence is a 3-step enum (`'low'|'medium'|'high'`). Define tiny `bumpConfidence(current, direction)` helper.

### `js/tests/stage-rules.test.js`

```
# Test: shouldAutoAdvance(plant) omitted notes returns identical output
# Test: shouldAutoAdvance(plant, []) equivalent to omitted
# Test: observation with 'action-taken:transplanted' at daysAgo(1) → returns null (blocks 72h)
# Test: observation with recovery keyword ('bouncing back','recovering','still stressed') at daysAgo(0.5) → returns null
# Test: action-taken:transplanted at daysAgo(4) does NOT block — 72h elapsed
# Test: only notes matching plant.id count — transplant on plantA does not block plantB
```

Add constants at top of `stage-rules.js` near existing STAGES:
```js
const POST_TRANSPLANT_BLOCK_HOURS = 72;
const RECOVERY_BLOCK_HOURS = 48;
```

### `js/tests/priority-engine.test.js`

```
# Test: calculateWeights(priorities) omitted notes returns identical output
# Test: calculateWeights({yield:3,quality:3,terpenes:3,effect:3}, []) === {0.25,0.25,0.25,0.25}
# Test: 'priority-yield' note shifts yield UP, sum stays 1.0 (floor 1e-9)
# Test: 'priority-terps' note shifts terpenes UP
# Test: Conflicting signals — note biases on top of star baseline by +0.10, re-normalizes
# Test: getRecommendation forwards notes to calculateWeights (verify via tradeoffNote)
```

Note bias: single `+0.10` adjustment to matching dimension before normalization. Most recent (by `observedAt`) wins if multiple fire.

```js
const NOTE_PRIORITY_BIAS = 0.10;
```

### Dashboard banner tests

```
# Test: renderStatusBanner with tasks=[] and no alerts renders 'All good — Day X, stage' unchanged
# Test: tasks=[] + alert-severity obs within 48h → additional .status-banner-note child with text + relative timestamp
# Test: tasks=[] + alert obs OLDER than 48h → no second-line banner
# Test: urgent tasks present → no second-line banner (primary banner carries alert)
# Test: Second-line banner text truncated at 80 chars with ellipsis
# Test: Click on .status-banner-note navigates to plant-detail for obs's plantId
```

## Implementation

### `harvest-advisor.js`

1. Import `mergeNoteContext`.
2. Append `notes = []`.
3. After `weights`: `const noteCtx = notes.length ? mergeNoteContext(notes) : null;`
4. Extract `growerIntent`, whether `user-thinks-early`/`user-thinks-late` rule ids fired, aroma/trichome/timeline keywords.
5. Apply overrides in order:
   - **growerIntent**: `max-terps` + peak-milky → upgrade `harvest-soon → harvest-now`; `max-yield` + classic-window → downgrade `harvest-now → harvest-soon`.
   - **Confidence shift**: `user-thinks-early` → `bumpConfidence(+1)`; `user-thinks-late` → `-1`.
   - **Tradeoff narration**: append one sentence summarizing winning signal, quote at most 60 chars raw text. Null-safe.
6. Collect cited obs ids from `noteCtx._citedObsIds`, expose as `citedObsIds: string[]` (default `[]`).
7. Return shape: `{ recommendation, confidence, tradeoffNote, staggerSuggestion, dryingProtocol, curingProtocol, citedObsIds }`.

**Do NOT modify callers** (`harvest-view.js`, `doctor-ui.js`) — backwards compat. Section-10 wires the real `notes` argument.

### `stage-rules.js`

1. Append `notes = []` to `shouldAutoAdvance(plant, notes = [])`.
2. Before stage math, scan notes for:
   - `obs.plantId === plant.id` AND `parsed.keywords.includes('action-taken:transplanted')` AND age < 72h
   - `obs.plantId === plant.id` AND `parsed.keywords` intersects `['recovering','bouncing-back','still-stressed','recovery']` AND age < 48h
3. If either hits, return null. Otherwise existing logic unchanged.
4. Add POST_TRANSPLANT_BLOCK_HOURS, RECOVERY_BLOCK_HOURS constants.
5. Do NOT modify `getDaysInStage`, `getStageDurations`, etc.

### `priority-engine.js`

1. Append `notes = []` to `calculateWeights(priorities, notes = [])`.
2. Compute baseline as today (sum-normalized stars).
3. If notes.length, scan for most-recent obs with `parsed.keywords` containing `priority-yield`/`priority-terps`/`priority-quality`/`priority-effect`.
4. Apply `+0.10` to matching dimension's raw star value, re-normalize. All-zeros → start from 0.25 equal-weight.
5. Append `notes = []` to `getRecommendation(..., notes = [])`, forward to `calculateWeights`.
6. `blendTarget` unchanged.

### `dashboard.js`

Import `getRelevantObservations`. In `renderStatusBanner`:

1. Compute existing status/text.
2. Append primary `.status-banner` unchanged.
3. **New**: if `urgentTasks.length === 0 && recommendedTasks.length === 0`:
   ```js
   const alertObs = getRelevantObservations(store, {
     since: new Date(Date.now() - 48 * 3600000).toISOString(),
     minSeverity: 'alert',
     limit: 1,
   });
   ```
4. If `alertObs.length > 0`, append `<div class="status-banner-note">`:
   - Text: quoted rawText (80-char truncate + ellipsis) + " · " + relative time
   - `data-plant-id` attribute
   - Click navigates via existing `navigate` import
5. Local `relativeTime(iso)` helper returning `'just now'|'Nm ago'|'Nh ago'|'Nd ago'`. No libs.

If `tasks.length > 0`, no second-line banner.

## Edge cases

- Empty `notes` === omitted notes — every file tests both.
- Per-plant scoping: note on plantA never influences plantB.
- Null-safety on merged ctx (`noteCtx` may be null when notes=[]).
- Citations: `citedObsIds` defaults to `[]`, never `undefined`.

## Manual verification

1. `vercel dev`, `/test-runner` hard reload, all three new test files pass.
2. Dashboard: seed grow with zero tasks, add plant log note `"tent feels really hot, plants wilting"`. Second-line `.status-banner-note` appears.
3. Seed obs >48h old, confirm banner disappears.
4. Harvest view: peak milky + note `"smells like lemon candy, want max terps"` → tradeoffNote cites aroma, `citedObsIds` populated.

No `sw.js` bump. Section-10 only.

Commit: `section-06: note-aware harvest/stage/priority advisors + dashboard alert banner`

## Out of scope

- `recordReferencedIn` wiring — section-10.
- `js/plant-doctor/*` — section-05.
- `js/components/task-engine.js`, task-card override — section-07.
- Caller-side `notes` wiring — section-10 passes the real arrays.
- New CSS file — `.status-banner-note` rule goes in existing `css/note-contextualizer.css` (~8 lines).
