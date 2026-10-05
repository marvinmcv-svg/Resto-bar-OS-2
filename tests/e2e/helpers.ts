import { expect, type Page } from "@playwright/test";

export const STORAGE_KEY = "restobar-demo-v3";
const PINS: Record<string, string> = { Roberto: "0000", Daniela: "1234", Carla: "2222", Ana: "1111", Jorge: "4444", Rosa: "5555", Marvin: "9999" };

/** Edits the persisted demo state (signed out first), then reloads. */
export async function patchState(page: Page, fn: string) {
  // The store saves after its first render; wait for it so the patch never races the seed.
  await page.waitForFunction((key) => localStorage.getItem(key) !== null, STORAGE_KEY);
  await page.evaluate(([key, body]) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const s = JSON.parse(raw);
    s.sessionStaffId = null;
    new Function("s", body)(s);
    localStorage.setItem(key, JSON.stringify(s));
  }, [STORAGE_KEY, fn] as const);
  await page.reload();
}

/**
 * Sign in on /entrar with the person's PIN. If the clock-in step shows up (they aren't clocked in),
 * `clockIn` decides whether to mark entry or skip.
 */
export async function signIn(page: Page, name: string, { fresh = false, clockIn = false } = {}) {
  await page.goto("/entrar");
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  } else {
    await patchState(page, "");
  }
  await page.getByRole("button", { name: new RegExp(`^${name},`) }).click();
  for (const d of PINS[name]) await page.getByRole("button", { name: d, exact: true }).click();
  const skip = page.getByRole("button", { name: "Ahora no" });
  await Promise.race([page.waitForURL((u) => !u.pathname.startsWith("/entrar")), skip.waitFor()]);
  if (await skip.isVisible()) await page.getByRole("button", { name: clockIn ? "Marcar entrada" : "Ahora no" }).click();
  await expect(page).not.toHaveURL(/\/entrar$/);
}

/** "Bs 2.088,00" -> 208800 centavos. */
export function parseBs(text: string): number {
  const m = text.match(/Bs\s*([\d.]+,\d{2})/);
  if (!m) throw new Error(`No Bs amount in "${text}"`);
  return Number(m[1].replace(/\./g, "").replace(",", ""));
}

export function bs(minor: number): string {
  const [w, c] = (minor / 100).toFixed(2).split(".");
  return `Bs ${w.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${c}`;
}
