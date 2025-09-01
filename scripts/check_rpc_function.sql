SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM 
    information_schema.routines 
WHERE 
    routine_name = 'get_invitation_and_party'
    AND routine_schema = 'public';
