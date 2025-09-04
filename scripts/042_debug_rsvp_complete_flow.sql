-- Complete debug of RSVP flow - check all aspects of the status update
-- This will help identify exactly where the disconnect is happening

-- First, let's create a comprehensive debug function
CREATE OR REPLACE FUNCTION public.debug_rsvp_complete_flow(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'token_check', (
      SELECT json_build_object(
        'token_exists', EXISTS(SELECT 1 FROM invitations WHERE token = p_token),
        'invitation_data', (
          SELECT json_build_object(
            'id', i.id,
            'wedding_id', i.wedding_id,
            'guest_id', i.guest_id,
            'created_at', i.created_at,
            'responded_at', i.responded_at
          )
          FROM invitations i WHERE i.token = p_token
        )
      )
    ),
    'guest_check', (
      SELECT json_build_object(
        'guest_exists', g.id IS NOT NULL,
        'current_rsvp_status', g.rsvp_status,
        'rsvp_responded_at', g.rsvp_responded_at,
        'updated_at', g.updated_at,
        'guest_name', g.first_name || ' ' || g.last_name,
        'guest_data', json_build_object(
          'id', g.id,
          'wedding_id', g.wedding_id,
          'first_name', g.first_name,
          'last_name', g.last_name,
          'rsvp_status', g.rsvp_status,
          'rsvp_responded_at', g.rsvp_responded_at,
          'created_at', g.created_at,
          'updated_at', g.updated_at
        )
      )
      FROM invitations i
      LEFT JOIN guests g ON g.id = i.guest_id
      WHERE i.token = p_token
    ),
    'rls_check', (
      SELECT json_build_object(
        'can_select_invitation', EXISTS(SELECT 1 FROM invitations WHERE token = p_token),
        'can_select_guest', EXISTS(
          SELECT 1 FROM invitations i 
          JOIN guests g ON g.id = i.guest_id 
          WHERE i.token = p_token
        ),
        'wedding_owner', (
          SELECT w.owner_id
          FROM invitations i
          JOIN weddings w ON w.id = i.wedding_id
          WHERE i.token = p_token
        )
      )
    ),
    'rpc_function_test', (
      SELECT json_build_object(
        'get_invitation_and_guest', (
          SELECT array_agg(
            json_build_object(
              'invitation_id', invitation_id,
              'wedding_id', wedding_id,
              'guest_id', guest_id,
              'first_name', first_name,
              'last_name', last_name,
              'rsvp_status', rsvp_status
            )
          )
          FROM get_invitation_and_guest(p_token)
        )
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant permissions
REVOKE ALL ON FUNCTION public.debug_rsvp_complete_flow(text) FROM public;
GRANT EXECUTE ON FUNCTION public.debug_rsvp_complete_flow(text) TO anon, authenticated;

-- Also create a function to test direct guest update
CREATE OR REPLACE FUNCTION public.test_direct_guest_update(p_token text, p_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_id_found uuid;
  update_count integer := 0;
  before_status text;
  after_status text;
BEGIN
  -- Get guest ID and current status
  SELECT g.id, g.rsvp_status INTO guest_id_found, before_status
  FROM invitations i
  JOIN guests g ON g.id = i.guest_id
  WHERE i.token = p_token;
  
  -- Try direct update
  UPDATE guests 
  SET rsvp_status = p_status,
      rsvp_responded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  WHERE id = guest_id_found;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Get status after update
  SELECT rsvp_status INTO after_status
  FROM guests
  WHERE id = guest_id_found;
  
  RETURN json_build_object(
    'guest_id', guest_id_found,
    'before_status', before_status,
    'after_status', after_status,
    'update_count', update_count,
    'success', update_count > 0 AND after_status = p_status,
    'token', p_token,
    'requested_status', p_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.test_direct_guest_update(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.test_direct_guest_update(text, text) TO anon, authenticated;
