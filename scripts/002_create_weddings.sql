-- Create weddings table for multi-tenant support
create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bride_name text not null,
  groom_name text not null,
  wedding_date date not null,
  venue_name text,
  venue_address text,
  guest_count_estimate integer default 0,
  budget_total decimal(10,2) default 0,
  status text default 'planning' check (status in ('planning', 'confirmed', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.weddings enable row level security;

-- RLS Policies for weddings
create policy "weddings_select_own"
  on public.weddings for select
  using (auth.uid() = owner_id or auth.uid() in (
    select user_id from wedding_collaborators where wedding_id = id
  ));

create policy "weddings_insert_own"
  on public.weddings for insert
  with check (auth.uid() = owner_id);

create policy "weddings_update_own"
  on public.weddings for update
  using (auth.uid() = owner_id or auth.uid() in (
    select user_id from wedding_collaborators where wedding_id = id and role = 'planner'
  ));

create policy "weddings_delete_own"
  on public.weddings for delete
  using (auth.uid() = owner_id);
