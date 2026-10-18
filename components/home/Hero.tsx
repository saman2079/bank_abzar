import Link from "next/link";
import { ArrowLeft, Drill, Headset, ShieldCheck, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";

const perks = [
  { Icon: ShieldCheck, label: "ضمانت اصالت کالا" },
  { Icon: Truck, label: "ارسال سریع" },
  { Icon: Headset, label: "پشتیبانی واقعی" },
] as const;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="border-border bg-surface relative overflow-hidden rounded-card border bg-[radial-gradient(60%_90%_at_25%_50%,rgba(245,184,0,0.18),transparent)]"
    >
      <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:p-12">
        <div>
          <p className="text-muted text-sm">قدرت در دستان شما</p>
          <h1 id="hero-title" className="mt-3 text-3xl leading-tight font-extrabold md:text-5xl md:leading-snug">
            ابزار حرفه‌ای
            <br />
            برای کارهای <span className="text-primary">بزرگ</span>
          </h1>
          <p className="text-muted mt-4 max-w-md text-sm leading-7 md:text-base">
            بهترین برندهای جهانی ابزارآلات، با تضمین اصالت کالا و ارسال سریع به سراسر کشور.
          </p>
          <Link href="/products" className={buttonVariants({ size: "lg", className: "mt-6" })}>
            <ArrowLeft className="size-4" aria-hidden />
            مشاهده محصولات
          </Link>

          <ul className="text-muted mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs md:text-sm">
            {perks.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-5" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* جایگزین: <Image priority> با تصویر واقعی هیرو (WebP، ابعاد مشخص) */}
        <div aria-hidden className="text-primary/30 hidden place-items-center md:grid">
          <Drill className="size-64" strokeWidth={0.75} />
        </div>
      </div>
    </section>
  );
}