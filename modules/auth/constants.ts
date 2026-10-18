export const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 60;

export const CUSTOMER_SESSION_SECONDS = 60 * 60 * 24 * 30;
export const STAFF_SESSION_SECONDS = 60 * 60 * 12;

export function isStaffRole(role: Role): boolean {
  return role === "ADMIN" || role === "STAFF";
}
