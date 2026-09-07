"use client";

import type { Appointment } from "@/types/appointment";
import {
  deleteAppointment,
  saveAppointment,
  toggleAppointmentComplete,
} from "@/actions/appointments";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleCheck,
  Edit3,
  IndianRupee,
  Phone,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { formatIndiaDate } from "@/lib/format";

type Conflict = {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  overlapMinutes: number;
};

type AppointmentManagerProps = {
  appointments: Appointment[];
  date: string;
  groupByDate?: boolean;
  allowCreate?: boolean;
};

function FieldError({
  errors,
  name,
}: {
  errors: Record<string, string[]>;
  name: string;
}) {
  const message = errors[name]?.[0];
  if (!message) return null;

  return (
    <span id={`${name}-error`} className="mt-1.5 block text-xs text-danger">
      {message}
    </span>
  );
}

function formatTime(value: string) {
  if (!value) return "";
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatPaymentMode(value: string) {
  return value === "online" ? "Online" : "Cash";
}

function fieldValue(
  appointment: Appointment | null,
  key: keyof Appointment,
  fallback = "",
) {
  const value = appointment?.[key];
  return value == null ? fallback : String(value);
}

function groupAppointmentsByDate(appointments: Appointment[]) {
  const groups = new Map<string, Appointment[]>();

  for (const appointment of appointments) {
    const existing = groups.get(appointment.date);
    if (existing) {
      existing.push(appointment);
    } else {
      groups.set(appointment.date, [appointment]);
    }
  }

  return groups;
}

export function AppointmentManager({
  appointments,
  date,
  groupByDate = false,
  allowCreate = true,
}: AppointmentManagerProps) {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Appointment | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [pendingInput, setPendingInput] = useState<
    Parameters<typeof saveAppointment>[0] | null
  >(null);
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (dialogOpen) {
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    }
  }, [dialogOpen]);

  function openCreate() {
    setEditing(null);
    setError("");
    setFieldErrors({});
    setConflicts([]);
    setPendingInput(null);
    setDialogOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setEditing(appointment);
    setError("");
    setFieldErrors({});
    setConflicts([]);
    setPendingInput(null);
    setDialogOpen(true);
  }

  function closeEditor() {
    if (pending) return;
    setDialogOpen(false);
    setError("");
    setFieldErrors({});
    setConflicts([]);
    setPendingInput(null);
  }

  async function persist(input: Parameters<typeof saveAppointment>[0]) {
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const result = await saveAppointment(input);

      if (result.success) {
        setDialogOpen(false);
        setConflicts([]);
        setPendingInput(null);
        router.refresh();
        return;
      }

      if (result.conflicts?.length) {
        setConflicts(result.conflicts);
        setPendingInput(input);
        return;
      }

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      setError(
        result.error || "We couldn’t save this appointment. Please try again.",
      );
    } catch {
      setError("We couldn’t save this appointment. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startTime = String(form.get("startTime"));
    const endTime = String(form.get("endTime"));

    if (endTime <= startTime) {
      setError("End time must be later than start time.");
      setFieldErrors({ endTime: ["End time must be after start time."] });
      return;
    }

    await persist({
      id: editing ? fieldValue(editing, "id") : undefined,
      clientName: String(form.get("clientName")).trim(),
      phone: String(form.get("phone")).trim() || undefined,
      service: String(form.get("service")).trim(),
      description: String(form.get("description")).trim() || undefined,
      date: String(form.get("date")),
      startTime,
      endTime,
      bookingAmount: String(form.get("bookingAmount")),
      pendingAmount: String(form.get("pendingAmount")),
      bookingPaymentMode: String(form.get("bookingPaymentMode")) as
        | "online"
        | "cash",
      pendingPaymentMode: String(form.get("pendingPaymentMode")) as
        | "online"
        | "cash",
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    setError("");
    try {
      const result = await deleteAppointment(fieldValue(deleting, "id"));

      if (result.success) {
        setDeleting(null);
        router.refresh();
      } else {
        setError(result.error || "We couldn’t delete this appointment.");
      }
    } catch {
      setError("We couldn’t delete this appointment.");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleComplete(appointment: Appointment) {
    const id = fieldValue(appointment, "id");
    setCompletingId(id);
    setError("");
    try {
      const result = await toggleAppointmentComplete(id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "We couldn’t update this appointment.");
      }
    } catch {
      setError("We couldn’t update this appointment.");
    } finally {
      setCompletingId(null);
    }
  }

  function renderAppointmentCard(appointment: Appointment) {
    const isCompleted = appointment.isCompleted;
    const appointmentId = fieldValue(appointment, "id");
    const isTogglingComplete = completingId === appointmentId;

    return (
      <article
        key={appointmentId}
        className={`group grid gap-4 rounded-2xl border p-4 shadow-[0_10px_35px_rgb(70_55_30/4%)] transition sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:p-5 ${
          isCompleted
            ? "border-emerald-200 bg-emerald-50 shadow-[0_10px_35px_rgb(16_185_129/8%)]"
            : "border-line bg-paper hover:border-gold/45"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-sm font-bold sm:block ${
            isCompleted ? "text-emerald-800" : "text-gold-deep"
          }`}
        >
          <p>{formatTime(fieldValue(appointment, "startTime"))}</p>
          <span className="text-muted sm:hidden">—</span>
          <p className="mt-1 text-xs font-medium text-muted">
            {formatTime(fieldValue(appointment, "endTime"))}
          </p>
        </div>

        <div
          className={`min-w-0 sm:border-l sm:pl-5 ${
            isCompleted ? "border-emerald-200" : "border-line"
          }`}
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2
              className={`font-display text-xl font-semibold leading-tight sm:text-2xl ${
                isCompleted
                  ? "text-muted line-through decoration-emerald-700/40"
                  : ""
              }`}
            >
              {fieldValue(appointment, "clientName")}
            </h2>
            <span className="rounded-full bg-gold/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-gold-deep">
              {fieldValue(appointment, "service")}
            </span>
            {isCompleted && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-emerald-900">
                Done
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {fieldValue(appointment, "phone") && (
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-paper/80 px-2.5 py-1 text-xs text-muted">
                <Phone aria-hidden="true" className="size-3.5" />
                {fieldValue(appointment, "phone")}
              </span>
            )}
            <span className="rounded-xl border border-line bg-paper/80 px-3 py-2 text-xs text-muted">
              <span className="block font-bold uppercase tracking-wider text-charcoal/70">
                Booking
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <IndianRupee aria-hidden="true" className="size-3.5" />
                {formatMoney(fieldValue(appointment, "bookingAmount"))}
                <span className="text-muted">·</span>
                {formatPaymentMode(
                  fieldValue(appointment, "bookingPaymentMode", "cash"),
                )}
              </span>
            </span>
            <span className="rounded-xl border border-line bg-paper/80 px-3 py-2 text-xs text-muted">
              <span className="block font-bold uppercase tracking-wider text-charcoal/70">
                Pending
              </span>
              <span className="mt-1 flex items-center gap-1.5">
                <IndianRupee aria-hidden="true" className="size-3.5" />
                {formatMoney(fieldValue(appointment, "pendingAmount"))}
                <span className="text-muted">·</span>
                {formatPaymentMode(
                  fieldValue(appointment, "pendingPaymentMode", "cash"),
                )}
              </span>
            </span>
          </div>
          {fieldValue(appointment, "description") && (
            <p
              className={`mt-3 text-sm leading-6 text-muted ${
                groupByDate ? "" : "line-clamp-2"
              }`}
            >
              {fieldValue(appointment, "description")}
            </p>
          )}
        </div>

        <div
          className={`flex items-center justify-end gap-1 border-t pt-3 sm:border-0 sm:justify-start sm:pt-0 ${
            isCompleted ? "border-emerald-200" : "border-line"
          }`}
        >
          <button
            type="button"
            className={`rounded-full p-2.5 transition disabled:opacity-50 ${
              isCompleted
                ? "bg-white/80 text-emerald-800 hover:bg-white"
                : "text-muted hover:bg-emerald-50 hover:text-emerald-800"
            }`}
            onClick={() => handleToggleComplete(appointment)}
            disabled={isTogglingComplete}
            aria-label={
              isCompleted
                ? `Mark ${fieldValue(appointment, "clientName")}'s appointment as incomplete`
                : `Mark ${fieldValue(appointment, "clientName")}'s appointment as done`
            }
          >
            {isCompleted ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <CircleCheck aria-hidden="true" className="size-4" />
            )}
          </button>
          <button
            type="button"
            className="rounded-full p-2.5 text-muted transition hover:bg-cream hover:text-charcoal"
            onClick={() => openEdit(appointment)}
            aria-label={`Edit ${fieldValue(appointment, "clientName")}'s appointment`}
          >
            <Edit3 aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-full p-2.5 text-muted transition hover:bg-red-50 hover:text-danger"
            onClick={() => {
              setError("");
              setDeleting(appointment);
            }}
            aria-label={`Delete ${fieldValue(appointment, "clientName")}'s appointment`}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </article>
    );
  }

  return (
    <>
      <span
        data-testid="appointment-manager-ready"
        data-ready={ready ? "true" : "false"}
        aria-hidden="true"
      />
      {allowCreate && (
        <button
          type="button"
          className="button-primary w-full sm:w-auto"
          onClick={openCreate}
        >
          <CalendarPlus aria-hidden="true" className="size-4" />
          New appointment
        </button>
      )}

      {error && !dialogOpen && !deleting && (
        <p
          role="alert"
          className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger ${
            allowCreate ? "mt-4" : ""
          }`}
        >
          {error}
        </p>
      )}

      <div className={allowCreate ? "mt-6 space-y-3" : "space-y-3"}>
        {appointments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper/70 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
              {groupByDate ? (
                <CalendarDays aria-hidden="true" className="size-5" />
              ) : (
                <CalendarPlus aria-hidden="true" className="size-5" />
              )}
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">
              {groupByDate && !allowCreate
                ? "No pending appointments"
                : groupByDate
                  ? "No appointments yet"
                  : "A clear day"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              {groupByDate && !allowCreate
                ? "Completed bookings are hidden here. Add a new one from the day schedule, or mark one incomplete to bring it back."
                : groupByDate
                  ? "When bookings are added to the schedule, they will appear here."
                  : "No appointments are booked for this date. Add one when you’re ready."}
            </p>
            {allowCreate ? (
              <button
                type="button"
                className="button-secondary mt-6"
                onClick={openCreate}
              >
                Add first appointment
              </button>
            ) : (
              <Link href="/" className="button-secondary mt-6 inline-flex">
                Back to today
              </Link>
            )}
          </div>
        ) : groupByDate ? (
          <div className="space-y-8">
            {Array.from(groupAppointmentsByDate(appointments).entries()).map(
              ([appointmentDate, dayAppointments]) => (
                <section
                  key={appointmentDate}
                  aria-labelledby={`appointments-${appointmentDate}`}
                >
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
                        {formatIndiaDate(appointmentDate, {
                          weekday: "long",
                        })}
                      </p>
                      <h2
                        id={`appointments-${appointmentDate}`}
                        className="mt-1 font-display text-2xl font-semibold sm:text-3xl"
                      >
                        {formatIndiaDate(appointmentDate)}
                      </h2>
                    </div>
                    <Link
                      href={`/?date=${appointmentDate}`}
                      className="button-secondary h-10 px-4 text-sm"
                    >
                      Open day
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {dayAppointments.map((appointment) =>
                      renderAppointmentCard(appointment),
                    )}
                  </div>
                </section>
              ),
            )}
          </div>
        ) : (
          appointments.map((appointment) => renderAppointmentCard(appointment))
        )}
      </div>

      {dialogOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-[3px]"
          />
          <div
            role="dialog"
            aria-labelledby="appointment-dialog-title"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 m-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-0 text-charcoal shadow-2xl sm:inset-0 sm:m-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(44rem,calc(100%-2rem))] sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
                  {editing ? "Update booking" : "New booking"}
                </p>
                <h2
                  id="appointment-dialog-title"
                  className="mt-1 font-display text-2xl font-semibold sm:text-3xl"
                >
                  Appointment details
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full p-2 text-muted hover:bg-cream"
                aria-label="Close appointment form"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <label htmlFor="clientName">
                  <span className="field-label">Client name</span>
                  <input
                    ref={firstFieldRef}
                    id="clientName"
                    className="field"
                    name="clientName"
                    defaultValue={fieldValue(editing, "clientName")}
                    required
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.clientName)}
                    aria-describedby={
                      fieldErrors.clientName ? "clientName-error" : undefined
                    }
                  />
                  <FieldError errors={fieldErrors} name="clientName" />
                </label>
                <label>
                  <span className="field-label">Phone (optional)</span>
                  <input
                    className="field"
                    name="phone"
                    type="tel"
                    defaultValue={fieldValue(editing, "phone")}
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={
                      fieldErrors.phone ? "phone-error" : undefined
                    }
                  />
                  <FieldError errors={fieldErrors} name="phone" />
                </label>
              </div>

              <label htmlFor="service">
                <span className="field-label">Service</span>
                <input
                  id="service"
                  className="field"
                  name="service"
                  defaultValue={fieldValue(editing, "service")}
                  placeholder="e.g. Acrylic nails"
                  required
                  aria-invalid={Boolean(fieldErrors.service)}
                  aria-describedby={
                    fieldErrors.service ? "service-error" : undefined
                  }
                />
                <FieldError errors={fieldErrors} name="service" />
              </label>

              <label>
                <span className="field-label">
                  Description / notes (optional)
                </span>
                <textarea
                  className="field min-h-24 resize-y"
                  name="description"
                  defaultValue={fieldValue(editing, "description")}
                  placeholder="Preferences, preparation, or other details"
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? "description-error" : undefined
                  }
                />
                <FieldError errors={fieldErrors} name="description" />
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label>
                  <span className="field-label">Date</span>
                  <input
                    className="field"
                    name="date"
                    type="date"
                    defaultValue={fieldValue(editing, "date", date)}
                    required
                    aria-invalid={Boolean(fieldErrors.date)}
                    aria-describedby={
                      fieldErrors.date ? "date-error" : undefined
                    }
                  />
                  <FieldError errors={fieldErrors} name="date" />
                </label>
                <label htmlFor="startTime">
                  <span className="field-label">Start time</span>
                  <input
                    id="startTime"
                    className="field"
                    name="startTime"
                    type="time"
                    defaultValue={fieldValue(
                      editing,
                      "startTime",
                      "10:00",
                    ).slice(0, 5)}
                    required
                    aria-invalid={Boolean(fieldErrors.startTime)}
                    aria-describedby={
                      fieldErrors.startTime ? "startTime-error" : undefined
                    }
                  />
                  <FieldError errors={fieldErrors} name="startTime" />
                </label>
                <label htmlFor="endTime">
                  <span className="field-label">End time</span>
                  <input
                    id="endTime"
                    className="field"
                    name="endTime"
                    type="time"
                    defaultValue={fieldValue(editing, "endTime", "11:00").slice(
                      0,
                      5,
                    )}
                    required
                    aria-invalid={Boolean(fieldErrors.endTime)}
                    aria-describedby={
                      fieldErrors.endTime ? "endTime-error" : undefined
                    }
                  />
                  <FieldError errors={fieldErrors} name="endTime" />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="bookingAmount">
                    <span className="field-label">Booking amount</span>
                    <input
                      id="bookingAmount"
                      className="field"
                      name="bookingAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue={fieldValue(editing, "bookingAmount", "0")}
                      required
                      aria-invalid={Boolean(fieldErrors.bookingAmount)}
                      aria-describedby={
                        fieldErrors.bookingAmount
                          ? "bookingAmount-error"
                          : undefined
                      }
                    />
                    <FieldError errors={fieldErrors} name="bookingAmount" />
                  </label>
                  <label>
                    <span className="field-label">Booking payment mode</span>
                    <select
                      className="field"
                      name="bookingPaymentMode"
                      defaultValue={fieldValue(
                        editing,
                        "bookingPaymentMode",
                        "cash",
                      )}
                      aria-invalid={Boolean(fieldErrors.bookingPaymentMode)}
                      aria-describedby={
                        fieldErrors.bookingPaymentMode
                          ? "bookingPaymentMode-error"
                          : undefined
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                    <FieldError
                      errors={fieldErrors}
                      name="bookingPaymentMode"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label htmlFor="pendingAmount">
                    <span className="field-label">Pending amount</span>
                    <input
                      id="pendingAmount"
                      className="field"
                      name="pendingAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      defaultValue={fieldValue(editing, "pendingAmount", "0")}
                      required
                      aria-invalid={Boolean(fieldErrors.pendingAmount)}
                      aria-describedby={
                        fieldErrors.pendingAmount
                          ? "pendingAmount-error"
                          : undefined
                      }
                    />
                    <FieldError errors={fieldErrors} name="pendingAmount" />
                  </label>
                  <label>
                    <span className="field-label">Pending payment mode</span>
                    <select
                      className="field"
                      name="pendingPaymentMode"
                      defaultValue={fieldValue(
                        editing,
                        "pendingPaymentMode",
                        "cash",
                      )}
                      aria-invalid={Boolean(fieldErrors.pendingPaymentMode)}
                      aria-describedby={
                        fieldErrors.pendingPaymentMode
                          ? "pendingPaymentMode-error"
                          : undefined
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                    <FieldError
                      errors={fieldErrors}
                      name="pendingPaymentMode"
                    />
                  </label>
                </div>
              </div>

              {conflicts.length > 0 && (
                <div
                  role="alert"
                  className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
                >
                  <div className="flex gap-3">
                    <TriangleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <div>
                      <p className="font-bold">
                        This time overlaps another booking
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {conflicts.map((conflict) => (
                          <li key={conflict.id}>
                            {conflict.clientName},{" "}
                            {formatTime(conflict.startTime)}–
                            {formatTime(conflict.endTime)}:{" "}
                            <strong>{conflict.overlapMinutes} minutes</strong>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs leading-5">
                        Change the time, or explicitly book anyway.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={closeEditor}
                  disabled={pending}
                >
                  Cancel
                </button>
                {conflicts.length > 0 && pendingInput && (
                  <button
                    type="button"
                    className="button-secondary border-amber-400 text-amber-900"
                    disabled={pending}
                    onClick={() =>
                      persist({ ...pendingInput, forceOverlap: true })
                    }
                  >
                    {pending ? "Booking…" : "Book anyway"}
                  </button>
                )}
                <button
                  type="submit"
                  className="button-primary"
                  disabled={pending}
                >
                  {pending
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Book appointment"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {deleting && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-[3px]"
          />
          <div
            role="dialog"
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 m-0 max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-5 text-charcoal shadow-2xl sm:inset-0 sm:m-auto sm:max-h-none sm:w-[min(28rem,calc(100%-2rem))] sm:rounded-3xl sm:p-7"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-danger">
              <Trash2 aria-hidden="true" className="size-5" />
            </div>
            <h2
              id="delete-dialog-title"
              className="mt-4 font-display text-2xl font-semibold sm:text-3xl"
            >
              Delete appointment?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              This will permanently remove the appointment for{" "}
              <strong className="text-charcoal">
                {fieldValue(deleting, "clientName")}
              </strong>
              .
            </p>
            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setDeleting(null)}
                disabled={pending}
              >
                Keep it
              </button>
              <button
                type="button"
                className="button-primary border-danger bg-danger hover:bg-danger"
                onClick={confirmDelete}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
