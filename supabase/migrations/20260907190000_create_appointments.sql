create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text,
  service text not null,
  description text,
  appointment_date date not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  booking_amount_paise integer not null default 0,
  pending_amount_paise integer not null default 0,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_client_name_length
    check (char_length(btrim(client_name)) between 1 and 120),
  constraint appointments_phone_length
    check (phone is null or char_length(phone) <= 30),
  constraint appointments_service_length
    check (char_length(btrim(service)) between 1 and 160),
  constraint appointments_description_length
    check (description is null or char_length(description) <= 2000),
  constraint appointments_valid_interval check (end_time > start_time),
  constraint appointments_start_on_date
    check ((start_time at time zone 'Asia/Kolkata')::date = appointment_date),
  constraint appointments_end_on_date
    check ((end_time at time zone 'Asia/Kolkata')::date = appointment_date),
  constraint appointments_booking_amount_nonnegative
    check (booking_amount_paise >= 0),
  constraint appointments_pending_amount_nonnegative
    check (pending_amount_paise >= 0)
);

create index appointments_date_start_idx
  on public.appointments (appointment_date, start_time);

create or replace function public.set_appointment_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();

  if tg_op = 'UPDATE' then
    new.created_by = old.created_by;
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

create trigger appointments_set_audit_fields
before update on public.appointments
for each row execute function public.set_appointment_audit_fields();

alter table public.appointments enable row level security;

create policy "Authenticated staff can read appointments"
on public.appointments
for select
to authenticated
using (true);

create policy "Authenticated staff can create appointments"
on public.appointments
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Authenticated staff can update appointments"
on public.appointments
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated staff can delete appointments"
on public.appointments
for delete
to authenticated
using (true);

revoke all on table public.appointments from anon;
grant select, insert, update, delete on table public.appointments to authenticated;
