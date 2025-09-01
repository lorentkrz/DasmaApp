-- Create budget categories
create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  budgeted_amount decimal(10,2) default 0,
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  category_id uuid references public.budget_categories(id) on delete set null,
  vendor_id uuid, -- Will reference vendors table
  description text not null,
  amount decimal(10,2) not null,
  expense_date date not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'overdue')),
  payment_method text,
  receipt_url text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;

-- RLS Policies for budget categories
create policy "budget_categories_select_wedding_access"
  on public.budget_categories for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "budget_categories_insert_wedding_access"
  on public.budget_categories for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "budget_categories_update_wedding_access"
  on public.budget_categories for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "budget_categories_delete_wedding_access"
  on public.budget_categories for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

-- RLS Policies for expenses
create policy "expenses_select_wedding_access"
  on public.expenses for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "expenses_insert_wedding_access"
  on public.expenses for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    ) and created_by = auth.uid()
  );

create policy "expenses_update_wedding_access"
  on public.expenses for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "expenses_delete_wedding_access"
  on public.expenses for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
