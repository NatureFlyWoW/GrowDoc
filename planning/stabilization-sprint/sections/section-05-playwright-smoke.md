# Section 5: Playwright Smoke Test

## Overview

This section adds a single Playwright end-to-end smoke test that verifies the GrowDoc app boots correctly. This is a direct response to the production outage where a `DOMContentLoaded` race (caused by top-level `await`) rendered a completely empty page with zero console errors -- only a human opening a browser would notice. The smoke test catches this class of failure automatically.

Playwright is the **one and only** allowed npm devDependency. The project otherwise has zero npm dependencies by design.

## Dependencies

- **Section 1** (Remove Top-Level Awaits): The boot race must be fixed.
- **Section 2** (Error Handling): The smoke test filters console errors from Section 2's labeled catches.
- **Section 4** (Test Coverage): Stable test infrastructure.

## Files to Create or Modify

| File | Action | Purpose |
|------|--------|---------|
| `C:/GrowDoc/playwright.config.js` | **Create** | Playwright config with webServer and BASE_URL |
| `C:/GrowDoc/tests/smoke.spec.js` | **Create** | The smoke test (4 assertions) |
| `C:/GrowDoc/package.json` | **Modify** | Add `@playwright/test` devDep and `test:smoke` script |
| `C:/GrowDoc/.gitignore` | **Modify** | Add `node_modules/`, `test-results/`, `playwright-report/` |
| `C:/GrowDoc/CLAUDE.md` | **Modify** | Document the Playwright exception |

---

## Tests FIRST

Since this section IS the test, the stubs define the implementation:

### tests/smoke.spec.js

**Test 1 -- `__growdocStore` exists:**
- `page.goto('/')`, wait for `window.__growdocStore !== undefined` (timeout 5s)
- Assert `typeof window.__growdocStore === 'object'`
- This is the critical regression guard for the DOMContentLoaded race

**Test 2 -- Sidebar has children:**
- Wait for `#sidebar` to have `childElementCount > 0`
- Proves `renderSidebar()` executed

**Test 3 -- Content has children:**
- Wait for `#content` to have `childElementCount > 0`
- Proves router initialized and rendered a view

**Test 4 -- No unexpected console errors:**
- Collect `console.error` messages and `pageerror` events during load
- Filter out expected non-critical errors (labeled catch blocks from Section 2 using `[module:context]` pattern)
- Only fail on errors containing `"failed to start"`, `"quota"`, or uncaught exceptions

### Regression Guard (Manual Verification)

Documented as a comment in the test file: reintroducing a top-level `await` before `boot()` would cause `__growdocStore` to be undefined, making test 1 fail.

---

## Implementation Details

### 1. playwright.config.js

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 10_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  projects: [
    { name: 'chromium', use: {} },
  ],
  retries: 0,
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npx -y serve . -l 3000',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

- `baseURL` from env `BASE_URL` or default localhost
- `webServer` only activates when `BASE_URL` is NOT set (local testing)
- Single project: chromium only
- `reuseExistingServer: true` for dev convenience

### 2. tests/smoke.spec.js

Key implementation notes per assertion:

- **Test 1:** Use `page.waitForFunction(() => window.__growdocStore !== undefined)` then evaluate type
- **Test 2:** Use `page.waitForFunction(() => document.querySelector('#sidebar')?.childElementCount > 0)`
- **Test 3:** Use `page.waitForFunction(() => document.querySelector('#content')?.childElementCount > 0)`
- **Test 4:** Set up `page.on('console', ...)` and `page.on('pageerror', ...)` before navigating. Filter errors: keep only those with `"failed to start"`, `"quota"`, or uncaught exceptions. Assert filtered list is empty.

### 3. package.json Modifications

Add `devDependencies` and `test:smoke` script:

```json
{
  "devDependencies": {
    "@playwright/test": "^1"
  },
  "scripts": {
    "setup-password": "node scripts/setup-password.js",
    "test:smoke": "playwright test"
  }
}
```

### 4. .gitignore Updates

Add:
- `node_modules/`
- `test-results/`
- `playwright-report/`

### 5. CLAUDE.md Update

Add to Critical Rules section under rule 3:

> **Exception:** Playwright (`@playwright/test`) is the only allowed npm devDependency -- used for smoke testing only. It is not a runtime dependency and does not ship to production.

---

## Setup and Running

```bash
npm install
npx playwright install chromium
npx playwright test                    # local
BASE_URL=https://growdoc.vercel.app npx playwright test  # production
```

No CI pipeline. Manual only.

---

## Verification Checklist

1. `npx playwright test` passes locally with all 4 assertions green
2. `BASE_URL=<production-url> npx playwright test` passes against production
3. Regression validation (manual, one-time): temporarily add a delay before `boot()` registration, confirm test 1 fails
4. `node_modules/` is in `.gitignore`
5. `CLAUDE.md` documents the Playwright exception
6. `package.json` has `@playwright/test` in `devDependencies` (not `dependencies`)
7. `test:smoke` script works via `npm run test:smoke`
