import { test, expect } from '@playwright/test';

// Regression guard: reintroducing a top-level `await` before boot()
// registration would cause __growdocStore to remain undefined, failing test 1.

test.describe('GrowDoc smoke test', () => {
  let consoleErrors = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    pageErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });
    await page.goto('/');
  });

  test('store exists after boot', async ({ page }) => {
    await page.waitForFunction(() => window.__growdocStore !== undefined, null, { timeout: 5000 });
    const storeType = await page.evaluate(() => typeof window.__growdocStore);
    expect(storeType).toBe('object');
  });

  test('sidebar has children', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelector('#sidebar')?.childElementCount > 0,
      null,
      { timeout: 5000 }
    );
    const count = await page.evaluate(() => document.querySelector('#sidebar').childElementCount);
    expect(count).toBeGreaterThan(0);
  });

  test('content has children', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelector('#content')?.childElementCount > 0,
      null,
      { timeout: 5000 }
    );
    const count = await page.evaluate(() => document.querySelector('#content').childElementCount);
    expect(count).toBeGreaterThan(0);
  });

  test('no unexpected console errors', async ({ page }) => {
    await page.waitForFunction(() => window.__growdocStore !== undefined, null, { timeout: 5000 });
    const critical = [...consoleErrors, ...pageErrors].filter(msg => {
      if (/\[\w+[:-]\w+\]/.test(msg)) return false;
      return /failed to start|quota|Uncaught|TypeError|ReferenceError/i.test(msg);
    });
    expect(critical).toEqual([]);
  });
});
