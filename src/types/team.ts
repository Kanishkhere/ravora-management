export interface TeamMember {
  id: string;
  name: string;
  /** Default incentive percentage (0 means no incentive). */
  defaultIncentivePercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberInput {
  id?: string;
  name: string;
  defaultIncentivePercent: string;
}

export type SaveTeamMemberResult =
  | { success: true; member: TeamMember }
  | {
      success: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    };

export type SetTeamMemberActiveResult =
  | { success: true }
  | { success: false; error: string };
