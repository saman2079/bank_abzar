export const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** حداقل طول طبق توصیه‌ی NIST SP 800-63B (طول مهم‌تر از قواعد ترکیبی است)؛ سقف برای جلوگیری از سوءاستفاده‌ی هش سنگین. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const CUSTOMER_SESSION_SECONDS = 60 * 60 * 24 * 30;
export const STAFF_SESSION_SECONDS = 60 * 60 * 12;

export function isStaffRole(role: Role): boolean {
  return role === "ADMIN" || role === "STAFF";
}
