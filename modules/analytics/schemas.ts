import { z } from "zod";

/** بدنه‌ی رویداد کلاینت. همه‌چیز دوباره سمت سرور اعتبارسنجی/دسته‌بندی می‌شود. */
export const trackSchema = z.object({
  type: z.enum(["VIEW", "LEAVE"]),
  path: z.string().min(1).max(300),
  referrer: z.string().max(500).optional().default(""),
  prevPath: z.string().max(300).optional().default(""),
  search: z.string().max(500).optional().default(""),
  durationSec: z.number().int().min(0).max(3600).optional(),
  scrollPct: z.number().int().min(0).max(100).optional(),
  viewport: z.number().int().min(0).max(10000).optional(),
});

export type TrackInput = z.infer<typeof trackSchema>;
