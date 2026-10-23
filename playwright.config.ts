import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ADMIN_STATE = "e2e/.auth/admin.json";

/**
 * تست سرتاسری روی build واقعی: اول `npm run build` (و دیتابیس با seed)، بعد `npm run test:e2e`.
 * برای تست‌های ادمین: E2E_ADMIN_PHONE و E2E_ADMIN_PASSWORD (با `npm run admin:create` بساز)؛ بدون آن‌ها آن تست‌ها skip می‌شوند.
 * برای تست روی سرور دیگر: E2E_BASE_URL (در این حالت webServer بالا نمی‌آید).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testDir: "e2e/public", use: { ...devices["Desktop Chrome"] } },
    {
      name: "admin",
      testDir: "e2e/admin",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run start", url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
