import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("signed-out visitors are sent to the sign-in screen", async ({ page }) => {
  await page.goto("/entrar");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/resumen");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("a waiter can't open the menu editor or the dashboard", async ({ page }) => {
  await signIn(page, "Ana", { fresh: true });
  await expect(page).toHaveURL(/\/pos$/);
  await page.goto("/menu");
  await expect(page.getByRole("heading", { name: "Sin acceso a esta pantalla" })).toBeVisible();
  await page.goto("/resumen");
  await expect(page.getByRole("heading", { name: "Sin acceso a esta pantalla" })).toBeVisible();
});

test("a waiter asks the cashier for the bill instead of charging", async ({ page }) => {
  await signIn(page, "Ana", { fresh: true });
  await page.goto("/pos/mesa/m5");
  const ticket = page.getByRole("complementary");
  await expect(ticket.getByRole("button", { name: /^Cobrar/ })).toHaveCount(0);
  await ticket.getByRole("button", { name: /Pedir la cuenta a caja/ }).click();
  await expect(ticket.getByRole("button", { name: /Caja avisada/ })).toBeVisible();
});

test("a manager adds a dish, it sells in the POS, then removes it with undo", async ({ page }) => {
  await signIn(page, "Daniela", { fresh: true });
  await page.goto("/menu");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill("Api con pastel");
  await page.getByLabel("Precio (Bs)").fill("15");
  await page.getByRole("radio", { name: /Para picar/ }).click();
  await page.getByRole("button", { name: "Agregar al menú" }).click();
  await expect(page.getByRole("button", { name: "Editar Api con pastel" })).toBeVisible();

  await page.goto("/pos/mesa/m2");
  await page.getByRole("tab", { name: "Para picar" }).click();
  await expect(page.getByRole("button", { name: "Api con pastel, Bs 15,00" })).toBeVisible();

  await page.goto("/menu");
  await page.getByRole("button", { name: "Editar Api con pastel" }).click();
  await page.getByRole("button", { name: "Quitar del menú" }).click();
  await page.getByRole("alertdialog").or(page.getByRole("dialog")).getByRole("button", { name: "Quitar del menú" }).click();
  await expect(page.getByRole("button", { name: "Editar Api con pastel" })).toHaveCount(0);
  await expect(page.getByText("Quitados del menú")).toBeVisible();
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByRole("button", { name: "Editar Api con pastel" })).toBeVisible();
});

test("kitchen marks a ticket ready and the waiter sees it", async ({ page }) => {
  await signIn(page, "Rosa", { fresh: true });
  await expect(page).toHaveURL(/\/cocina$/);
  const ticket = page.getByRole("listitem").filter({ hasText: "Mesa 6" });
  await ticket.getByRole("button", { name: "Empezar" }).click();
  await ticket.getByRole("button", { name: "Listo para servir" }).click();
  await expect(page.getByRole("region", { name: /Listos para servir/ }).getByText("Mesa 6")).toBeVisible();

  await signIn(page, "Ana");
  await page.goto("/pos/mesa/m6");
  await expect(page.getByRole("complementary").getByText("Listo para servir").first()).toBeVisible();
});

test("the platform admin sees client restaurants, not the till", async ({ page }) => {
  await signIn(page, "Marvin", { fresh: true });
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("La Casona")).toBeVisible();
  await page.goto("/pos");
  await expect(page.getByRole("heading", { name: "Sin acceso a esta pantalla" })).toBeVisible();
});
