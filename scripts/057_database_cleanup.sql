-- =================================================================================
-- DATABASE CLEANUP SCRIPT - REMOVE ALL CONFLICTING ELEMENTS
-- =================================================================================
-- This script removes all conflicting functions, policies, and triggers
-- before applying a clean fix

-- STEP 1: Drop all potentially conflicting functions
DROP FUNCTION IF EXISTS public.debug_session_issues() CASCADE;
DROP FUNCTION IF EXISTS public.validate_session_persistence() CASCADE;
DROP FUNCTION IF EXISTS public.comprehensive_session_debug() CASCADE;
DROP FUNCTION IF EXISTS public.test_cookie_persistence() CASCADE;
DROP FUNCTION IF EXISTS public.test_auth_queries() CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_wedding(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_auth_action(TEXT, TEXT) CASCADE;

-- STEP 2: Drop all conflicting tables
DROP TABLE IF EXISTS public.session_debug_log CASCADE;
DROP TABLE IF EXISTS public.auth_debug_log CASCADE;

-- STEP 3: Drop all RLS policies that might conflict
-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Weddings policies
DROP POLICY IF EXISTS "weddings_select_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_insert_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_update_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_delete_owner" ON public.weddings;

-- Drop all table-specific policies that might conflict
DO $$
DECLARE
    table_name TEXT;
    table_list TEXT[] := ARRAY['guests', 'expenses', 'budget_categories', 'tasks', 'task_boards',
                              'vendors', 'wedding_tables', 'cash_gifts', 'invitations'];
BEGIN
    FOREACH table_name IN ARRAY table_list LOOP
        -- Drop all policies for this table
        EXECUTE format('DROP POLICY IF EXISTS "%I_select_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_insert_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_update_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_delete_owner_only" ON public.%I', table_name, table_name);

        RAISE NOTICE 'Cleaned policies for table: %', table_name;
    END LOOP;
END $$;

-- STEP 4: Drop conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- STEP 5: Verify cleanup
SELECT 'CLEANUP VERIFICATION' as status,
       'All conflicting elements removed' as message;

-- Check remaining functions
SELECT 'REMAINING FUNCTIONS' as check_type,
       COUNT(*) as function_count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('debug_session_issues', 'validate_session_persistence',
                       'comprehensive_session_debug', 'test_cookie_persistence',
                       'test_auth_queries', 'user_owns_wedding', 'handle_new_user');

-- Check remaining policies
SELECT 'REMAINING POLICIES' as check_type,
       COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%debug%' OR policyname LIKE '%session%';

SELECT 'Cleanup completed. Now run the fresh comprehensive fix script.' as next_step;
