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
