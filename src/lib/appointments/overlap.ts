import type {
  Appointment,
  AppointmentConflict,
} from "@/types/appointment";

export type TimeInterval = {
  startTime: string | Date;
  endTime: string | Date;
};

function toMilliseconds(value: string | Date): number {
  const milliseconds =
    value instanceof Date ? value.getTime() : new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    throw new RangeError("Interval contains an invalid date.");
  }

  return milliseconds;
}

export function getOverlapMinutes(
  first: TimeInterval,
  second: TimeInterval,
): number {
  const firstStart = toMilliseconds(first.startTime);
  const firstEnd = toMilliseconds(first.endTime);
  const secondStart = toMilliseconds(second.startTime);
  const secondEnd = toMilliseconds(second.endTime);

  if (firstEnd <= firstStart || secondEnd <= secondStart) {
    throw new RangeError("Interval end must be after its start.");
  }

  const overlapMilliseconds =
    Math.min(firstEnd, secondEnd) - Math.max(firstStart, secondStart);

  return Math.max(0, overlapMilliseconds / 60_000);
}

export function intervalsOverlap(
  first: TimeInterval,
  second: TimeInterval,
): boolean {
  return getOverlapMinutes(first, second) > 0;
}

export function findAppointmentConflicts(
  candidate: TimeInterval,
  appointments: Appointment[],
  excludedAppointmentId?: string,
): AppointmentConflict[] {
  return appointments.flatMap((appointment) => {
    if (appointment.id === excludedAppointmentId) return [];

    const appointmentInterval = {
      startTime: new Date(
        `${appointment.date}T${appointment.startTime.slice(0, 5)}:00+05:30`,
      ),
      endTime: new Date(
        `${appointment.date}T${appointment.endTime.slice(0, 5)}:00+05:30`,
      ),
    };
    const overlapMinutes = getOverlapMinutes(candidate, appointmentInterval);
    if (overlapMinutes === 0) return [];

    return [
      {
        id: appointment.id,
        clientName: appointment.clientName,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        overlapMinutes,
      },
    ];
  });
}
