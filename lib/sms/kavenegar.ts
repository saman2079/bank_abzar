import { z } from "zod";
import type { SmsProvider } from "./types";

const responseSchema = z.object({ return: z.object({ status: z.number(), message: z.string().optional() }) });
const TIMEOUT_MS = 8000;

export class KavenegarError extends Error {
  constructor(readonly httpStatus: number, readonly kavenegarStatus: number | null) {
    super(`Kavenegar request failed (http ${httpStatus}, kavenegar ${kavenegarStatus ?? "unknown"})`);
    this.name = "KavenegarError";
  }
}

export type KavenegarConfig = {
  apiKey: string;
  method: "send"; // فعلاً فقط send
  sender?: string;
};

export function otpMessage(code: string): string {
  return `کد ورود شما به بانک ابزار: ${code}`;
}

export function createKavenegarSms(config: KavenegarConfig): SmsProvider {
  return {
    async sendOtp(phone, code) {
      const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(config.apiKey)}/sms/send.json`);

      const body = new URLSearchParams({ receptor: phone, message: otpMessage(code) });
      if (config.sender) body.set("sender", config.sender);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });

      const parsed = responseSchema.safeParse(await response.json().catch(() => null));
      const kavenegarStatus = parsed.success ? parsed.data.return.status : null;

      if (!response.ok || kavenegarStatus !== 200) {
        throw new KavenegarError(response.status, kavenegarStatus);
      }
    },
  };
}