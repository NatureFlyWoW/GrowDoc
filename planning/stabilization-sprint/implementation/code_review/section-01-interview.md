# Code Review Interview: Section 01 - Remove Top-Level Awaits

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Stale comment referencing removed top-level await | Low-Med | Auto-fixed |
| 2 | Missing getActiveEdgeCases sync + applyDoctorSuppression tests | Medium | User chose: Add now |
| 3 | Flaky setTimeout(200) in lazy-loader.test.js | Medium | Auto-fixed |
| 4 | "without engine" test doesn't verify fallback path | Low | Let go |
| 5 | renderStageDetail test passes null plant | Low | Auto-fixed |
| 6 | Plan's grep verification too broad | Low | Let go |
| 7 | No trailing .catch on fire-and-forget chains | Low | Auto-fixed |

## User Interview

**Q: Missing test categories — add now or defer to Section 04?**
A: User chose "Add now"

## Applied Fixes

### Auto-fixes
1. **Stale comment** (main.js): Removed reference to nonexistent top-level await in DOMContentLoaded guard comment
2. **Flaky setTimeout** (lazy-loader.test.js): Removed setTimeout(200) hack. Tests now call generateTasks twice sequentially — both exercise the same code path since the fallback block handles null engine.
3. **renderStageDetail null** (timeline-bar.js): Changed `{ plant: null, grow: null }` to `{ plant: { id: 't', stage: 'seedling', logs: [] }, grow: {} }` — targets edge-case null-safety specifically
4. **Trailing .catch** (all 4 files): Added `.catch(() => {})` to fire-and-forget `.then()` chains to prevent unhandled rejection if callback throws

### User-requested fixes
5. **getActiveEdgeCases sync tests** (lazy-loader.test.js): Added `export { getActiveEdgeCases }` to main.js. Test imports it and verifies `!(result instanceof Promise)` and `Array.isArray(result)`
6. **applyDoctorSuppression test** (doctor-ui.js): Added `runTests()` export with null-plant passthrough test. Registered in test runner.

### Let go
- #4: Both engine-loaded and fallback paths return arrays — test still validates the public contract
- #6: Plan's grep pattern matches valid `await import` inside functions; implementation correctly removed only top-level awaits
