import { getAppointmentsForMonth } from "@/actions/appointments";
import { getExpensesForMonth } from "@/actions/expenses";
import { AppNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { BrandMark } from "@/components/brand-mark";
import { ExpenseManager } from "@/components/expense-manager";
import { MonthFilter } from "@/components/month-filter";
import {
  currentMonthKeyInIndia,
  formatMonthKey,
  isMonthKey,
  todayInIndia,
} from "@/lib/format";
import { formatRupees, totalExpenses, totalSales } from "@/lib/finance";
import {
  incentiveItems,
  summarizeIncentives,
  totalIncentivePaise,
} from "@/lib/incentives";
import type { Appointment } from "@/types/appointment";
import type { Expense } from "@/types/expense";
import { Receipt, TriangleAlert, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expenses",
};

type ExpensesPageProps = {
  searchParams: Promise<{ month?: string | string[] }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const requested = Array.isArray(params.month) ? params.month[0] : params.month;
  const currentMonth = currentMonthKeyInIndia();
  const month = isMonthKey(requested) ? requested : currentMonth;
  const monthLabel = formatMonthKey(month);

  // Load independently so a problem with one doesn't hide the other.
  const [salesResult, expensesResult] = await Promise.allSettled([
    getAppointmentsForMonth(month),
    getExpensesForMonth(month),
  ]);

  const appointments: Appointment[] =
    salesResult.status === "fulfilled" ? salesResult.value : [];
  const expenses: Expense[] =
    expensesResult.status === "fulfilled" ? expensesResult.value : [];
  const salesError = salesResult.status === "rejected";
  const expensesError = expensesResult.status === "rejected";

  const sales = totalSales(appointments);
  const manualExpenses = totalExpenses(expenses);
  // Incentives are earned by completed appointments and count as an expense.
  const incentives = salesError ? [] : incentiveItems(appointments);
  const incentiveSummary = summarizeIncentives(incentives);
  const incentiveTotal = totalIncentivePaise(incentives) / 100;
  const spent = manualExpenses + incentiveTotal;
  const net = sales - spent;

  // New expenses default to today when viewing the current month, otherwise
  // the first day of the selected month.
  const defaultDate = month === currentMonth ? todayInIndia() : `${month}-01`;

  return (
    <div className="paper-texture min-h-screen">
      <header className="border-b border-line/80 bg-paper/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <BrandMark priority className="min-w-0" />
          <LogoutButton />
        </div>
      </header>
      <AppNav />

      <main data-pending-dim className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
              <Receipt aria-hidden="true" className="size-4 shrink-0" />
              Expenses
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {monthLabel}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sales and expenses for the selected month.
            </p>
          </div>
          <MonthFilter month={month} />
        </div>

        <section
          aria-label={`Summary for ${monthLabel}`}
          className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3"
        >
          <div className="rounded-2xl border border-line bg-emerald-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/70">
              Total sales
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-emerald-900">
              {salesError ? "—" : formatRupees(sales)}
            </p>
            <p className="mt-1 text-xs text-emerald-900/70">
              {appointments.length} appointment
              {appointments.length === 1 ? "" : "s"} · bookings plus pending
              from completed
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Total expenses
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-gold-deep">
              {expensesError ? "—" : formatRupees(spent)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatRupees(manualExpenses)} expenses +{" "}
              {formatRupees(incentiveTotal)} incentives
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-paper/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">
              Net (sales − expenses)
            </p>
            <p
              className={`mt-2 font-display text-3xl font-semibold ${
                net < 0 ? "text-danger" : ""
              }`}
            >
              {salesError || expensesError ? "—" : formatRupees(net)}
            </p>
            <p className="mt-1 text-xs text-muted">{monthLabel}</p>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="incentives-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2
                id="incentives-heading"
                className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl"
              >
                <Users aria-hidden="true" className="size-5 text-gold" />
                Team incentives
              </h2>
              <p className="mt-1 text-sm text-muted">
                Earned on completed appointments in {monthLabel}. Use these
                totals when working out salaries.
              </p>
            </div>
            <p className="font-display text-2xl font-semibold text-gold-deep">
              {salesError ? "—" : formatRupees(incentiveTotal)}
            </p>
          </div>

          {salesError ? null : incentiveSummary.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line bg-paper/70 px-5 py-6 text-sm text-muted">
              No incentives earned in {monthLabel}. They appear here once
              appointments with a team member and incentive are marked done.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {incentiveSummary.map((member) => (
                <li
                  key={member.teamMemberId}
                  className="rounded-2xl border border-line bg-paper p-4"
                >
                  <p className="font-display text-xl font-semibold leading-tight">
                    {member.teamMemberName}
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold text-gold-deep">
                    {formatRupees(member.incentivePaise / 100)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {member.appointments} appointment
                    {member.appointments === 1 ? "" : "s"} ·{" "}
                    {formatRupees(member.workPaise / 100)} of work
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10" aria-labelledby="expenses-heading">
          <h2
            id="expenses-heading"
            className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl"
          >
            <Receipt aria-hidden="true" className="size-5 text-gold" />
            Expenses
          </h2>

          {salesError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
            >
              This month’s sales couldn’t be loaded. Please refresh and try again.
            </p>
          )}

          {expensesError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-6 text-danger"
            >
              <TriangleAlert aria-hidden="true" className="size-5" />
              <p className="mt-3 font-bold">Expenses unavailable</p>
              <p className="mt-1 text-sm">
                The expenses couldn’t be loaded. Please refresh and try again.
              </p>
            </div>
          ) : (
            <ExpenseManager
              expenses={expenses}
              incentives={incentives}
              defaultDate={defaultDate}
            />
          )}
        </section>
      </main>
    </div>
  );
}
