"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { monthRangeFromKey } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { rupeesToPaise } from "@/lib/validation/appointment";
import { expenseInputSchema, monthKeySchema } from "@/lib/validation/expense";
import type { PaymentMode } from "@/types/appointment";
import type { ExpenseRow } from "@/types/database";
import type {
  DeleteExpenseResult,
  Expense,
  ExpenseInput,
  SaveExpenseResult,
} from "@/types/expense";

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: row.expense_date,
    category: row.category,
    description: row.description,
    amount: row.amount_paise / 100,
    amountPaise: row.amount_paise,
    paymentMode: (row.payment_mode === "online" ? "online" : "cash") as PaymentMode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

export async function getExpensesForMonth(monthKey: string): Promise<Expense[]> {
  const parsed = monthKeySchema.safeParse(monthKey);
  if (!parsed.success) {
    throw new Error("Invalid month.");
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { start, end } = monthRangeFromKey(parsed.data);
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", start)
    .lte("expense_date", end)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load expenses.");
  }

  return (data as ExpenseRow[]).map(toExpense);
}

export async function saveExpense(
  input: ExpenseInput,
): Promise<SaveExpenseResult> {
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted expense details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const value = parsed.data;
  const record = {
    expense_date: value.date,
    category: value.category,
    description: value.description,
    amount_paise: rupeesToPaise(value.amount),
    payment_mode: value.paymentMode,
  };

  const mutation = value.id
    ? supabase
        .from("expenses")
        .update(record)
        .eq("id", value.id)
        .select("*")
        .single()
    : supabase.from("expenses").insert(record).select("*").single();

  const { data, error } = await mutation;
  if (error || !data) {
    return {
      success: false,
      error: value.id
        ? "Unable to update the expense."
        : "Unable to save the expense.",
    };
  }

  revalidatePath("/expenses");
  return { success: true, expense: toExpense(data as ExpenseRow) };
}

export async function deleteExpense(id: string): Promise<DeleteExpenseResult> {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "Invalid expense ID." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Unable to delete the expense." };
  }

  revalidatePath("/expenses");
  return { success: true };
}
