"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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

  return (
    <nav
      aria-label="Filter by month"
      className="flex w-full flex-col gap-2 sm:w-auto"
    >
      <div className="flex w-full items-center gap-2">
        <Link
          href={`/expenses?month=${shiftMonthKey(month, -1)}`}
          className="button-secondary size-11 shrink-0 p-0"
          aria-label="Previous month"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
        <select
          aria-label="Month"
          className="field h-11 min-w-0 flex-1 rounded-full py-0 sm:w-36 sm:flex-none"
          value={monthText}
          onChange={(event) => go(`${yearText}-${event.target.value}`)}
        >
          {MONTH_NAMES.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, "0")}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          className="field h-11 w-24 shrink-0 rounded-full py-0"
          value={yearText}
          onChange={(event) => go(`${event.target.value}-${monthText}`)}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <Link
          href={`/expenses?month=${shiftMonthKey(month, 1)}`}
          className="button-secondary size-11 shrink-0 p-0"
          aria-label="Next month"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {month !== currentMonth && (
        <Link
          href={`/expenses?month=${currentMonth}`}
          className="button-secondary h-11 w-full justify-center sm:w-auto"
        >
          This month
        </Link>
      )}
    </nav>
  );
}
