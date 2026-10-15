import { createHash, randomBytes } from "node:crypto";

const SESSION_TOKEN_BYTES = 32;

/** Return a URL-safe bearer secret. Store only hashSessionToken(token) in PostgreSQL. */
export function createSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

/** Hash the raw cookie token before persistence; never log or persist the raw token. */
export function hashSessionToken(token: string): string {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    throw new Error("فرمت نشست نامعتبر است.");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidSessionTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,60}$/.test(token);
}
