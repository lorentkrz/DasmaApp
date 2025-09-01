-- Create wedding collaborators table for helpers/planners
create table if not exists public.wedding_collaborators (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('helper', 'planner')),
  permissions jsonb default '{"can_edit_guests": true, "can_edit_budget": false, "can_edit_vendors": true, "can_edit_tasks": true}'::jsonb,
  invited_by uuid not null references auth.users(id),
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  accepted_at timestamp with time zone,
  unique(wedding_id, user_id)
);

-- Enable RLS
alter table public.wedding_collaborators enable row level security;

-- RLS Policies for wedding collaborators
create policy "collaborators_select_related"
  on public.wedding_collaborators for select
  using (
    auth.uid() = user_id or 
    auth.uid() = invited_by or
    auth.uid() in (select owner_id from weddings where id = wedding_id)
  );

create policy "collaborators_insert_owner"
  on public.wedding_collaborators for insert
  with check (
    auth.uid() = invited_by and
    auth.uid() in (select owner_id from weddings where id = wedding_id)
  );

create policy "collaborators_update_own"
  on public.wedding_collaborators for update
  using (auth.uid() = user_id or auth.uid() = invited_by);

create policy "collaborators_delete_owner"
  on public.wedding_collaborators for delete
  using (
    auth.uid() = invited_by or
    auth.uid() in (select owner_id from weddings where id = wedding_id)
  );
