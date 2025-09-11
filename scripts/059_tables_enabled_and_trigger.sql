-- Add an 'enabled' flag to wedding_tables and block seating assignments when disabled
-- Safe, idempotent migration.

begin;

-- 1) Schema change: enabled flag
alter table if exists public.wedding_tables
  add column if not exists enabled boolean not null default true;

comment on column public.wedding_tables.enabled is 'If false, table is visible but disabled for seating assignments';

-- 2) Optional trigger to prevent direct UPDATE assigning guests to a disabled table
--    This complements client-side checks. It protects integrity if someone updates the DB directly.
create or replace function public.prevent_assign_to_disabled_table()
returns trigger
language plpgsql
as $$
begin
  if NEW.table_assignment is not null then
    -- check if target table is enabled
    if exists (
      select 1
      from public.wedding_tables t
      where t.id = NEW.table_assignment and t.enabled = false
    ) then
      raise exception 'Cannot assign guest to a disabled table';
    end if;
  end if;
  return NEW;
end;
$$;

-- Drop and recreate trigger on guests
drop trigger if exists trg_prevent_assign_to_disabled on public.guests;
create trigger trg_prevent_assign_to_disabled
  before update of table_assignment on public.guests
  for each row
  execute function public.prevent_assign_to_disabled_table();

commit;
