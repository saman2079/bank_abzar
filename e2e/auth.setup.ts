import fs from "node:fs";
import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const STATE = path.join("e2e", ".auth", "admin.json");

/** یک‌بار ورود ادمین و ذخیره‌ی نشست برای همه‌ی تست‌های پنل (تا rate-limit ورود پر نشود). */
setup("ورود ادمین", async ({ page }) => {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });

  const phone = process.env.E2E_ADMIN_PHONE;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!phone || !password) {
    // فایل خالی تا پروژه‌ی admin بالا بیاید؛ تست‌های آن خودشان skip می‌شوند.
    fs.writeFileSync(STATE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto("/admin/login");
  await page.getByLabel("شماره موبایل").fill(phone);
  await page.getByLabel("رمز عبور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "ورود به پنل" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await page.context().storageState({ path: STATE });
});
