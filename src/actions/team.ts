"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { teamMemberInputSchema } from "@/lib/validation/team";
import type { TeamMemberRow } from "@/types/database";
import type {
  SaveTeamMemberResult,
  SetTeamMemberActiveResult,
  TeamMember,
  TeamMemberInput,
} from "@/types/team";

function toTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    defaultIncentivePercent: Number(row.default_incentive_percent),
    isActive: row.is_active,
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

/** All team members, active first, then by name. */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const { supabase, user } = await authenticatedClient();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load team members.");
  }

  return (data as TeamMemberRow[]).map(toTeamMember);
}

export async function saveTeamMember(
  input: TeamMemberInput,
): Promise<SaveTeamMemberResult> {
  const parsed = teamMemberInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please correct the highlighted details.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const value = parsed.data;
  const record = {
    name: value.name,
    default_incentive_percent: Number(value.defaultIncentivePercent),
  };

  const mutation = value.id
    ? supabase
        .from("team_members")
        .update(record)
        .eq("id", value.id)
        .select("*")
        .single()
    : supabase.from("team_members").insert(record).select("*").single();

  const { data, error } = await mutation;
  if (error || !data) {
    return {
      success: false,
      error: value.id
        ? "Unable to update the team member."
        : "Unable to add the team member.",
    };
  }

  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath("/appointments");
  revalidatePath("/expenses");
  return { success: true, member: toTeamMember(data as TeamMemberRow) };
}

export async function setTeamMemberActive(
  id: string,
  isActive: boolean,
): Promise<SetTeamMemberActiveResult> {
  if (!z.uuid().safeParse(id).success) {
    return { success: false, error: "Invalid team member ID." };
  }

  const { supabase, user } = await authenticatedClient();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("team_members")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    return { success: false, error: "Unable to update the team member." };
  }

  revalidatePath("/team");
  revalidatePath("/");
  revalidatePath("/appointments");
  return { success: true };
}
