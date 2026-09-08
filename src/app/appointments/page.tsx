import { getAllAppointments } from "@/actions/appointments";
import { logout } from "@/actions/auth";
import { AppointmentManager } from "@/components/appointment-manager";
import { BrandMark } from "@/components/brand-mark";
import type { Appointment } from "@/types/appointment";
import { todayInIndia } from "@/lib/format";
import { ArrowLeft, IndianRupee, List, LogOut, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "All appointments",
};

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

export default async function AllAppointmentsPage() {
  let appointments: Appointment[] = [];
  let loadError = "";

  try {
    const allAppointments = await getAllAppointments();
    appointments = allAppointments.filter((appointment) => !appointment.isCompleted);
  } catch {
    loadError = "The appointment list couldn’t be loaded. Please refresh and try again.";
  }

  const bookingTotal = amountTotal(appointments, "bookingAmount");
  const pendingTotal = amountTotal(appointments, "pendingAmount");

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
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-charcoal"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to day schedule
        </Link>

        <div className="mt-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
            <List aria-hidden="true" className="size-4 shrink-0" />
            Full schedule
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            All appointments
          </h1>
          <p className="mt-2 text-sm text-muted">
            {appointments.length} pending appointment
            {appointments.length === 1 ? "" : "s"} across the studio calendar.
          </p>
        </div>

        {!loadError && (
          <section
            aria-label="Pending appointment totals"
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="rounded-2xl border border-line bg-paper/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Total booking
              </p>
              <p className="mt-2 flex items-center gap-1 font-display text-3xl font-semibold">
                <IndianRupee aria-hidden="true" className="size-5 text-gold" />
                {formatMoney(bookingTotal).replace("₹", "").trim()}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-paper/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Total pending
              </p>
              <p className="mt-2 flex items-center gap-1 font-display text-3xl font-semibold text-gold-deep">
                <IndianRupee aria-hidden="true" className="size-5" />
                {formatMoney(pendingTotal).replace("₹", "").trim()}
              </p>
            </div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="all-appointments-heading">
          <h2 id="all-appointments-heading" className="sr-only">
            Appointment list
          </h2>

          {loadError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-danger"
            >
              <TriangleAlert aria-hidden="true" className="size-5" />
              <p className="mt-3 font-bold">List unavailable</p>
              <p className="mt-1 text-sm">{loadError}</p>
            </div>
          ) : (
            <AppointmentManager
              appointments={appointments}
              date={todayInIndia()}
              groupByDate
              allowCreate={false}
            />
          )}
        </section>
      </main>
    </div>
  );
}
