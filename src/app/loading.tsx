import { BrandMark } from "@/components/brand-mark";

export default function Loading() {
  return (
    <div className="paper-texture min-h-screen" aria-busy="true">
      <header className="border-b border-line/80 bg-paper/75">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark priority />
        </div>
      </header>
      <main className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="h-3 w-28 rounded bg-line" />
        <div className="mt-4 h-12 w-64 rounded bg-line/70" />
        <div className="mt-3 h-4 w-36 rounded bg-line/70" />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 rounded-2xl border border-line bg-paper/70"
            />
          ))}
        </div>
        <div className="mt-10 h-9 w-40 rounded bg-line/70" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-32 rounded-2xl border border-line bg-paper/70"
            />
          ))}
        </div>
        <span className="sr-only">Loading appointment schedule…</span>
      </main>
    </div>
  );
}
