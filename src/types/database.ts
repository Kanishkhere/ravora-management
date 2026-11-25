export type AppointmentRow = {
  id: string;
  client_name: string;
  phone: string | null;
  service: string;
  description: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  booking_amount_paise: number;
  pending_amount_paise: number;
  booking_payment_mode: string;
  pending_payment_mode: string;
  is_completed: boolean;
  incentive_enabled: boolean;
  created_at: string;
  updated_at: string;
  /** Present when the query embeds `appointment_assignments(*)`. */
  appointment_assignments?: AssignmentRow[];
};

export type AssignmentRow = {
  id: string;
  appointment_id: string;
  team_member_id: string;
  amount_paise: number;
  incentive_percent: number;
  created_at: string;
};

export type TeamMemberRow = {
  id: string;
  name: string;
  default_incentive_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount_paise: number;
  payment_mode: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: AppointmentRow;
        Insert: Omit<
          AppointmentRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "is_completed"
          | "incentive_enabled"
          | "booking_payment_mode"
          | "pending_payment_mode"
        > & {
          id?: string;
          is_completed?: boolean;
          incentive_enabled?: boolean;
          booking_payment_mode?: string;
          pending_payment_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<AppointmentRow, "id" | "created_at" | "appointment_assignments">
        >;
        Relationships: [];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: Omit<TeamMemberRow, "id" | "created_at" | "updated_at" | "is_active"> & {
          id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TeamMemberRow, "id" | "created_at">>;
        Relationships: [];
      };
      appointment_assignments: {
        Row: AssignmentRow;
        Insert: Omit<AssignmentRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AssignmentRow, "id" | "created_at">>;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: Omit<
          ExpenseRow,
          "id" | "created_at" | "updated_at" | "payment_mode"
        > & {
          id?: string;
          payment_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ExpenseRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_appointment_assignments: {
        Args: { p_appointment_id: string; p_assignments: unknown };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
