import { z } from "zod";

import { dateSchema, paymentModeSchema, rupeesToPaise } from "./appointment";

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export const expenseAmountSchema = z
  .string()
  .trim()
  .regex(
    MONEY_PATTERN,
    "Enter an amount with no more than 2 decimal places.",
  )
  .refine((value) => rupeesToPaise(value) > 0, "Amount must be more than 0.")
  .refine(
    (value) => rupeesToPaise(value) <= 2_147_483_647,
    "Amount is too large.",
  );

export const expenseInputSchema = z.object({
  id: z.uuid("Expense ID is invalid.").optional(),
  date: dateSchema,
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(60, "Category must be 60 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(200, "Description must be 200 characters or fewer."),
  amount: expenseAmountSchema,
  paymentMode: paymentModeSchema,
});

export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Enter a valid month in YYYY-MM format.");
