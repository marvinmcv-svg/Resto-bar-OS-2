import { chromium } from "@playwright/test";
const base = process.env.BASE || "http://localhost:3100";
const [,, who = "Daniela", ...paths] = process.argv;
const pins = { Carla: "2222",  Roberto: "0000", Daniela: "1234", Carla: "2222", Ana: "1111", Jorge: "4444", Rosa: "5555", Marvin: "9999" };
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(base + "/entrar");
await page.waitForTimeout(500);
await page.screenshot({ path: `/tmp/claude-0/shots/entrar.png` });
await page.getByRole("button", { name: new RegExp(`^${who},`) }).click();
await page.screenshot({ path: `/tmp/claude-0/shots/pin.png` });
await page.keyboard.type(pins[who]);
await page.waitForTimeout(1500);
await page.screenshot({ path: `/tmp/claude-0/shots/${who}-home.png` });
for (const p of paths) {
  await page.goto(base + p);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/tmp/claude-0/shots/${who}${p.replace(/\//g, "_")}.png`, fullPage: true });
}
console.log("url", page.url(), "errors", JSON.stringify(errors.slice(0, 5)));
await browser.close();
