"use client";

import { BrandMark } from "@/components/brand-mark";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="paper-texture flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <BrandMark priority />
        <div className="mt-8 rounded-3xl border border-line bg-paper p-7 shadow-xl">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-danger">
            <TriangleAlert aria-hidden="true" className="size-5" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            The appointment manager hit an unexpected error. Your data has not
            been changed.
          </p>
          <button type="button" className="button-primary mt-6" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
