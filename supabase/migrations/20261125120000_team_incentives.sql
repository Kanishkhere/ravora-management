-- Team members and their default incentive percentage
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_incentive_percent numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_members_name_length
    check (char_length(btrim(name)) between 1 and 80),
  constraint team_members_incentive_range
    check (default_incentive_percent between 0 and 100)
);

create or replace function public.set_team_member_audit_fields()
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

create trigger team_members_set_audit_fields
before update on public.team_members
for each row execute function public.set_team_member_audit_fields();

-- Who did (part of) an appointment, and the incentive percentage used for it
create table public.appointment_assignments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null
    references public.appointments(id) on delete cascade,
  team_member_id uuid not null
    references public.team_members(id),
  amount_paise integer not null,
  incentive_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),

  constraint appointment_assignments_amount_positive
    check (amount_paise > 0),
  constraint appointment_assignments_incentive_range
    check (incentive_percent between 0 and 100),
  constraint appointment_assignments_unique_member
    unique (appointment_id, team_member_id)
);

create index appointment_assignments_member_idx
  on public.appointment_assignments (team_member_id);

alter table public.appointments
  add column incentive_enabled boolean not null default true;

-- Replaces all assignments of an appointment in one transaction
create or replace function public.save_appointment_assignments(
  p_appointment_id uuid,
  p_assignments jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.appointment_assignments
  where appointment_id = p_appointment_id;

  insert into public.appointment_assignments
    (appointment_id, team_member_id, amount_paise, incentive_percent)
  select
    p_appointment_id,
    (item->>'team_member_id')::uuid,
    (item->>'amount_paise')::integer,
    (item->>'incentive_percent')::numeric
  from jsonb_array_elements(p_assignments) as item;
end;
$$;

alter table public.team_members enable row level security;
alter table public.appointment_assignments enable row level security;

create policy "Authenticated staff can read team members"
on public.team_members for select to authenticated using (true);
create policy "Authenticated staff can create team members"
on public.team_members for insert to authenticated with check (true);
create policy "Authenticated staff can update team members"
on public.team_members for update to authenticated using (true) with check (true);
create policy "Authenticated staff can delete team members"
on public.team_members for delete to authenticated using (true);

create policy "Authenticated staff can read assignments"
on public.appointment_assignments for select to authenticated using (true);
create policy "Authenticated staff can create assignments"
on public.appointment_assignments for insert to authenticated with check (true);
create policy "Authenticated staff can update assignments"
on public.appointment_assignments for update to authenticated using (true) with check (true);
create policy "Authenticated staff can delete assignments"
on public.appointment_assignments for delete to authenticated using (true);

revoke all on table public.team_members from anon;
revoke all on table public.appointment_assignments from anon;
grant select, insert, update, delete on table public.team_members to authenticated;
grant select, insert, update, delete on table public.appointment_assignments to authenticated;
revoke all on function public.save_appointment_assignments(uuid, jsonb) from public, anon;
grant execute on function public.save_appointment_assignments(uuid, jsonb) to authenticated;
