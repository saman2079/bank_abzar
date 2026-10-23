import { expect, test } from "@playwright/test";

test.describe("علاقه‌مندی‌ها (مهمان)", () => {
  test("صفحه‌ی علاقه‌مندی به ورود هدایت می‌شود", async ({ page }) => {
    await page.goto("/account/wishlist");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fwishlist/);
  });

  test("API برای مهمان لیست خالی می‌دهد و کش نمی‌شود", async ({ request }) => {
    const response = await request.get("/api/wishlist");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false, ids: [] });
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("قلب برای مهمان به صفحه‌ی ورود می‌برد", async ({ page }) => {
    await page.goto("/products");
    await page.getByRole("button", { name: /به علاقه‌مندی‌ها/ }).first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
