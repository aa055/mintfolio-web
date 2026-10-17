import { expect, test } from "@playwright/test";

import { pickTheme, ready } from "./support";

const isDark = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.classList.contains("dark"));
const valueStroke = async (page: import("@playwright/test").Page) =>
  (await page.locator(".recharts-area-curve").first().getAttribute("stroke"))!.replace(/,/g, "").replace(/ +/g, " ");

test("light by default; dark applies live, persists, and recolours charts", async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
  expect(await isDark(page)).toBe(false);
  await expect(page.locator(".recharts-area-curve").first()).toBeVisible();
  expect(await valueStroke(page)).toBe("rgb(95 122 34)");

  await pickTheme(page, "Dark");
  expect(await isDark(page)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(40, 54, 24)");
  await expect.poll(() => valueStroke(page)).toBe("rgb(110 168 36)");

  // Applied before React loads: already set when the HTML has parsed.
  await page.goto("/holdings", { waitUntil: "domcontentloaded" });
  expect(await isDark(page)).toBe(true);
  await ready(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
});

test("System follows the OS live; Light restores", async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
  await pickTheme(page, "System");
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => isDark(page)).toBe(false);
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => isDark(page)).toBe(true);
  await pickTheme(page, "Light");
  expect(await isDark(page)).toBe(false);
});
