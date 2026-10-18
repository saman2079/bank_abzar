import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

const items = [
  { Icon: CreditCard, title: "پرداخت امن", desc: "درگاه پرداخت معتبر" },
  { Icon: Truck, title: "ارسال سریع", desc: "به سراسر کشور" },
  { Icon: ShieldCheck, title: "ضمانت اصالت کالا", desc: "تضمین کیفیت و گارانتی" },
  { Icon: Headset, title: "پشتیبانی ۲۴/۷", desc: "پاسخگویی واقعی" },
] as const;

export function TrustBar() {
  return (
    <section aria-label="مزایای خرید از بانک ابزار">
      <ul className="border-border bg-surface grid grid-cols-2 gap-6 rounded-card border p-5 md:grid-cols-4">
        {items.map(({ Icon, title, desc }) => (
          <li key={title} className="flex items-center gap-3">
            <Icon className="text-primary size-7 shrink-0" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-sm font-bold">{title}</p>
              <p className="text-muted text-xs">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}