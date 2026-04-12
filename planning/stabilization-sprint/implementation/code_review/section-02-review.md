# Code Review: Section 02 - Error Handling

## Medium Issues
1. **XSS sink in error-banner.js**: `innerHTML` interpolates message directly — DOM XSS if future caller passes user-derived data
2. **store.js:300**: Empty catch inside runTests — intentional skip

## Low Issues
3. **5 misleading labels**: task-engine:run-tests (not in tests), router:hash-parse (reads localStorage), photos:save (checks quota), rules-advice:test / rules-score:test (record errors, not tests)
4. **dismissError body paddingTop orphan**: If banner attaches to body then app-shell mounts before dismiss, body paddingTop stays
5. **Section 01 label naming drift**: Plan table used shorter labels than what section-01 actually committed

## Good
- All 8 test assertions implemented
- All 3 triggers wired correctly
- 40+ catch blocks replaced across 22 files
- CSS appended correctly
