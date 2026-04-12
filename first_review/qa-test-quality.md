# Test Quality Assessment

## Strengths

The test suite has several genuinely good patterns:

- **Behavioral, not structural.** Most tests assert observable outcomes (task count, DOM content, recommendation type) rather than implementation internals. The `task-engine.test.js` S07 cases are exemplary: they construct minimal observations and assert exact suppression behavior.
- **`__resetForTests()` discipline.** The note-contextualizer singleton is explicitly reset before and after test groups. Without this, shared mutable state would cause test-order dependencies.
- **Fixture-driven rules testing.** `note-contextualizer-rules.test.js` loads `fixtures/note-context-legacy.json` via `fetch()`. This is a correct approach for regex-heavy rule coverage, but it creates a **runtime network dependency** — the fixture fetch will fail if run outside `vercel dev`. There is no fallback if the fetch returns 404, causing the entire rules test group to fail with a single `assert(false, 'fixture load failed')`.
- **Half-life decay math pinned.** `note-contextualizer-merge.test.js` uses a fixed clock (`NOW = Date.UTC(2026, 3, 11, 12, 0, 0)`) to make weighting tests deterministic. This is correct and should be the pattern for all time-sensitive tests.

## Problems

**1. `edge-case-engine.runTests()` uses throw-on-fail, not `{pass,msg}[]`.**
`js/data/edge-case-engine.js:566-570` — the local `assert` function throws on failure. The test runner at `js/main.js:450` catches the exception and counts it as 1 failure regardless of which test failed. All 7 tests inside are invisible to the runner. This is a format incompatibility, not a logic bug, but it means edge-case suppression (bud rot, hermie, autoflower guards) has zero visible test signal.

**2. `dashboard.runTests()` at `js/views/dashboard.js:504` has only 7 assertions for a complex view.**
The status banner color test (`banner.dataset.status === 'green' || banner.classList.contains('status-green')`) uses an OR condition that will pass even if one branch is missing. This masks a real implementation inconsistency.

**3. `vercel-config.test.js` skips silently in production.**
`js/tests/vercel-config.test.js:15` — if the content-type is not JSON, it pushes a hardcoded `pass: true` result and returns. The test always passes in the environment where it most matters. There is no way to distinguish "test ran and passed" from "test was skipped."

**4. `debounce` test at `js/utils.js:107` only checks `typeof`.**
`assert(typeof debounce(() => {}, 100) === 'function')` passes regardless of whether debounce actually delays invocation. The actual debounce behavior is untested.

**5. VPD widget and feeding calculator tests lack boundary cases.**
Both test only the happy path. There are no tests for `calculateVPD` with 0% RH, 100% RH, or negative temperatures, nor for `getFeedingSchedule` with an unrecognized stage (which would return `null` and crash a caller that doesn't guard).

**6. `pattern-tracker.runTests()` is not in the runner module list.**
`js/data/pattern-tracker.js:79` — the module exports a conformant `runTests()` returning `{pass,msg}[]` but is absent from `js/main.js:396-423`. Learned-interval logic (used to adapt watering schedules) is silently excluded from every test run.
