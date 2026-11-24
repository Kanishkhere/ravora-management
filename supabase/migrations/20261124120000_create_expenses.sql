create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  category text not null,
  description text not null,
  amount_paise integer not null,
  payment_mode text not null default 'cash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint expenses_category_length
    check (char_length(btrim(category)) between 1 and 60),
  constraint expenses_description_length
    check (char_length(btrim(description)) between 1 and 200),
  constraint expenses_amount_positive
    check (amount_paise > 0),
  constraint expenses_payment_mode_check
    check (payment_mode in ('online', 'cash'))
);

create index expenses_date_idx on public.expenses (expense_date);

create or replace function public.set_expense_audit_fields()
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

create trigger expenses_set_audit_fields
before update on public.expenses
for each row execute function public.set_expense_audit_fields();

alter table public.expenses enable row level security;

create policy "Authenticated staff can read expenses"
on public.expenses
for select
to authenticated
using (true);

create policy "Authenticated staff can create expenses"
on public.expenses
for insert
to authenticated
with check (true);

create policy "Authenticated staff can update expenses"
on public.expenses
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated staff can delete expenses"
on public.expenses
for delete
to authenticated
using (true);

revoke all on table public.expenses from anon;
grant select, insert, update, delete on table public.expenses to authenticated;
