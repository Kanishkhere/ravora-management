import { describe, expect, it } from "vitest";

import type { Appointment } from "@/types/appointment";

import {
  buildAppointmentConfirmationMessage,
  buildWhatsAppConfirmationUrl,
  getAppointmentWhatsAppConfirmationUrl,
  normalizeIndiaWhatsAppPhone,
} from "./confirmation";

const sampleAppointment: Appointment = {
  id: "00000000-0000-4000-8000-000000000001",
  clientName: "Priya",
  phone: "9876543210",
  service: "Acrylic nails",
  description: null,
  date: "2026-09-12",
  startTime: "10:00",
  endTime: "11:00",
  bookingAmount: 500,
  pendingAmount: 250,
  bookingAmountPaise: 50_000,
  pendingAmountPaise: 25_000,
  bookingPaymentMode: "cash",
  pendingPaymentMode: "cash",
  isCompleted: false,
  createdAt: "2026-09-08T10:00:00.000Z",
  updatedAt: "2026-09-08T10:00:00.000Z",
};

describe("normalizeIndiaWhatsAppPhone", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["+91 98765 43210", "919876543210"],
    ["919876543210", "919876543210"],
    ["09876543210", null],
    ["12345", null],
    ["", null],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeIndiaWhatsAppPhone(input)).toBe(expected);
  });
});

describe("buildWhatsAppConfirmationUrl", () => {
  it("builds a wa.me link with encoded message text", () => {
    const url = buildWhatsAppConfirmationUrl("919876543210", "Hello there");

    expect(url).toBe("https://wa.me/919876543210?text=Hello%20there");
  });
});

describe("buildAppointmentConfirmationMessage", () => {
  it("includes the studio name and appointment details", () => {
    const message = buildAppointmentConfirmationMessage(sampleAppointment);

    expect(message).toContain("Hi Priya,");
    expect(message).toContain("Ravora Beauty Studio and Academy");
    expect(message).toContain("Service: Acrylic nails");
    expect(message).toContain("Booking paid:");
    expect(message).toContain("Pending:");
  });
});

describe("getAppointmentWhatsAppConfirmationUrl", () => {
  it("returns a wa.me url when the phone is valid", () => {
    const url = getAppointmentWhatsAppConfirmationUrl(sampleAppointment);

    expect(url).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(url).toContain(encodeURIComponent("Hi Priya,"));
  });

  it("returns null when the phone is missing or invalid", () => {
    expect(
      getAppointmentWhatsAppConfirmationUrl({
        ...sampleAppointment,
        phone: null,
      }),
    ).toBeNull();
    expect(
      getAppointmentWhatsAppConfirmationUrl({
        ...sampleAppointment,
        phone: "123",
      }),
    ).toBeNull();
  });
});
