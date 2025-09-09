-- Authentication Debug and Test Script
-- Run this script to identify and debug authentication issues
-- This script will help diagnose the exact problems with your middleware and auth flow

-- ============================================================================
-- 1. BASIC CONNECTIVITY AND SETUP CHECKS
-- ============================================================================

\echo '=== BASIC SETUP CHECKS ==='

-- Check if auth.users table exists and is accessible
SELECT 
    'AUTH_USERS_TABLE' as check_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS: Auth users table accessible'
        ELSE 'FAIL: Cannot access auth.users'
    END as result,
    COUNT(*) as total_users
FROM auth.users;

-- Check if profiles table exists
SELECT 
    'PROFILES_TABLE' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
        THEN 'PASS: Profiles table exists'
        ELSE 'FAIL: Profiles table missing'
    END as result;

-- Check if weddings table exists and has proper structure
SELECT 
    'WEDDINGS_TABLE' as check_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS: Weddings table accessible'
        ELSE 'FAIL: Cannot access weddings table'
    END as result,
    COUNT(*) as total_weddings
FROM public.weddings;

-- ============================================================================
-- 2. RLS POLICY VALIDATION
-- ============================================================================

\echo '=== RLS POLICY VALIDATION ==='

-- Check RLS is enabled on critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'PASS: RLS enabled'
        ELSE 'FAIL: RLS not enabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'weddings', 'guests', 'tasks', 'expenses', 'vendors', 'cash_gifts')
ORDER BY tablename;

-- Check for existing policies on critical tables
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'PASS: Has USING clause'
        ELSE 'WARNING: No USING clause'
    END as using_clause_status,
    CASE 
        WHEN with_check IS NOT NULL THEN 'PASS: Has WITH CHECK clause'
        ELSE 'INFO: No WITH CHECK clause'
    END as with_check_status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'weddings', 'guests', 'tasks', 'expenses', 'vendors', 'cash_gifts')
ORDER BY tablename, operation;

-- ============================================================================
-- 3. AUTHENTICATION CONTEXT CHECKS
-- ============================================================================

\echo '=== AUTHENTICATION CONTEXT CHECKS ==='

-- Test auth.uid() function
SELECT 
    'AUTH_UID_FUNCTION' as check_name,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'PASS: auth.uid() returns value'
        WHEN auth.uid() IS NULL THEN 'INFO: auth.uid() is NULL (not authenticated)'
        ELSE 'FAIL: auth.uid() error'
    END as result,
    auth.uid() as current_user_id;

-- Check if current session can access user data
SELECT 
    'USER_DATA_ACCESS' as check_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS: Can query weddings'
        WHEN COUNT(*) = 0 THEN 'INFO: No weddings found or access denied'
        ELSE 'FAIL: Cannot query weddings'
    END as result,
    COUNT(*) as accessible_weddings
FROM public.weddings;

-- ============================================================================
-- 4. SPECIFIC AUTHENTICATION ISSUES DIAGNOSIS
-- ============================================================================

\echo '=== AUTHENTICATION ISSUES DIAGNOSIS ==='

-- Check for users without profiles
SELECT 
    'USERS_WITHOUT_PROFILES' as check_name,
    COUNT(*) as users_without_profiles,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: All users have profiles'
        ELSE 'WARNING: Some users missing profiles'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check for weddings with invalid owner_id
SELECT 
    'WEDDINGS_INVALID_OWNERS' as check_name,
    COUNT(*) as weddings_with_invalid_owners,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: All weddings have valid owners'
        ELSE 'FAIL: Some weddings have invalid owner_id'
    END as status
FROM public.weddings w
LEFT JOIN auth.users u ON w.owner_id = u.id
WHERE u.id IS NULL;

-- Check for circular dependencies in policies (common cause of infinite loops)
WITH policy_dependencies AS (
    SELECT 
        schemaname,
        tablename,
        policyname,
        CASE 
            WHEN qual ~ 'wedding_id.*SELECT.*wedding' THEN 'HAS_CIRCULAR_DEPENDENCY'
            WHEN qual ~ 'owner_id.*SELECT.*owner' THEN 'HAS_CIRCULAR_DEPENDENCY'
            ELSE 'NO_CIRCULAR_DEPENDENCY'
        END as dependency_check
    FROM pg_policies 
    WHERE schemaname = 'public'
)
SELECT 
    'CIRCULAR_DEPENDENCY_CHECK' as check_name,
    COUNT(*) FILTER (WHERE dependency_check = 'HAS_CIRCULAR_DEPENDENCY') as policies_with_circular_deps,
    CASE 
        WHEN COUNT(*) FILTER (WHERE dependency_check = 'HAS_CIRCULAR_DEPENDENCY') = 0 
        THEN 'PASS: No circular dependencies detected'
        ELSE 'WARNING: Potential circular dependencies in RLS policies'
    END as status
FROM policy_dependencies;

-- ============================================================================
-- 5. MIDDLEWARE COMPATIBILITY CHECKS
-- ============================================================================

\echo '=== MIDDLEWARE COMPATIBILITY CHECKS ==='

-- Check for functions that might be called by middleware
SELECT 
    'MIDDLEWARE_FUNCTIONS' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'user_owns_wedding')
        THEN 'PASS: Helper functions available'
        ELSE 'INFO: No custom helper functions found'
    END as result;

-- Test a typical query that middleware/pages would make
SELECT 
    'TYPICAL_QUERY_TEST' as check_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS: Can execute typical wedding query'
        ELSE 'FAIL: Cannot execute typical wedding query'
    END as result
FROM (
    SELECT w.*, COUNT(g.id) as guest_count
    FROM public.weddings w
    LEFT JOIN public.guests g ON g.wedding_id = w.id
    GROUP BY w.id
    LIMIT 1
) test_query;

-- ============================================================================
-- 6. RECOMMENDATIONS
-- ============================================================================

\echo '=== RECOMMENDATIONS ==='

-- Generate recommendations based on findings
SELECT 
    'RECOMMENDATION' as type,
    recommendation
FROM (
    SELECT 'Run profiles creation script if users_without_profiles > 0' as recommendation
    WHERE EXISTS (
        SELECT 1 FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
        LIMIT 1
    )
    
    UNION ALL
    
    SELECT 'Fix wedding owner_id references if any invalid owners found' as recommendation
    WHERE EXISTS (
        SELECT 1 FROM public.weddings w
        LEFT JOIN auth.users u ON w.owner_id = u.id
        WHERE u.id IS NULL
        LIMIT 1
    )
    
    UNION ALL
    
    SELECT 'Review RLS policies for potential circular dependencies' as recommendation
    WHERE EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
            AND (qual ~ 'wedding_id.*SELECT.*wedding' OR qual ~ 'owner_id.*SELECT.*owner')
        LIMIT 1
    )
) recommendations;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

\echo '=== SUMMARY ==='
\echo 'This diagnostic script has completed. Review the results above to identify specific issues.'
\echo 'Common solutions:'
\echo '1. Run 051_ensure_profiles_table.sql if profiles issues found'
\echo '2. Run 052_fix_authentication_issues.sql for RLS policy fixes'
\echo '3. Check middleware configuration if auth.uid() issues persist'
\echo '4. Verify environment variables for Supabase connection'
