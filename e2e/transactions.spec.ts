import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { apiAs, norm, readUser, ready } from "./support";

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c50000000049454e44ae426082",
  "hex",
);

test.describe("Transactions page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/transactions");
    await ready(page);
  });

  test("lists every purchase and sale by month with totals", async ({ page }) => {
    await expect(page.locator("main ul > li")).toHaveCount(4);
    await expect(page.locator("main section h2")).toHaveCount(4);
    const totals = norm(await page.getByText(/^Net invested/).locator("..").innerText());
    expect(totals).toContain("Bought AED 20,800.00");
    expect(totals).toContain("Sold AED 5,900.00");
    expect(totals).toContain("Realized +AED 450.00");
    expect(totals).toContain("1 in other currencies not totalled");
  });

  test("filters by type, date, metal and search; state survives reload", async ({ page }) => {
    const rows = page.locator("main ul > li");
    await page.getByRole("group", { name: "Type" }).getByRole("button", { name: "Sales" }).click();
    await expect(rows).toHaveCount(1);
    await page.getByRole("group", { name: "Type" }).getByRole("button", { name: "Purchases" }).click();
    await expect(rows).toHaveCount(3);
    await page.waitForURL(/type=purchase/);
    await page.reload();
    await expect(rows).toHaveCount(3);
    await page.getByRole("button", { name: "Reset" }).click();

    await page.getByRole("combobox", { name: "Metal" }).click();
    await page.getByRole("option", { name: "Silver" }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("BullionByPost");
    await page.getByRole("button", { name: "Reset" }).click();

    await page.getByLabel("Search transactions").fill("souk");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Sell");
  });
});

test.describe("Purchase page", () => {
  test.describe.configure({ mode: "serial" });

  test("shows items, sells and undoes, uploads and removes a receipt", async ({ page }, info) => {
    page.on("dialog", (d) => d.accept()); // undo-sale and delete-receipt confirmations
    await page.goto("/transactions");
    await ready(page);
    await page.locator("main ul > li", { hasText: "Emirates Gold" }).getByRole("link").click();
    await page.waitForURL(/\/purchases\/[0-9a-f-]{36}$/);
    await expect(page.locator("h1 + p")).toContainText("Cash · 2 items · 0 receipts");
    const coin = page.locator("table tbody tr", { hasText: "Gold 22K coin" });
    await expect(coin).toContainText("+AED 450.00");
    await expect(coin.getByRole("button", { name: "Undo sale" })).toBeVisible();

    const bar = page.locator("table tbody tr", { hasText: "Gold 24K bar" });
    await bar.getByRole("button", { name: "Sell" }).click();
    await page.fill("#sale_price", "15000");
    await page.getByRole("button", { name: "Record sale" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await bar.getByRole("button", { name: "Undo sale" }).click();
    await expect(bar.getByRole("button", { name: "Sell" })).toBeVisible();

    const file = path.join(info.outputDir, "receipt.png");
    fs.mkdirSync(info.outputDir, { recursive: true });
    fs.writeFileSync(file, PNG);
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.locator("h1 + p")).toContainText("1 receipt", { timeout: 60_000 });
    const tile = page.locator("main li.group").first();
    await tile.hover();
    await tile.getByRole("button", { name: /Delete/ }).click();
    await expect(page.locator("h1 + p")).toContainText("0 receipts", { timeout: 60_000 });
  });

  test("deleting a purchase removes it and returns to Transactions", async ({ page }) => {
    const api = await apiAs(readUser());
    const me = await api<{ portfolio: { id: string } }>("GET", "/auth/me");
    const created = await api<{ id: string }>("POST", `/portfolios/${me.portfolio.id}/purchases`, {
      purchase_date: "2026-08-01", dealer: "Delete Me Dealer", purchase_currency: "AED", payment_method: "cash",
      items: [{ metal: "silver", purity: "999", weight_value: "10", weight_unit: "g", purchase_price: "70.00" }],
    });
    page.on("dialog", (d) => d.accept());
    await page.goto(`/purchases/${created.id}`);
    await ready(page);
    await page.getByRole("button", { name: "Delete" }).click();
    await page.waitForURL("**/transactions");
    await expect(page.getByText("Delete Me Dealer")).toHaveCount(0);
  });
});
