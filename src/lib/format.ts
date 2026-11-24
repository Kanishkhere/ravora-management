import { format, parseISO } from "date-fns";

export const INDIA_TIME_ZONE = "Asia/Kolkata";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPaise(paise: number): string {
  return inrFormatter.format(paise / 100);
}

export function toIndiaIsoInstant(date: string, time: string): string {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

export function formatIndiaTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parseISO(isoTimestamp));
}

export function formatIndiaDate(
  isoDateOrTimestamp: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: INDIA_TIME_ZONE,
  }).format(parseISO(isoDateOrTimestamp));
}

export function todayInIndia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function currentMonthRangeInIndia(referenceDate = todayInIndia()) {
  const [year, month] = referenceDate.split("-");
  const monthNumber = Number(month);
  const lastDay = new Date(Number(year), monthNumber, 0).getDate();

  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function currentMonthLabelInIndia(referenceDate = todayInIndia()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    month: "long",
  }).format(parseISO(referenceDate));
}

export function formatDateInput(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function currentMonthKeyInIndia(referenceDate = todayInIndia()) {
  return referenceDate.slice(0, 7);
}

export function isMonthKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

/** First and last calendar day (YYYY-MM-DD) of a YYYY-MM month key. */
export function monthRangeFromKey(monthKey: string) {
  return currentMonthRangeInIndia(`${monthKey}-01`);
}

export function formatMonthKey(monthKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

export function shiftMonthKey(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}
