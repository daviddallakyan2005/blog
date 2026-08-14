import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL,
  },
  webServer:
    process.env.PLAYWRIGHT_WEBSERVER === "1"
      ? {
          command: "pnpm dev",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
});
