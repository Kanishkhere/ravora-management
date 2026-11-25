import { describe, expect, it } from "vitest";

import {
  appointmentInputSchema,
  moneySchema,
  rupeesToPaise,
} from "./appointment";

const validInput = {
  clientName: "Meera Shah",
  phone: "",
  service: "Gel nails",
  description: "",
  date: "2026-09-08",
  startTime: "10:00",
  endTime: "11:00",
  bookingAmount: "500.50",
  pendingAmount: "250",
  bookingPaymentMode: "cash",
  pendingPaymentMode: "online",
} as const;

describe("appointment validation", () => {
  it("accepts valid appointment details", () => {
    expect(appointmentInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts a valid Indian mobile number", () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        phone: "+91 98765 43210",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid phone number", () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        phone: "12345",
      }).success,
    ).toBe(false);
  });

  it("accepts international phone numbers with a country code", () => {
    for (const phone of ["+44 7700 900123", "+971501234567", "+1 415 555 2671"]) {
      expect(
        appointmentInputSchema.safeParse({ ...validInput, phone }).success,
      ).toBe(true);
    }
  });

  it("rejects a foreign number without a country code", () => {
    expect(
      appointmentInputSchema.safeParse({ ...validInput, phone: "2079460958" })
        .success,
    ).toBe(false);
  });

  it("accepts one team member for the whole bill, with or without a matching amount", () => {
    const member = "11111111-1111-4111-8111-111111111111";
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        assignments: [
          { teamMemberId: member, amount: "750.50", incentivePercent: "10" },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires a split between members to add up to the bill", () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    const split = (first: string, second: string) =>
      appointmentInputSchema.safeParse({
        ...validInput,
        assignments: [
          { teamMemberId: a, amount: first, incentivePercent: "10" },
          { teamMemberId: b, amount: second, incentivePercent: "5" },
        ],
      }).success;

    expect(split("500.50", "250")).toBe(true);
    expect(split("500.50", "200")).toBe(false);
  });

  it("rejects the same member twice and out-of-range percentages", () => {
    const a = "11111111-1111-4111-8111-111111111111";
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        assignments: [
          { teamMemberId: a, amount: "500.50", incentivePercent: "10" },
          { teamMemberId: a, amount: "250", incentivePercent: "10" },
        ],
      }).success,
    ).toBe(false);
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        assignments: [
          { teamMemberId: a, amount: "750.50", incentivePercent: "101" },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid payment mode", () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        bookingPaymentMode: "card",
      }).success,
    ).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        date: "2026-02-29",
      }).success,
    ).toBe(false);
  });

  it("requires the end time to be after the start time", () => {
    expect(
      appointmentInputSchema.safeParse({
        ...validInput,
        endTime: "10:00",
      }).success,
    ).toBe(false);
  });

  it.each(["-1", "1.001", "1,000", ""])(
    "rejects invalid money value %j",
    (amount) => {
      expect(moneySchema.safeParse(amount).success).toBe(false);
    },
  );

  it("converts decimal rupees to integer paise exactly", () => {
    expect(rupeesToPaise("500.50")).toBe(50_050);
    expect(rupeesToPaise("250")).toBe(25_000);
    expect(rupeesToPaise("0.05")).toBe(5);
  });
});
