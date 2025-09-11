-- Create notifications table for in-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  seen boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies: users can only see and update their own notifications
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Insert will be performed by service role or Security Definer functions.

-- Create push_subscriptions to store browser push endpoints
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies: users manage only their own subscriptions
create policy "push_select_own"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "push_insert_own"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "push_update_own"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_delete_own"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
