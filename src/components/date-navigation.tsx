"use client";

import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { todayInIndia } from "@/lib/format";

type DateNavigationProps = {
  date: string;
};

export function DateNavigation({ date }: DateNavigationProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const current = parseISO(date);
  const previous = format(addDays(current, -1), "yyyy-MM-dd");
  const next = format(addDays(current, 1), "yyyy-MM-dd");
  const today = todayInIndia();
  const formattedDate = format(current, "MMM d, yyyy");

  function goToDate(value: string) {
    if (!value || value === date) return;
    router.push(`/?date=${value}`);
  }

  function openDatePicker() {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <nav
      aria-label="Schedule date"
      className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[18rem]"
    >
      <div className="flex w-full items-center gap-2">
        <Link
          href={`/?date=${previous}`}
          className="button-secondary size-11 shrink-0 p-0"
          aria-label="Previous day"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={openDatePicker}
            className="button-secondary h-11 w-full min-w-0 gap-2 px-3 sm:px-4"
            aria-label={`Jump to date, currently ${formattedDate}`}
          >
            <CalendarDays
              aria-hidden="true"
              className="size-4 shrink-0 text-gold-deep"
            />
            <span className="truncate">{formattedDate}</span>
          </button>
          <input
            ref={inputRef}
            type="date"
            value={date}
            onChange={(event) => goToDate(event.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <Link
          href={`/?date=${next}`}
          className="button-secondary size-11 shrink-0 p-0"
          aria-label="Next day"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {date !== today && (
        <Link
          href={`/?date=${today}`}
          className="button-secondary h-11 w-full justify-center sm:w-auto"
        >
          Today
        </Link>
      )}
    </nav>
  );
}
