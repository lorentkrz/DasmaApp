-- Fix plus_one column conflict in guests table
-- Remove duplicate plus_one column, keep plus_one_allowed

-- First, copy any data from plus_one to plus_one_allowed if needed
UPDATE public.guests 
SET plus_one_allowed = plus_one 
WHERE plus_one IS NOT NULL 
  AND plus_one_allowed IS NULL;

-- Drop dependent view first
DROP VIEW IF EXISTS public.guests_list_view CASCADE;

-- Drop the duplicate plus_one column
ALTER TABLE public.guests 
DROP COLUMN IF EXISTS plus_one;

-- Ensure plus_one_allowed has proper default
ALTER TABLE public.guests 
ALTER COLUMN plus_one_allowed SET DEFAULT false;

-- Recreate the view with correct column reference
CREATE OR REPLACE VIEW public.guests_list_view
WITH (security_invoker = on)
AS
SELECT 
  g.*,
  trim(coalesce(g.first_name,'') || ' ' || coalesce(g.last_name,'')) as full_name,
  gg.name as group_name,
  inv_last.sent_at as invitation_last_sent_at,
  inv_last.opened_at as invitation_last_opened_at,
  inv_last.responded_at as invitation_last_responded_at,
  (inv_last.sent_at is not null) as invitation_effective_sent,
  inv_last.token as invitation_last_token
FROM public.guests g
LEFT JOIN public.guest_groups gg on gg.id = g.group_id
LEFT JOIN lateral (
  SELECT i.sent_at, i.opened_at, i.responded_at, i.token
  FROM public.invitations i
  WHERE i.wedding_id = g.wedding_id and i.guest_id = g.id
  ORDER BY coalesce(i.sent_at, i.created_at) desc nulls last
  LIMIT 1
) inv_last on true;

-- Grant permissions
GRANT SELECT ON TABLE public.guests_list_view TO authenticated;
