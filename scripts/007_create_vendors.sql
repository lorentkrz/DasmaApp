-- Create vendors table
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  category text not null check (category in ('photographer', 'videographer', 'florist', 'caterer', 'venue', 'dj', 'band', 'baker', 'decorator', 'transportation', 'other')),
  contact_person text,
  email text,
  phone text,
  website text,
  address text,
  contract_amount decimal(10,2),
  deposit_amount decimal(10,2),
  deposit_paid boolean default false,
  final_payment_due date,
  contract_signed boolean default false,
  contract_url text,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  status text default 'considering' check (status in ('considering', 'contacted', 'booked', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.vendors enable row level security;

-- Add foreign key constraint to expenses table
alter table public.expenses 
add constraint fk_expenses_vendor 
foreign key (vendor_id) references public.vendors(id) on delete set null;

-- RLS Policies for vendors
create policy "vendors_select_wedding_access"
  on public.vendors for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "vendors_insert_wedding_access"
  on public.vendors for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "vendors_update_wedding_access"
  on public.vendors for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "vendors_delete_wedding_access"
  on public.vendors for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
