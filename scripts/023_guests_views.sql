-- Guests domain views and helpful indexes (idempotent)
-- - guests_kpis: per-wedding counts and response rate
-- - guests_list_view: enriched guest list with full_name and group_name

-- Helpful indexes
create index if not exists guests_wedding_status_idx on public.guests(wedding_id, rsvp_status);
create index if not exists guests_group_idx on public.guests(group_id);

-- KPIs per wedding
create or replace view public.guests_kpis
with (security_invoker = on)
as
select 
  g.wedding_id,
  count(*)::int as total,
  count(*) filter (where g.rsvp_status = 'attending')::int as attending,
  count(*) filter (where g.rsvp_status = 'not_attending')::int as not_attending,
  count(*) filter (where g.rsvp_status = 'pending')::int as pending,
  count(*) filter (where g.rsvp_status = 'maybe')::int as maybe,
  count(*) filter (where g.plus_one_allowed is true and g.plus_one_name is not null)::int as plus_ones,
  case when count(*) > 0 then round((
    (count(*) filter (where g.rsvp_status in ('attending','not_attending','maybe')))::numeric
    / count(*)::numeric
  ) * 100) else 0 end::int as response_rate_pct
from public.guests g
group by g.wedding_id;

-- Enriched list view, preserving original column names used by frontend
create or replace view public.guests_list_view
with (security_invoker = on)
as
select 
  g.*,
  trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as full_name,
  gg.name as group_name,
  inv_last.sent_at as invitation_last_sent_at,
  inv_last.opened_at as invitation_last_opened_at,
  inv_last.responded_at as invitation_last_responded_at,
  (inv_last.sent_at is not null) as invitation_effective_sent,
  inv_last.token as invitation_last_token
from public.guests g
left join public.guest_groups gg on gg.id = g.group_id
left join lateral (
  select i.sent_at, i.opened_at, i.responded_at, i.token
  from public.invitations i
  where i.wedding_id = g.wedding_id and i.guest_id = g.id
  order by coalesce(i.sent_at, i.created_at) desc nulls last
  limit 1
) inv_last on true;

-- Permissions: allow authenticated role to select from these views (RLS applies on underlying tables)
grant select on table public.guests_kpis to authenticated;
grant select on table public.guests_list_view to authenticated;
