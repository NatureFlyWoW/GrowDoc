# Section 3: Cultivation Contradiction Resolution

## Overview

Seven data contradictions and one dangerous advice rule exist across the GrowDoc knowledge files. Different files give conflicting numbers for the same cultivation parameter (drying temp, seedling VPD, harvest amber percentage, etc.), and two mites-related rules fire in flower stages where they cause crop loss. This section resolves all 8 issues by updating the authoritative values in every affected file.

**No dependencies.** This section can be implemented in parallel with Section 01.

**Blocks:** Section 04 (Test Coverage Expansion) depends on these data fixes being in place before writing data-consistency tests.

---

## Files To Modify

| File | Contradiction(s) |
|------|-------------------|
| `C:/GrowDoc/js/data/note-contextualizer/rules-advice.js` | #1 mites-raise-rh, #5 epsom timing, #8 mites-spray |
| `C:/GrowDoc/js/data/stage-rules.js` | #2 drying temp |
| `C:/GrowDoc/js/data/knowledge-articles.js` | #2 drying temp, #4 harvest amber, #6 cure burp, #7 late-flower RH |
| `C:/GrowDoc/js/data/stage-content.js` | #3 seedling VPD |
| `C:/GrowDoc/js/data/grow-knowledge.js` | #7 late-flower RH |
| `C:/GrowDoc/js/data/edge-case-knowledge-supplemental.js` | Verify only -- already canonical |

---

## Tests (Write BEFORE Implementing)

### Test Group A: Mites-Raise-RH Stage Filter (Resolution #1)

```js
const rule = ADVICE_RULES.find(r => r.id === 'advice-mites-raise-rh');

// Test: rule does NOT fire when ctx.stage is 'mid-flower'
{ pass: !rule.condition({ rhExtracted: 30, stage: 'mid-flower' }), msg: 'mites-raise-rh suppressed in mid-flower' }

// Test: rule does NOT fire when ctx.stage is 'late-flower'
{ pass: !rule.condition({ rhExtracted: 30, stage: 'late-flower' }), msg: 'mites-raise-rh suppressed in late-flower' }

// Test: rule does NOT fire when ctx.stage is 'ripening'
{ pass: !rule.condition({ rhExtracted: 30, stage: 'ripening' }), msg: 'mites-raise-rh suppressed in ripening' }

// Test: rule fires when ctx.stage is 'seedling'
{ pass: rule.condition({ rhExtracted: 30, stage: 'seedling' }), msg: 'mites-raise-rh fires in seedling' }

// Test: rule fires when ctx.stage is 'early-veg'
{ pass: rule.condition({ rhExtracted: 30, stage: 'early-veg' }), msg: 'mites-raise-rh fires in early-veg' }

// Test: rule fires when ctx.stage is 'late-veg'
{ pass: rule.condition({ rhExtracted: 30, stage: 'late-veg' }), msg: 'mites-raise-rh fires in late-veg' }
```

### Test Group B: Mites-Spray Stage Filter (Resolution #8)

```js
const sprayRule = ADVICE_RULES.find(r => r.id === 'advice-mites-spray');

// Test: rule does NOT fire when ctx.stage is 'mid-flower'
{ pass: !sprayRule.condition({ stage: 'mid-flower' }), msg: 'mites-spray suppressed in mid-flower' }

// Test: rule does NOT fire when ctx.stage is 'late-flower'
{ pass: !sprayRule.condition({ stage: 'late-flower' }), msg: 'mites-spray suppressed in late-flower' }

// Test: rule fires when ctx.stage is 'early-veg'
{ pass: sprayRule.condition({ stage: 'early-veg' }), msg: 'mites-spray fires in early-veg' }
```

### Test Group C: Data Consistency Assertions

```js
// Test: drying temperature -- stage-rules DRYING_TARGETS uses 15-18C optimal
{ pass: DRYING_TARGETS.temp.min === 15 && DRYING_TARGETS.temp.max === 18, msg: 'DRYING_TARGETS temp is 15-18C' }

// Test: seedling VPD -- stage-content seedling whatToDo includes '0.4-0.8'
{ pass: STAGE_CONTENT.seedling.whatToDo.some(s => s.includes('0.4-0.8')), msg: 'seedling VPD is 0.4-0.8 kPa' }

// Test: harvest amber -- knowledge-articles harvest-timing includes '20-30% amber'
const harvestArt = KNOWLEDGE_ARTICLES.find(a => a.id === 'harvest-timing');
{ pass: harvestArt.layer1.includes('20-30% amber') || harvestArt.layer1.includes('20\u201330% amber'), msg: 'harvest amber is 20-30%' }

// Test: epsom foliar timing -- rules-advice epsom rule detail includes 'before lights-on'
const epsomRule = ADVICE_RULES.find(r => r.id === 'advice-mg-def-epsom');
{ pass: epsomRule.detail.includes('before lights-on'), msg: 'epsom foliar says before lights-on' }

// Test: cure burp week 1 -- knowledge-articles curing-protocol includes 3x daily
const cureArt = KNOWLEDGE_ARTICLES.find(a => a.id === 'curing-protocol');
{ pass: cureArt.layer1.includes('three times daily') || cureArt.layer1.includes('3x daily'), msg: 'cure burp week 1 is 3x daily' }

// Test: late-flower RH -- grow-knowledge dayRH for late-flower is 45-50
{ pass: ENVIRONMENT_TARGETS['late-flower'].dayRH.min === 45 && ENVIRONMENT_TARGETS['late-flower'].dayRH.max === 50, msg: 'late-flower dayRH is 45-50' }
```

### Test Group D: Supplemental File Consistency

```js
// Test: epsom entry references 'before lights-on'
const epsomEntry = EDGE_CASE_KNOWLEDGE_SUPPLEMENTAL.find(e => e.id.includes('epsom'));
{ pass: epsomEntry.correctAction.includes('before lights-on'), msg: 'supplemental epsom says before lights-on' }

// Test: harvest/amber entry uses 20-30% range
const fastFlowerEntry = EDGE_CASE_KNOWLEDGE_SUPPLEMENTAL.find(e => e.id === 'fast-flower-strain-standard-harvest-timing-miss');
{ pass: fastFlowerEntry.generalAdvice.includes('20-30%'), msg: 'supplemental harvest amber uses 20-30%' }
```

---

## The 8 Resolutions -- Implementation Details

### Resolution #1: advice-mites-raise-rh (DANGEROUS rule)

**File:** `C:/GrowDoc/js/data/note-contextualizer/rules-advice.js`, lines 342-348

**Current condition:** `(ctx) => _isNum(ctx.rhExtracted) && ctx.rhExtracted < 40`

**Fix:** Add stage filter -- only fire in veg stages:

```js
condition: (ctx) => {
  const vegStages = ['seedling', 'early-veg', 'late-veg'];
  if (ctx.stage && !vegStages.includes(ctx.stage)) return false;
  return _isNum(ctx.rhExtracted) && ctx.rhExtracted < 40;
},
```

When `ctx.stage` is undefined, the rule still fires (deliberate -- the rule is helpful in veg and only dangerous in flower).

### Resolution #2: Drying Temperature

**Canonical:** 15-18C optimal for terpene preservation.

- `js/data/stage-rules.js` line 308: Change `temp: { min: 15, max: 21 }` to `temp: { min: 15, max: 18 }`
- `js/data/knowledge-articles.js` line 382 (drying-protocol): Change `'18-21C'` to `'15-18C'`
- `js/data/knowledge-articles.js` line 449 (terpene-max): Change `'18-21C'` to `'15-18C'`
- `js/data/stage-content.js` line 330: Already says 15-18C. No change needed.

### Resolution #3: Seedling VPD

**Canonical:** 0.4-0.8 kPa.

- `js/data/stage-content.js` line 43: Change `'VPD 0.6-0.9 kPa'` to `'VPD 0.4-0.8 kPa'`
- `js/data/grow-knowledge.js` line 28: Already has `vpdRange: { min: 0.4, max: 0.8 }`. No change needed.

### Resolution #4: Harvest Amber Percentage

**Canonical:** 20-30% amber for balanced effect.

- `js/data/knowledge-articles.js` line 356 (harvest-timing): Change `'10-20% amber for balanced'` to `'20-30% amber for balanced'`. Update heavier sedation from `'20-30%'` to `'30-40%'`.

### Resolution #5: Epsom Foliar Timing

**Canonical:** 30 minutes before lights-on.

- `js/data/note-contextualizer/rules-advice.js` line 293: Change `'spray leaves at lights-off'` to `'spray leaves 30 minutes before lights-on'`
- `js/data/edge-case-knowledge-supplemental.js`: Already says "before lights-on". No change needed.

### Resolution #6: Cure Burp Schedule Week 1

**Canonical:** 3x daily in week 1.

- `js/data/knowledge-articles.js` line 395: Change `'twice daily'` to `'three times daily'` for week 1. Add note about reducing to twice daily in week 2.
- `js/data/stage-content.js` line 369: Already says 3x daily. No change needed.

### Resolution #7: Late-Flower RH

**Canonical:** 45-50% (terpene-safe floor with botrytis protection ceiling).

- `js/data/grow-knowledge.js` line 68: Change `dayRH: { min: 35, max: 45 }` to `dayRH: { min: 45, max: 50 }`. Update `nightRH` to `{ min: 45, max: 50 }` for consistency.
- `js/data/knowledge-articles.js` line 341 (botrytis): Change `'below 45% in late flower'` to `'45-50% in late flower'`
- `js/data/knowledge-articles.js` line 449 (terpene-max): Change `'50-55% RH in final weeks'` to `'45-50% RH in final weeks'`
- `js/data/stage-content.js` line 257: Already says 45-50%. No change needed.

### Resolution #8: advice-mites-spray / Neem (DANGEROUS rule)

**File:** `C:/GrowDoc/js/data/note-contextualizer/rules-advice.js`, lines 350-357

**Current condition:** `_truthy` (always fires)

**Fix:** Add stage filter:

```js
condition: (ctx) => {
  const vegStages = ['seedling', 'early-veg', 'late-veg'];
  return !ctx.stage || vegStages.includes(ctx.stage);
},
```

---

## Additional File: edge-case-knowledge-supplemental.js

After completing the 8 resolutions, verified this file's contents:

1. Epsom timing (lines 433-435): Already says "before lights-on." No change needed.
2. Harvest amber (line 216): Already uses "20-30%." No change needed.
3. Mites/RH (lines 374-376): Already warns against raising RH in flower. No change needed.
4. Neem/transition (lines 405-414): Already says to stop neem before flip. No change needed.

**Result:** `edge-case-knowledge-supplemental.js` requires no changes.

---

## Verification Checklist

1. `advice-mites-raise-rh` returns `false` for `{ rhExtracted: 30, stage: 'mid-flower' }`, `{ rhExtracted: 30, stage: 'late-flower' }`, and `{ rhExtracted: 30, stage: 'ripening' }`
2. `advice-mites-spray` returns `false` for `{ stage: 'mid-flower' }` and `true` for `{ stage: 'early-veg' }`
3. No remaining old/wrong values in `js/data/`: no `18-21C` in drying context, no `0.6-0.9 kPa` for seedling, no `10-20% amber` for balanced, no `lights-off` in epsom context, no `twice daily` for week-1 cure, no `35-45%` for late-flower dayRH
4. Existing tests pass at `/test` route

## Summary

| # | What | Old Value | New Value | File(s) |
|---|------|-----------|-----------|---------|
| 1 | mites-raise-rh | Fires all stages | Veg-only stage filter | rules-advice.js |
| 2 | Drying temp | 15-21C / 18-21C | 15-18C optimal | stage-rules.js, knowledge-articles.js |
| 3 | Seedling VPD | 0.6-0.9 kPa | 0.4-0.8 kPa | stage-content.js |
| 4 | Harvest amber | 10-20% balanced | 20-30% balanced | knowledge-articles.js |
| 5 | Epsom timing | lights-off | before lights-on | rules-advice.js |
| 6 | Cure burp wk1 | twice daily | 3x daily | knowledge-articles.js |
| 7 | Late-flower RH | 35-45% / 50-55% | 45-50% | grow-knowledge.js, knowledge-articles.js |
| 8 | mites-spray/neem | Fires all stages | Veg-only stage filter | rules-advice.js |
