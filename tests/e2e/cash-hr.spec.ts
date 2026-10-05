import { expect, test } from "@playwright/test";
import { parseBs, patchState, signIn } from "./helpers";

test("cashier: withdrawal with a manager PIN, cash charge, close Bs 10 short, owner sees it", async ({ page }) => {
  await signIn(page, "Carla", { fresh: true });
  await expect(page).toHaveURL(/\/caja$/);
  await expect(page.getByRole("heading", { name: "Caja abierta" })).toBeVisible();

  // Taking cash out needs a manager.
  await page.getByRole("button", { name: "Salida" }).click();
  await page.getByLabel("Monto (Bs)").fill("50");
  await page.getByRole("button", { name: "Pedir aprobación" }).click();
  for (const d of "1234") await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText("−Bs 50,00")).toBeVisible();

  // Charge table 3 (asked for the bill) in cash.
  await page.getByRole("button", { name: /^Cobrar Mesa 3,/ }).click();
  await page.getByRole("button", { name: "Efectivo" }).click();
  await page.getByRole("button", { name: "Exacto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /^Cobrar Bs/ }).click();
  await expect(page.getByRole("button", { name: /^Cobrar Mesa 3,/ })).toHaveCount(0);

  // Close: count Bs 10 less than expected.
  await page.getByRole("button", { name: "Cerrar caja" }).click();
  const dialog = page.getByRole("dialog");
  const expected = parseBs((await dialog.getByText(/^Esperado Bs/).textContent()) ?? "");
  await dialog.getByRole("tab", { name: "Escribir total" }).click();
  await dialog.getByRole("textbox").fill(String((expected - 1000) / 100).replace(".", ","));
  await expect(dialog.getByText("Falta Bs 10,00")).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar caja" }).click();
  await expect(page.getByRole("dialog").getByText("Caja cerrada")).toBeVisible();
  await page.getByRole("button", { name: "Listo" }).click();
  await expect(page.getByRole("heading", { name: "La caja está cerrada" })).toBeVisible();

  // Cash is disabled while the register is closed.
  await page.goto("/pos/mesa/m5");
  await page.getByRole("complementary").getByRole("button", { name: /^Cobrar/ }).click();
  await expect(page.getByRole("button", { name: "Efectivo" })).toBeDisabled();

  // The manager sees the shortfall on the dashboard.
  await signIn(page, "Daniela");
  await page.goto("/resumen");
  await expect(page.getByText("Faltó Bs 10,00")).toBeVisible();
});

test("staff clock in at sign-in and show up as working", async ({ page }) => {
  await page.goto("/entrar");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // Make sure Ana isn't clocked in yet, whatever the time of day.
  await patchState(page, "s.timeEntries = s.timeEntries.filter((e) => !(e.staffId === 's-ana' && !e.outAt));");
  await signIn(page, "Ana", { clockIn: true });
  await expect(page.getByText(/Entrada marcada/)).toBeVisible();

  await signIn(page, "Daniela");
  await page.goto("/equipo");
  await page.getByRole("tab", { name: "Asistencia" }).click();
  await expect(page.getByText("Trabajando ahora").locator("..").locator("..")).toContainText("Ana");
});

test("manager splits yesterday's tips by hours; shares add up to the total", async ({ page }) => {
  await signIn(page, "Daniela", { fresh: true });
  await page.goto("/equipo");
  await page.getByRole("tab", { name: "Propinas" }).click();
  const panel = page.getByRole("region", { name: "Propinas" });
  const total = parseBs((await panel.getByTestId("tips-total").textContent()) ?? "");
  await panel.getByRole("button", { name: "Guardar reparto" }).click();
  await expect(panel.getByText("Reparto guardado")).toBeVisible();
  const shares = await panel.getByTestId("tip-share").allTextContents();
  expect(shares.length).toBeGreaterThan(1);
  expect(shares.reduce((s, t) => s + parseBs(t), 0)).toBe(total);
  await panel.getByRole("button", { name: "Marcar pagado" }).first().click();
  await expect(panel.getByText("Pagado").first()).toBeVisible();
});

test("waiters can't open the register; managers can't see pay or ID", async ({ page }) => {
  await signIn(page, "Ana", { fresh: true });
  await page.goto("/caja");
  await expect(page.getByRole("heading", { name: "Sin acceso a esta pantalla" })).toBeVisible();

  await signIn(page, "Daniela");
  await page.goto("/equipo");
  await page.getByRole("button", { name: "Editar Ana" }).click();
  await expect(page.getByText("Solo el dueño ve el CI y el sueldo.")).toBeVisible();
  await expect(page.getByText("8123450 SC")).toHaveCount(0);

  await signIn(page, "Roberto");
  await page.goto("/equipo");
  await page.getByRole("button", { name: "Editar Ana" }).click();
  await expect(page.getByRole("textbox", { name: "CI", exact: true })).toHaveValue("8123450 SC");
});
