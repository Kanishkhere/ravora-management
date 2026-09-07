import { describe, expect, it } from "vitest";

import type { Appointment } from "@/types/appointment";

import {
  findAppointmentConflicts,
  getOverlapMinutes,
  intervalsOverlap,
} from "./overlap";

const interval = (startTime: string, endTime: string) => ({
  startTime: `2026-09-08T${startTime}:00+05:30`,
  endTime: `2026-09-08T${endTime}:00+05:30`,
});

describe("appointment interval overlap", () => {
  it("returns the exact overlap in minutes", () => {
    expect(
      getOverlapMinutes(interval("10:00", "11:00"), interval("10:50", "11:30")),
    ).toBe(10);
  });

  it("does not treat touching boundaries as an overlap", () => {
    expect(
      intervalsOverlap(interval("10:00", "11:00"), interval("11:00", "12:00")),
    ).toBe(false);
  });

  it("calculates overlap when one interval contains another", () => {
    expect(
      getOverlapMinutes(interval("09:00", "13:00"), interval("10:15", "11:45")),
    ).toBe(90);
  });

  it("excludes the edited appointment", () => {
    const appointment: Appointment = {
      id: "7459bd1d-f113-42a6-87f0-a3847ed8a5da",
      clientName: "Asha",
      phone: null,
      service: "Nails",
      description: null,
      date: "2026-09-08",
      startTime: "10:00",
      endTime: "11:00",
      bookingAmount: 500,
      pendingAmount: 250,
      bookingAmountPaise: 50_000,
      pendingAmountPaise: 25_000,
      bookingPaymentMode: "cash",
      pendingPaymentMode: "online",
      isCompleted: false,
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    };

    expect(
      findAppointmentConflicts(
        interval("10:30", "11:30"),
        [appointment],
        appointment.id,
      ),
    ).toEqual([]);
  });

  it("rejects inverted intervals", () => {
    expect(() =>
      getOverlapMinutes(interval("11:00", "10:00"), interval("09:00", "12:00")),
    ).toThrow(RangeError);
  });
});
