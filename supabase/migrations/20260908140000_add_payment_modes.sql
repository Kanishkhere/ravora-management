alter table public.appointments
  add column booking_payment_mode text not null default 'cash',
  add column pending_payment_mode text not null default 'cash';

alter table public.appointments
  add constraint appointments_booking_payment_mode_check
    check (booking_payment_mode in ('online', 'cash')),
  add constraint appointments_pending_payment_mode_check
    check (pending_payment_mode in ('online', 'cash'));
