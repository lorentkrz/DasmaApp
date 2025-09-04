-- Fix get_invitation_and_guest RPC function to remove unique_token references
-- This addresses the "column i.unique_token does not exist" error

CREATE OR REPLACE FUNCTION public.get_invitation_and_guest(p_token text)
RETURNS TABLE (
  invitation_id uuid,
  wedding_id uuid,
  guest_id uuid,
  first_name text,
  last_name text,
  rsvp_status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id as invitation_id,
         i.wedding_id,
         g.id as guest_id,
         g.first_name,
         g.last_name,
         g.rsvp_status
  FROM public.invitations i
  JOIN public.guests g ON g.id = i.guest_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

-- Ensure proper permissions
REVOKE ALL ON FUNCTION public.get_invitation_and_guest(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invitation_and_guest(text) TO anon, authenticated;
