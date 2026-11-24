"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  currentMonthKeyInIndia,
  shiftMonthKey,
} from "@/lib/format";

type MonthFilterProps = {
  month: string;
};

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", month: "long" }).format(
    new Date(Date.UTC(2000, index, 1)),
  ),
);

export function MonthFilter({ month }: MonthFilterProps) {
  const router = useRouter();
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const currentMonth = currentMonthKeyInIndia();
  const currentYear = Number(currentMonth.slice(0, 4));
  const firstYear = Math.min(2024, year);
  const lastYear = Math.max(currentYear + 1, year);
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );

  function go(key: string) {
    if (key !== month) router.push(`/expenses?month=${key}`);
  }

  const arrowClass =
    "flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-cream hover:text-charcoal";
  const selectClass =
    "h-9 w-full cursor-pointer appearance-none rounded-full border-0 bg-transparent pl-3 pr-8 text-sm font-bold text-charcoal outline-none transition hover:bg-cream focus-visible:bg-cream";

  return (
    <nav
      aria-label="Filter by month"
      className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
    >
      <div className="flex w-full items-center gap-1 rounded-full border border-line bg-paper p-1 shadow-[0_6px_20px_rgb(70_55_30/5%)] sm:w-auto">
        <Link
          href={`/expenses?month=${shiftMonthKey(month, -1)}`}
          className={arrowClass}
          aria-label="Previous month"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>

        <div className="relative min-w-0 flex-1 sm:w-36 sm:flex-none">
          <select
            aria-label="Month"
            className={selectClass}
            value={monthText}
            onChange={(event) => go(`${yearText}-${event.target.value}`)}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gold-deep"
          />
        </div>

        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-line" />

        <div className="relative w-24 shrink-0">
          <select
            aria-label="Year"
            className={selectClass}
            value={yearText}
            onChange={(event) => go(`${event.target.value}-${monthText}`)}
          >
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gold-deep"
          />
        </div>

        <Link
          href={`/expenses?month=${shiftMonthKey(month, 1)}`}
          className={arrowClass}
          aria-label="Next month"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {month !== currentMonth && (
        <Link
          href={`/expenses?month=${currentMonth}`}
          className="button-secondary h-11 px-4"
        >
          This month
        </Link>
      )}
    </nav>
  );
}
