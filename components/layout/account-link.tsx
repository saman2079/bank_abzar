import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";

const className =
  "text-fg hover:text-primary hover:bg-surface-2 relative grid size-10 place-items-center rounded-full transition-colors";

/** داینامیک (کوکی می‌خواند)؛ همیشه داخل <Suspense> رندر شود تا بقیه‌ی هدر استاتیک بماند. */
export async function AccountLink() {
  const user = await getCurrentUser();

  return (
    <Link href={user ? "/account" : "/login"} aria-label={user ? "حساب من" : "ورود یا ثبت‌نام"} className={className}>
      <User className="size-5" aria-hidden />
      {user ? <span className="bg-primary absolute end-2 top-2 size-2 rounded-full" aria-hidden /> : null}
    </Link>
  );
}

export function AccountLinkFallback() {
  return (
    <Link href="/login" aria-label="ورود یا ثبت‌نام" className={className}>
      <User className="size-5" aria-hidden />
    </Link>
  );
}
