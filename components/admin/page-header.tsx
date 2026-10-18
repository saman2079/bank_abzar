import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  action?: { href: string; label: string };
  description?: string;
};

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold">{title}</h1>
        {description ? <p className="text-muted text-sm">{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className={buttonVariants({ size: "sm" })}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
