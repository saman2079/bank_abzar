"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { formString } from "@/lib/form";
import { rateLimit } from "@/lib/rate-limit";
import { startPaymentSchema } from "./schemas";
import { startPayment } from "./service";

export type StartPaymentState = { error?: string };

export async function startPaymentAction(_prev: StartPaymentState, formData: FormData): Promise<StartPaymentState> {
  const parsed = startPaymentSchema.safeParse({ orderId: formString(formData, "orderId") });
  if (!parsed.success) return { error: "سفارش نامعتبر است." };

  const user = await requireUser(`/account/orders/${parsed.data.orderId}`);

  const limit = await rateLimit(`pay:start:${user.id}`, 10, 600);
  if (!limit.ok) return { error: "تلاش‌های زیاد؛ چند دقیقه بعد دوباره امتحان کنید." };

  const result = await startPayment(user.id, parsed.data.orderId);
  if (!result.ok) return { error: result.error };

  redirect(result.redirectUrl);
}
