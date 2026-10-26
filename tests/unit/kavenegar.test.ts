import { afterEach, describe, expect, it, vi } from "vitest";
import { KavenegarError, createKavenegarSms } from "@/lib/sms/kavenegar";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("createKavenegarSms", () => {
  it("کد را با POST و بدنه‌ی فرم می‌فرستد و شماره/کد در URL نیست", async () => {
    const fetchMock = mockFetch(200, { return: { status: 200, message: "تایید شد" }, entries: [] });
    await createKavenegarSms({ apiKey: "KEY123", method: "lookup", template: "otp-template" }).sendOtp("09121234567", "482913");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.pathname).toBe("/v1/KEY123/verify/lookup.json");
    expect(url.search).toBe("");
    expect(init.method).toBe("POST");

    const body = init.body as URLSearchParams;
    expect(body.get("receptor")).toBe("09121234567");
    expect(body.get("token")).toBe("482913");
    expect(body.get("template")).toBe("otp-template");
  });

  it("وقتی کاوه‌نگار status غیر از ۲۰۰ می‌دهد خطا می‌اندازد (بدون کلید/کد در پیام)", async () => {
    mockFetch(200, { return: { status: 418, message: "اعتبار کافی نیست" } });

    const error = await createKavenegarSms({ apiKey: "KEY123", method: "lookup", template: "t" }).sendOtp("09121234567", "482913").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KavenegarError);
    expect((error as KavenegarError).kavenegarStatus).toBe(418);
    expect((error as Error).message).not.toContain("KEY123");
    expect((error as Error).message).not.toContain("482913");
  });

  it("خطای HTTP و پاسخ غیر JSON را هم خطا می‌کند", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>bad gateway</html>", { status: 502 })));

    const error = await createKavenegarSms({ apiKey: "K", method: "lookup", template: "t" }).sendOtp("09121234567", "1").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(KavenegarError);
    expect((error as KavenegarError).httpStatus).toBe(502);
    expect((error as KavenegarError).kavenegarStatus).toBeNull();
  });

  it("حالت send: متن را به /sms/send.json می‌فرستد و sender اختیاری است", async () => {
    const fetchMock = mockFetch(200, { return: { status: 200 } });
    await createKavenegarSms({ apiKey: "KEY123", method: "send", template: "" }).sendOtp("09121234567", "482913");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.pathname).toBe("/v1/KEY123/sms/send.json");
    const body = init.body as URLSearchParams;
    expect(body.get("receptor")).toBe("09121234567");
    expect(body.get("message")).toContain("482913");
    expect(body.has("sender")).toBe(false);
    expect(body.has("token")).toBe(false);
  });

  it("حالت send: با sender آن را هم می‌فرستد", async () => {
    const fetchMock = mockFetch(200, { return: { status: 200 } });
    await createKavenegarSms({ apiKey: "K", method: "send", template: "", sender: "10004346" }).sendOtp("09121234567", "1");

    const [, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect((init.body as URLSearchParams).get("sender")).toBe("10004346");
  });
});
