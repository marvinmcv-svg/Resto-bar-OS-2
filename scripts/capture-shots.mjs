// Captures real screens of the running app for the landing page and the demo video.
// Usage: BASE=http://localhost:3000 node scripts/capture-shots.mjs  (PW_CHROMIUM_PATH optional)
import { chromium } from "@playwright/test";
import { copyFileSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "public/landing";
mkdirSync(OUT, { recursive: true });

const PINS = { Roberto: "0000", Daniela: "1234", Ana: "1111", Jorge: "4444", Rosa: "5555", Marvin: "9999" };
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });

async function session(who, { width = 1440, height = 900, scale = 2 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: new RegExp(`^${who},`) }).click();
  await page.keyboard.type(PINS[who]);
  await page.waitForURL((u) => !u.pathname.startsWith("/entrar"));
  await settle(page);
  return { ctx, page };
}

async function settle(page) {
  // Hide the Next dev indicator and toasts; let entrance animations finish and photos load.
  await page.addStyleTag({ content: "nextjs-portal,[data-sonner-toaster]{display:none!important}" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);
}

async function shot(page, name, opts = {}) {
  await settle(page);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 84, ...opts });
  console.log("saved", name);
}

// Sign-in
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/entrar`);
  await shot(page, "entrar");
  await ctx.close();
}

// Waiter: floor plan and order screen with an upsell
{
  const { ctx, page } = await session("Ana");
  await page.getByRole("button", { name: "Entendido" }).click();
  await shot(page, "floor");
  await page.goto(`${BASE}/pos/mesa/m2`);
  await shot(page, "order");
  await ctx.close();
}

// Waiter on a phone
{
  const { ctx, page } = await session("Ana", { width: 390, height: 844, scale: 3 });
  await page.goto(`${BASE}/pos/mesa/m6`);
  await shot(page, "phone-order");
  await page.getByRole("button", { name: /Ver pedido/ }).click();
  await shot(page, "phone-ticket");
  await ctx.close();
}

// Kitchen screen
{
  const { ctx, page } = await session("Rosa");
  await shot(page, "kitchen");
  await ctx.close();
}

// Owner: dashboard, menu editor, team
{
  const { ctx, page } = await session("Roberto");
  await shot(page, "dashboard");
  await page.goto(`${BASE}/menu`);
  await shot(page, "menu");
  await page.getByRole("button", { name: "Editar Pique macho" }).click();
  await shot(page, "menu-editor");
  await page.keyboard.press("Escape");
  await page.goto(`${BASE}/equipo`);
  await shot(page, "team");
  await ctx.close();
}

// Platform admin
{
  const { ctx, page } = await session("Marvin");
  await shot(page, "admin");
  await ctx.close();
}

await browser.close();

// The film uses the same screens.
for (const name of ["order", "kitchen", "dashboard", "phone-order", "phone-ticket", "entrar", "team", "menu-editor"]) {
  copyFileSync(`${OUT}/${name}.jpg`, `video/assets/${name}.jpg`);
}
