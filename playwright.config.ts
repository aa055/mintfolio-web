import { defineConfig, devices } from "@playwright/test";

import { loadE2EEnv, STATE_FILE } from "./e2e/support";

loadE2EEnv();

/**
 * End-to-end tests against a running app: start the API (port 8000) and
 * `npm run dev` first, then `npm run test:e2e`. Global setup creates a
 * throwaway Supabase user with sample purchases; teardown deletes it with
 * all its data and files. See e2e/README.md.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // One shared user: run tests one at a time so they can't trip over each other.
  workers: 1,
  fullyParallel: false,
  // The dev server compiles pages on first visit and the database is remote.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    storageState: STATE_FILE,
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : undefined,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
});
