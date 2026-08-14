import { expect, test } from "@playwright/test";

const storageState = process.env.E2E_OWNER_STORAGE_STATE;
const hasOwnerCreds = Boolean(
  storageState ||
    (process.env.E2E_OWNER_EMAIL && process.env.E2E_OWNER_PASSWORD),
);

test.describe("studio", () => {
  test.skip(
    !hasOwnerCreds,
    "No E2E_OWNER credentials — GitHub OAuth is not automated here",
  );

  test.describe("publish flow", () => {
    test.skip(
      !storageState,
      "Real publish e2e needs E2E_OWNER_STORAGE_STATE from a logged-in owner",
    );

    test.use({ storageState: storageState ?? undefined });

    test("owner can open studio", async ({ page }) => {
      const response = await page.goto("/studio");
      expect(response?.status()).toBe(200);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: /dashboard/i }),
      ).toBeVisible();
    });
  });
});
