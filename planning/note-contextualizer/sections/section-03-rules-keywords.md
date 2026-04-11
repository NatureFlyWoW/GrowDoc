# section-03-rules-keywords — Port KEYWORD_PATTERNS + golden fixtures + delete legacy

**Original plan section:** S2 (KEYWORD_PATTERNS port + golden fixtures + delete legacy, M)
**Batch:** 2 (parallel with section-04-merge-weighting)
**Depends on:** section-01 (provides `Observation`/`ParsedNote` JSDoc, stub `parseObservation`, registered test file)
**Blocks:** section-04 (merge/weighting consumes `rules-keywords.js`), section-05 (score/advice rules read `ctx`)

This section commits **twice**: `section-03a: port KEYWORD_PATTERNS + fixtures` and `section-03b: delete legacy v3 tool`. The split lets 03b be reverted independently, and lets 03a be reverted without resurrecting deleted files.

## Background

GrowDoc uses vanilla ES modules, no bundler, no npm. Tests run at `/test-runner`. Section-01 created `js/tests/note-contextualizer.test.js` with a stub `parseObservation` returning `{ ctx: {}, observations: [], actionsTaken: [], questions: [], keywords: [], frankoOverrides: [] }`. This section replaces the stub with the real parser.

Legacy parser lives at `docs/note-context-rules.js`. Exports `KEYWORD_PATTERNS` (~984 rules) and `extractNoteContext(rawText)`. Each rule entry:

```js
{
  id: 'action-flushed',
  pattern: /flush(ed|ing)?/i,
  extract: (match, rawText, ctx) => { /* mutates ctx */ },
  // optional: domain, severity, wizardStep, notes
}
```

**Rule array order matters.** The legacy parser applies rules in declaration order; later rules see fields written by earlier ones via shared `ctx`. Parity tests enforce order preservation.

### `ParsedNote.ctx` field list (§4a of claude-plan.md)

```js
{
  plantType: 'clone'|'seed'|'mother'|'autoflower'|null,
  medium:    'soil'|'coco'|'hydro'|'living-soil'|null,
  waterSource: 'tap'|'ro'|'distilled'|'rainwater'|null,
  lighting:  'led'|'hps'|'cmh'|'fluorescent'|null,
  phExtracted: number|null,
  ecExtracted: number|null,
  tempExtracted: number|null,
  rhExtracted: number|null,
  vpdExtracted: number|null,
  severity:  'worsening'|'stable'|'improving'|null,
  rootHealth: 'healthy'|'suspect'|'rotting'|null,
  growerIntent: 'max-yield'|'max-terps'|'learn'|null,
  timelineDays: number|null,
  amendments: string[],
  previousProblems: string[],
  actions: string[],
}
```

Every field name and type round-trips for every golden fixture. Missing values produce `null` or `[]` — not `undefined`.

### `FRANCO_OVERRIDE_RULE_IDS`

Set of rule ids that bypass recency decay in merge. Populate by iterating ported `KEYWORD_PATTERNS` and filtering:

- `stress-heat-*` (prefix)
- `stress-overwater-*`
- `root-rot-*`
- `stress-drought-severe` (exact)
- `hermie-*`
- `bananas-spotted` (exact)

Export as `Object.freeze(new Set(...))` for O(1) lookup.

### `SEVERITY_HEURISTICS`

~10–20 regex entries mapping phrases to severity (`'alert'|'watch'|'info'`). Plan calls out one specific fix:

```js
// Correct — grouping matches each word individually
/\b(bad|terrible|worst)\b/i
// Bug form (do NOT ship): /\bbad|terrible|worst\b/i
```

Cover legacy severity phrases (`yellowing`, `wilting`, `burnt tips`, `leaves falling`, `everything fine`, `doing great`). Each entry: `{ regex, severity }`.

### `ACTION_TAKEN_PATTERNS`

Regexes detecting past-tense action verbs. Each: `{ regex, taskType }` where taskType ∈ `'water'|'feed'|'flush'|'ipm'|'defoliate'|'top'`.

```js
{ regex: /\b(just\s+)?(watered|watering)\b/i, taskType: 'water' },
{ regex: /\b(flushed|flushing)\b/i, taskType: 'flush' },
```

When fired, `parseObservation` pushes `'action-taken'` into `obs.domains` and appends to `parsed.actionsTaken` as `{type:'action', value:taskType}`.

### `DOMAIN_BY_RULE_ID`

Plain object mapping every `KEYWORD_PATTERNS` id to one domain from the enum. Test asserts totality.

## Files

**Created:**
- `js/data/note-contextualizer/rules-keywords.js`
- `js/tests/fixtures/note-context-legacy.json` (golden fixtures)
- `planning/note-contextualizer/harness/legacy-parity-harness.html` (one-time capture; delete or leave in `planning/`)

**Modified:**
- `js/data/note-contextualizer/index.js` (replace stub `parseObservation`)
- `js/tests/note-contextualizer.test.js` (append Section 2 test block)

**Deleted (sub-commit 03b):**
- `docs/note-context-rules.js`
- `docs/tool-plant-doctor.html`
- `docs/plant-doctor-data.js` (only if grep confirms v3-only)
- Corresponding `docs/docs.json` entries

Do NOT modify `vercel.json` — 404 is acceptable.

## Sub-commit 03a

### 1. Port `KEYWORD_PATTERNS`

Copy the entire array verbatim into `rules-keywords.js` as `export const KEYWORD_PATTERNS = Object.freeze([...])`. Preserve array order exactly. Do not rename ids, split, or alphabetize. Each rule keeps its `{id, pattern, extract, ...}` shape. Closures port verbatim — if one throws, `ruleErrors[]` absorbs it via section-01's `parseAllObservations`.

### 2. Author auxiliary tables

```js
export const SEVERITY_HEURISTICS = Object.freeze([
  // ~10–20 { regex, severity } entries
]);

export const ACTION_TAKEN_PATTERNS = Object.freeze([
  // 6+ { regex, taskType } entries — one per task type minimum
]);

export const DOMAIN_BY_RULE_ID = Object.freeze({
  // '<ruleId>': '<domain>' — one per KEYWORD_PATTERNS id
});

export const FRANCO_OVERRIDE_RULE_IDS = Object.freeze(new Set(
  KEYWORD_PATTERNS
    .map(r => r.id)
    .filter(id =>
      id.startsWith('stress-heat-') ||
      id.startsWith('stress-overwater-') ||
      id.startsWith('root-rot-') ||
      id === 'stress-drought-severe' ||
      id.startsWith('hermie-') ||
      id === 'bananas-spotted'
    )
));
```

`DOMAIN_BY_RULE_ID` can be hand-authored alongside the port, or derived from legacy `rule.domain` when present. Fallback: infer from id prefix (`ph-*` → `nutrients`, `temp-*` → `environment`, `mite-*` → `pest`).

### 3. Implement `parseObservation`

Replace section-01 stub in `js/data/note-contextualizer/index.js`. Contract:

- **Idempotent:** if `obs.parsed != null`, return early.
- **Empty input:** `rawText === ''` produces full `ctx` with defaults, empty arrays for keywords/observations/actions/questions. Never mutates `obs.severity` or `obs.severityRaw`.
- **Field defaults:** small private `emptyCtx()` returns fresh object with every §4a field pre-populated.
- **Severity mapping:** SEVERITY_HEURISTICS fires → write LEGACY enum to `obs.severityRaw` and display alias to `obs.severity`:
  - `'alert'` → `severityRaw:'urgent'`, `severity:'alert'`
  - `'watch'` → `severityRaw:'concern'`, `severity:'watch'`
  - `'info'` → `severityRaw:null`, `severity:'info'`
- Set `severityAutoInferred = true` only when the parser writes severity itself (caller had null on entry).
- Populate `obs.parsed.keywords` in KEYWORD_PATTERNS declaration order.
- Populate `obs.parsed.frankoOverrides` as subset of keywords in `FRANCO_OVERRIDE_RULE_IDS`.
- Populate `obs.domains` from DOMAIN_BY_RULE_ID + `'action-taken'` when ACTION_TAKEN_PATTERNS fired.
- Populate `obs.parsed.actionsTaken` from ACTION_TAKEN_PATTERNS.
- Populate `obs.parsed.questions` from sentences ending `?` or starting `is/does/should/can`.

### 4. Capture golden fixtures (one-time manual)

1. Create `planning/note-contextualizer/harness/legacy-parity-harness.html`:
   ```html
   <!doctype html><meta charset="utf-8">
   <script type="module">
     import { extractNoteContext } from '/docs/note-context-rules.js';
     const inputs = [ /* 25 representative inputs */ ];
     const results = inputs.map(input => ({ input, expected_ctx: extractNoteContext(input) }));
     console.log(JSON.stringify(results, null, 2));
     window.__results = results;
   </script>
   ```
2. `vercel dev`, open harness in browser, `copy(__results)` from devtools.
3. Save to `js/tests/fixtures/note-context-legacy.json` as top-level array of `{input, expected_ctx}`.
4. Commit the JSON as part of 03a.

25 inputs must exercise every ctx scalar field, every array field, one sample per domain, at least one Franco-override trigger, and the `/\b(bad|terrible|worst)\b/i` regression phrase.

### 5. Grep for stale refs (prep for 03b)

- `grep -r "note-context-rules" js/ docs/ index.html admin.html`
- `grep -r "plant-doctor-data" js/ docs/ index.html admin.html`
- `grep -r "tool-plant-doctor" js/ docs/ docs.json index.html admin.html`

Any hits → update imports or remove. `docs.json` entries for `tool-plant-doctor` and `plant-doctor-data` removed wholesale.

## Sub-commit 03b — delete legacy

Separate commit after 03a passes tests.

1. Confirm grep clean (no stale refs outside to-delete set).
2. `git rm docs/note-context-rules.js`
3. `git rm docs/tool-plant-doctor.html`
4. Inspect `docs/plant-doctor-data.js` — if imported only by `tool-plant-doctor.html`, `git rm`. Otherwise leave.
5. Edit `docs/docs.json` — remove v3 tool entries, validate JSON.
6. Re-run Section 2 tests at `/test-runner` with hard reload.
7. Commit: `section-03b: delete legacy v3 tool`.

No `sw.js` VERSION bump here (section-10).

## Tests

Append to `js/tests/note-contextualizer.test.js`:

```
# Test: KEYWORD_PATTERNS is frozen
# Test: KEYWORD_PATTERNS.length equals legacy count (hardcode after grep at port time)
# Test: Every entry has { id:string, pattern:RegExp, extract:function }
# Test: KEYWORD_PATTERNS ids are unique (Set size === array length)

# Test: parseObservation({rawText: 'just flushed with 6.0 pH'})
#   → parsed.keywords includes 'action-flushed' AND 'ph-extracted'
#   → parsed.ctx.phExtracted === 6.0
#   → parsed.actionsTaken contains {type:'action', value:'flush'}
#   → obs.domains includes 'action-taken'
# Test: parseObservation preserves declaration order for multi-rule matches
# Test: parseObservation({rawText: ''}) — parsed !== null, empty arrays, full ctx defaults
# Test: parseObservation ctx shape matches §4a field list

# Test: For every fixture in note-context-legacy.json:
#   deepEqual(parseObservation({rawText: fixture.input}).parsed.ctx, fixture.expected_ctx)
#   One {pass, msg} per fixture

# Test: Every SEVERITY_HEURISTICS entry compiles, has { regex, severity }
# Test: /\b(bad|terrible|worst)\b/i matches 'bad', 'terrible', 'worst' individually
# Test: Every ACTION_TAKEN_PATTERNS entry compiles, matches documented phrase

# Test: DOMAIN_BY_RULE_ID is total over KEYWORD_PATTERNS
# Test: FRANCO_OVERRIDE_RULE_IDS contains at least one id matching each documented prefix
# Test: parseObservation on 'tent hit 40C, leaves taco' populates parsed.frankoOverrides

# 03b verification tests (run after deletes land):
# Test: fetch('/docs/note-context-rules.js') returns 404
# Test: docs/docs.json has no entry with id 'tool-plant-doctor' or 'plant-doctor-data'
```

## Manual verification

1. `vercel dev`, `/test-runner` with hard reload. All Section 2 tests pass.
2. Open admin.html → plant → log note `just flushed with 6.0 pH`. Severity chip still renders, strip still shows `[parsing soon…]` (section-08 replaces).
3. After 03b: `http://localhost:3000/docs/tool-plant-doctor.html` → 404 (acceptable).
4. No console errors on SPA navigation.

## Done when

- `KEYWORD_PATTERNS` frozen, ordered, length-matching-legacy.
- Auxiliary tables exported with correct contracts.
- `parseObservation` is real, produces §4a ctx, idempotent, never throws on strings.
- `js/tests/fixtures/note-context-legacy.json` has 25 fixtures, all round-trip.
- Every Section 2 test passes in `/test-runner`.
- Sub-commit 03b has removed legacy files, docs.json entries, zero stale refs.
- Two commits on main: `section-03a` and `section-03b`.
