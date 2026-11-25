import type { Appointment, AppointmentAssignment } from "@/types/appointment";

/** Incentive in paise for a share of work at a percentage (rounded to the nearest paisa). */
export function incentivePaise(sharePaise: number, percent: number): number {
  // Percentages have at most 2 decimals, so work in hundredths to avoid float drift.
  return Math.round((sharePaise * Math.round(percent * 100)) / 10_000);
}

/** The full bill: booking plus pending. Same amount that counts as sales once completed. */
export function billTotalPaise(
  appointment: Pick<Appointment, "bookingAmountPaise" | "pendingAmountPaise">,
): number {
  return appointment.bookingAmountPaise + appointment.pendingAmountPaise;
}

/** Whether this appointment currently earns incentives. */
export function earnsIncentive(
  appointment: Pick<Appointment, "isCompleted" | "incentiveEnabled">,
): boolean {
  return appointment.isCompleted && appointment.incentiveEnabled;
}

export function assignmentIncentivePaise(
  assignment: Pick<AppointmentAssignment, "amountPaise" | "incentivePercent">,
): number {
  return incentivePaise(assignment.amountPaise, assignment.incentivePercent);
}

/** Incentive earned by an appointment in total (0 unless completed with incentive on). */
export function appointmentIncentivePaise(appointment: Appointment): number {
  if (!earnsIncentive(appointment)) return 0;
  return appointment.assignments.reduce(
    (total, assignment) => total + assignmentIncentivePaise(assignment),
    0,
  );
}

export interface IncentiveItem {
  key: string;
  appointmentId: string;
  date: string;
  clientName: string;
  service: string;
  teamMemberId: string;
  teamMemberName: string;
  workPaise: number;
  percent: number;
  incentivePaise: number;
}

/** One line per person per completed appointment that earns an incentive. */
export function incentiveItems(appointments: Appointment[]): IncentiveItem[] {
  const items: IncentiveItem[] = [];

  for (const appointment of appointments) {
    if (!earnsIncentive(appointment)) continue;

    for (const assignment of appointment.assignments) {
      const amount = assignmentIncentivePaise(assignment);
      if (amount <= 0) continue;

      items.push({
        key: `${appointment.id}:${assignment.teamMemberId}`,
        appointmentId: appointment.id,
        date: appointment.date,
        clientName: appointment.clientName,
        service: appointment.service,
        teamMemberId: assignment.teamMemberId,
        teamMemberName: assignment.teamMemberName,
        workPaise: assignment.amountPaise,
        percent: assignment.incentivePercent,
        incentivePaise: amount,
      });
    }
  }

  return items;
}

export interface MemberIncentiveSummary {
  teamMemberId: string;
  teamMemberName: string;
  appointments: number;
  workPaise: number;
  incentivePaise: number;
}

/** Total incentive per team member, largest first. */
export function summarizeIncentives(
  items: IncentiveItem[],
): MemberIncentiveSummary[] {
  const byMember = new Map<string, MemberIncentiveSummary>();

  for (const item of items) {
    const existing = byMember.get(item.teamMemberId) ?? {
      teamMemberId: item.teamMemberId,
      teamMemberName: item.teamMemberName,
      appointments: 0,
      workPaise: 0,
      incentivePaise: 0,
    };
    existing.appointments += 1;
    existing.workPaise += item.workPaise;
    existing.incentivePaise += item.incentivePaise;
    byMember.set(item.teamMemberId, existing);
  }

  return Array.from(byMember.values()).sort(
    (a, b) =>
      b.incentivePaise - a.incentivePaise ||
      a.teamMemberName.localeCompare(b.teamMemberName),
  );
}

export function totalIncentivePaise(items: IncentiveItem[]): number {
  return items.reduce((total, item) => total + item.incentivePaise, 0);
}

/** Returns an error message when split shares do not add up to the bill. */
export function checkSplitTotal(
  sharesPaise: number[],
  billPaise: number,
): string | null {
  if (sharesPaise.length === 0) return null;
  const assigned = sharesPaise.reduce((total, value) => total + value, 0);
  if (assigned === billPaise) return null;

  const difference = Math.abs(billPaise - assigned) / 100;
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(difference);

  return assigned < billPaise
    ? `The split is ${formatted} short of the bill. Amounts must add up to the total.`
    : `The split is ${formatted} over the bill. Amounts must add up to the total.`;
}
