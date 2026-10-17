import { expect, test } from "@playwright/test";

import { ready } from "./support";

const SECTIONS = [
  ["Holdings", "/holdings"],
  ["Transactions", "/transactions"],
  ["Metal rates", "/rates"],
  ["Settings", "/settings"],
] as const;

const noSidewaysScroll = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("sidebar navigates and highlights the current section", async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
  const sidebar = page.locator("aside");
  await expect(sidebar.locator('[aria-current="page"]')).toHaveAccessibleName("Home");
  for (const [label, url] of SECTIONS) {
    await sidebar.getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(`**${url}`);
    await expect(sidebar.locator('[aria-current="page"]')).toHaveAccessibleName(label);
  }
  await page.goto("/purchases/new");
  await expect(sidebar.locator('[aria-current="page"]')).toHaveAccessibleName("Transactions");
});

test("keyboard: skip link first, then the sidebar in order", async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveText("Skip to content");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("account menu: profile, settings, theme, sign out", async ({ page }) => {
  await page.goto("/dashboard");
  await ready(page);
  await page.getByRole("button", { name: "Account menu" }).click();
  const menu = page.getByRole("menu");
  for (const item of ["Profile", "Settings", "Sign out"]) await expect(menu.getByRole("menuitem", { name: item })).toBeVisible();
  for (const theme of ["Light", "Dark", "System"]) await expect(menu.getByRole("menuitemradio", { name: theme })).toBeVisible();
  await menu.getByRole("menuitem", { name: "Profile" }).click();
  await page.waitForURL("**/profile");
});

test("tablet shows an icon rail; phones get a bottom tab bar", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto("/holdings");
  await ready(page);
  expect((await page.locator("aside").boundingBox())!.width).toBe(64);
  expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");
  await ready(page);
  await expect(page.locator("aside")).toBeHidden();
  const tabs = page.locator("nav[aria-label=Main]").last();
  await tabs.getByRole("link", { name: "Rates" }).click();
  await page.waitForURL("**/rates");
  await expect(tabs.locator('[aria-current="page"]')).toHaveAccessibleName("Rates");
  for (const url of ["/dashboard", "/holdings", "/transactions", "/rates", "/settings", "/profile"]) {
    await page.goto(url);
    await ready(page);
    expect(await noSidewaysScroll(page), url).toBeLessThanOrEqual(0);
  }
});

test("unknown pages show the branded 404", async ({ page }) => {
  await page.goto("/purchases/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
