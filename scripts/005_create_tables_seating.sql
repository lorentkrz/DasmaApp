-- Create tables for seating arrangements
create table if not exists public.wedding_tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  table_number integer not null,
  table_name text,
  capacity integer not null default 8,
  table_type text default 'round' check (table_type in ('round', 'rectangular', 'square')),
  position_x decimal(10,2) default 0,
  position_y decimal(10,2) default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id, table_number)
);

-- Enable RLS
alter table public.wedding_tables enable row level security;

-- Add foreign key constraint to guests table
alter table public.guests 
add constraint fk_guests_table_assignment 
foreign key (table_assignment) references public.wedding_tables(id) on delete set null;

-- RLS Policies for wedding tables
create policy "tables_select_wedding_access"
  on public.wedding_tables for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "tables_insert_wedding_access"
  on public.wedding_tables for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "tables_update_wedding_access"
  on public.wedding_tables for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "tables_delete_wedding_access"
  on public.wedding_tables for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
