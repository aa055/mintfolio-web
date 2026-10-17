import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { ready } from "./support";

const PAGES = ["/dashboard", "/holdings", "/transactions", "/rates", "/settings", "/profile", "/purchases/new"];

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
      await page.evaluate((t) => localStorage.setItem("mintfolio-theme", t), theme);
    });
    test.afterEach(async ({ page }) => {
      await page.evaluate(() => localStorage.removeItem("mintfolio-theme"));
    });

    for (const url of PAGES) {
      test(`${url} has no WCAG 2.1 A/AA violations`, async ({ page }) => {
        await page.goto(url);
        await ready(page);
        await page.waitForTimeout(800); // charts and fonts settle
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
          .analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
        expect(summary, summary.join("\n")).toEqual([]);
      });
    }
  });
}
