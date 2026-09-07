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
  createdAt: string;
  updatedAt: string;
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
  | { success: false; error: string };
