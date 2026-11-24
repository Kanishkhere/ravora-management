import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/brand-mark";
import { Spinner } from "@/components/pending";

type PageLoadingProps = {
  label: string;
  /** Number of summary cards to show in the skeleton. */
  cards?: number;
};

/** Route-level loading screen: header, tabs, skeleton blocks and a spinner. */
export function PageLoading({ label, cards = 3 }: PageLoadingProps) {
  return (
    <div className="paper-texture min-h-screen" aria-busy="true">
      <header className="border-b border-line/80 bg-paper/75">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <BrandMark priority />
        </div>
      </header>
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div role="status" className="flex items-center gap-2 text-sm font-medium text-gold-deep">
          <Spinner className="size-5" />
          {label}
        </div>
        <div className="animate-pulse">
          <div className="mt-6 h-12 w-64 rounded bg-line/70" />
          <div className="mt-3 h-4 w-36 rounded bg-line/70" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: cards }, (_, item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-line bg-paper/70"
              />
            ))}
          </div>
          <div className="mt-10 h-11 w-40 rounded-full bg-line/70" />
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-line bg-paper/70"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
