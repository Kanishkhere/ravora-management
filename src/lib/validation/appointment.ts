import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const dateSchema = z
  .string()
  .refine(isCalendarDate, "Enter a valid date in YYYY-MM-DD format.");

export const timeSchema = z
  .string()
  .regex(TIME_PATTERN, "Enter a valid time in HH:mm format.");

export const moneySchema = z
  .string()
  .trim()
  .regex(
    MONEY_PATTERN,
    "Enter a non-negative amount with no more than 2 decimal places.",
  )
  .refine(
    (value) => rupeesToPaise(value) <= 2_147_483_647,
    "Amount is too large.",
  );

export const paymentModeSchema = z.enum(["online", "cash"], {
  message: "Choose online or cash.",
});

export const appointmentInputSchema = z
  .object({
    id: z.uuid("Appointment ID is invalid.").optional(),
    clientName: z
      .string()
      .trim()
      .min(1, "Client name is required.")
      .max(120, "Client name must be 120 characters or fewer."),
    phone: z
      .string()
      .trim()
      .max(30, "Phone must be 30 characters or fewer.")
      .optional()
      .default(""),
    service: z
      .string()
      .trim()
      .min(1, "Service is required.")
      .max(160, "Service must be 160 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(2_000, "Description must be 2,000 characters or fewer.")
      .optional()
      .default(""),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    bookingAmount: moneySchema,
    pendingAmount: moneySchema,
    bookingPaymentMode: paymentModeSchema,
    pendingPaymentMode: paymentModeSchema,
    forceOverlap: z.boolean().optional().default(false),
  })
  .superRefine((value, context) => {
    if (value.endTime <= value.startTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
  });

export type ValidatedAppointmentInput = z.infer<
  typeof appointmentInputSchema
>;

export function rupeesToPaise(value: string): number {
  const [rupees, fraction = ""] = value.trim().split(".");
  return Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
}
