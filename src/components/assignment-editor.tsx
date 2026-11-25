"use client";

import { Plus, Users, X } from "lucide-react";

import { checkSplitTotal } from "@/lib/incentives";
import { formatRupees } from "@/lib/finance";
import { rupeesToPaise } from "@/lib/validation/appointment";
import type { Appointment, AssignmentInput } from "@/types/appointment";
import type { TeamMember } from "@/types/team";

export type AssignmentDraft = {
  teamMemberId: string;
  /** Rupees. Only used when splitting. */
  amount: string;
  incentivePercent: string;
};

export type TeamEditorState = {
  incentiveEnabled: boolean;
  /** False: one person does the whole bill. True: several people share it. */
  split: boolean;
  rows: AssignmentDraft[];
};

const MONEY = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

/** Rupee string -> paise, or 0 when it is not a valid amount yet. */
export function safePaise(value: string): number {
  const trimmed = value.trim();
  return MONEY.test(trimmed) ? rupeesToPaise(trimmed) : 0;
}

export function emptyTeamState(): TeamEditorState {
  return { incentiveEnabled: true, split: false, rows: [] };
}

export function teamStateFromAppointment(
  appointment: Appointment | null,
): TeamEditorState {
  if (!appointment) return emptyTeamState();

  return {
    incentiveEnabled: appointment.incentiveEnabled,
    split: appointment.assignments.length > 1,
    rows: appointment.assignments.map((assignment) => ({
      teamMemberId: assignment.teamMemberId,
      amount: String(assignment.amount),
      incentivePercent: String(assignment.incentivePercent),
    })),
  };
}

/** Converts editor state into the assignments sent to the server. */
export function buildAssignments(
  state: TeamEditorState,
  billPaise: number,
): AssignmentInput[] {
  const rows = state.rows.filter((row) => row.teamMemberId);
  if (rows.length === 0) return [];

  if (!state.split || rows.length === 1) {
    return [
      {
        teamMemberId: rows[0].teamMemberId,
        amount: String(billPaise / 100),
        incentivePercent: rows[0].incentivePercent || "0",
      },
    ];
  }

  return rows.map((row) => ({
    teamMemberId: row.teamMemberId,
    amount: row.amount.trim(),
    incentivePercent: row.incentivePercent || "0",
  }));
}

/** Client-side hint for splits that do not add up. */
export function splitProblem(
  state: TeamEditorState,
  billPaise: number,
): string | null {
  const rows = state.rows.filter((row) => row.teamMemberId);
  if (!state.split || rows.length < 2) return null;
  return checkSplitTotal(
    rows.map((row) => safePaise(row.amount)),
    billPaise,
  );
}

type AssignmentEditorProps = {
  members: TeamMember[];
  state: TeamEditorState;
  onChange: (state: TeamEditorState) => void;
  billPaise: number;
  /** Prefix for element ids (the editor can appear in more than one dialog). */
  idPrefix: string;
  error?: string;
  /** Hide the "Give incentive" checkbox (the caller decides separately). */
  hideIncentiveToggle?: boolean;
};

function blankRow(): AssignmentDraft {
  return { teamMemberId: "", amount: "", incentivePercent: "0" };
}

export function AssignmentEditor({
  members,
  state,
  onChange,
  billPaise,
  idPrefix,
  error,
  hideIncentiveToggle = false,
}: AssignmentEditorProps) {
  const { rows, split, incentiveEnabled } = state;
  const visibleRows = rows.length > 0 ? rows : [blankRow()];
  const usedIds = new Set(rows.map((row) => row.teamMemberId));
  const assignedPaise = split
    ? rows.reduce((total, row) => total + safePaise(row.amount), 0)
    : 0;
  const remainingPaise = billPaise - assignedPaise;
  const problem = splitProblem(state, billPaise);

  function memberById(id: string) {
    return members.find((member) => member.id === id);
  }

  function setRows(
    next: AssignmentDraft[],
    patch: Partial<TeamEditorState> = {},
  ) {
    onChange({ ...state, ...patch, rows: next });
  }

  function updateRow(index: number, patch: Partial<AssignmentDraft>) {
    const next = visibleRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row,
    );
    setRows(next);
  }

  function chooseMember(index: number, memberId: string) {
    const member = memberById(memberId);
    updateRow(index, {
      teamMemberId: memberId,
      // The member's default is only a starting point for this appointment.
      incentivePercent: member ? String(member.defaultIncentivePercent) : "0",
    });
  }

  function startSplit() {
    const first = visibleRows[0];
    setRows([{ ...first, amount: "" }, blankRow()], { split: true });
  }

  function endSplit() {
    setRows(visibleRows.slice(0, 1), { split: false });
  }

  function addRow() {
    setRows([...visibleRows, blankRow()]);
  }

  function removeRow(index: number) {
    const next = visibleRows.filter((_, rowIndex) => rowIndex !== index);
    if (next.length < 2) {
      setRows(next, { split: false });
    } else {
      setRows(next);
    }
  }

  function optionsFor(rowMemberId: string) {
    return members.filter(
      (member) =>
        member.id === rowMemberId ||
        (member.isActive && !usedIds.has(member.id)),
    );
  }

  const percentField = (row: AssignmentDraft, index: number) => (
    <label className="block">
      <span className="field-label">Incentive %</span>
      <input
        className="field"
        type="number"
        min="0"
        max="100"
        step="0.01"
        inputMode="decimal"
        value={row.incentivePercent}
        onChange={(event) =>
          updateRow(index, { incentivePercent: event.target.value })
        }
        disabled={!incentiveEnabled}
        aria-label={`Incentive percentage for this appointment, row ${index + 1}`}
      />
    </label>
  );

  return (
    <fieldset className="rounded-2xl border border-line bg-cream/40 p-4 sm:p-5">
      <legend className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
        <Users aria-hidden="true" className="size-4" />
        Team and incentive
      </legend>

      <label
        className={`flex items-center gap-3 text-sm font-medium ${
          hideIncentiveToggle ? "hidden" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={incentiveEnabled}
          onChange={(event) =>
            onChange({ ...state, incentiveEnabled: event.target.checked })
          }
          className="size-4 accent-[#8d672f]"
        />
        Give incentive for this appointment
      </label>

      {members.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Add team members in the Team tab to assign who did the work.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {!split ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <label className="block" htmlFor={`${idPrefix}-member-0`}>
                <span className="field-label">Done by</span>
                <select
                  id={`${idPrefix}-member-0`}
                  className="field"
                  value={visibleRows[0].teamMemberId}
                  onChange={(event) => chooseMember(0, event.target.value)}
                >
                  <option value="">Not assigned</option>
                  {optionsFor(visibleRows[0].teamMemberId).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </label>
              {visibleRows[0].teamMemberId && incentiveEnabled
                ? percentField(visibleRows[0], 0)
                : null}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRows.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-line bg-paper p-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_auto] sm:items-end"
                >
                  <label
                    className="block"
                    htmlFor={`${idPrefix}-member-${index}`}
                  >
                    <span className="field-label">Team member</span>
                    <select
                      id={`${idPrefix}-member-${index}`}
                      className="field"
                      value={row.teamMemberId}
                      onChange={(event) =>
                        chooseMember(index, event.target.value)
                      }
                    >
                      <option value="">Choose…</option>
                      {optionsFor(row.teamMemberId).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                          {member.isActive ? "" : " (inactive)"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="field-label">Work (₹)</span>
                    <input
                      className="field"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(event) =>
                        updateRow(index, { amount: event.target.value })
                      }
                      placeholder="0"
                      aria-label={`Amount of work done by team member ${index + 1}`}
                    />
                  </label>
                  {percentField(row, index)}
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-red-50 hover:text-danger"
                    aria-label={`Remove team member ${index + 1}`}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addRow}
                  disabled={visibleRows.length >= 10}
                  className="button-secondary h-10 px-4 text-sm"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add team member
                </button>
                <p
                  className={`text-sm font-medium ${
                    remainingPaise === 0 ? "text-emerald-800" : "text-gold-deep"
                  }`}
                  aria-live="polite"
                >
                  {remainingPaise === 0
                    ? `Fully assigned (${formatRupees(billPaise / 100)})`
                    : remainingPaise > 0
                      ? `${formatRupees(remainingPaise / 100)} left to assign of ${formatRupees(billPaise / 100)}`
                      : `${formatRupees(-remainingPaise / 100)} over ${formatRupees(billPaise / 100)}`}
                </p>
              </div>
            </div>
          )}

          {!split ? (
            <button
              type="button"
              onClick={startSplit}
              className="text-sm font-bold text-gold-deep underline-offset-4 hover:underline"
            >
              Split between team members
            </button>
          ) : (
            <button
              type="button"
              onClick={endSplit}
              className="text-sm font-bold text-gold-deep underline-offset-4 hover:underline"
            >
              Back to one person
            </button>
          )}

          {!split && visibleRows[0].teamMemberId && (
            <p className="text-xs text-muted">
              Gets the full bill of {formatRupees(billPaise / 100)}.
            </p>
          )}
        </div>
      )}

      {(problem || error) && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error || problem}
        </p>
      )}
    </fieldset>
  );
}
