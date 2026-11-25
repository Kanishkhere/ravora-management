"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOverlapMinutes } from "@/lib/appointments/overlap";
import {
  currentMonthRangeInIndia,
  monthRangeFromKey,
  toIndiaIsoInstant,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  appointmentInputSchema,
  assignmentInputSchema,
  dateSchema,
  rupeesToPaise,
} from "@/lib/validation/appointment";
import { monthKeySchema } from "@/lib/validation/expense";
import type {
  Appointment,
  AppointmentAssignment,
  AppointmentConflict,
  AppointmentInput,
  CompleteWithTeamInput,
  DeleteAppointmentResult,
  PaymentMode,
  SaveAppointmentResult,
  ToggleAppointmentCompleteResult,
} from "@/types/appointment";
import type { AppointmentRow, Database } from "@/types/database";
import { billTotalPaise, checkSplitTotal } from "@/lib/incentives";

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

/** Embedded select so assignments come back with each appointment. */
const APPOINTMENT_SELECT = "*, appointment_assignments(*)";

type NameMap = Map<string, string>;

function toAppointment(row: AppointmentRow, names: NameMap): Appointment {
  const assignments: AppointmentAssignment[] = (
    row.appointment_assignments ?? []
  )
    .map((assignment) => ({
      teamMemberId: assignment.team_member_id,
      teamMemberName: names.get(assignment.team_member_id) ?? "Team member",
      amount: assignment.amount_paise / 100,
      amountPaise: assignment.amount_paise,
      incentivePercent: Number(assignment.incentive_percent),
    }))
    .sort((a, b) => a.teamMemberName.localeCompare(b.teamMemberName));

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
    incentiveEnabled: row.incentive_enabled ?? true,
    assignments,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function teamNames(supabase: SupabaseClient): Promise<NameMap> {
  const { data } = await supabase.from("team_members").select("id, name");
  return new Map(
    ((data ?? []) as { id: string; name: string }[]).map((member) => [
      member.id,
      member.name,
    ]),
  );
}

async function toAppointments(
  supabase: SupabaseClient,
  rows: unknown,
): Promise<Appointment[]> {
  const names = await teamNames(supabase);
  return (rows as AppointmentRow[]).map((row) => toAppointment(row, names));
}

async function fetchAppointment(
  supabase: SupabaseClient,
  id: string,
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  const [appointment] = await toAppointments(supabase, [data]);
  return appointment ?? null;
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
    .select(APPOINTMENT_SELECT)
    .eq("appointment_date", parsedDate.data)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load appointments.");
  }

  return toAppointments(supabase, data);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load appointments.");
  }

  return toAppointments(supabase, data);
}

export async function getAppointmentsForCurrentMonthInIndia(): Promise<
  Appointment[]
> {
  const { start, end } = currentMonthRangeInIndia();
  return getAppointmentsBetween(start, end);
}

export async function getAppointmentsForMonth(
  monthKey: string,
): Promise<Appointment[]> {
  const parsed = monthKeySchema.safeParse(monthKey);
  if (!parsed.success) {
    throw new Error("Invalid month.");
  }

  const { start, end } = monthRangeFromKey(parsed.data);
  return getAppointmentsBetween(start, end);
}

async function getAppointmentsBetween(
  start: string,
  end: string,
): Promise<Appointment[]> {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .gte("appointment_date", start)
    .lte("appointment_date", end)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error("Unable to load appointments.");
  }

  return toAppointments(supabase, data);
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
    incentive_enabled: value.incentiveEnabled,
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
          incentive_enabled: record.incentive_enabled,
        })
        .eq("id", value.id)
        .select("id")
        .single()
    : supabase.from("appointments").insert(record).select("id").single();

  const { data, error } = await mutation;
  if (error || !data) {
    return {
      success: false,
      error: value.id
        ? "Unable to update the appointment."
        : "Unable to create the appointment.",
    };
  }

  const appointmentId = (data as { id: string }).id;
  const assignmentError = await replaceAssignments(
    supabase,
    appointmentId,
    value.assignments,
    record.booking_amount_paise + record.pending_amount_paise,
  );
  if (assignmentError) {
    revalidatePath("/");
    revalidatePath("/appointments");
    return {
      success: false,
      error: `The appointment was saved, but the team details were not. ${assignmentError}`,
    };
  }

  const appointment = await fetchAppointment(supabase, appointmentId);
  if (!appointment) {
    return { success: false, error: "Unable to load the saved appointment." };
  }

  revalidateAppointmentPaths();
  return { success: true, appointment };
}

type ValidAssignment = z.infer<typeof assignmentInputSchema>;

function revalidateAppointmentPaths() {
  revalidatePath("/");
  revalidatePath("/appointments");
  revalidatePath("/expenses");
}

/**
 * Replaces an appointment's assignments in one database transaction.
 * A single person always gets the whole bill, so their share stays
 * correct even if the booking or pending amount changes.
 */
async function replaceAssignments(
  supabase: SupabaseClient,
  appointmentId: string,
  assignments: ValidAssignment[],
  billPaise: number,
): Promise<string | null> {
  const payload = assignments.map((assignment) => ({
    team_member_id: assignment.teamMemberId,
    amount_paise:
      assignments.length === 1 ? billPaise : rupeesToPaise(assignment.amount),
    incentive_percent: Number(assignment.incentivePercent),
  }));

  if (payload.some((item) => item.amount_paise <= 0)) {
    return "The bill must be more than 0 to assign team members.";
  }

  const { error } = await supabase.rpc("save_appointment_assignments", {
    p_appointment_id: appointmentId,
    p_assignments: payload,
  });

  return error ? "Please try again." : null;
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

  revalidateAppointmentPaths();
  return { success: true };
}

/**
 * Marks done / not done. Completing an appointment that has no team yet
 * (while team members exist and incentive is on) returns `needsTeam`
 * so the UI can ask who did the work first.
 */
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
    .select("is_completed, incentive_enabled")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Unable to find the appointment." };
  }

  if (!existing.is_completed && existing.incentive_enabled) {
    const [{ count: assignmentCount }, { count: memberCount }] =
      await Promise.all([
        supabase
          .from("appointment_assignments")
          .select("id", { count: "exact", head: true })
          .eq("appointment_id", id),
        supabase
          .from("team_members")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

    if (!assignmentCount && memberCount) {
      return { success: false, needsTeam: true };
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({ is_completed: !existing.is_completed })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Unable to update the appointment status.",
    };
  }

  const appointment = await fetchAppointment(supabase, id);
  if (!appointment) {
    return { success: false, error: "Unable to load the appointment." };
  }

  revalidateAppointmentPaths();
  return { success: true, appointment };
}

/** Completes an appointment after choosing who did the work (or opting out of incentive). */
export async function completeAppointmentWithTeam(
  id: string,
  input: CompleteWithTeamInput,
): Promise<ToggleAppointmentCompleteResult> {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "Invalid appointment ID." };
  }

  const assignments = z
    .array(assignmentInputSchema)
    .max(10)
    .safeParse(input.assignments ?? []);
  if (!assignments.success) {
    return {
      success: false,
      error: "Please check the team members, amounts and percentages.",
    };
  }

  const memberIds = assignments.data.map((item) => item.teamMemberId);
  if (new Set(memberIds).size !== memberIds.length) {
    return { success: false, error: "Each team member can only be added once." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("booking_amount_paise, pending_amount_paise")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Unable to find the appointment." };
  }

  const billPaise = billTotalPaise({
    bookingAmountPaise: existing.booking_amount_paise,
    pendingAmountPaise: existing.pending_amount_paise,
  });

  if (assignments.data.length > 1) {
    const splitError = checkSplitTotal(
      assignments.data.map((item) => rupeesToPaise(item.amount)),
      billPaise,
    );
    if (splitError) return { success: false, error: splitError };
  }

  if (assignments.data.length > 0) {
    const assignmentError = await replaceAssignments(
      supabase,
      id,
      assignments.data,
      billPaise,
    );
    if (assignmentError) {
      return { success: false, error: assignmentError };
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      is_completed: true,
      incentive_enabled: Boolean(input.incentiveEnabled),
    })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: "Unable to update the appointment status.",
    };
  }

  const appointment = await fetchAppointment(supabase, id);
  if (!appointment) {
    return { success: false, error: "Unable to load the appointment." };
  }

  revalidateAppointmentPaths();
  return { success: true, appointment };
}
