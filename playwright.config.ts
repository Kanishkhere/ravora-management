import { defineConfig, devices } from "@playwright/test";

const hasLocalCredentials =
  Boolean(process.env.E2E_STAFF_EMAIL) &&
  Boolean(process.env.E2E_STAFF_PASSWORD);

const e2ePort = process.env.PLAYWRIGHT_PORT ?? "3099";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : hasLocalCredentials
      ? {
          command: `npm run build && npm run start -- -p ${e2ePort}`,
          url: baseURL,
          reuseExistingServer: false,
          timeout: 120_000,
        }
      : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
