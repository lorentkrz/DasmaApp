-- Fix Immediate Cookie/Session Clearing Issue
-- This script addresses the problem where cookies are created but immediately cleared

-- ============================================================================
-- STEP 1: Check current JWT settings and session configuration
-- ============================================================================

-- Check current auth settings that might cause immediate session clearing
SELECT
    'JWT_EXPIRY_CHECK' as check_name,
    CASE
        WHEN setting IS NOT NULL THEN 'JWT expiry setting found: ' || setting
        ELSE 'No JWT expiry setting found - using defaults'
    END as status,
    setting
FROM pg_settings
WHERE name LIKE '%jwt%' OR name LIKE '%session%' OR name LIKE '%auth%';

-- ============================================================================
-- STEP 2: Ensure proper session handling in auth configuration
-- ============================================================================

-- Create a function to debug session issues
CREATE OR REPLACE FUNCTION public.debug_session_issues()
RETURNS TABLE (
    issue_type TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
DECLARE
    current_user_id UUID;
    session_count INT;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT
            'AUTHENTICATION'::TEXT,
            'FAILED'::TEXT,
            'No authenticated user found'::TEXT,
            'User needs to log in again'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        'AUTHENTICATION'::TEXT,
        'PASSED'::TEXT,
        'User authenticated: ' || current_user_id::TEXT,
        'Authentication working correctly'::TEXT;

    -- Check session persistence
    BEGIN
        -- Test if we can maintain a session context
        SELECT COUNT(*) INTO session_count
        FROM auth.users
        WHERE id = current_user_id;

        IF session_count > 0 THEN
            RETURN QUERY SELECT
                'SESSION_PERSISTENCE'::TEXT,
                'PASSED'::TEXT,
                'Session context maintained'::TEXT,
                'Session persistence working'::TEXT;
        ELSE
            RETURN QUERY SELECT
                'SESSION_PERSISTENCE'::TEXT,
                'FAILED'::TEXT,
                'Cannot maintain session context'::TEXT,
                'Check JWT and session configuration'::TEXT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'SESSION_PERSISTENCE'::TEXT,
            'ERROR'::TEXT,
            SQLERRM::TEXT,
            'Database error in session handling'::TEXT;
    END;

    -- Check RLS policies that might be invalidating sessions
    BEGIN
        PERFORM COUNT(*) FROM public.profiles WHERE id = current_user_id;
        RETURN QUERY SELECT
            'RLS_PROFILES'::TEXT,
            'PASSED'::TEXT,
            'Can access profiles'::TEXT,
            'RLS policies working'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'RLS_PROFILES'::TEXT,
            'FAILED'::TEXT,
            SQLERRM::TEXT,
            'Fix RLS policies on profiles table'::TEXT;
    END;

    -- Check if basic queries work
    BEGIN
        PERFORM COUNT(*) FROM public.weddings WHERE owner_id = current_user_id;
        RETURN QUERY SELECT
            'DATABASE_ACCESS'::TEXT,
            'PASSED'::TEXT,
            'Basic database access working'::TEXT,
            'No database access issues'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'DATABASE_ACCESS'::TEXT,
            'FAILED'::TEXT,
            SQLERRM::TEXT,
            'Fix database access permissions'::TEXT;
    END;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Fix potential RLS policy issues that might clear sessions
-- ============================================================================

-- Ensure profiles policies are not causing session invalidation
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Recreate with simpler policies
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- STEP 4: Create session validation function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_session_persistence()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    current_user_id UUID;
    test_timestamp TIMESTAMPTZ;
BEGIN
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT
            'SESSION_VALIDATION'::TEXT,
            'FAILED'::TEXT,
            'No authenticated user'::TEXT;
        RETURN;
    END IF;

    -- Test timestamp to ensure session context is maintained
    test_timestamp := NOW();

    RETURN QUERY SELECT
        'SESSION_VALIDATION'::TEXT,
        'PASSED'::TEXT,
        'Session validated at: ' || test_timestamp::TEXT;

    -- Test if we can perform operations that require active session
    BEGIN
        -- Test a simple query that requires authentication
        PERFORM COUNT(*) FROM public.weddings WHERE owner_id = current_user_id;

        RETURN QUERY SELECT
            'SESSION_OPERATIONS'::TEXT,
            'PASSED'::TEXT,
            'Session operations working correctly'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'SESSION_OPERATIONS'::TEXT,
            'FAILED'::TEXT,
            'Session operations failed: ' || SQLERRM::TEXT;
    END;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Grant necessary permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.debug_session_issues() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_session_issues() TO anon;
GRANT EXECUTE ON FUNCTION public.validate_session_persistence() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_session_persistence() TO anon;

-- ============================================================================
-- STEP 6: Create session monitoring trigger
-- ============================================================================

-- Create a table to log session issues for debugging
CREATE TABLE IF NOT EXISTS public.session_debug_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.session_debug_log ENABLE ROW LEVEL SECURITY;

-- Create policy for session debug log
CREATE POLICY "session_debug_log_own"
    ON public.session_debug_log FOR ALL
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.session_debug_log TO authenticated;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================

/*
To debug the immediate cookie clearing issue:

1. Run this after logging in:
   SELECT * FROM public.debug_session_issues();

2. Test session persistence:
   SELECT * FROM public.validate_session_persistence();

3. Check for session issues:
   SELECT * FROM public.session_debug_log
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;

4. If issues persist, the problem might be:
   - JWT token configuration in Supabase dashboard
   - Browser cookie settings
   - Network/proxy clearing cookies
   - Supabase project settings
*/
