alter table public.appointments
  add column is_completed boolean not null default false;

create index appointments_date_completed_idx
  on public.appointments (appointment_date, is_completed);
