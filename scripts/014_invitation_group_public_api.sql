-- Group-aware public API for invitations via secure RPCs
-- Allows anon access by token only

-- Return either a single guest or a party (group) with members
create or replace function public.get_invitation_and_party(p_token text)
returns table (
  invitation_id uuid,
  wedding_id uuid,
  is_group boolean,
  primary_guest_id uuid,
  primary_first_name text,
  primary_last_name text,
  members jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with inv as (
    select i.*, g.group_id as guest_group_id
    from public.invitations i
    left join public.guests g on g.id = i.guest_id
    where i.token = p_token
    limit 1
  ), grp as (
    select coalesce(inv.guest_group_id, g.group_id) as gid, inv.wedding_id
    from inv
    left join public.guests g on g.id = inv.guest_id
  )
  select 
    i.id as invitation_id,
    i.wedding_id,
    (grp.gid is not null) as is_group,
    case when grp.gid is not null then gg.primary_guest_id else i.guest_id end as primary_guest_id,
    pg.first_name as primary_first_name,
    pg.last_name as primary_last_name,
    case when grp.gid is not null then (
      select jsonb_agg(jsonb_build_object(
        'id', g.id,
        'first_name', g.first_name,
        'last_name', g.last_name,
        'rsvp_status', g.rsvp_status
      ) order by g.created_at asc)
      from public.guests g
      where g.group_id = grp.gid
    ) else (
      select jsonb_agg(jsonb_build_object(
        'id', pg.id,
        'first_name', pg.first_name,
        'last_name', pg.last_name,
        'rsvp_status', pg.rsvp_status
      ))
      from public.guests pg
      where pg.id = i.guest_id
    ) end as members
  from inv i
  left join grp on true
  left join public.guest_groups gg on gg.id = grp.gid
  left join public.guests pg on pg.id = coalesce(gg.primary_guest_id, i.guest_id)
  where i.id is not null;
end;
$$;

revoke all on function public.get_invitation_and_party(text) from public;
grant execute on function public.get_invitation_and_party(text) to anon, authenticated;

-- Set party response: either apply to all members or only to provided attendee ids
create or replace function public.set_party_response_by_token(
  p_token text,
  p_status text,
  p_apply_all boolean default false,
  p_attendee_ids uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('pending','attending','not_attending','maybe') then
    raise exception 'Invalid status';
  end if;

  -- identify target guest ids by token
  with inv as (
    select i.*, coalesce(g.group_id, i.group_id) as gid
    from public.invitations i
    left join public.guests g on g.id = i.guest_id
    where i.token = p_token
    limit 1
  ), target as (
    select case 
      when inv.gid is not null then (
        select array_agg(g.id) from public.guests g where g.group_id = inv.gid
      )
      else array[inv.guest_id]
    end as ids
    from inv
  )
  update public.guests g
  set rsvp_status = p_status,
      rsvp_responded_at = timezone('utc', now())
  where g.id = any(
    case 
      when p_apply_all then (select ids from target)
      when p_attendee_ids is not null then p_attendee_ids
      else (select ids from target) -- default apply all
    end
  );

  update public.invitations i
  set responded_at = coalesce(i.responded_at, timezone('utc', now()))
  where i.token = p_token;
end;
$$;

revoke all on function public.set_party_response_by_token(text, text, boolean, uuid[]) from public;
grant execute on function public.set_party_response_by_token(text, text, boolean, uuid[]) to anon, authenticated;
