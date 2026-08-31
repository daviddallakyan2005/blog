import { expect, test } from "@playwright/test";

const shouldRun =
  Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
  process.env.PLAYWRIGHT_WEBSERVER === "1";

test.skip(
  !shouldRun,
  "Set PLAYWRIGHT_BASE_URL or PLAYWRIGHT_WEBSERVER=1 to run public e2e",
);

const pages: { path: string; text: RegExp }[] = [
  { path: "/", text: /cv/i },
  { path: "/articles", text: /articles/i },
  { path: "/tags", text: /tags/i },
  { path: "/about", text: /about|blog/i },
  { path: "/projects", text: /projects/i },
  { path: "/search", text: /search/i },
];

for (const pageCase of pages) {
  test(`${pageCase.path} returns 200`, async ({ page }) => {
    const response = await page.goto(pageCase.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(pageCase.text);
  });
}

test("/robots.txt returns 200", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/user-agent|allow|disallow/i);
});

test("/sitemap.xml returns 200", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(await response.text()).toMatch(/urlset|url/i);
});

test("/studio redirects to login", async ({ page }) => {
  const response = await page.goto("/studio");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Studio" })).toBeVisible();
});
