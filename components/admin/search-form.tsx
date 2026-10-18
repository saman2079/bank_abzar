import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchFormProps = {
  action: string;
  q?: string;
  placeholder: string;
  /** فیلتر اضافه (مثلاً <Select name="status">) */
  children?: React.ReactNode;
};

/** فرم GET ساده؛ بدون JS کار می‌کند و URL قابل اشتراک است. */
export function SearchForm({ action, q, placeholder, children }: SearchFormProps) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <label htmlFor="admin-q" className="sr-only">
          جستجو
        </label>
        <Search className="text-muted pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input id="admin-q" name="q" defaultValue={q} placeholder={placeholder} className="ps-10" />
      </div>
      {children}
      <Button type="submit" variant="outline">
        اعمال
      </Button>
    </form>
  );
}
