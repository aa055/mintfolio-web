import fs from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { norm, ready, TEST_NAME } from "./support";

// These change shared profile settings, so they run in order and put them back.
test.describe.configure({ mode: "serial" });

const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c50000000049454e44ae426082",
  "hex",
);

async function menuText(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  const text = norm(await page.getByRole("menu").innerText());
  await page.keyboard.press("Escape");
  return text;
}

test("signup asks for a name", async ({ browser }) => {
  const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await anon.newPage();
  await page.goto("/signup");
  await expect(page.locator('input[name="name"]')).toHaveAttribute("required", "");
  await anon.close();
});

test("profile shows account details; photo uploads and removes", async ({ page }, info) => {
  await page.goto("/profile");
  await ready(page);
  await expect(page.locator("#display_name")).toHaveValue(TEST_NAME);
  await expect(page.getByText("Email and password")).toBeVisible();

  const file = path.join(info.outputDir, "photo.png");
  fs.mkdirSync(info.outputDir, { recursive: true });
  fs.writeFileSync(file, PNG);
  await page.getByLabel("Choose a profile photo").setInputFiles(file);
  await expect(page.getByText("Preview — save to use this photo.")).toBeVisible();
  await page.getByRole("button", { name: "Save photo" }).click();
  await expect(page.getByText("Photo updated")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("header").getByRole("button", { name: "Account menu" }).locator("img"))
    .toHaveAttribute("src", /\/storage\/v1\/object\/sign\/avatars\//);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Photo removed")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("header").getByRole("button", { name: "Account menu" }).locator("img")).toHaveCount(0);
});

test("a name changed on Profile shows in the menu", async ({ page }) => {
  await page.goto("/profile");
  await ready(page);
  await page.fill("#display_name", "Layla R.");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect.poll(() => menuText(page), { timeout: 20_000 }).toContain("Layla R.");
  // put it back
  await page.fill("#display_name", TEST_NAME);
  await page.getByRole("button", { name: "Save name" }).click();
  await expect.poll(() => menuText(page), { timeout: 20_000 }).toContain(TEST_NAME);
});

test("weight unit: tola everywhere, then back to grams", async ({ page }) => {
  const setUnit = async (label: string) => {
    await page.goto("/settings");
    await ready(page);
    await page.getByRole("combobox", { name: "Weight unit" }).click();
    await page.getByRole("option", { name: label }).click();
    await page.getByRole("button", { name: "Save preferences" }).click();
    await expect(page.locator("form", { hasText: "Preferences" }).getByText("Saved")).toBeVisible();
  };
  await setUnit("Tola (11.66 g)");
  await page.goto("/holdings");
  await ready(page);
  const holdings = norm(await page.locator("main").innerText());
  expect(holdings).toContain("2.667 tola"); // 1 oz bar = 31.1035 g
  expect(holdings).toContain("Avg cost / tola");
  await page.goto("/dashboard");
  await ready(page);
  await expect(page.getByText("Current value", { exact: true }).locator("xpath=..")).toContainText("tola");
  await setUnit("Grams (g)");
});
