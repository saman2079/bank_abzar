import { describe, expect, it } from "vitest";
import { loginSchema, newPasswordSchema, registerSchema } from "@/modules/auth/schemas";

describe("newPasswordSchema", () => {
  it.each(["Tool-store-2026", "کلمه‌ی عبور قوی", "abcd1234efgh"])("%s قبول است", (value) => {
    expect(newPasswordSchema.safeParse(value).success).toBe(true);
  });

  it.each(["short1", "12345678", "Password", "aaaaaaaa", "abababab", "x".repeat(129)])("%s رد می‌شود", (value) => {
    expect(newPasswordSchema.safeParse(value).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = { phone: "09123456789", password: "Tool-store-2026", confirm: "Tool-store-2026" };

  it("شماره را نرمال می‌کند", () => {
    const result = registerSchema.safeParse({ ...base, phone: "۰۹۱۲۳۴۵۶۷۸۹" });
    expect(result.success && result.data.phone).toBe("09123456789");
  });

  it("تکرار رمز باید یکسان باشد", () => {
    expect(registerSchema.safeParse({ ...base, confirm: "other-password" }).success).toBe(false);
  });

  it("رمز نباید همان شماره باشد", () => {
    expect(registerSchema.safeParse({ ...base, password: "09123456789", confirm: "09123456789" }).success).toBe(false);
  });

  it("شماره نامعتبر رد می‌شود", () => {
    expect(registerSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("رمز خالی رد می‌شود", () => {
    expect(loginSchema.safeParse({ phone: "09123456789", password: "" }).success).toBe(false);
  });

  it("ورودی درست قبول است", () => {
    expect(loginSchema.safeParse({ phone: "09123456789", password: "x" }).success).toBe(true);
  });
});
