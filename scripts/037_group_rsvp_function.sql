-- Create RPC function to handle group RSVP updates securely
create or replace function public.set_group_rsvp_by_token(
  p_token text, 
  p_status text,
  p_apply_all boolean default false,
  p_attendee_ids text[] default array[]::text[]
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_rec record;
  guest_rec record;
  group_members_count integer := 0;
  individual_count integer := 0;
  main_guest_updated boolean := false;
begin
  -- Validate status
  if p_status not in ('pending','attending','not_attending','maybe') then
    raise exception 'Invalid RSVP status: %', p_status;
  end if;

  -- Get invitation and main guest info
  select i.*, g.group_id, g.wedding_id as guest_wedding_id
  into invitation_rec
  from public.invitations i
  join public.guests g on g.id = i.guest_id
  where i.token = p_token;

  if not found then
    raise exception 'Invalid invitation token';
  end if;

  -- Update main guest
  update public.guests
  set rsvp_status = p_status,
      rsvp_responded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = invitation_rec.guest_id;
  
  main_guest_updated := found;

  -- Update invitation timestamps
  update public.invitations
  set responded_at = coalesce(responded_at, timezone('utc', now())),
      opened_at = coalesce(opened_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where token = p_token;

  -- Handle group updates if apply_all is true
  if p_apply_all then
    -- Update all group members (excluding main guest)
    update public.guests
    set rsvp_status = p_status,
        rsvp_responded_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where wedding_id = invitation_rec.guest_wedding_id
      and (group_id = invitation_rec.group_id or id = invitation_rec.group_id)
      and id != invitation_rec.guest_id;
    
    get diagnostics group_members_count = row_count;
  end if;

  -- Handle individual attendee selection
  if array_length(p_attendee_ids, 1) > 0 and not p_apply_all then
    update public.guests
    set rsvp_status = p_status,
        rsvp_responded_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where wedding_id = invitation_rec.guest_wedding_id
      and id = any(p_attendee_ids::uuid[])
      and id != invitation_rec.guest_id;
    
    get diagnostics individual_count = row_count;
  end if;

  return json_build_object(
    'success', true,
    'main_guest_updated', main_guest_updated,
    'group_members_updated', group_members_count,
    'individual_attendees_updated', individual_count,
    'status', p_status,
    'token', p_token
  );
end;
$$;

revoke all on function public.set_group_rsvp_by_token(text, text, boolean, text[]) from public;
grant execute on function public.set_group_rsvp_by_token(text, text, boolean, text[]) to anon, authenticated;
