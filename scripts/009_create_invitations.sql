-- Create invitation templates
create table if not exists public.invitation_templates (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  name text not null,
  template_type text default 'rsvp' check (template_type in ('rsvp', 'save_the_date', 'thank_you')),
  subject text not null,
  message_template text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create invitations table
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  template_id uuid references public.invitation_templates(id) on delete set null,
  token text not null unique,
  invitation_type text default 'rsvp' check (invitation_type in ('rsvp', 'save_the_date', 'thank_you')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  responded_at timestamp with time zone,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invitation_templates enable row level security;
alter table public.invitations enable row level security;

-- RLS Policies for invitation templates
create policy "invitation_templates_select_wedding_access"
  on public.invitation_templates for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitation_templates_insert_wedding_access"
  on public.invitation_templates for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitation_templates_update_wedding_access"
  on public.invitation_templates for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitation_templates_delete_wedding_access"
  on public.invitation_templates for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

-- RLS Policies for invitations
create policy "invitations_select_wedding_access"
  on public.invitations for select
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitations_insert_wedding_access"
  on public.invitations for insert
  with check (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitations_update_wedding_access"
  on public.invitations for update
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

create policy "invitations_delete_wedding_access"
  on public.invitations for delete
  using (
    wedding_id in (
      select id from weddings where owner_id = auth.uid()
      union
      select wedding_id from wedding_collaborators where user_id = auth.uid()
    )
  );

-- Create function to generate unique invitation tokens
create or replace function generate_invitation_token()
returns text
language plpgsql
as $$
declare
  raw text;
begin
  -- Use standard Base64 then convert to URL-safe by translating +/ to -_ and stripping = padding
  raw := encode(gen_random_bytes(32), 'base64');
  raw := translate(raw, '+/', '-_');
  return regexp_replace(raw, '=+$', '');
end;
$$;

-- Normalize on `token` column and ensure defaults/indexes
alter table public.invitations 
  add column if not exists token text;

-- Backfill token from unique_token when present (only if column exists)
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' and table_name = 'invitations' and column_name = 'unique_token'
  ) then
    execute $$update public.invitations set token = unique_token where token is null and unique_token is not null;$$;
  end if;
end$$;

-- Ensure unique index on token
create unique index if not exists invitations_token_idx on public.invitations(token);

-- Set default token generator
alter table public.invitations 
  alter column token set default generate_invitation_token();

-- Drop legacy column if present
alter table public.invitations drop column if exists unique_token;
