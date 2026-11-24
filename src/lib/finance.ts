import type { Appointment } from "@/types/appointment";
import type { Expense } from "@/types/expense";

/** Sales = every booking amount plus pending amounts of completed appointments. */
export function totalSales(appointments: Appointment[]) {
  return appointments.reduce(
    (total, appointment) =>
      total +
      appointment.bookingAmountPaise / 100 +
      (appointment.isCompleted ? appointment.pendingAmountPaise / 100 : 0),
    0,
  );
}

export function totalExpenses(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amountPaise, 0) / 100;
}

export function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
