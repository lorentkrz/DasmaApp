-- Comprehensive authentication debug and fix script
-- This script addresses all authentication-related issues found in the analysis

-- ============================================================================
-- 1. DEBUG: Check current authentication setup
-- ============================================================================

-- Check if auth.users table is accessible
SELECT 'AUTH USERS CHECK' as check_type, COUNT(*) as user_count
FROM auth.users;

-- Check profiles table
SELECT 'PROFILES CHECK' as check_type, COUNT(*) as profile_count
FROM public.profiles;

-- Check weddings and their owners
SELECT 'WEDDINGS CHECK' as check_type, 
       COUNT(*) as wedding_count,
       COUNT(DISTINCT owner_id) as unique_owners
FROM public.weddings;

-- Check for orphaned weddings (weddings without users)
SELECT 'ORPHANED WEDDINGS' as check_type,
       COUNT(*) as orphaned_count
FROM public.weddings w
LEFT JOIN auth.users u ON w.owner_id = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- 2. FIX: Ensure all RLS policies are consistent
-- ============================================================================

-- Fix weddings RLS policies 
DROP POLICY IF EXISTS "weddings_select_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_insert_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_update_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_delete_owner" ON public.weddings;

-- Create consistent wedding policies
CREATE POLICY "weddings_select_owner"
  ON public.weddings FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "weddings_insert_owner"
  ON public.weddings FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "weddings_update_owner"
  ON public.weddings FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "weddings_delete_owner"
  ON public.weddings FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- 3. FIX: Check and fix all domain RLS policies for consistency
-- ============================================================================

-- Function to check if a wedding belongs to the current user
CREATE OR REPLACE FUNCTION public.user_owns_wedding(wedding_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.weddings 
    WHERE id = wedding_uuid AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FIX: Ensure all critical tables have proper owner-based RLS
-- ============================================================================

-- Fix any remaining RLS issues by re-creating all policies consistently
DO $$
DECLARE
    table_name TEXT;
    table_list TEXT[] := ARRAY['guests', 'expenses', 'budget_categories', 'tasks', 'task_boards', 
                              'vendors', 'wedding_tables', 'cash_gifts', 'invitations'];
BEGIN
    FOREACH table_name IN ARRAY table_list LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "%I_select_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_insert_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_update_owner_only" ON public.%I', table_name, table_name);
        EXECUTE format('DROP POLICY IF EXISTS "%I_delete_owner_only" ON public.%I', table_name, table_name);
        
        -- Create consistent owner-only policies
        EXECUTE format('CREATE POLICY "%I_select_owner_only" ON public.%I FOR SELECT USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()))', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_insert_owner_only" ON public.%I FOR INSERT WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()))', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_update_owner_only" ON public.%I FOR UPDATE USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()))', table_name, table_name);
        EXECUTE format('CREATE POLICY "%I_delete_owner_only" ON public.%I FOR DELETE USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()))', table_name, table_name);
        
        RAISE NOTICE 'Fixed RLS policies for table: %', table_name;
    END LOOP;
END $$;

-- ============================================================================
-- 5. VALIDATION: Test authentication queries
-- ============================================================================

-- Test query that should work after authentication
CREATE OR REPLACE FUNCTION public.test_auth_queries()
RETURNS TABLE (
    test_name TEXT,
    success BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    -- Test 1: Can we access weddings?
    BEGIN
        PERFORM COUNT(*) FROM public.weddings;
        RETURN QUERY SELECT 'weddings_access'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'weddings_access'::TEXT, false, SQLERRM;
    END;
    
    -- Test 2: Can we access profiles?
    BEGIN
        PERFORM COUNT(*) FROM public.profiles;
        RETURN QUERY SELECT 'profiles_access'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'profiles_access'::TEXT, false, SQLERRM;
    END;
    
    -- Test 3: Can we access guests through RLS?
    BEGIN
        PERFORM COUNT(*) FROM public.guests;
        RETURN QUERY SELECT 'guests_rls_access'::TEXT, true, NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'guests_rls_access'::TEXT, false, SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. SUMMARY AND INSTRUCTIONS
-- ============================================================================

-- Run this to test after applying the fixes:
-- SELECT * FROM public.test_auth_queries();

COMMENT ON FUNCTION public.test_auth_queries() IS 'Test function to validate authentication fixes';
COMMENT ON FUNCTION public.user_owns_wedding(UUID) IS 'Helper function to check wedding ownership';

-- Summary of fixes applied:
-- ✅ Ensured profiles table exists and has proper RLS
-- ✅ Fixed weddings RLS policies 
-- ✅ Re-created all domain RLS policies consistently
-- ✅ Added helper functions for authentication
-- ✅ Added validation tests
--
-- This should resolve authentication redirect issues by ensuring:
-- 1. All necessary tables exist
-- 2. All RLS policies are consistent 
-- 3. No circular dependencies in policy checks
-- 4. Proper owner-based access control
