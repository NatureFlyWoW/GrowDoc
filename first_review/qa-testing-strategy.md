# Recommended Testing Strategy

## Current State

All tests run in-browser at `/test-runner` via `js/main.js:renderTestRunner()`. There is no CI, no headless runner, no npm test script. The project has zero npm dependencies by design (vanilla JS, no bundler). This is both a constraint and a reasonable baseline given the architecture.

## Immediate Fixes (No New Infrastructure)

1. **Add `pattern-tracker` to `main.js:396` module list.** It exports the correct `{pass,msg}[]` format and is ready to run. One-line change.

2. **Convert `edge-case-engine.runTests()` to `{pass,msg}[]` format.** Replace the throw-on-fail `assert` at `js/data/edge-case-engine.js:566` with the push-result pattern used everywhere else. Add the module to the runner list.

3. **Make the fixture fetch non-fatal.** In `note-contextualizer-rules.test.js:20-24`, if `fetch` fails, push a skip notice (`pass: true, msg: 'fixture skipped (offline)'`) rather than `pass: false`. Prevents false CI failures when running outside `vercel dev`.

## CI Integration

The simplest viable approach given no npm dependencies and Vercel hosting:

- Add a **Vercel build check**: create `scripts/run-tests-headless.js` using Node's built-in `--experimental-vm-modules` to import ES modules and call `runTests()` on pure-function modules (utils, store, storage, router, all `tests/*.test.js` files that do not touch `document`).
- DOM-dependent tests (sidebar, onboarding, dashboard, severity-chip, UI tests) require a browser. Use **Playwright** as a single dev-dependency (`npm install -D playwright`) to drive `/test-runner` in headless Chromium and assert the final summary line contains `ALL TESTS PASSED`.
- Wire this as a GitHub Actions workflow on push to `main`. Trigger: `vercel deploy --prebuilt` already runs; add a post-deploy smoke step calling `vercel curl /test-runner` and scraping the pass/fail count.

## What to Test First (Priority Order)

1. `api/_lib/auth.js` — authentication is the highest-risk untested path (pure Node, no DOM, easy to unit-test).
2. `api/save.js` — SHA conflict path and filename validation; mock the GitHub client.
3. `js/components/log-form.js` — every note enters through here; DOM test, add to runner.
4. `js/views/plant-detail.js` — regression fence for the async/await crash class (`fix: dashboard crashed because generateTasks became async`, `fix: top-level await race lost DOMContentLoaded`).
5. `js/data/calculators.js` — pure functions, trivial to add.

## Preventing the Async/Await Regression Class

The two recent fixes (`c5837da`, `da460dd`) both trace to code that `await`-ed inside a synchronous render path or raced against `DOMContentLoaded`. The pattern to prevent recurrence:

- Any function called from a DOM event handler or render path must be synchronous OR the caller must `await` it. Add an assertion in `task-engine.test.js` that `generateTasks()` returns a Promise (already tested as async), and add a DOM-integration test that confirms the dashboard renders without an empty task list after a store commit — this would have caught both regressions.
- Document the async contract in `CLAUDE/conventions.md`: "render functions are synchronous; async work must complete before `renderView()` is called."
