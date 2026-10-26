import { expect, test } from "@playwright/test";

test.describe("صفحه‌های عمومی", () => {
  test("صفحه‌ی اصلی بالا می‌آید و JSON-LD سازمان/سایت دارد", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/بانک ابزار/);
    await expect(page.locator("header")).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((text) => text.includes('"Organization"'))).toBe(true);
    expect(jsonLd.some((text) => text.includes('"WebSite"'))).toBe(true);
  });

  test("فروشگاه و صفحه‌ی محصول", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { level: 1, name: "فروشگاه ابزارآلات" })).toBeVisible();

    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((text) => text.includes('"Product"'))).toBe(true);
  });

  test("وبلاگ", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "مقالات و راهنمای خرید" })).toBeVisible();
  });

  test("مقاله‌ی ناموجود ۴۰۴ می‌دهد", async ({ page }) => {
    const response = await page.goto("/blog/this-article-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("محصول ناموجود ۴۰۴ می‌دهد", async ({ page }) => {
    const response = await page.goto("/products/this-product-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("سئو", () => {
  test("robots.txt بخش‌های خصوصی را می‌بندد و sitemap دارد", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("Disallow: /admin");
    expect(text).toContain("Disallow: /cart");
    expect(text).toContain("Sitemap:");
  });

  test("sitemap.xml معتبر است و صفحه‌ی خصوصی ندارد", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/products");
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/cart");
    expect(xml).not.toContain("/account");
  });

  test("صفحه‌های خصوصی noindex هستند", async ({ page }) => {
    for (const path of ["/cart", "/login", "/admin/login"]) {
      await page.goto(path);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots, path).toContain("noindex");
    }
  });
});

test.describe("هدرهای امنیتی", () => {
  test("هدرها روی صفحه‌ی اصلی", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

test.describe("دسترسی ناشناس (ضد دور زدن احراز هویت)", () => {
  test("پنل ادمین به ورود هدایت می‌شود", async ({ page }) => {
    await page.goto("/admin/invoices");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("سفارش‌های من به ورود هدایت می‌شود و next حفظ می‌شود", async ({ page }) => {
    await page.goto("/account/orders");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Forders/);
  });

  test("کرون بدون توکن هرگز اجرا نمی‌شود", async ({ request }) => {
    const response = await request.post("/api/internal/cron");
    expect([401, 503]).toContain(response.status());

    const wrong = await request.post("/api/internal/cron", { headers: { authorization: "Bearer wrong-secret-value" } });
    expect([401, 503]).toContain(wrong.status());
  });

  test("آپلود تصویر برای ناشناس رد می‌شود", async ({ request }) => {
    const file = { name: "a.png", mimeType: "image/png", buffer: Buffer.from("not-an-image") };
    for (const url of ["/api/admin/articles/images", "/api/admin/products/anything/images"]) {
      const response = await request.post(url, { multipart: { file, files: file } });
      expect(response.status(), url).toBe(401);
    }
  });

  test("ورود ادمین با رمز اشتباه خطای عمومی می‌دهد", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("شماره موبایل").fill("09129999999");
    await page.getByLabel("رمز عبور", { exact: true }).fill("wrong-password-123");
    await page.getByRole("button", { name: "ورود به پنل" }).click();
    await expect(page.getByText("شماره یا رمز عبور اشتباه است.")).toBeVisible();
  });

  test("مسیر uploads از path traversal محافظت می‌شود", async ({ request }) => {
    for (const path of ["/uploads/..%2f..%2fetc%2fpasswd", "/uploads/x/../../package.json", "/uploads/a.png"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });
});
