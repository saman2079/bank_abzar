import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4 text-center">
      <div>
        <p className="text-primary text-6xl font-extrabold">۴۰۴</p>
        <h1 className="mt-4 text-xl font-extrabold">صفحه‌ی مورد نظر پیدا نشد</h1>
        <p className="text-muted mt-2 text-sm">ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد.</p>
        <Link href="/" className={buttonVariants({ size: "lg", className: "mt-8" })}>
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </main>
  );
}
