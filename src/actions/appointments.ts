"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOverlapMinutes } from "@/lib/appointments/overlap";
import { toIndiaIsoInstant } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentInputSchema,
  dateSchema,
  rupeesToPaise,
} from "@/lib/validation/appointment";
import type {
  Appointment,
  AppointmentConflict,
  AppointmentInput,
  DeleteAppointmentResult,
  PaymentMode,
  SaveAppointmentResult,
  ToggleAppointmentCompleteResult,
} from "@/types/appointment";
import type { AppointmentRow, Database } from "@/types/database";

type AppointmentInsert =
  Database["public"]["Tables"]["appointments"]["Insert"];

function timestampToIndiaTime(timestamp: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.hour}:${values.minute}`;
}

function toPaymentMode(value: string): PaymentMode {
  return value === "online" ? "online" : "cash";
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientName: row.client_name,
    phone: row.phone,
    service: row.service,
    description: row.description,
    date: row.appointment_date,
    startTime: timestampToIndiaTime(row.start_time),
    endTime: timestampToIndiaTime(row.end_time),
    bookingAmount: row.booking_amount_paise / 100,
    pendingAmount: row.pending_amount_paise / 100,
    bookingAmountPaise: row.booking_amount_paise,
    pendingAmountPaise: row.pending_amount_paise,
    bookingPaymentMode: toPaymentMode(row.booking_payment_mode),
    pendingPaymentMode: toPaymentMode(row.pending_payment_mode),
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

export async function getAppointmentsForDate(
  date: string,
): Promise<Appointment[]> {
  const parsedDate = dateSchema.safeParse(date);
  if (!parsedDate.success) {
    throw new Error("Invalid appointment date.");
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("appointment_date", parsedDate.data)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load appointments.");
  }

  return (data as AppointmentRow[]).map(toAppointment);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load appointments.");
  }

  return (data as AppointmentRow[]).map(toAppointment);
}

export async function saveAppointment(
  input: AppointmentInput,
): Promise<SaveAppointmentResult> {
  const parsed = appointmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted appointment details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const value = parsed.data;
  const startTime = toIndiaIsoInstant(value.date, value.startTime);
  const endTime = toIndiaIsoInstant(value.date, value.endTime);

  let conflictQuery = supabase
    .from("appointments")
    .select("*")
    .eq("appointment_date", value.date)
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (value.id) {
    conflictQuery = conflictQuery.neq("id", value.id);
  }

  const { data: overlappingRows, error: overlapError } = await conflictQuery;
  if (overlapError) {
    return {
      success: false,
      error: "Unable to verify the studio schedule. Please try again.",
    };
  }

  const conflicts: AppointmentConflict[] = (
    overlappingRows as AppointmentRow[]
  ).map((row) => ({
    id: row.id,
    clientName: row.client_name,
    startTime: timestampToIndiaTime(row.start_time),
    endTime: timestampToIndiaTime(row.end_time),
    overlapMinutes: getOverlapMinutes(
      { startTime, endTime },
      { startTime: row.start_time, endTime: row.end_time },
    ),
  }));

  if (conflicts.length > 0 && !value.forceOverlap) {
    return { success: false, conflicts };
  }

  const record: AppointmentInsert = {
    client_name: value.clientName,
    phone: value.phone || null,
    service: value.service,
    description: value.description || null,
    appointment_date: value.date,
    start_time: startTime,
    end_time: endTime,
    booking_amount_paise: rupeesToPaise(value.bookingAmount),
    pending_amount_paise: rupeesToPaise(value.pendingAmount),
    booking_payment_mode: value.bookingPaymentMode,
    pending_payment_mode: value.pendingPaymentMode,
  };

  const mutation = value.id
    ? supabase
        .from("appointments")
        .update({
          client_name: record.client_name,
          phone: record.phone,
          service: record.service,
          description: record.description,
          appointment_date: record.appointment_date,
          start_time: record.start_time,
          end_time: record.end_time,
          booking_amount_paise: record.booking_amount_paise,
          pending_amount_paise: record.pending_amount_paise,
          booking_payment_mode: record.booking_payment_mode,
          pending_payment_mode: record.pending_payment_mode,
        })
        .eq("id", value.id)
        .select("*")
        .single()
    : supabase.from("appointments").insert(record).select("*").single();

  const { data, error } = await mutation;
  if (error || !data) {
    return {
      success: false,
      error: value.id
        ? "Unable to update the appointment."
        : "Unable to create the appointment.",
    };
  }

  revalidatePath("/");
  revalidatePath("/appointments");
  return { success: true, appointment: toAppointment(data as AppointmentRow) };
}

export async function deleteAppointment(
  id: string,
): Promise<DeleteAppointmentResult> {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "Invalid appointment ID." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Unable to delete the appointment." };
  }

  revalidatePath("/");
  revalidatePath("/appointments");
  return { success: true };
}

export async function toggleAppointmentComplete(
  id: string,
): Promise<ToggleAppointmentCompleteResult> {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "Invalid appointment ID." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("is_completed")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Unable to find the appointment." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ is_completed: !existing.is_completed })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Unable to update the appointment status.",
    };
  }

  revalidatePath("/");
  revalidatePath("/appointments");
  return { success: true, appointment: toAppointment(data as AppointmentRow) };
}
