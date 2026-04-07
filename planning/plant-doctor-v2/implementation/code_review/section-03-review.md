# Code Review: Section 03 — Scoring Engine

## Summary
Implementation faithfully follows the section plan's algorithm specification. All four functions (`scoreDiagnoses`, `getRefineQuestions`, `applyRefineAnswer`, `generateCombinedPlan`) match the documented algorithms step-by-step. Tests are comprehensive.

## Findings

### [minor] scoreDiagnoses — no guard on SCORING global
- **Location:** `scoreDiagnoses()`, top of function
- **Issue:** If `SCORING` or `SYMPTOMS` are undefined (data file not loaded), the function will throw. The tests guard with `dataFileLoaded()` but the function itself doesn't.
- **Suggestion:** This is acceptable — the calling code (Section 05) only invokes scoring after `dataFileLoaded()` returns true. No change needed.

### [nitpick] Variable name shadowing in tests
- **Location:** Test section, multiple `var` declarations
- **Issue:** Several test variables use similar names (`si`, `ci`, `ai`) that could shadow outer scope in strict mode. However, since this is vanilla JS without strict mode, and tests run in a single function scope, this is harmless.
- **Suggestion:** Let go — consistent with existing test style.

### [minor] generateCombinedPlan — TREE[diag.resultId] lookup
- **Location:** `generateCombinedPlan()`, line checking `isResult(treeNode)`
- **Issue:** The function correctly guards against missing/non-result TREE nodes. This is good — handles edge cases where scoring might return IDs not in TREE.
- **Suggestion:** No change needed — properly handled.

## Verdict
PASS — Implementation matches plan exactly. No bugs found. Edge cases handled correctly.
