# Code Review Interview: Section 02 - Error Handling

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | XSS sink in error-banner.js innerHTML | Medium | Auto-fixed (textContent) |
| 2 | store.js:300 empty catch inside runTests | Medium | Let go (intentional test) |
| 3 | 5 misleading catch-block labels | Low | User chose: Fix labels |
| 4 | dismissError body paddingTop orphan | Low | Let go |
| 5 | Section 01 label naming drift | Low | Let go (already committed) |

## User Interview

**Q: Fix 5 misleading labels to match function context?**
A: User chose "Fix labels"

## Applied Fixes

### Auto-fixes
1. **XSS in error-banner.js**: Replaced `innerHTML` interpolation with `document.createElement` + `textContent` for the message span
2. **Label corrections**:
   - `[task-engine:run-tests]` → `[task-engine:edge-case-suppression]`
   - `[router:hash-parse]` → `[router:profile-check]`
   - `[photos:save]` → `[photos:quota-check]`
   - `[rules-advice:test]` → `[rules-advice:record-error]`
   - `[rules-score:test]` → `[rules-score:record-error]`

### Let go
- store.js:300 catch inside runTests — catching is the test behavior
- dismissError paddingTop orphan — early-boot edge case, unlikely in practice
- Section 01 label drift — already committed with their own names
