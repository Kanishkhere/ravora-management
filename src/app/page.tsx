import { getAppointmentsForDate } from "@/actions/appointments";
import { logout } from "@/actions/auth";
import type { Appointment } from "@/types/appointment";
import { AppointmentManager } from "@/components/appointment-manager";
import { BrandMark } from "@/components/brand-mark";
import { DateNavigation } from "@/components/date-navigation";
import { todayInIndia } from "@/lib/format";
import { format, isValid, parseISO } from "date-fns";
import { CalendarDays, IndianRupee, LogOut, TriangleAlert } from "lucide-react";

type HomeProps = {
  searchParams: Promise<{ date?: string | string[] }>;
};

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

function amountTotal(appointments: Appointment[], key: keyof Appointment) {
  return appointments.reduce((total, appointment) => {
    const value = Number(appointment[key] ?? 0);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const date = validDate(requestedDate)
    ? requestedDate!
    : todayInIndia();

  let appointments: Appointment[] = [];
  let loadError = "";

  try {
    appointments = await getAppointmentsForDate(date);
    appointments.sort((a, b) =>
      String(a.startTime).localeCompare(String(b.startTime)),
    );
  } catch {
    loadError = "The schedule couldn’t be loaded. Please refresh and try again.";
  }

  const bookingTotal = amountTotal(appointments, "bookingAmount");
  const pendingTotal = amountTotal(appointments, "pendingAmount");
  const selectedDate = parseISO(date);

  return (
    <div className="paper-texture min-h-screen">
      <header className="border-b border-line/80 bg-paper/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <BrandMark priority className="min-w-0" />
          <form action={logout}>
            <button
              type="submit"
              className="button-secondary size-11 p-0 sm:w-auto sm:px-4"
              aria-label="Log out"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
              Day schedule
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {format(selectedDate, "EEEE")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
          <DateNavigation date={date} />
        </div>

        <section
          aria-label="Daily summary"
          className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-line bg-paper/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Appointments
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">
              {appointments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Booking total
            </p>
            <p className="mt-2 flex items-center gap-1 font-display text-3xl font-semibold">
              <IndianRupee aria-hidden="true" className="size-5 text-gold" />
              {formatMoney(bookingTotal).replace("₹", "").trim()}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Pending total
            </p>
            <p className="mt-2 flex items-center gap-1 font-display text-3xl font-semibold text-gold-deep">
              <IndianRupee aria-hidden="true" className="size-5" />
              {formatMoney(pendingTotal).replace("₹", "").trim()}
            </p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="schedule-heading">
          <div className="mb-5">
            <h2
              id="schedule-heading"
              className="font-display text-2xl font-semibold sm:text-3xl"
            >
              Day’s flow
            </h2>
            <p className="mt-1 text-sm text-muted">
              Appointments are arranged by start time.
            </p>
          </div>

          {loadError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-danger"
            >
              <TriangleAlert aria-hidden="true" className="size-5" />
              <p className="mt-3 font-bold">Schedule unavailable</p>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          ) : (
            <AppointmentManager appointments={appointments} date={date} />
          )}
        </section>
      </main>
    </div>
  );
}
