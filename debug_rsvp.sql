-- Debug RSVP function and data
-- Check if RPC function exists
SELECT proname, proargnames, prosrc 
FROM pg_proc 
WHERE proname = 'set_rsvp_by_token';

-- Check current guest data for a specific invitation
-- Replace 'YOUR_TOKEN_HERE' with actual invitation token
SELECT 
    i.token,
    i.wedding_id,
    i.guest_id,
    g.first_name,
    g.last_name,
    g.rsvp_status,
    g.rsvp_responded_at,
    g.updated_at
FROM invitations i
JOIN guests g ON g.id = i.guest_id
WHERE i.token = 'YOUR_TOKEN_HERE';

-- Test the RPC function directly
-- Replace 'YOUR_TOKEN_HERE' with actual invitation token
SELECT set_rsvp_by_token('YOUR_TOKEN_HERE', 'attending');

-- Check if update worked
SELECT 
    i.token,
    g.first_name,
    g.last_name,
    g.rsvp_status,
    g.rsvp_responded_at,
    g.updated_at
FROM invitations i
JOIN guests g ON g.id = i.guest_id
WHERE i.token = 'YOUR_TOKEN_HERE';
