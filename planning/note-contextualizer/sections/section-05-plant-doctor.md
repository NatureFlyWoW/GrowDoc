# section-05-plant-doctor

**Batch:** 3 (parallel with `section-06-advisors`)
**Original plan section:** S4 (Plant Doctor wiring + authored rules + activePlantId, M)
**Dependencies:** section-01, section-03, section-04
**Blocks:** section-07, section-10

## Goal

Wire the Note Contextualizer into the Plant Doctor so contextual notes influence both condition scoring and advice output. Author two rule modules (`rules-score.js`, `rules-advice.js`) from scratch targeting Companion condition taxonomy (`'Nitrogen Deficiency'`, `'Overwatering'`, `'Heat Stress'`, etc.), NOT legacy v3 rule ids. Introduce `store.state.ui.activePlantId` so multi-plant grows diagnose the right plant.

At section end:
1. Seeding a plant with `{logs: [{details: {notes: 'pH was 5.0 runoff, tips burning'}}]}` makes `'pH Imbalance'` outrank an un-noted baseline.
2. "Your Action Plan" block renders from `generateContextualAdvice`, each item carrying cited observation ids.
3. Plant Doctor operates on the launched plant, not `plants[0]`.

## Background

### Companion condition taxonomy (why rewriting not porting)

Legacy v3 scored against ids like `r-n-def`, `r-overwater`. Companion `doctor-engine.js:runDiagnosis` scores against human-readable **condition names**. The `SCORING` array in `doctor-data.js`:

```js
{ condition: 'Nitrogen Deficiency', symptom: 'yellow-lower-leaves', weight: 20 }
```

Returns `{condition, confidence, matchedSymptoms, score}` ranked by confidence. The top condition's `condition` string is the canonical key we target. **No bridge layer** — write rules directly against Companion names.

### `ParsedNote.ctx` (input to both rule modules)

Fields frozen by section-03:
```
plantType, medium, waterSource, lighting, phExtracted, ecExtracted,
tempExtracted, rhExtracted, vpdExtracted, severity, rootHealth, growerIntent,
timelineDays, amendments[], previousProblems[], actions[]
```

Rules may only read these fields.

### Existing doctor-engine

`js/plant-doctor/doctor-engine.js`:
- `runDiagnosis(symptoms, context)` — scores `_data.SCORING`, returns top 10.
- `getRefineQuestions(topConditions)` — unchanged.
- `buildContext(store)` — currently pulls `grow.plants[0]`, returns `{medium, lighting, stage, experience, recentLogs}`.
- `setDiagnosticData(scoring, refineRules)` — lazy data installer.

`buildContext` is the active-plant hook. `runDiagnosis` is the score-adjustment hook (call `adjustScoresFromNotes(scoresMap, ctx)` between tally and normalization).

### Store shape

`js/main.js:36` creates store with a `ui` slot accepting any object via `js/storage.js:359` shape validation. Adding `activePlantId` needs no migration. The existing `main.js:50` auto-save loop persists `ui` on commit — `activePlantId` goes to `localStorage['growdoc-companion-ui']` for free.

## Files

### Create

**1. `js/data/note-contextualizer/rules-score.js`**

Export frozen array `SCORE_ADJUSTMENTS` of ~30–40 rules:

```js
{
  id: 'score-ph-lockout',
  appliesTo: 'pH Imbalance',
  condition: (ctx) => ctx.phExtracted != null && (ctx.phExtracted < 5.5 || ctx.phExtracted > 7.0),
  adjustment: +25,
}
```

Cover at minimum:
- `'pH Imbalance'` — out-of-range phExtracted, previousProblems.includes('pH-drift')
- `'Overwatering'` — rootHealth === 'suspect' or 'rotting'
- `'Underwatering'` — rootHealth === 'healthy' + wilting signals
- `'Heat Stress'` — tempExtracted > 28; severe > 32
- `'Cold Stress'` — tempExtracted < 16
- `'Low Humidity Stress'` — rhExtracted < 35
- `'High Humidity / Mould Risk'` — rhExtracted > 70
- `'Nutrient Burn'` — ecExtracted > 2.2; previousProblems.includes('nute-burn')
- `'Nitrogen Deficiency'` — medium === 'coco' AND ecExtracted < 0.8
- `'Light Burn'` — lighting === 'led' + no heat signal + severity 'worsening'
- `'Root Rot'` — rootHealth === 'rotting'; medium === 'hydro' + tempExtracted > 24
- `'VPD Stress'` — vpdExtracted < 0.6 or > 1.6

15+ unique `appliesTo` conditions. Unique rule ids pattern `score-<kebab>`.

```js
export function adjustScoresFromNotes(scoresMap, ctx);
// scoresMap: {condition name: {condition, score, matches, maxScore}}
// Iterates SCORE_ADJUSTMENTS with try/catch.
// On throw: push to getObservationIndex().ruleErrors, continue.
// On truthy condition: scoresMap[rule.appliesTo].score += rule.adjustment (never <0).
// If missing entry: create minimal {condition, score:0, matches:[], maxScore:100, noteAdjusted:true}.
// Returns mutated scoresMap.
```

**2. `js/data/note-contextualizer/rules-advice.js`**

Export frozen `ADVICE_RULES` of ~40–50:

```js
{
  id: 'advice-ph-lockout-flush',
  appliesTo: 'pH Imbalance',
  condition: (ctx) => ctx.phExtracted != null && ctx.phExtracted < 5.5,
  headline: 'Flush with pH-corrected water',
  detail: 'Your runoff read below 5.5 — cations are likely locked out. Run 1.5× pot-volume of pH 6.3 water, then resume normal feeding at half strength.',
  severity: 'alert',  // display alias, not legacy enum
}
```

2–4 advice rules per covered condition. Static strings (don't interpolate ctx into text — coupling through `condition`). Severity uses display enum.

```js
export function generateContextualAdvice(ctx, conditionName);
// Filter ADVICE_RULES by appliesTo === conditionName.
// Evaluate each rule.condition in try/catch — errors to ruleErrors.
// Sort truthy matches by severity (alert > watch > info), stable.
// Take top 5. Return {id, headline, detail, severity, citedObsIds: []}.
// citedObsIds populated by section-10.
// Fallback on zero matches: generic advice item.
```

**3. `js/tests/doctor-engine.test.js`** (new test file)

Register in `js/main.js:298`. Call `__resetForTests()` on every test.

```
# Test: rules-score.js rules have id, appliesTo, condition closure, adjustment number
# Test: rules-score.js appliesTo values are all real Companion conditions from doctor-data.js SCORING
# Test: rules-advice.js rules have id, appliesTo, condition, headline, detail, severity
# Test: adjustScoresFromNotes boosts 'pH Imbalance' when ctx.phExtracted out of 5.5-7.0
# Test: adjustScoresFromNotes boosts 'Overwatering' when ctx.rootHealth === 'suspect'|'rotting'
# Test: adjustScoresFromNotes boosts 'Heat Stress' when ctx.tempExtracted > 28
# Test: adjustScoresFromNotes preserves non-matching scores
# Test: generateContextualAdvice returns top-5 for condition
# Test: generateContextualAdvice falls back to generic when no match
# Test: generateContextualAdvice returns citedObsIds field (empty in this section)
# Test: Rule error isolation — throwing closure → ruleErrors entry, other rules still execute
# Test: buildContext uses store.state.ui.activePlantId when set
# Test: buildContext falls back to plants[0] when activePlantId null
# Test: buildContext fetches observations for ACTIVE plant
# Test: runDiagnosis end-to-end — seeded 'ph was 5.0 runoff, tips burning' → 'pH Imbalance' confidence boosted
# Test: runDiagnosis cross-plant isolation — alert on plantA doesn't affect plantB
# Test: activePlantId persists to localStorage
```

Notes:
- Fixtures inline.
- Companion-condition validity test imports `SCORING` from `js/plant-doctor/doctor-data.js`, asserts every `SCORE_ADJUSTMENTS[i].appliesTo` is in the set.
- Baseline vs. boosted test: run twice (empty notes, seeded notes), confirm confidence strictly higher in seeded case. Don't assert exact number.
- Cross-plant isolation: grow with two plants, seed alert note only on A, set `ui.activePlantId = B.id`, assert B's diagnosis unaffected.

### Modify

**4. `js/plant-doctor/doctor-engine.js`**

Three edits:

**a) `runDiagnosis` — call `adjustScoresFromNotes`:**
```js
import { adjustScoresFromNotes } from '../data/note-contextualizer/index.js';
// ... after SCORING tally loop, before normalization:
if (context && context.ctx) {
  adjustScoresFromNotes(scores, context.ctx);
}
```

**b) `buildContext(store)` — active plant, attach ctx:**
```js
import { getRelevantObservations, mergeNoteContext } from '../data/note-contextualizer/index.js';

const activeId = store.state.ui?.activePlantId ?? null;
const plant = grow?.plants?.find(p => p.id === activeId) ?? grow?.plants?.[0] ?? null;
const observations = plant
  ? getRelevantObservations(store, { plantId: plant.id, since: _daysAgoIso(14) })
  : [];
const ctx = mergeNoteContext(observations);
return {
  medium: profile.medium || null,
  lighting: profile.lighting || null,
  stage: plant?.stage || null,
  experience: profile.experience || null,
  recentLogs: _getRecentLogs(plant),
  plantId: plant?.id || null,
  ctx,
  observations,  // for section-10 citation wiring
};
```

Add `_daysAgoIso(n)` helper: `new Date(Date.now() - n*86400000).toISOString()`.

**c) No new exports.** Keep `setDiagnosticData` unchanged.

**5. `js/plant-doctor/doctor-ui.js`**

Add "Your Action Plan" block after top-conditions list. Call `generateContextualAdvice(context.ctx, topCondition.condition)`. Render each item as:

```
<div class="doctor-advice" data-severity="${item.severity}" data-advice-id="${item.id}">
  <h4>${item.headline}</h4>
  <p>${item.detail}</p>
</div>
```

Use `textContent`/DOM APIs, never raw `innerHTML`. `citedObsIds` placeholder in `data-cited-obs-ids` attribute — section-10 fills.

Skip the block if `ctx` is null (backwards compat).

**6. `js/main.js:36`** (MINIMAL — only 1 line)

Default `activePlantId: null`:
```js
const ui = validateShape('ui', migrate('ui', load('ui') || { sidebarCollapsed: false, activePlantId: null }));
```

No `js/store.js` change. No migration.

**7. `js/views/plant-detail.js`** (MINIMAL)

On mount (top of `renderPlantDetail`):
```js
if (plant && store.state.ui?.activePlantId !== plant.id) {
  store.commit('ui', { ...store.state.ui, activePlantId: plant.id });
}
```

Must fire BEFORE Plant Doctor launch button renders.

**8. Plant Doctor launch handlers**

Grep for `navigate('/plant-doctor')` or equivalent (likely in `plant-detail.js`, `dashboard.js`). Before navigation:
```js
store.commit('ui', { ...store.state.ui, activePlantId: plantId });
navigate('/plant-doctor');
```

If launched from non-plant-scoped context, fall back to `grow.plants[0]?.id`. Don't clear.

## Implementation order (TDD)

1. Write tests first — all fail.
2. Author `rules-score.js`. Shape test → Companion-conditions-valid test → three boost tests.
3. Author `rules-advice.js`. Shape → top-5 → generic-fallback.
4. Wire re-exports from `index.js`.
5. Edit `doctor-engine.js:buildContext` — active plant tests pass.
6. Edit `runDiagnosis` — end-to-end pH test passes.
7. Edit `doctor-ui.js` — render Action Plan. Manual verify.
8. Edit `main.js:36` — persistence test passes.
9. Edit `plant-detail.js` + launch handlers. Manual verify multi-plant.
10. `/test-runner` all pass. Commit `section-05: plant doctor note-awareness + authored rules + activePlantId`.

## Out of scope

- `recordReferencedIn` wiring — section-10.
- Task engine — section-07.
- `doctor-data.js` modifications — source of truth, read only.
- Fixture files in `js/tests/fixtures/` — inline per test.
- Legacy id mapping bridge.
- `activePlantId` migration — absent-slot semantics suffice.
- `vercel --prod` — section-10.

## Manual verification

- `/test-runner` all pass with hard reload.
- Seed two plants. Plant A → Plant Doctor → see A's medium/stage. Plant B → Plant Doctor → see B's.
- Add log note on plant A `ph was 5.0 runoff, tips burning`. Plant Doctor shows `pH Imbalance` in top 3 and an alert-severity advice item about pH flushing.
- Plant B (no notes) shows no pH Imbalance advice — isolation holds.
- Refresh page — `localStorage['growdoc-companion-ui']` contains `activePlantId`.
- No console errors.
