-- Ensure guest_groups.primary_guest_id updates correctly when a guest is deleted
-- This migration drops and recreates the FK to use ON DELETE SET NULL

begin;

-- Drop existing FK if present
alter table if exists public.guest_groups
  drop constraint if exists guest_groups_primary_guest_id_fkey;

-- Recreate FK with ON DELETE SET NULL to allow deleting guests
alter table if exists public.guest_groups
  add constraint guest_groups_primary_guest_id_fkey
  foreign key (primary_guest_id)
  references public.guests(id)
  on delete set null;

commit;
