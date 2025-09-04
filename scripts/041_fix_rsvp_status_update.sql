-- Fix RSVP status update issue - ensure the function actually updates the guest status
-- Replace the existing function with a more robust version

CREATE OR REPLACE FUNCTION public.set_rsvp_by_token_debug(p_token text, p_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_count integer := 0;
  invitation_count integer := 0;
  guest_info json;
  invitation_exists boolean := false;
  guest_exists boolean := false;
  target_guest_id uuid;
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending','attending','not_attending','maybe') THEN
    RAISE EXCEPTION 'Invalid RSVP status: %', p_status;
  END IF;

  -- Check if invitation exists
  SELECT EXISTS(SELECT 1 FROM public.invitations WHERE token = p_token) INTO invitation_exists;
  
  -- Resolve target guest: prefer invitation.guest_id, else group's primary guest
  SELECT COALESCE(i.guest_id, gg.primary_guest_id)
  INTO target_guest_id
  FROM public.invitations i
  LEFT JOIN public.guest_groups gg ON gg.id = i.group_id
  WHERE i.token = p_token;

  -- Get guest info for debugging BEFORE update
  SELECT json_build_object(
    'invitation_exists', invitation_exists,
    'guest_id', g.id,
    'guest_name', COALESCE(g.first_name || ' ' || g.last_name, 'Unknown'),
    'old_status', g.rsvp_status,
    'wedding_id', g.wedding_id,
    'token', p_token
  ) INTO guest_info
  FROM public.guests g
  WHERE g.id = target_guest_id;

  -- Check if guest exists
  SELECT EXISTS(
    SELECT 1 FROM public.guests g 
    WHERE g.id = target_guest_id
  ) INTO guest_exists;

  -- Update guest RSVP status for the resolved target guest
  UPDATE public.guests 
  SET 
    rsvp_status = p_status,
    rsvp_responded_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  WHERE id = target_guest_id;
  
  GET DIAGNOSTICS guest_count = ROW_COUNT;

  -- Update invitation timestamps
  UPDATE public.invitations 
  SET 
    responded_at = COALESCE(responded_at, timezone('utc', now())),
    opened_at = COALESCE(opened_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  WHERE token = p_token;
  
  GET DIAGNOSTICS invitation_count = ROW_COUNT;

  -- Return comprehensive debug info
  RETURN json_build_object(
    'success', guest_count > 0,
    'guest_updated', guest_count > 0,
    'invitation_updated', invitation_count > 0,
    'guest_count', guest_count,
    'invitation_count', invitation_count,
    'invitation_exists', invitation_exists,
    'guest_exists', guest_exists,
    'guest_info', guest_info,
    'new_status', p_status,
    'token', p_token,
    'timestamp', timezone('utc', now())
  );
END;
$$;

-- Ensure proper permissions
REVOKE ALL ON FUNCTION public.set_rsvp_by_token_debug(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_rsvp_by_token_debug(text, text) TO anon, authenticated;

-- Also fix the original function to work properly
CREATE OR REPLACE FUNCTION public.set_rsvp_by_token(p_token text, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_guest_id uuid;
BEGIN
  IF p_status NOT IN ('pending','attending','not_attending','maybe') THEN
    RAISE EXCEPTION 'Invalid RSVP status: %', p_status;
  END IF;

  -- Resolve target guest: prefer invitation.guest_id, else group's primary guest
  SELECT COALESCE(i.guest_id, gg.primary_guest_id)
  INTO target_guest_id
  FROM public.invitations i
  LEFT JOIN public.guest_groups gg ON gg.id = i.group_id
  WHERE i.token = p_token;

  -- Update guest RSVP status
  UPDATE public.guests 
  SET 
    rsvp_status = p_status,
    rsvp_responded_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  WHERE id = target_guest_id;

  -- Ensure we updated at least one row
  IF NOT FOUND OR target_guest_id IS NULL THEN
    RAISE EXCEPTION 'No guest found for token %', p_token;
  END IF;

  -- Update invitation timestamps
  UPDATE public.invitations 
  SET 
    responded_at = COALESCE(responded_at, timezone('utc', now())),
    opened_at = COALESCE(opened_at, timezone('utc', now())),
    updated_at = timezone('utc', now())
  WHERE token = p_token;
END;
$$;

REVOKE ALL ON FUNCTION public.set_rsvp_by_token(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_rsvp_by_token(text, text) TO anon, authenticated;
