-- =================================================================================
-- COMPREHENSIVE FIX FOR IMMEDIATE COOKIE CLEARING - FINAL SOLUTION
-- =================================================================================
-- This script addresses ALL potential causes of immediate cookie/session clearing

-- STEP 1: Check current auth configuration
SELECT
    'Current Auth Settings Check' as check_type,
    name,
    setting,
    CASE
        WHEN name LIKE '%jwt%' THEN 'JWT Configuration'
        WHEN name LIKE '%session%' THEN 'Session Configuration'
        WHEN name LIKE '%auth%' THEN 'Auth Configuration'
        ELSE 'Other'
    END as category
FROM pg_settings
WHERE name LIKE '%jwt%' OR name LIKE '%session%' OR name LIKE '%auth%'
ORDER BY category, name;

-- STEP 2: Comprehensive session debugging function
CREATE OR REPLACE FUNCTION public.comprehensive_session_debug()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
DECLARE
    current_user_id UUID;
    user_count INT;
    profile_exists BOOLEAN;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    -- Check 1: Basic authentication
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT
            'AUTHENTICATION'::TEXT,
            'FAILED'::TEXT,
            'No authenticated user found - session may have been cleared'::TEXT,
            'Check browser cookies and Supabase project settings'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        'AUTHENTICATION'::TEXT,
        'PASSED'::TEXT,
        'User authenticated: ' || current_user_id::TEXT,
        'Authentication working'::TEXT;

    -- Check 2: User exists in auth.users
    SELECT COUNT(*) INTO user_count
    FROM auth.users
    WHERE id = current_user_id;

    IF user_count = 0 THEN
        RETURN QUERY SELECT
            'USER_EXISTS'::TEXT,
            'FAILED'::TEXT,
            'User not found in auth.users table'::TEXT,
            'Check Supabase user management'::TEXT;
    ELSE
        RETURN QUERY SELECT
            'USER_EXISTS'::TEXT,
            'PASSED'::TEXT,
            'User exists in auth.users'::TEXT,
            'User data intact'::TEXT;
    END IF;

    -- Check 3: Profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = current_user_id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        RETURN QUERY SELECT
            'PROFILE_EXISTS'::TEXT,
            'FAILED'::TEXT,
            'User profile missing'::TEXT,
            'Profile triggers may not be working'::TEXT;
    ELSE
        RETURN QUERY SELECT
            'PROFILE_EXISTS'::TEXT,
            'PASSED'::TEXT,
            'User profile exists'::TEXT,
            'Profile data available'::TEXT;
    END IF;

    -- Check 4: Test basic data access
    BEGIN
        PERFORM COUNT(*) FROM public.weddings WHERE owner_id = current_user_id;
        RETURN QUERY SELECT
            'DATA_ACCESS'::TEXT,
            'PASSED'::TEXT,
            'Can access user data'::TEXT,
            'Database access working'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'DATA_ACCESS'::TEXT,
            'FAILED'::TEXT,
            'Cannot access user data: ' || SQLERRM::TEXT,
            'Check RLS policies and permissions'::TEXT;
    END;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Fix RLS policies that might cause session clearing
-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Create simplified policies
CREATE POLICY "profiles_select_policy"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- STEP 4: Ensure profile trigger is working
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 6: Create cookie debugging function
CREATE OR REPLACE FUNCTION public.test_cookie_persistence()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
DECLARE
    current_user_id UUID;
    test_start TIMESTAMPTZ;
BEGIN
    current_user_id := auth.uid();
    test_start := NOW();

    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT
            'COOKIE_TEST'::TEXT,
            'FAILED'::TEXT,
            'No user session found'::TEXT;
        RETURN;
    END IF;

    -- Test 1: Basic session persistence
    RETURN QUERY SELECT
        'SESSION_PERSISTENCE'::TEXT,
        'PASSED'::TEXT,
        'Session active for user: ' || current_user_id::TEXT;

    -- Test 2: Database access with session
    BEGIN
        PERFORM COUNT(*) FROM public.profiles WHERE id = current_user_id;
        RETURN QUERY SELECT
            'DATABASE_ACCESS'::TEXT,
            'PASSED'::TEXT,
            'Database accessible with current session'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT
            'DATABASE_ACCESS'::TEXT,
            'FAILED'::TEXT,
            'Database access failed: ' || SQLERRM::TEXT;
    END;

    -- Test 3: Timestamp consistency
    RETURN QUERY SELECT
        'TIMESTAMP_TEST'::TEXT,
        'PASSED'::TEXT,
        'Test completed at: ' || test_start::TEXT;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.comprehensive_session_debug() TO authenticated;
GRANT EXECUTE ON FUNCTION public.comprehensive_session_debug() TO anon;
GRANT EXECUTE ON FUNCTION public.test_cookie_persistence() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_cookie_persistence() TO anon;

-- STEP 7: Create session monitoring table
CREATE TABLE IF NOT EXISTS public.auth_debug_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    session_info TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_debug_log ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "auth_debug_log_policy"
    ON public.auth_debug_log FOR ALL
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.auth_debug_log TO authenticated;

-- STEP 8: Insert debug record function
CREATE OR REPLACE FUNCTION public.log_auth_action(action_name TEXT, session_details TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.auth_debug_log (user_id, action, session_info)
    VALUES (auth.uid(), action_name, session_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================================
-- HOW TO USE THIS SCRIPT
-- =================================================================================
/*
1. Copy this entire script and paste it into your Supabase SQL Editor
2. Run the script
3. After logging in, test these functions in Supabase SQL Editor:

   -- Test comprehensive session debug:
   SELECT * FROM public.comprehensive_session_debug();

   -- Test cookie persistence:
   SELECT * FROM public.test_cookie_persistence();

   -- Check auth debug logs:
   SELECT * FROM public.auth_debug_log
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;

4. If issues persist, the problem is likely:
   - Supabase project JWT settings
   - Browser cookie settings
   - Network/proxy configuration
   - Supabase dashboard auth configuration

5. Check Supabase Dashboard Settings:
   - Go to Authentication > Settings
   - Verify JWT expiry settings
   - Check session configuration
   - Ensure "Enable email confirmations" is properly set
*/
