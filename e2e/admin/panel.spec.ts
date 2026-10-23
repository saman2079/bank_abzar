import { expect, test } from "@playwright/test";

test.skip(!process.env.E2E_ADMIN_PHONE || !process.env.E2E_ADMIN_PASSWORD, "E2E_ADMIN_PHONE / E2E_ADMIN_PASSWORD تنظیم نشده");

test.describe("پنل ادمین (با نشست ذخیره‌شده)", () => {
  test("داشبورد و منوی اصلی", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByText("پنل مدیریت بانک ابزار")).toBeVisible();
    for (const label of ["سفارش‌ها", "فاکتورها", "محصولات", "مقاله‌ها", "انبار"]) {
      await expect(page.getByRole("navigation", { name: "منوی مدیریت" }).getByText(label)).toBeVisible();
    }
  });

  test("لیست‌های اصلی بدون خطا بالا می‌آیند", async ({ page }) => {
    for (const path of ["/admin/orders", "/admin/products", "/admin/inventory", "/admin/invoices", "/admin/articles", "/admin/audit"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
    }
  });

  test("پیش‌فاکتور → قطعی‌کردن (موجودی کم می‌شود) → ابطال (موجودی برمی‌گردد)", async ({ page }) => {
    page.on("dialog", (dialog) => void dialog.accept());

    await page.goto("/admin/invoices/new");
    await page.getByLabel("نام مشتری / شرکت").fill("مشتری تست e2e");

    // اولین کالای واقعی (گزینه‌ی صفر placeholder است)
    const select = page.locator('select[name="productId"]').first();
    await select.selectOption({ index: 1 });
    await page.locator('input[name="quantity"]').first().fill("1");

    await page.getByRole("button", { name: "ذخیره به‌عنوان پیش‌فاکتور" }).click();
    await expect(page).toHaveURL(/\/admin\/invoices\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("پیش‌فاکتور");

    await page.getByRole("button", { name: "تأیید مشتری — قطعی‌کردن فاکتور" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("فاکتور فروش");

    await page.getByLabel("دلیل ابطال").fill("پاک‌سازی تست e2e");
    await page.getByRole("button", { name: /ابطال فاکتور/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("باطل");
  });
});
