import { expect, test } from "@playwright/test";

import { aed, apiAs, norm, readUser, ready } from "./support";

type History = { points: { day: string; rate_per_gram: string }[] };

test("figures match the price history API", async ({ page }) => {
  const api = await apiAs(readUser());
  const gold = await api<History>("GET", "/prices/history?metal=gold&range=5Y&currency=AED");
  const rates = gold.points.map((p) => Number(p.rate_per_gram));
  const latest = rates[rates.length - 1];
  const lastYear = gold.points
    .filter((p) => Date.parse(p.day) >= Date.parse(gold.points[gold.points.length - 1].day) - 365 * 86_400_000)
    .map((p) => Number(p.rate_per_gram));

  await page.goto("/rates");
  await ready(page);
  const text = norm(await page.locator("main").innerText());
  for (const [label, value] of [
    ["spot", latest],
    ["tola", latest * 11.6638],
    ["troy oz", latest * 31.1035],
    ["22K", (latest * 22) / 24],
    ["21K", (latest * 21) / 24],
    ["52-week high", Math.max(...lastYear)],
    ["52-week low", Math.min(...lastYear)],
  ] as const) {
    expect(text, label).toContain(aed(value));
  }
});

test("metal and range switch instantly and survive reload", async ({ page }) => {
  await page.goto("/rates");
  await ready(page);
  await page.getByRole("group", { name: "Metal" }).getByRole("button", { name: "Silver" }).click();
  await page.getByRole("group", { name: "Chart range" }).getByRole("button", { name: "5Y" }).click();
  await page.waitForURL(/metal=silver.*range=5Y|range=5Y.*metal=silver/);
  await page.reload();
  await expect(page.locator('[role="img"][aria-label^="Silver spot"]')).toBeVisible();
  await expect(page.getByRole("group", { name: "Chart range" }).getByRole("button", { name: "5Y" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Silver rates by purity")).toBeVisible();
  await expect(page.getByText(/^Data: .*GoldAPI\.io/)).toBeVisible();
});
