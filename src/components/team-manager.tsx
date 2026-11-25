"use client";

import {
  Edit3,
  Percent,
  Plus,
  RotateCcw,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import { saveTeamMember, setTeamMemberActive } from "@/actions/team";
import type { TeamMember } from "@/types/team";

import { Spinner } from "./pending";

type TeamManagerProps = {
  members: TeamMember[];
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
  return <span className="mt-1.5 block text-xs text-danger">{message}</span>;
}

function incentiveLabel(percent: number) {
  return percent > 0 ? `${percent}% incentive` : "No incentive";
}

export function TeamManager({ members }: TeamManagerProps) {
  const router = useRouter();
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (dialogOpen) {
      requestAnimationFrame(() => firstFieldRef.current?.focus());
    }
  }, [dialogOpen]);

  function openDialog(member: TeamMember | null) {
    setEditing(member);
    setError("");
    setFieldErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    if (pending) return;
    setDialogOpen(false);
    setError("");
    setFieldErrors({});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const result = await saveTeamMember({
        id: editing?.id,
        name: String(form.get("name")).trim(),
        defaultIncentivePercent: String(form.get("defaultIncentivePercent")),
      });

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      setError(result.error || "We couldn’t save this team member.");
    } catch {
      setError("We couldn’t save this team member. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(member: TeamMember) {
    setTogglingId(member.id);
    setError("");
    try {
      const result = await setTeamMemberActive(member.id, !member.isActive);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("We couldn’t update this team member.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button-primary w-full sm:w-auto"
        onClick={() => openDialog(null)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add team member
      </button>

      {error && !dialogOpen && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {members.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-paper/70 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold-deep">
              <Users aria-hidden="true" className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold">
              No team members yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              Add the people who do appointments, then choose who did the work
              when you book or complete one.
            </p>
          </div>
        ) : (
          members.map((member) => (
            <article
              key={member.id}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 shadow-[0_10px_35px_rgb(70_55_30/4%)] sm:p-5 ${
                member.isActive
                  ? "border-line bg-paper"
                  : "border-line/70 bg-paper/50"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3
                    className={`font-display text-xl font-semibold leading-tight break-words sm:text-2xl ${
                      member.isActive ? "" : "text-muted"
                    }`}
                  >
                    {member.name}
                  </h3>
                  {!member.isActive && (
                    <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Percent aria-hidden="true" className="size-3.5 text-gold" />
                  {incentiveLabel(member.defaultIncentivePercent)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-full p-2.5 text-muted transition hover:bg-cream hover:text-charcoal"
                  onClick={() => openDialog(member)}
                  aria-label={`Edit ${member.name}`}
                >
                  <Edit3 aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  className="button-secondary h-10 px-4 text-sm"
                  onClick={() => toggleActive(member)}
                  disabled={togglingId === member.id}
                  aria-label={
                    member.isActive
                      ? `Deactivate ${member.name}`
                      : `Reactivate ${member.name}`
                  }
                >
                  {togglingId === member.id ? (
                    <Spinner />
                  ) : member.isActive ? (
                    <UserMinus aria-hidden="true" className="size-4" />
                  ) : (
                    <RotateCcw aria-hidden="true" className="size-4" />
                  )}
                  {member.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            </article>
          ))
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
            aria-labelledby="team-dialog-title"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 m-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-paper p-0 text-charcoal shadow-2xl sm:inset-0 sm:m-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(30rem,calc(100%-2rem))] sm:rounded-3xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
                  {editing ? "Update team member" : "New team member"}
                </p>
                <h2
                  id="team-dialog-title"
                  className="mt-1 font-display text-2xl font-semibold sm:text-3xl"
                >
                  Team member
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-full p-2 text-muted hover:bg-cream"
                aria-label="Close team member form"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              <label className="block">
                <span className="field-label">Name</span>
                <input
                  ref={firstFieldRef}
                  className="field"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                  maxLength={80}
                  autoComplete="off"
                />
                <FieldError errors={fieldErrors} name="name" />
              </label>

              <label className="block">
                <span className="field-label">Default incentive (%)</span>
                <input
                  className="field"
                  name="defaultIncentivePercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={
                    editing ? String(editing.defaultIncentivePercent) : "0"
                  }
                  required
                />
                <span className="mt-1.5 block text-xs text-muted">
                  Use 0 if this person doesn’t earn incentive. Changing it
                  affects new appointments only. Past appointments keep the
                  percentage they were saved with.
                </span>
                <FieldError
                  errors={fieldErrors}
                  name="defaultIncentivePercent"
                />
              </label>

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
                  onClick={closeDialog}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={pending}
                >
                  {pending && <Spinner />}
                  {pending
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Add team member"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
