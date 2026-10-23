import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

type ResolveLocalPath = (segments: string[]) => string | null;
let resolveLocalPath: ResolveLocalPath;

beforeAll(async () => {
  // env.ts هنگام import مقدارها را می‌خواند؛ پس اول ست و بعد import پویا.
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.UPLOAD_DIR = "uploads";
  ({ resolveLocalPath } = await import("@/lib/storage/local"));
});

describe("resolveLocalPath (ضد path traversal)", () => {
  it("مسیر معتبر داخل ریشه‌ی آپلود", () => {
    const result = resolveLocalPath(["products", "p1", "a1b2.webp"]);
    expect(result).toBe(path.join(path.resolve("uploads"), "products", "p1", "a1b2.webp"));
  });

  it.each([
    [[".."]],
    [["..", "etc", "passwd"]],
    [["products", "..", "..", "secret"]],
    [["."]],
    [["a%2F..%2Fb"]],
    [["a/b"]],
    [["a\\b"]],
    [["a b.webp"]],
    [[""]],
    [[]],
  ])("%j → null", (segments) => {
    expect(resolveLocalPath(segments)).toBeNull();
  });
});
