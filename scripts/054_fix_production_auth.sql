-- Comprehensive Production Authentication Fix
-- This script ensures all authentication-related database configurations are correct

-- ============================================================================
-- STEP 1: Ensure profiles table exists and is properly configured
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Fix all RLS policies for profiles
-- ============================================================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Create clean, simple policies
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
-- STEP 3: Ensure profile creation trigger exists
-- ============================================================================

-- Create or replace the function to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: Ensure all existing users have profiles
-- ============================================================================

-- Create profiles for any users that don't have them
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: Fix weddings table RLS policies
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "weddings_select_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_insert_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_update_owner" ON public.weddings;
DROP POLICY IF EXISTS "weddings_delete_owner" ON public.weddings;

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
-- STEP 6: Create a function to validate authentication
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_auth()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    user_count INT;
    profile_count INT;
    current_user_id UUID;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN QUERY SELECT 'Authentication'::TEXT, 'FAILED'::TEXT, 'No authenticated user'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 'Authentication'::TEXT, 'PASSED'::TEXT, 'User ID: ' || current_user_id::TEXT;
    
    -- Check if profile exists
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles
    WHERE id = current_user_id;
    
    IF profile_count = 0 THEN
        RETURN QUERY SELECT 'Profile'::TEXT, 'FAILED'::TEXT, 'No profile found for user'::TEXT;
    ELSE
        RETURN QUERY SELECT 'Profile'::TEXT, 'PASSED'::TEXT, 'Profile exists'::TEXT;
    END IF;
    
    -- Check if user can query their own weddings
    BEGIN
        PERFORM COUNT(*) FROM public.weddings WHERE owner_id = current_user_id;
        RETURN QUERY SELECT 'Weddings RLS'::TEXT, 'PASSED'::TEXT, 'Can query weddings'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'Weddings RLS'::TEXT, 'FAILED'::TEXT, SQLERRM::TEXT;
    END;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on profiles table
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Grant permissions on weddings table
GRANT ALL ON public.weddings TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_auth() TO anon;

-- ============================================================================
-- STEP 8: Create indexes for better performance
-- ============================================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_weddings_owner_id ON public.weddings(owner_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Run this query to verify the setup:
-- SELECT * FROM public.validate_auth();

COMMENT ON FUNCTION public.validate_auth() IS 'Run this function to validate authentication setup';
