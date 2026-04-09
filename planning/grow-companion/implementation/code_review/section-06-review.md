# Section 06: Priority System UI -- Code Review

## Summary

Section 06 delivers two new modules (`js/components/star-rating.js` and `js/data/priority-engine.js`), a comprehensive test file, and a refactor of the onboarding wizard to consume the new reusable component. The implementation is well-structured: the star-rating component has clean DOM construction, solid accessibility markup, and the priority engine contains pure calculation functions with proper weight redistribution. The onboarding refactor correctly replaces inline star rendering with the new component while preserving existing behavior.

Overall quality is good. The separation between UI component and calculation engine is clean. All nine test cases from the section plan are present plus several extras. There is one critical accessibility bug (stale tabindex), one important dead-code issue, and a tradeoff-note text bug. The Priority Display Widget called for in the plan is absent.

---

## Findings

### Critical

**C1. Stale tabindex after rating changes -- broken keyboard navigation**
File: `C:/GrowDoc/js/components/star-rating.js`, line 63

The `tabindex` attribute is set once during star creation (`i === currentValue ? '0' : '-1'`) but is never updated in `updateStars()`. After the user clicks or arrow-keys to a new rating, the roving tabindex remains on the original star. This means:
- Tab into the widget focuses the wrong star (the initial one, not the current one).
- After clicking star 5 when starting at 3, pressing Tab leaves the radiogroup but re-entering still focuses star 3.

The fix: update tabindex for every star inside `updateStars()`:
```javascript
stars[i].setAttribute('tabindex', starNum === currentValue ? '0' : '-1');
```
This should be added alongside the existing `aria-checked` update in the `updateStars` loop. Additionally, when `currentValue` is 0 (all deselected), no star has `tabindex="0"`, making the widget unreachable by keyboard. Star 1 should receive `tabindex="0"` as a fallback when value is 0.

---

### Important

**I1. Duplicate EFFECT_TYPES constant -- dead code in onboarding.js**
Files: `C:/GrowDoc/js/views/onboarding.js` line 49, `C:/GrowDoc/js/components/star-rating.js` line 3

The refactor removed the inline effect-selector construction from onboarding.js and replaced it with `renderEffectSelector` from star-rating.js. However, the local `const EFFECT_TYPES = [...]` on line 49 of onboarding.js was left behind. It is now unused dead code. The canonical copy is in star-rating.js (exported on line 161). The leftover declaration should be removed to avoid confusion about which list is authoritative -- if someone later edits the onboarding copy thinking it controls the dropdown, nothing will change.

**I2. Tradeoff note text has a logic error in the "benefits" clause**
File: `C:/GrowDoc/js/data/priority-engine.js`, line 150

The tradeoff note generation reads:
```javascript
`Higher DLI benefits ${lowLabel === 'Yield' ? 'yield' : highDim} but may reduce ${lowDim}...`
```

The intent is "Higher DLI benefits [the dimension that wants higher DLI]", which is `highDim` (the dimension with the higher optimal). But the ternary checks `lowLabel === 'Yield'` and substitutes `'yield'` (lowercase) when true, and falls through to `highDim` otherwise. This creates confusing outputs:

- When yield is the high dimension: `lowLabel` could be 'Terpenes', so the condition is false, and it prints `highDim` = 'yield'. This happens to be correct by accident.
- When yield is the low dimension (highDim = 'quality' or 'terpenes'): `lowLabel` = 'Yield', condition is true, and it prints 'yield' -- which is **wrong**, because yield wants *less* DLI in this scenario, not more.

The line should simply use `highDim` (or its capitalized form) without the ternary.

**I3. `name` parameter is destructured but never used**
File: `C:/GrowDoc/js/components/star-rating.js`, line 14

`renderStarRating` destructures `name` from options but never references it in the DOM or logic. It is not set as a `data-` attribute, not used for unique IDs, and not passed to the stars. This means if multiple star-rating instances exist on the same page, there is no programmatic way to distinguish them in the DOM (e.g., for automated testing or external access). Either remove `name` from the destructuring to avoid dead variables, or use it (e.g., `group.dataset.priority = name`).

**I4. `medium` parameter accepted but never used in getRecommendation**
File: `C:/GrowDoc/js/data/priority-engine.js`, line 70

The `getRecommendation(param, stage, medium, priorities)` function accepts `medium` as its third argument, and the section plan signature includes it. However, the current DLI and temp_dif implementations never reference `medium`. The test file passes `'soil'` and `null` for it. This is acceptable if medium-specific logic is planned for a later section, but it should be documented with a comment (e.g., `// medium: reserved for section 08 nutrient integration`) so future readers know the unused parameter is intentional.

**I5. `select.id = 'effect-type'` creates duplicate IDs when multiple instances exist**
File: `C:/GrowDoc/js/components/star-rating.js`, line 129

The `renderEffectSelector` function hardcodes `select.id = 'effect-type'` and the label uses `for='effect-type'`. If `renderEffectSelector` is ever called more than once on the same page (e.g., onboarding + settings, as the section plan mentions), there will be duplicate element IDs in the DOM, which is invalid HTML and can cause accessibility label association to break. Consider generating a unique ID per instance (e.g., `effect-type-${Date.now()}` or accepting an `id` option).

---

### Minor

**M1. Arrow key navigation does not handle the value=0 state gracefully**
File: `C:/GrowDoc/js/components/star-rating.js`, lines 75-83

When `currentValue` is 0 (fully deselected via toggle), pressing ArrowLeft sets `prev = Math.max(1, 0 - 1) = 1` which is fine -- it re-selects star 1. But pressing ArrowRight sets `next = Math.min(5, 0 + 1) = 1` which also selects star 1. Both directions do the same thing at value 0. This is a minor UX inconsistency -- not a bug per se, since ArrowRight "increasing" from 0 to 1 makes sense. But the focus call `stars[next - 1].focus()` works because `stars[0]` exists. Worth a comment at minimum.

**M2. `setValue` on the returned instance does not fire onChange**
File: `C:/GrowDoc/js/components/star-rating.js`, line 105

The returned API includes `setValue: (v) => { currentValue = v; updateStars(); }` which updates visuals but does **not** call `onChange`. This asymmetry (click triggers onChange, programmatic setValue does not) could surprise callers who use `setValue` expecting the callback. Document this behavior or add an optional `silent` parameter.

**M3. No test for keyboard navigation**
File: `C:/GrowDoc/js/tests/priority-system.test.js`

The test file covers click interaction, toggle deselect, and onChange callbacks, but keyboard navigation (ArrowRight/ArrowLeft/Enter/Space) is not tested. Given that full keyboard support is a section plan requirement and there is a tabindex bug (C1), adding at least one keyboard nav test would catch regressions.

**M4. No test for tradeoff note content**
File: `C:/GrowDoc/js/tests/priority-system.test.js`

The DLI and temp_dif recommendation tests verify that `value > 0` and ranges are sensible, but neither test checks whether `tradeoffNote` is returned (or not) for specific priority combinations. The section plan explicitly describes tradeoff note generation rules. A test that sets up yield=5/terpenes=5 for mid-flower and asserts that `tradeoffNote` is a non-null string (or checks a substring) would validate the tradeoff logic, which has a bug (I2).

**M5. Magic number 5 in DLI tradeoff threshold**
File: `C:/GrowDoc/js/data/priority-engine.js`, line 145

The `maxDiff <= 5` threshold for generating tradeoff notes is a magic number. This DLI difference threshold should be a named constant (e.g., `const DLI_TRADEOFF_THRESHOLD = 5`) for clarity and maintainability.

**M6. `_wizardState.targetEffect = null` set redundantly in onboarding onChange**
File: `C:/GrowDoc/js/views/onboarding.js`, lines 498-499

When the Effect rating drops below 3, the onChange handler calls `effectSelector.hide()` **and** separately sets `_wizardState.targetEffect = null`. But `effectSelector.hide()` already fires its own onChange callback which sets `_wizardState.targetEffect = null` (via the wired onChange on line 511). The explicit null assignment on line 499 is harmless but redundant.

---

## Missing Items

**Priority Display Widget (section plan item 11)**

The section plan describes a "Priority Display Widget" -- a compact read-only visualization showing the current priority balance with four colored horizontal bars (or labeled star counts) and an explainer text. This widget is meant for use in settings and optionally on the dashboard. It is not present in the diff. The implementation checklist item 11 ("Create priority display widget") is not covered.

This widget is likely needed by section 09 (Dashboard), so it could be deferred, but it should be explicitly tracked as incomplete for section 06 or moved to a later section's scope.

---

## Test Coverage Assessment

| Plan Test Case | Covered | Notes |
|---|---|---|
| Click sets rating | Yes | Tests star click and getValue |
| Toggle deselect | Yes | Tests N-1 toggle and 1->0 edge |
| Store update (onChange fires) | Yes | Tests onChange callback sequence |
| Effect type show (>= 3) | Yes | Tests visible=true rendering |
| Effect type hide (< 3) | Yes | Tests visible=false, show(), hide(), and clear-on-hide |
| Equal stars = equal weights | Yes | All four dimensions checked |
| All-zero handling | Yes | Checks fallback to 0.25 |
| Weights sum to 1.0 | Yes | Asymmetric input verified |
| Dominant weight | Yes | 5/8 = 0.625 verified |
| blendTarget redistribution | Yes (extra) | Not in plan, but good addition |
| getRecommendation DLI | Yes (extra) | Not in plan, but validates integration |
| getRecommendation temp_dif | Yes (extra) | Not in plan, but validates integration |
| Unknown param | Yes (extra) | Good defensive test |
| Keyboard navigation | No | Plan requires it; not tested |
| Tradeoff note content | No | Plan describes rules; not validated |

Test count: 27 assertions across 13 test blocks. All plan-required test cases are present as test blocks. Two notable gaps are keyboard interaction and tradeoff note validation.
