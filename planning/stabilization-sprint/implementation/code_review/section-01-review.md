# Code Review: Section 01 - Remove Top-Level Awaits

Overall the core refactor is correct and matches the plan closely. The four files (main.js, timeline-bar.js, task-engine.js, doctor-ui.js) all have the top-level await replaced with the memoized _getEngine + fire-and-forget pattern exactly as specified.

## Issues Found

### 1. Stale Comment in main.js (Low-Medium)
Line 258 still references a "top-level await import" that no longer exists. Should be updated.

### 2. Missing Planned Tests (Medium)
- main.js: Missing tests for getActiveEdgeCases returning array (not Promise) and returning [] when engine not ready
- doctor-ui.js: Missing applyDoctorSuppression null-engine test

### 3. Flaky Test in lazy-loader.test.js (Medium)
Uses hardcoded setTimeout(200ms) to wait for engine load. Classic flaky pattern.

### 4. lazy-loader.test.js "without engine" test (Low)
Doesn't verify the fallback path was actually taken vs engine path.

### 5. renderStageDetail null safety test (Low)
Passes plant:null which may throw for unrelated reasons.

### 6. No grep verification test (Low)
Plan's grep pattern too broad — matches valid await imports inside functions. Not a bug.

### 7. No trailing .catch on fire-and-forget (Low)
If .then callback throws, rejection is unhandled. Minor since callbacks are trivial.

## What Looks Good
- All 4 files correctly use identical lazy-loader pattern
- Error labels follow [module:context] convention
- getActiveEdgeCases remains sync with () => [] default
- readyState guard preserved
- Fallback blocks preserved and activate correctly
- Test registration correct
- Memoization tests verify same Promise reference
