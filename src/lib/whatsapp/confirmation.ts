import { formatIndiaDate } from "../format";
import type { Appointment } from "@/types/appointment";

const STUDIO_NAME = "Ravora Beauty Studio and Academy";

function formatTimeForMessage(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Returns digits-only international number (country code first) for wa.me,
 * or null when the number is not usable.
 *
 * Accepted: "+<country code><number>" or "00<country code><number>" (8-15 digits),
 * plus bare Indian mobiles (10 digits, or 91 + 10 digits) for older records.
 */
export function normalizeWhatsAppPhone(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  const international = trimmed.startsWith("+");
  const doubleZero = !international && digits.startsWith("00");

  if (international || doubleZero) {
    const national = doubleZero ? digits.slice(2) : digits;
    if (!/^[1-9]\d{7,14}$/.test(national)) return null;
    // Indian numbers are always 91 followed by a 10 digit mobile.
    if (national.startsWith("91") && !/^91[6-9]\d{9}$/.test(national)) {
      return null;
    }
    return national;
  }

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (/^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}

export function buildWhatsAppConfirmationUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildAppointmentConfirmationMessage(appointment: Appointment) {
  const lines = [
    `Hi ${appointment.clientName},`,
    "",
    `Your appointment at ${STUDIO_NAME} is confirmed.`,
    "",
    `Date: ${formatIndiaDate(appointment.date)}`,
    `Time: ${formatTimeForMessage(appointment.startTime)} – ${formatTimeForMessage(appointment.endTime)}`,
    `Service: ${appointment.service}`,
    `Booking paid: ${formatRupees(appointment.bookingAmount)}`,
    `Pending: ${formatRupees(appointment.pendingAmount)}`,
    "",
    "We look forward to seeing you!",
  ];

  return lines.join("\n");
}

export function getAppointmentWhatsAppConfirmationUrl(
  appointment: Appointment,
): string | null {
  const phone = normalizeWhatsAppPhone(appointment.phone ?? "");
  if (!phone) return null;

  return buildWhatsAppConfirmationUrl(
    phone,
    buildAppointmentConfirmationMessage(appointment),
  );
}
