import { describe, expect, it } from "vitest";
import { loginUrl, safeRedirectPath } from "@/modules/auth/redirect";

describe("safeRedirectPath (ضد open-redirect)", () => {
  it("مسیر داخلی را نگه می‌دارد", () => {
    expect(safeRedirectPath("/account/orders/abc?payment=paid")).toBe("/account/orders/abc?payment=paid");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "account",
    "",
    "/a\nb",
    "/" + "a".repeat(250),
  ])("%j → fallback", (value) => {
    expect(safeRedirectPath(value)).toBe("/account");
  });

  it("مقدار غیر رشته → fallback", () => {
    expect(safeRedirectPath(undefined)).toBe("/account");
    expect(safeRedirectPath(42)).toBe("/account");
  });
});

describe("loginUrl", () => {
  it("next امن را encode می‌کند", () => {
    expect(loginUrl("/checkout")).toBe("/login?next=%2Fcheckout");
  });

  it("next نامعتبر را حذف می‌کند", () => {
    expect(loginUrl("//evil.com")).toBe("/login");
    expect(loginUrl()).toBe("/login");
  });
});
