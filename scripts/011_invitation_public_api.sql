-- Public API for invitations via secure RPCs
-- This allows guests (anon) to access only their own invitation via token

-- Function to fetch invitation and guest info by token
create or replace function public.get_invitation_and_guest(p_token text)
returns table (
  invitation_id uuid,
  wedding_id uuid,
  guest_id uuid,
  first_name text,
  last_name text,
  rsvp_status text
)
language sql
security definer
set search_path = public
as $$
  select i.id as invitation_id,
         i.wedding_id,
         g.id as guest_id,
         g.first_name,
         g.last_name,
         g.rsvp_status
  from public.invitations i
  join public.guests g on g.id = i.guest_id
  where i.token = p_token
  limit 1;
$$;

revoke all on function public.get_invitation_and_guest(text) from public;
grant execute on function public.get_invitation_and_guest(text) to anon, authenticated;

-- Function to set RSVP by token
create or replace function public.set_rsvp_by_token(p_token text, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('pending','attending','not_attending','maybe') then
    raise exception 'Invalid RSVP status';
  end if;

  update public.guests g
  set rsvp_status = p_status,
      rsvp_responded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  from public.invitations i
  where i.token = p_token
    and g.id = i.guest_id;

  -- Ensure we have at least one row affected
  if not found then
    raise exception 'No guest found for token %', p_token;
  end if;

  update public.invitations i
  set responded_at = coalesce(i.responded_at, timezone('utc', now())),
      opened_at = coalesce(i.opened_at, timezone('utc', now()))
  where i.token = p_token;
end;
$$;

revoke all on function public.set_rsvp_by_token(text, text) from public;
grant execute on function public.set_rsvp_by_token(text, text) to anon, authenticated;
