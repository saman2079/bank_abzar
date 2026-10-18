import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { ARGON2_OPTIONS } from "./argon2-options";

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

let dummyHash: Promise<string> | undefined;

/**
 * اگر کاربر وجود ندارد هم یک verify کامل انجام می‌شود تا زمان پاسخ،
 * وجود/عدم‌وجود شماره را لو ندهد.
 */
export async function verifyPassword(hashed: string | null, password: string): Promise<boolean> {
  try {
    if (!hashed) {
      dummyHash ??= hashPassword("timing-equalizer-not-a-real-password");
      await verify(await dummyHash, password);
      return false;
    }
    return await verify(hashed, password);
  } catch {
    return false;
  }
}
