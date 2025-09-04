-- Harden update_rsvp_by_token: when attendee IDs are provided, only require same wedding, not strict group membership.
-- This avoids failures when group linking differs across datasets.

begin;

create or replace function public.update_rsvp_by_token(
  p_token text,
  p_status text,
  p_apply_all boolean,
  p_attendee_ids uuid[]
)
returns table(updated_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv record;
  v_primary uuid;
  v_ids uuid[];
begin
  -- Load invitation
  select id, guest_id, group_id, wedding_id
    into v_inv
  from invitations
  where token = p_token;
  if not found then
    raise exception 'Invalid invitation token';
  end if;

  -- Resolve primary guest id
  v_primary := v_inv.guest_id;
  if v_primary is null and v_inv.group_id is not null then
    select primary_guest_id into v_primary from guest_groups where id = v_inv.group_id;
  end if;
  if v_primary is null then
    raise exception 'No guest resolved for this invitation';
  end if;

  -- Build list of IDs to update
  if p_apply_all then
    v_ids := array(
      select id from guests
      where wedding_id = v_inv.wedding_id
        and (
          id = v_primary
          or group_id = v_primary
          or (v_inv.group_id is not null and group_id = v_inv.group_id)
        )
    );
  elsif p_attendee_ids is not null and array_length(p_attendee_ids, 1) is not null then
    -- Only require same wedding for per-person updates, to be resilient to grouping schema
    v_ids := (
      select array_agg(id)
      from guests
      where id = any(p_attendee_ids)
        and wedding_id = v_inv.wedding_id
    );
  else
    v_ids := array[v_primary];
  end if;

  -- Update the guests and return only actually updated ids
  return query
  with updated as (
    update guests
       set rsvp_status = p_status::text,
           rsvp_responded_at = now(),
           updated_at = now()
     where id = any(v_ids)
     returning id
  )
  select id as updated_id from updated;

  -- Touch invitation timestamps (best-effort)
  update invitations
     set responded_at = now(),
         opened_at = coalesce(opened_at, now()),
         updated_at = now()
   where token = p_token;
end;
$$;

-- grants unchanged
commit;
