import { z } from "zod";
import { phoneSchema } from "@/modules/auth/schemas";
import { profileSchema } from "../schemas";

const password = z.string().min(12, "رمز حداقل ۱۲ کاراکتر باشد").max(200);

export const createUserSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("CUSTOMER"), phone: phoneSchema, name: profileSchema.shape.name, email: profileSchema.shape.email }),
  z.object({
    kind: z.literal("STAFF"),
    phone: phoneSchema,
    name: profileSchema.shape.name,
    email: profileSchema.shape.email,
    password,
  }),
]);

export const updateUserSchema = z.object({
  id: z.string().min(1).max(40),
  name: profileSchema.shape.name,
  email: profileSchema.shape.email,
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({ id: z.string().min(1).max(40), password });
