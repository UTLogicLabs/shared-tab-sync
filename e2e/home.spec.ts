import { expect, test } from "@playwright/test";

test("home page renders the call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /shared tab sync/i })).toBeVisible();
});
