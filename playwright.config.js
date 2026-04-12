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
