import { describe, expect, it } from "vitest";
import { maskPhone, normalizeIranMobile, toLatinDigits } from "@/lib/phone";

describe("normalizeIranMobile", () => {
  it.each([
    ["09123456789", "09123456789"],
    ["9123456789", "09123456789"],
    ["+989123456789", "09123456789"],
    ["989123456789", "09123456789"],
    ["00989123456789", "09123456789"],
    ["۰۹۱۲۳۴۵۶۷۸۹", "09123456789"],
    ["0912 345 6789", "09123456789"],
    ["0912-345-6789", "09123456789"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeIranMobile(input)).toBe(expected);
  });

  it.each(["", "abc", "0812345678", "091234567", "091234567890", "0212345678", "09123456789; DROP TABLE"])(
    "%j نامعتبر است",
    (input) => {
      expect(normalizeIranMobile(input)).toBeNull();
    },
  );
});

describe("toLatinDigits / maskPhone", () => {
  it("ارقام فارسی و عربی را لاتین می‌کند", () => {
    expect(toLatinDigits("۱۲۳٤٥٦")).toBe("123456");
  });

  it("شماره را ماسک می‌کند", () => {
    expect(maskPhone("09123456789")).toBe("0912***6789");
    expect(maskPhone("123")).toBe("***");
  });
});
