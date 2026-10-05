import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/pos");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("open a table, order, send, void with PIN, and charge", async ({ page }) => {
  // Open free table 1 for 2 guests.
  await page.getByRole("button", { name: /Mesa 1, Libre/ }).click();
  await page.getByRole("button", { name: "Abrir mesa" }).click();
  await expect(page).toHaveURL(/\/pos\/mesa\/m1$/);
  const ticket = page.getByRole("complementary");

  // Item with required options: hamburger, extra cheese.
  await page.getByRole("tab", { name: "Platos" }).click();
  await page.getByRole("button", { name: /^Hamburguesa La Casona, / }).click();
  await page.getByRole("button", { name: /Queso/ }).click();
  await page.getByRole("button", { name: /Agregar · Bs 63,00/ }).click();

  // Item without options: two beers.
  await page.getByRole("tab", { name: "Cervezas" }).click();
  await page.getByRole("button", { name: /^Paceña 620 ml, / }).click();
  await page.getByRole("button", { name: /^Paceña 620 ml, / }).click();
  await expect(ticket.getByText("Bs 113,00")).toBeVisible();

  // Can't charge before sending: the main action is "send to kitchen".
  await expect(ticket.getByRole("button", { name: /^Cobrar/ })).toHaveCount(0);
  await ticket.getByRole("button", { name: /Enviar a cocina \(3\)/ }).click();

  // Void the beers: wrong PIN first, then the manager's.
  await ticket.getByRole("button", { name: "Anular Paceña 620 ml" }).click();
  for (const d of "9999") await page.getByRole("button", { name: d, exact: true }).click();
  await expect(page.getByText("PIN incorrecto")).toBeVisible();
  await page.waitForTimeout(400);
  for (const d of "1234") await page.getByRole("button", { name: d, exact: true }).click();
  await expect(ticket.getByText("Bs 63,00").last()).toBeVisible();

  // Pay in cash with Bs 100 and see the change.
  await ticket.getByRole("button", { name: /^Cobrar/ }).click();
  await page.getByRole("button", { name: "Efectivo" }).click();
  await page.getByRole("button", { name: "Bs 100" }).click();
  await expect(page.getByText("Vuelto:")).toContainText("Bs 37,00");
  await page.getByRole("button", { name: "Cobrar Bs 63,00" }).click();

  // Back on the floor, table 1 is free again; the owner sees the void.
  await expect(page).toHaveURL(/\/pos$/);
  await expect(page.getByRole("button", { name: /Mesa 1, Libre/ })).toBeVisible();
  await page.goto("/resumen");
  await expect(page.getByText(/3 anulaciones/).first()).toBeVisible();
});

test("sold-out items are disabled in the POS", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("switch", { name: "Salteña de carne disponible" }).click();
  await page.goto("/pos/mesa/m2");
  await expect(page.getByRole("button", { name: "Salteña de carne, Bs 12,00, agotado" })).toBeDisabled();
});
