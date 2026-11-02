import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_LENGTH } from "@/modules/chat/constants";
import { cursorSchema, staffMessageSchema, visitorMessageSchema } from "@/modules/chat/schemas";

describe("visitorMessageSchema", () => {
  it("متن را trim می‌کند و نام خالی را حذف می‌کند", () => {
    const result = visitorMessageSchema.parse({ body: "  سلام  ", name: "  " });
    expect(result).toEqual({ body: "سلام", name: undefined });
  });

  it("نویسه‌های کنترلی را حذف و خط جدید را نگه می‌دارد", () => {
    const result = visitorMessageSchema.parse({ body: "الف\u0000ب\nج\u0007" });
    expect(result.body).toBe("الفب\nج");
  });

  it("پیام خالی یا فقط فاصله را رد می‌کند", () => {
    expect(visitorMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(visitorMessageSchema.safeParse({ body: "\u0000" }).success).toBe(false);
  });

  it("پیام بلندتر از سقف را رد می‌کند", () => {
    expect(visitorMessageSchema.safeParse({ body: "ا".repeat(MAX_MESSAGE_LENGTH + 1) }).success).toBe(false);
    expect(visitorMessageSchema.safeParse({ body: "ا".repeat(MAX_MESSAGE_LENGTH) }).success).toBe(true);
  });

  it("HTML را به‌صورت متن ساده نگه می‌دارد (رندر در UI فقط متن است)", () => {
    expect(staffMessageSchema.parse({ body: "<b>x</b>" }).body).toBe("<b>x</b>");
  });
});

describe("cursorSchema", () => {
  it("مقدار نامعتبر یا منفی را به ۰ برمی‌گرداند", () => {
    expect(cursorSchema.parse("abc")).toBe(0);
    expect(cursorSchema.parse("-5")).toBe(0);
    expect(cursorSchema.parse("12")).toBe(12);
    expect(cursorSchema.parse(undefined)).toBe(0);
  });
});
