drop policy if exists "Authenticated staff can create appointments"
  on public.appointments;

alter table public.appointments
  drop constraint if exists appointments_created_by_fkey;

alter table public.appointments
  drop column if exists created_by;

create or replace function public.set_appointment_audit_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();

  if tg_op = 'UPDATE' then
    new.created_at = old.created_at;
  end if;

  return new;
end;
$$;

create policy "Authenticated staff can create appointments"
on public.appointments
for insert
to authenticated
with check (true);
