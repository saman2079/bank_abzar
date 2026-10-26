import "server-only";

import { env } from "@/lib/env";
import { consoleSms } from "./console";
import { createKavenegarSms } from "./kavenegar";
import type { SmsProvider } from "./types";

function createProvider(): SmsProvider {
  if (env.SMS_PROVIDER === "kavenegar") {
    return createKavenegarSms({
      apiKey: env.SMS_API_KEY ?? "",
      sender: env.SMS_SENDER,
    });
  }

  if (env.NODE_ENV === "production") {
    return {
      async sendOtp() {
        throw new Error(
          "SMS_PROVIDER=console is not allowed in production; configure kavenegar",
        );
      },
    };
  }

  return consoleSms;
}

export const sms: SmsProvider = createProvider();
