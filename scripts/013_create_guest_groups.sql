-- Guest groups (households/parties) for inviting multiple people with a single invite
create table if not exists public.guest_groups (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text, -- optional label, e.g., "The Smith Family"
  primary_guest_id uuid references public.guests(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.guest_groups enable row level security;

create policy "guest_groups_select_wedding_access"
  on public.guest_groups for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guest_groups_insert_wedding_access"
  on public.guest_groups for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guest_groups_update_wedding_access"
  on public.guest_groups for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guest_groups_delete_wedding_access"
  on public.guest_groups for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

-- Add group_id to guests for simple membership (flat list, no relationships)
alter table public.guests
  add column if not exists group_id uuid references public.guest_groups(id) on delete set null;

-- Invitations can point to either a single guest or a group
alter table public.invitations
  alter column guest_id drop not null;

alter table public.invitations
  add column if not exists group_id uuid references public.guest_groups(id) on delete cascade;

-- Ensure exactly one target is set (guest or group)
create or replace function public.invitations_target_check(inv public.invitations)
returns boolean language sql immutable as $$
  (inv.guest_id is not null and inv.group_id is null) or (inv.guest_id is null and inv.group_id is not null)
$$;

alter table public.invitations
  drop constraint if exists invitations_target_ck;

alter table public.invitations
  add constraint invitations_target_ck check (public.invitations_target_check((public.invitations).*));
