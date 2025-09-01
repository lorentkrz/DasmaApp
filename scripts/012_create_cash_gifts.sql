-- Cash gifts (Bakshish) given by guests
create table if not exists public.cash_gifts (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  guest_id uuid references public.guests(id) on delete set null,
  amount decimal(10,2) not null,
  gift_date date not null default (current_date),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cash_gifts enable row level security;

-- RLS Policies: owner or collaborator can see wedding gifts; insert must be by an authorized user and records must belong to accessible wedding
create policy "cash_gifts_select_wedding_access"
  on public.cash_gifts for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "cash_gifts_insert_wedding_access"
  on public.cash_gifts for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    ) and created_by = auth.uid()
  );

create policy "cash_gifts_update_wedding_access"
  on public.cash_gifts for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "cash_gifts_delete_wedding_access"
  on public.cash_gifts for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
