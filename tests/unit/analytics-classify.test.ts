import { describe, expect, it } from "vitest";
import { classifyPath, classifySource, detectDevice, isBot, normalizePath, parseUtm } from "@/modules/analytics/classify";

describe("classifyPath", () => {
  it("دسته‌بندی مسیرها و استخراج اسلاگ", () => {
    expect(classifyPath("/")?.kind).toBe("HOME");
    expect(classifyPath("/products")?.kind).toBe("PRODUCTS");
    expect(classifyPath("/products/drill-x?utm_source=a")).toMatchObject({ kind: "PRODUCT", slug: "drill-x" });
    expect(classifyPath("/blog/how-to/")).toMatchObject({ kind: "ARTICLE", slug: "how-to" });
    expect(classifyPath("/categories/%D8%A7%D8%A8%D8%B2%D8%A7%D8%B1")).toMatchObject({ kind: "CATEGORY", slug: "ابزار" });
    expect(classifyPath("/checkout")?.kind).toBe("CHECKOUT");
    expect(classifyPath("/account/orders")?.kind).toBe("ACCOUNT");
  });

  it("مسیرهای ادمین/API و ناامن را رد می‌کند", () => {
    expect(classifyPath("/admin")).toBeNull();
    expect(classifyPath("/api/chat")).toBeNull();
    expect(classifyPath("//evil.com")).toBeNull();
    expect(classifyPath("https://evil.com")).toBeNull();
    expect(normalizePath(`/${"a".repeat(400)}`)).toBeNull();
  });
});

describe("classifySource", () => {
  const base = { utmSource: null, ownHost: "shop.ir", userAgent: "Mozilla/5.0" };

  it("utm اولویت دارد", () => {
    expect(classifySource({ ...base, referrer: "", utmSource: "telegram" }).source).toBe("TELEGRAM");
    expect(classifySource({ ...base, referrer: "https://google.com/", utmSource: "ig" }).source).toBe("INSTAGRAM");
  });

  it("از هاست ارجاع‌دهنده", () => {
    expect(classifySource({ ...base, referrer: "https://t.me/" })).toEqual({ source: "TELEGRAM", referrerHost: "t.me" });
    expect(classifySource({ ...base, referrer: "https://l.instagram.com/x" }).source).toBe("INSTAGRAM");
    expect(classifySource({ ...base, referrer: "https://www.google.com/" }).source).toBe("SEARCH");
    expect(classifySource({ ...base, referrer: "https://blog.example.org/post" }).source).toBe("REFERRAL");
  });

  it("داخلی، UA اپ‌ها و مستقیم", () => {
    expect(classifySource({ ...base, referrer: "https://www.shop.ir/blog" }).source).toBe("INTERNAL");
    expect(classifySource({ ...base, referrer: "", userAgent: "Mozilla Instagram 300.0" }).source).toBe("INSTAGRAM");
    expect(classifySource({ ...base, referrer: "" }).source).toBe("DIRECT");
  });
});

describe("ابزارهای کمکی", () => {
  it("parseUtm", () => {
    expect(parseUtm("?utm_source=Telegram&utm_medium=Post&utm_campaign=Sale1")).toEqual({
      source: "telegram",
      medium: "post",
      campaign: "Sale1",
    });
    expect(parseUtm("")).toEqual({ source: null, medium: null, campaign: null });
  });

  it("isBot و detectDevice", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone) Safari")).toBe(false);
    expect(detectDevice(null, 390)).toBe("MOBILE");
    expect(detectDevice(null, 900)).toBe("TABLET");
    expect(detectDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("DESKTOP");
  });
});
