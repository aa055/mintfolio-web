import { expect, test } from "@playwright/test";

import { norm, ready, TEST_NAME } from "./support";

test.beforeEach(async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
});

test("greets by the name given at signup", async ({ page }) => {
  const first = TEST_NAME.split(" ")[0];
  await expect(page.locator("main h1")).toHaveText(new RegExp(`^Good (morning|afternoon|evening), ${first}\\.$`));
});

test("rate cards and values are labelled as spot", async ({ page }) => {
  const cards = page.locator('main a[href="/rates"]');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toContainText("Gold 24K spot");
  await expect(page.getByText(/Spot rates · .* dealer prices add a premium/)).toBeVisible();
  await expect(page.getByText("Valued daily at spot rates")).toBeVisible();
});

test("chart's last point equals the Current value tile", async ({ page }) => {
  const tile = norm(await page.getByText("Current value", { exact: true }).locator("xpath=..").innerText());
  const value = tile.match(/AED [\d,]+\.\d{2}/)![0];
  const label = norm((await page.locator('[role="img"][aria-label^="Portfolio value"]').getAttribute("aria-label"))!);
  expect(label.match(/to (AED [\d,]+\.\d{2}), invested/)![1]).toBe(value);
});

test("range chips re-slice the chart", async ({ page }) => {
  const gain = page.getByText(/^Gain over/);
  const before = norm(await gain.innerText());
  await page.getByRole("group", { name: "Chart range" }).getByRole("button", { name: "1M" }).click();
  await expect(gain).toContainText("the last month");
  expect(norm(await gain.innerText())).not.toBe(before);
});

test("recent transactions filter by window and open the purchase", async ({ page }) => {
  const card = page.locator("h2", { hasText: "Recent transactions" }).locator("xpath=ancestor::div[contains(@class,'flex-col')][1]");
  const rows = card.locator("ul > li");
  const window = card.getByRole("group", { name: "Time window" });
  await window.getByRole("button", { name: "7D" }).click();
  await expect(rows).toHaveCount(1); // today's sale
  await window.getByRole("button", { name: "All" }).click();
  await expect(rows).toHaveCount(4); // 3 purchases + 1 sale
  await rows.filter({ hasText: "Gold 22K coin" }).getByRole("link").click();
  await page.waitForURL(/\/purchases\/[0-9a-f-]{36}$/);
  await expect(page.locator("main h1")).toHaveText("Emirates Gold");
});
