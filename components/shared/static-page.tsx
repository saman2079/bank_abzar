import { Breadcrumbs } from "./breadcrumbs";

type StaticPageProps = {
  title: string;
  children: React.ReactNode;
};

export function StaticPage({ title, children }: StaticPageProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "صفحه اصلی", href: "/" }, { label: title }]} />
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="text-muted space-y-4 leading-8">{children}</div>
    </article>
  );
}
