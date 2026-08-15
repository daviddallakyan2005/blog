import { expect, test } from "@playwright/test";

const shouldRun =
  Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
  process.env.PLAYWRIGHT_WEBSERVER === "1";

test.skip(
  !shouldRun,
  "Set PLAYWRIGHT_BASE_URL or PLAYWRIGHT_WEBSERVER=1 to run public e2e",
);

test("typing helloworld opens the Take a break game hub", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").click();
  await page.keyboard.type("helloworld");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Take a break" }),
  ).toBeVisible();
  await expect(dialog.getByText("2048", { exact: true }).first()).toBeVisible();
  await expect(
    dialog.getByText("Snake", { exact: true }).first(),
  ).toBeVisible();
});
