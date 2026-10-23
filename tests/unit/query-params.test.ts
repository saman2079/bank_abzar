import { describe, expect, it } from "vitest";
import { firstParam, pageParam } from "@/lib/query-params";
import { productListQuerySchema } from "@/modules/catalog/schemas";

describe("pageParam / firstParam", () => {
  it("شماره‌ی صفحه‌ی امن", () => {
    expect(pageParam("3")).toBe(3);
    expect(pageParam(["4", "9"])).toBe(4);
    expect(pageParam("0")).toBe(1);
    expect(pageParam("-5")).toBe(1);
    expect(pageParam("1001")).toBe(1);
    expect(pageParam("abc")).toBe(1);
    expect(pageParam(undefined)).toBe(1);
  });

  it("firstParam اولین مقدار را برمی‌گرداند", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("x")).toBe("x");
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe("productListQuerySchema (ورودی خراب خطا نمی‌دهد)", () => {
  it("مقدارهای نامعتبر به پیش‌فرض برمی‌گردند", () => {
    const query = productListQuerySchema.parse({ q: "x".repeat(500), category: "Bad Slug!", sort: "hack", page: "-1" });
    expect(query.q).toBeUndefined();
    expect(query.category).toBeUndefined();
    expect(query.page).toBe(1);
  });

  it("مقدار معتبر حفظ می‌شود", () => {
    const query = productListQuerySchema.parse({ q: "  دریل  ", category: "power-tools", page: "2" });
    expect(query.q).toBe("دریل");
    expect(query.category).toBe("power-tools");
    expect(query.page).toBe(2);
  });
});
