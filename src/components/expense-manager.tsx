"use client";

import { Edit3, IndianRupee, Plus, Receipt, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { deleteExpense, saveExpense } from "@/actions/expenses";
import { formatIndiaDate } from "@/lib/format";
import { formatRupees } from "@/lib/finance";
import { Spinner } from "./pending";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/expense";

type ExpenseManagerProps = {
  expenses: Expense[];
  /** Default date for new expenses (YYYY-MM-DD, inside the selected month). */
  defaultDate: string;
};

function FieldError({
  errors,
  name,
}: {
  errors: Record<string, string[]>;
  name: string;
}) {
  const message = errors[name]?.[0];
  if (!message) return null;
  return <span className="mt-1.5 block text-xs text-danger">{message}</span>;
}

export function ExpenseManager({ expenses, defaultDate }: ExpenseManagerProps) {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (dialogOpen) {
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    }
  }, [dialogOpen]);

  function openDialog(expense: Expense | null) {
    setEditing(expense);
    setError("");
    setFieldErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    if (pending) return;
    setDialogOpen(false);
    setError("");
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const result = await saveExpense({
        id: editing?.id,
        date: String(form.get("date")),
        category: String(form.get("category")),
        description: String(form.get("description")).trim(),
        amount: String(form.get("amount")),
        paymentMode: String(form.get("paymentMode")) as "online" | "cash",
      });

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      setError(result.error || "We couldn’t save this expense. Please try again.");
    } catch {
      setError("We couldn’t save this expense. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    setError("");
    try {
      const result = await deleteExpense(deleting.id);
      if (result.success) {
        setDeleting(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("We couldn’t delete this expense.");
    } finally {
      setPending(false);
    }
  }

  const categories = editing && !EXPENSE_CATEGORIES.includes(
    editing.category as (typeof EXPENSE_CATEGORIES)[number],
  )
    ? [...EXPENSE_CATEGORIES, editing.category]
    : EXPENSE_CATEGORIES;

  return (
    <>
      <button
        type="button"
        className="button-primary w-full sm:w-auto"
        onClick={() => openDialog(null)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add expense
      </button>

      {error && !dialogOpen && !deleting && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {expenses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper/70 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
              <Receipt aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">
              No expenses this month
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              Add supplies, rent, or any other spending to see it alongside
              this month’s sales.
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <article
              key={expense.id}
              className="grid gap-3 rounded-2xl border border-line bg-paper p-4 shadow-[0_10px_35px_rgb(70_55_30/4%)] sm:grid-cols-[8rem_minmax(0,1fr)_auto_auto] sm:items-center sm:p-5"
            >
              <p className="text-sm font-bold text-gold-deep">
                {formatIndiaDate(expense.date, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-display text-xl font-semibold leading-tight break-words">
                    {expense.description}
                  </h3>
                  <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-gold-deep">
                    {expense.category}
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                    {expense.paymentMode === "online" ? "Online" : "Cash"}
                  </span>
                </div>
              </div>
              <p className="flex items-center gap-1 font-display text-2xl font-semibold">
                <IndianRupee aria-hidden="true" className="size-4 text-gold" />
                {formatRupees(expense.amount).replace("₹", "").trim()}
              </p>
              <div className="flex items-center justify-end gap-1 border-t border-line pt-3 sm:border-0 sm:pt-0">
                <button
                  type="button"
                  className="rounded-full p-2.5 text-muted transition hover:bg-cream hover:text-charcoal"
                  onClick={() => openDialog(expense)}
                  aria-label={`Edit expense ${expense.description}`}
                >
                  <Edit3 aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-2.5 text-muted transition hover:bg-red-50 hover:text-danger"
                  onClick={() => {
                    setError("");
                    setDeleting(expense);
                  }}
                  aria-label={`Delete expense ${expense.description}`}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {dialogOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-[3px]"
          />
          <div
            role="dialog"
            aria-labelledby="expense-dialog-title"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 m-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-0 text-charcoal shadow-2xl sm:inset-0 sm:m-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(36rem,calc(100%-2rem))] sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
                  {editing ? "Update expense" : "New expense"}
                </p>
                <h2
                  id="expense-dialog-title"
                  className="mt-1 font-display text-2xl font-semibold sm:text-3xl"
                >
                  Expense details
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-full p-2 text-muted hover:bg-cream"
                aria-label="Close expense form"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              <label className="block">
                <span className="field-label">Description</span>
                <input
                  ref={firstFieldRef}
                  className="field"
                  name="description"
                  defaultValue={editing?.description ?? ""}
                  placeholder="e.g. Gel polish restock"
                  required
                  maxLength={200}
                />
                <FieldError errors={fieldErrors} name="description" />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">Category</span>
                  <select
                    className="field"
                    name="category"
                    defaultValue={editing?.category ?? EXPENSE_CATEGORIES[0]}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={fieldErrors} name="category" />
                </label>
                <label className="block">
                  <span className="field-label">Date</span>
                  <input
                    className="field"
                    name="date"
                    type="date"
                    defaultValue={editing?.date ?? defaultDate}
                    required
                  />
                  <FieldError errors={fieldErrors} name="date" />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">Amount</span>
                  <input
                    className="field"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={editing ? String(editing.amount) : ""}
                    placeholder="0"
                    required
                  />
                  <FieldError errors={fieldErrors} name="amount" />
                </label>
                <label className="block">
                  <span className="field-label">Payment mode</span>
                  <select
                    className="field"
                    name="paymentMode"
                    defaultValue={editing?.paymentMode ?? "cash"}
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                  <FieldError errors={fieldErrors} name="paymentMode" />
                </label>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={closeDialog}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={pending}
                >
                  {pending && <Spinner />}
                  {pending ? "Saving…" : editing ? "Save changes" : "Add expense"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {deleting && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-[3px]"
          />
          <div
            role="dialog"
            aria-labelledby="delete-expense-title"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 m-0 max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-5 text-charcoal shadow-2xl sm:inset-0 sm:m-auto sm:max-h-none sm:w-[min(28rem,calc(100%-2rem))] sm:rounded-3xl sm:p-7"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-danger">
              <Trash2 aria-hidden="true" className="size-5" />
            </div>
            <h2
              id="delete-expense-title"
              className="mt-4 font-display text-2xl font-semibold sm:text-3xl"
            >
              Delete expense?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This will permanently remove{" "}
              <strong className="text-charcoal">{deleting.description}</strong>{" "}
              ({formatRupees(deleting.amount)}).
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setDeleting(null)}
                disabled={pending}
              >
                Keep it
              </button>
              <button
                type="button"
                className="button-primary border-danger bg-danger hover:bg-danger"
                onClick={confirmDelete}
                disabled={pending}
              >
                {pending && <Spinner />}
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
