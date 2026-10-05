import { expect, type Page } from "@playwright/test";

const PINS: Record<string, string> = { Roberto: "0000", Daniela: "1234", Carla: "2222", Ana: "1111", Jorge: "4444", Rosa: "5555", Marvin: "9999" };

/** Fresh demo + sign in on /entrar with the person's PIN. */
export async function signIn(page: Page, name: string, { fresh = false } = {}) {
  await page.goto("/entrar");
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  } else {
    // Sign out if someone is signed in.
    await page.evaluate(() => {
      const raw = localStorage.getItem("restobar-demo-v2");
      if (!raw) return;
      const s = JSON.parse(raw);
      s.sessionStaffId = null;
      localStorage.setItem("restobar-demo-v2", JSON.stringify(s));
    });
    await page.reload();
  }
  await page.getByRole("button", { name: new RegExp(`^${name},`) }).click();
  for (const d of PINS[name]) await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page).not.toHaveURL(/\/entrar$/);
}
