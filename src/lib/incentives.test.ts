import { describe, expect, it } from "vitest";

import type { Appointment, AppointmentAssignment } from "@/types/appointment";

import {
  appointmentIncentivePaise,
  checkSplitTotal,
  incentiveItems,
  incentivePaise,
  summarizeIncentives,
  totalIncentivePaise,
} from "./incentives";

function assignment(
  id: string,
  name: string,
  amount: number,
  percent: number,
): AppointmentAssignment {
  return {
    teamMemberId: id,
    teamMemberName: name,
    amount,
    amountPaise: amount * 100,
    incentivePercent: percent,
  };
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "a1",
    clientName: "Priya",
    phone: null,
    service: "Acrylic nails",
    description: null,
    date: "2026-10-12",
    startTime: "10:00",
    endTime: "11:00",
    bookingAmount: 1000,
    pendingAmount: 1500,
    bookingAmountPaise: 100_000,
    pendingAmountPaise: 150_000,
    bookingPaymentMode: "cash",
    pendingPaymentMode: "cash",
    isCompleted: true,
    incentiveEnabled: true,
    assignments: [
      assignment("m1", "Asha", 1000, 10),
      assignment("m2", "Ben", 1500, 5),
    ],
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("incentivePaise", () => {
  it("applies the percentage to the share", () => {
    expect(incentivePaise(100_000, 10)).toBe(10_000);
    expect(incentivePaise(150_000, 5)).toBe(7_500);
  });

  it("rounds to the nearest paisa", () => {
    expect(incentivePaise(100_001, 12.5)).toBe(12_500);
    expect(incentivePaise(333, 10)).toBe(33);
    expect(incentivePaise(335, 10)).toBe(34);
  });

  it("returns 0 for 0 percent", () => {
    expect(incentivePaise(250_000, 0)).toBe(0);
  });
});

describe("appointmentIncentivePaise", () => {
  it("adds up each person's incentive on a completed appointment", () => {
    expect(appointmentIncentivePaise(appointment())).toBe(17_500);
  });

  it("is zero until the appointment is completed", () => {
    expect(appointmentIncentivePaise(appointment({ isCompleted: false }))).toBe(
      0,
    );
  });

  it("is zero when incentive is switched off", () => {
    expect(
      appointmentIncentivePaise(appointment({ incentiveEnabled: false })),
    ).toBe(0);
  });
});

describe("incentive items and summary", () => {
  it("skips unfinished, opted-out and 0% work", () => {
    const items = incentiveItems([
      appointment(),
      appointment({ id: "a2", isCompleted: false }),
      appointment({ id: "a3", incentiveEnabled: false }),
      appointment({
        id: "a4",
        assignments: [assignment("m3", "Cara", 2500, 0)],
      }),
    ]);

    expect(items.map((item) => item.key)).toEqual(["a1:m1", "a1:m2"]);
    expect(totalIncentivePaise(items)).toBe(17_500);
  });

  it("totals per member across appointments, largest first", () => {
    const items = incentiveItems([
      appointment(),
      appointment({
        id: "a5",
        assignments: [assignment("m2", "Ben", 2500, 10)],
        bookingAmountPaise: 250_000,
        pendingAmountPaise: 0,
      }),
    ]);
    const summary = summarizeIncentives(items);

    expect(summary).toEqual([
      {
        teamMemberId: "m2",
        teamMemberName: "Ben",
        appointments: 2,
        workPaise: 400_000,
        incentivePaise: 32_500,
      },
      {
        teamMemberId: "m1",
        teamMemberName: "Asha",
        appointments: 1,
        workPaise: 100_000,
        incentivePaise: 10_000,
      },
    ]);
  });
});

describe("checkSplitTotal", () => {
  it("accepts a split that matches the bill", () => {
    expect(checkSplitTotal([100_000, 150_000], 250_000)).toBeNull();
  });

  it("reports a short or over split", () => {
    expect(checkSplitTotal([100_000, 100_000], 250_000)).toContain("short");
    expect(checkSplitTotal([200_000, 100_000], 250_000)).toContain("over");
  });

  it("has nothing to check without assignments", () => {
    expect(checkSplitTotal([], 250_000)).toBeNull();
  });
});
