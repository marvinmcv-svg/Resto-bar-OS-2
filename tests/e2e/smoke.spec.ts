import { expect, test } from "@playwright/test";

test("landing page sells the offer and shows the product film", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("restaurante");
  await expect(page.locator("video[src='/landing/demo.mp4']")).toHaveCount(1);
  await expect(page.getByText("Bs 350").first()).toBeVisible();
  await page.getByRole("link", { name: "Probar el sistema ahora" }).first().click();
  await expect(page).toHaveURL(/\/entrar$/);
});

test("the old sales URL redirects to the landing page", async ({ page }) => {
  await page.goto("/oferta");
  await expect(page).toHaveURL(/\/$/);
});
