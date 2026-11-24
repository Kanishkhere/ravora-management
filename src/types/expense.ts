import type { PaymentMode } from "./appointment";

export const EXPENSE_CATEGORIES = [
  "Supplies",
  "Rent",
  "Utilities",
  "Salary",
  "Marketing",
  "Equipment",
  "Other",
] as const;

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  /** Rupee value for display and form editing. Persistence remains integer paise. */
  amount: number;
  amountPaise: number;
  paymentMode: PaymentMode;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  id?: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  paymentMode: PaymentMode;
}

export type SaveExpenseResult =
  | { success: true; expense: Expense }
  | {
      success: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    };

export type DeleteExpenseResult =
  | { success: true }
  | { success: false; error: string };
