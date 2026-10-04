import { expect, test } from "@playwright/test";

test("landing page shows the offer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("restaurante");
  await expect(page.getByText("Bs 350")).toBeVisible();
});
