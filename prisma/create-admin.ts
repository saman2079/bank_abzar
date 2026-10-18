import { config } from "dotenv";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizeIranMobile } from "../lib/phone";
import { ARGON2_OPTIONS } from "../modules/auth/argon2-options";

config({ path: [".env.local", ".env"] });

/**
 * ساخت/ارتقای ادمین:
 *   ADMIN_PASSWORD='رمز-حداقل-۱۲-کاراکتر' npm run admin:create -- 09121234567 "نام ادمین"
 * رمز عمداً از env خوانده می‌شود تا در history ترمینال نماند.
 */
async function main() {
  const [rawPhone, name] = process.argv.slice(2);
  const password = process.env.ADMIN_PASSWORD;
  const connectionString = process.env.DATABASE_URL;

  const phone = rawPhone ? normalizeIranMobile(rawPhone) : null;
  if (!phone) throw new Error("شماره موبایل معتبر نیست. مثال: 09121234567");
  if (!password || password.length < 12) throw new Error("ADMIN_PASSWORD باید حداقل ۱۲ کاراکتر باشد");
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    const passwordHash = await hash(password, ARGON2_OPTIONS);
    const data = {
      role: "ADMIN",
      passwordHash,
      isActive: true,
      phoneVerifiedAt: new Date(),
      ...(name ? { name } : {}),
    } as const;

    const user = await prisma.user.upsert({
      where: { phone },
      update: data,
      create: { phone, ...data },
      select: { id: true },
    });

    // نشست‌های قبلی (مثلاً اگر مشتری بوده) باطل می‌شوند.
    await prisma.session.deleteMany({ where: { userId: user.id } });

    process.stdout.write(`Admin ready: ${phone}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
