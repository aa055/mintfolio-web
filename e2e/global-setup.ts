import fs from "node:fs";

import { chromium, type FullConfig } from "@playwright/test";

import { AUTH_DIR, checkServers, createSeededUser, deleteUser, STATE_FILE, USER_FILE } from "./support";

/** Create the test user and sign in once; every test reuses the session. */
export default async function globalSetup(config: FullConfig) {
  const { baseURL, launchOptions } = config.projects[0].use;
  await checkServers(baseURL!);
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const user = await createSeededUser();
  fs.writeFileSync(USER_FILE, JSON.stringify(user));
  try {
    const browser = await chromium.launch(launchOptions);
    const page = await browser.newPage({ baseURL });
    await page.goto("/login");
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await Promise.all([page.waitForURL("**/dashboard", { timeout: 120_000 }), page.click('button[type="submit"]')]);
    await page.locator("main h1").waitFor({ timeout: 90_000 });
    await page.context().storageState({ path: STATE_FILE });
    await browser.close();
  } catch (err) {
    await deleteUser(user.id); // don't leave the user behind if login fails
    throw err;
  }
}
