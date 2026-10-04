import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    // Optional override for machines with a preinstalled Chromium of a different version.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: { command: "pnpm build && pnpm start", url: "http://localhost:3000", reuseExistingServer: true, timeout: 180_000 },
});
