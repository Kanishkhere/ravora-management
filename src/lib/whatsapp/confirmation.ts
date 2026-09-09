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

export function normalizeIndiaWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]\d{9}$/.test(digits)) {
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
  const phone = normalizeIndiaWhatsAppPhone(appointment.phone ?? "");
  if (!phone) return null;

  return buildWhatsAppConfirmationUrl(
    phone,
    buildAppointmentConfirmationMessage(appointment),
  );
}
