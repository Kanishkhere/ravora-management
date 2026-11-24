import { Spinner } from "@/components/pending";

export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="paper-texture flex min-h-[100dvh] items-center justify-center gap-2 text-sm font-medium text-gold-deep"
    >
      <Spinner className="size-5" />
      Loading…
    </div>
  );
}
