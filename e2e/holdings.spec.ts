import { expect, test } from "@playwright/test";

import { norm, ready } from "./support";

test.beforeEach(async ({ page }) => {
  await page.goto("/holdings");
  await ready(page);
});

test("metal cards: value, P/L, held, fine metal, average cost", async ({ page }) => {
  const cards = norm(await page.locator("main div.grid").first().innerText());
  expect(cards).toContain("Fine silver 621.45 g"); // 622.07 g of .999
  expect(cards).toMatch(/Avg cost \/ g AED [\d,.]+/);
  await expect(page.getByText(/^AED items only/)).toBeVisible(); // the GBP coin is excluded
});

test("defaults to active items; Active + sold shows the sold lot", async ({ page }) => {
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(3);
  await expect(rows.filter({ hasText: "Sold" })).toHaveCount(0);
  expect(page.url()).not.toContain("status=");
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Active + sold" }).click();
  await expect(rows).toHaveCount(4);
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(rows).toHaveCount(3);
});

test("premium over spot under each cost; none without a rate in that currency", async ({ page }) => {
  await expect(page.locator("tr", { hasText: "Gold 24K bar" })).toContainText(/% (over|under) spot/);
  await expect(page.locator("tr", { hasText: "Gold 916 coin" })).not.toContainText("spot"); // GBP: no history
});

test("item names open their purchase", async ({ page }) => {
  await page.locator("table").getByRole("link", { name: "Silver 999 coin" }).click();
  await page.waitForURL(/\/purchases\/[0-9a-f-]{36}$/);
  await expect(page.locator("main h1")).toHaveText("BullionByPost");
});
