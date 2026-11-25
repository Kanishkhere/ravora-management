export type PaymentMode = "online" | "cash";

export interface Appointment {
  id: string;
  clientName: string;
  phone: string | null;
  service: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  /** Rupee value for display and form editing. Persistence remains integer paise. */
  bookingAmount: number;
  /** Rupee value for display and form editing. Persistence remains integer paise. */
  pendingAmount: number;
  bookingAmountPaise: number;
  pendingAmountPaise: number;
  bookingPaymentMode: PaymentMode;
  pendingPaymentMode: PaymentMode;
  isCompleted: boolean;
  /** When false, no incentive is paid for this appointment. */
  incentiveEnabled: boolean;
  /** Team members who did the work, with their share of the bill. */
  assignments: AppointmentAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentAssignment {
  teamMemberId: string;
  teamMemberName: string;
  /** Rupee share of the bill this person worked on. */
  amount: number;
  amountPaise: number;
  /** Percentage used for this appointment (starts from the member's default). */
  incentivePercent: number;
}

export interface AssignmentInput {
  teamMemberId: string;
  amount: string;
  incentivePercent: string;
}

export interface AppointmentInput {
  id?: string;
  clientName: string;
  phone?: string;
  service: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingAmount: string;
  pendingAmount: string;
  bookingPaymentMode: PaymentMode;
  pendingPaymentMode: PaymentMode;
  incentiveEnabled?: boolean;
  assignments?: AssignmentInput[];
  forceOverlap?: boolean;
}

export interface AppointmentConflict {
  id: string;
  clientName: string;
  startTime: string;
  endTime: string;
  overlapMinutes: number;
}

export type SaveAppointmentResult =
  | { success: true; appointment: Appointment }
  | {
      success: false;
      conflicts?: AppointmentConflict[];
      error?: string;
      fieldErrors?: Record<string, string[]>;
    };

export type DeleteAppointmentResult =
  | { success: true }
  | { success: false; error: string };

export type ToggleAppointmentCompleteResult =
  | { success: true; appointment: Appointment }
  /** Completing needs the team (and split) to be chosen first. */
  | { success: false; needsTeam: true }
  | { success: false; needsTeam?: false; error: string };

export interface CompleteWithTeamInput {
  incentiveEnabled: boolean;
  assignments: AssignmentInput[];
}
