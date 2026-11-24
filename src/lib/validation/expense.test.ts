import { describe, expect, it } from "vitest";

import { expenseInputSchema, monthKeySchema } from "./expense";

const validInput = {
  date: "2026-10-12",
  category: "Supplies",
  description: "Gel polish restock",
  amount: "1250.50",
  paymentMode: "online",
} as const;

describe("expense validation", () => {
  it("accepts valid expense details", () => {
    expect(expenseInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a zero amount", () => {
    expect(
      expenseInputSchema.safeParse({ ...validInput, amount: "0" }).success,
    ).toBe(false);
  });

  it("rejects negative and over-precise amounts", () => {
    expect(
      expenseInputSchema.safeParse({ ...validInput, amount: "-5" }).success,
    ).toBe(false);
    expect(
      expenseInputSchema.safeParse({ ...validInput, amount: "1.234" }).success,
    ).toBe(false);
  });

  it("requires a description and valid date", () => {
    expect(
      expenseInputSchema.safeParse({ ...validInput, description: "  " })
        .success,
    ).toBe(false);
    expect(
      expenseInputSchema.safeParse({ ...validInput, date: "2026-02-30" })
        .success,
    ).toBe(false);
  });

  it("validates month keys", () => {
    expect(monthKeySchema.safeParse("2026-10").success).toBe(true);
    expect(monthKeySchema.safeParse("2026-13").success).toBe(false);
    expect(monthKeySchema.safeParse("2026-1").success).toBe(false);
  });
});
