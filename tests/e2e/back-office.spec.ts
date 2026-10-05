import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("inventory: sending a dish to the kitchen consumes its recipe; the kitchen logs waste", async ({ page }) => {
  await signIn(page, "Daniela", { fresh: true });
  await page.goto("/inventario");
  const papaRow = page.getByRole("row", { name: /^Papa / });
  await expect(papaRow).toContainText("22 kg");

  // 2 portions of fries = 700 g of potato.
  await page.goto("/pos/mesa/m6");
  await page.getByRole("tab", { name: "Para picar" }).click();
  await page.getByRole("button", { name: /^Papas fritas, / }).click();
  await page.getByRole("button", { name: /^Papas fritas, / }).click();
  await page.getByRole("complementary").getByRole("button", { name: /Enviar a cocina/ }).click();
  await page.goto("/inventario");
  await expect(page.getByRole("row", { name: /^Papa / })).toContainText("21,3 kg");

  await signIn(page, "Rosa");
  await page.goto("/inventario");
  await expect(page.getByRole("button", { name: "Pedido sugerido" })).toHaveCount(0);
  await page.getByRole("button", { name: "Merma de Tomate" }).click();
  await page.getByLabel(/Cantidad/).fill("0,5");
  await page.getByRole("button", { name: "Registrar" }).click();
  await page.getByRole("tab", { name: "Mermas" }).click();
  await expect(page.getByRole("region", { name: "Mermas" })).toContainText("Tomate");
});

test("recipe cost and margin update as the recipe changes", async ({ page }) => {
  await signIn(page, "Roberto", { fresh: true });
  await page.goto("/inventario");
  await page.getByRole("tab", { name: "Recetas y costos" }).click();
  await page.getByRole("button", { name: "Receta de Papas fritas" }).click();
  await expect(page.getByText("Bs 2,10").first()).toBeVisible(); // 350 g × Bs 6/kg
  await page.getByLabel(/Cantidad de Papa/).fill("0,5");
  await expect(page.getByText("Bs 3,00").first()).toBeVisible();
  await page.getByRole("button", { name: "Guardar receta" }).click();
  await expect(page.getByText(/Receta de Papas fritas guardada/)).toBeVisible();
});

test("reservations: a booking can't double-book a table; seating opens the table for that guest", async ({ page }) => {
  await signIn(page, "Daniela", { fresh: true });
  await page.goto("/reservas");
  await page.getByRole("button", { name: "Nueva reserva" }).click();
  await page.getByLabel("A nombre de").fill("Sofía");
  await page.getByRole("button", { name: /Sofía Cuéllar/ }).click();
  await page.getByLabel("Hora").fill("20:30");
  // Mesa 3 is booked by Carlos Peña at 20:00, so it isn't offered.
  await expect(page.getByRole("radio", { name: /^Mesa 3 / })).toHaveCount(0);
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByText("Sofía Cuéllar").first()).toBeVisible();

  const row = page.getByRole("listitem").filter({ hasText: "Elena Montaño" });
  await row.getByRole("button", { name: "Sentar" }).click();
  await expect(page).toHaveURL(/\/pos\/mesa\/t4$/);
  await expect(page.getByRole("complementary")).toContainText("Elena Montaño");
});

test("guests and marketing: new guest, then a campaign only reaches guests who opted in", async ({ page }) => {
  await signIn(page, "Roberto", { fresh: true });
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nuevo cliente" }).click();
  await page.getByLabel("Nombre").fill("Pedro Vaca");
  await page.getByLabel("Celular").fill("71234567");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ver Pedro Vaca" })).toContainText("+591 71234567");

  await page.goto("/marketing");
  await page.getByRole("radio", { name: /Todos con permiso/ }).click();
  const recipients = page.getByRole("region", { name: "Destinatarios" });
  await expect(recipients).not.toContainText("Pedro Vaca"); // didn't opt in
  await expect(recipients).not.toContainText("Mariana Saucedo"); // opted out
  const link = recipients.getByRole("link", { name: /Enviar a Familia Rojas/ });
  await expect(link).toHaveAttribute("href", /^https:\/\/wa\.me\/59170123401\?text=/);
});

test("analytics and payments render for the owner; waiters can't see them", async ({ page }) => {
  await signIn(page, "Roberto", { fresh: true });
  await page.goto("/analitica");
  await expect(page.getByRole("region", { name: "Estrellas" })).toBeVisible();
  await page.getByRole("radio", { name: "30 días" }).click();
  await expect(page.getByText("Últimos 30 días")).toBeVisible();
  await page.goto("/pagos");
  await expect(page.getByRole("region", { name: "Cierres de caja" })).toContainText("Faltó Bs 15,00");

  await signIn(page, "Ana");
  for (const p of ["/analitica", "/pagos", "/inventario", "/marketing"]) {
    await page.goto(p);
    await expect(page.getByRole("heading", { name: "Sin acceso a esta pantalla" })).toBeVisible();
  }
});

test("the app is installable: manifest, icons and service worker", async ({ page, request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({ name: "RestoBar OS", display: "standalone", start_url: "/entrar" });
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  await page.goto("/entrar");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/$/);
});
