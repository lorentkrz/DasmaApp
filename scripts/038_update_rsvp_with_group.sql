-- Create RPC function to handle RSVP updates with group members
create or replace function public.update_rsvp_with_group(
  invitation_token text,
  new_status text,
  group_guest_ids text[] default array[]::text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_rec record;
begin
  -- Validate status
  if new_status not in ('pending','attending','not_attending','maybe') then
    raise exception 'Invalid RSVP status: %', new_status;
  end if;

  -- Get invitation info
  select i.*, g.wedding_id, g.id as main_guest_id
  into invitation_rec
  from public.invitations i
  join public.guests g on g.id = i.guest_id
  where i.token = invitation_token;

  if not found then
    raise exception 'Invalid invitation token';
  end if;

  -- Update main guest
  update public.guests
  set rsvp_status = new_status,
      rsvp_responded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = invitation_rec.main_guest_id;

  -- Update group members if provided
  if array_length(group_guest_ids, 1) > 0 then
    update public.guests
    set rsvp_status = new_status,
        rsvp_responded_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where wedding_id = invitation_rec.wedding_id
      and id = any(group_guest_ids::uuid[]);
  end if;

  -- Update invitation timestamps
  update public.invitations
  set responded_at = coalesce(responded_at, timezone('utc', now())),
      opened_at = coalesce(opened_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where token = invitation_token;
end;
$$;

revoke all on function public.update_rsvp_with_group(text, text, text[]) from public;
grant execute on function public.update_rsvp_with_group(text, text, text[]) to anon, authenticated;
