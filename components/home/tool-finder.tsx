import { Search } from "lucide-react";

export function ToolFinder() {
  return (
    <section
      aria-labelledby="finder-title"
      className="border-border bg-surface rounded-card border bg-[radial-gradient(50%_100%_at_50%_0%,rgba(245,184,0,0.12),transparent)] p-6 text-center md:p-10"
    >
      <h2 id="finder-title" className="text-xl font-extrabold">
        ابزار مناسب کار شما چیست؟
      </h2>
      <p className="text-muted mt-2 text-sm">با چند کلیک، بهترین ابزار را پیدا کنید</p>

      <form action="/products" role="search" className="mx-auto mt-6 max-w-xl">
        <label htmlFor="finder-q" className="sr-only">
          جستجوی ابزار
        </label>
        <div className="border-border bg-bg focus-within:border-primary flex h-12 items-center gap-2 rounded-full border ps-5 pe-1.5">
          <input
            id="finder-q"
            name="q"
            type="search"
            placeholder="جستجوی ابزار..."
            className="placeholder:text-muted w-full bg-transparent text-sm outline-none"
          />
          <button
            type="submit"
            aria-label="جستجو"
            className="bg-primary text-primary-fg hover:bg-primary-hover grid size-9 shrink-0 place-items-center rounded-full transition-colors"
          >
            <Search className="size-4" aria-hidden />
          </button>
        </div>
      </form>
    </section>
  );
}
