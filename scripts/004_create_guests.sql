-- Create guests table
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text,
  guest_type text default 'adult' check (guest_type in ('adult', 'child', 'infant')),
  dietary_restrictions text,
  plus_one_allowed boolean default false,
  plus_one_name text,
  rsvp_status text default 'pending' check (rsvp_status in ('pending', 'attending', 'not_attending', 'maybe')),
  rsvp_responded_at timestamp with time zone,
  rsvp_notes text,
  table_assignment uuid,
  invitation_sent boolean default false,
  invitation_sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.guests enable row level security;

-- RLS Policies for guests
create policy "guests_select_wedding_access"
  on public.guests for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guests_insert_wedding_access"
  on public.guests for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guests_update_wedding_access"
  on public.guests for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "guests_delete_wedding_access"
  on public.guests for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
