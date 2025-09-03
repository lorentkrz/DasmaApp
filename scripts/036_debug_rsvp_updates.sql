-- Debug and fix RSVP updates
-- Create a new RPC function that returns debug information

create or replace function public.set_rsvp_by_token_debug(p_token text, p_status text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  guest_count integer := 0;
  invitation_count integer := 0;
  guest_info json;
begin
  if p_status not in ('pending','attending','not_attending','maybe') then
    raise exception 'Invalid RSVP status: %', p_status;
  end if;

  -- Get guest info for debugging
  select json_build_object(
    'guest_id', g.id,
    'guest_name', g.first_name || ' ' || g.last_name,
    'old_status', g.rsvp_status,
    'wedding_id', g.wedding_id
  ) into guest_info
  from public.invitations i
  join public.guests g on g.id = i.guest_id
  where i.token = p_token;

  -- Update guest RSVP status
  update public.guests g
  set rsvp_status = p_status,
      rsvp_responded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  from public.invitations i
  where i.token = p_token
    and g.id = i.guest_id;
  
  get diagnostics guest_count = row_count;

  -- Update invitation timestamps
  update public.invitations i
  set responded_at = coalesce(i.responded_at, timezone('utc', now())),
      opened_at = coalesce(i.opened_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where i.token = p_token;
  
  get diagnostics invitation_count = row_count;

  return json_build_object(
    'success', true,
    'guest_updated', guest_count > 0,
    'invitation_updated', invitation_count > 0,
    'guest_info', guest_info,
    'new_status', p_status,
    'token', p_token
  );
end;
$$;

revoke all on function public.set_rsvp_by_token_debug(text, text) from public;
grant execute on function public.set_rsvp_by_token_debug(text, text) to anon, authenticated;

-- Also create a function to check invitation token validity
create or replace function public.check_invitation_token(p_token text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'token_exists', count(*) > 0,
    'invitation_id', i.id,
    'guest_id', i.guest_id,
    'wedding_id', i.wedding_id,
    'guest_name', g.first_name || ' ' || g.last_name,
    'current_rsvp_status', g.rsvp_status,
    'invitation_created', i.created_at,
    'responded_at', i.responded_at
  )
  from public.invitations i
  left join public.guests g on g.id = i.guest_id
  where i.token = p_token
  group by i.id, i.guest_id, i.wedding_id, g.first_name, g.last_name, g.rsvp_status, i.created_at, i.responded_at;
$$;

revoke all on function public.check_invitation_token(text) from public;
grant execute on function public.check_invitation_token(text) to anon, authenticated;
