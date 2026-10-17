import fs from "node:fs";

import { AUTH_DIR, deleteUser, readUser, USER_FILE } from "./support";

/** Delete the test user with all its purchases, receipts and photo. */
export default async function globalTeardown() {
  if (!fs.existsSync(USER_FILE)) return;
  await deleteUser(readUser().id);
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
