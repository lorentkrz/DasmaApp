-- Create task boards (Kanban columns)
create table if not exists public.task_boards (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  position integer not null,
  color text default '#3b82f6',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  board_id uuid not null references public.task_boards(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  position integer not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.task_boards enable row level security;
alter table public.tasks enable row level security;

-- RLS Policies for task boards
create policy "task_boards_select_wedding_access"
  on public.task_boards for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "task_boards_insert_wedding_access"
  on public.task_boards for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "task_boards_update_wedding_access"
  on public.task_boards for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "task_boards_delete_wedding_access"
  on public.task_boards for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

-- RLS Policies for tasks
create policy "tasks_select_wedding_access"
  on public.tasks for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "tasks_insert_wedding_access"
  on public.tasks for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    ) and created_by = auth.uid()
  );

create policy "tasks_update_wedding_access"
  on public.tasks for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "tasks_delete_wedding_access"
  on public.tasks for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );
