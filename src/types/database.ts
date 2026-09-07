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
          | "booking_payment_mode"
          | "pending_payment_mode"
        > & {
          id?: string;
          is_completed?: boolean;
          booking_payment_mode?: string;
          pending_payment_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Omit<AppointmentRow, "id" | "created_at">
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
