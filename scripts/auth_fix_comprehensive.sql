-- Enhanced Authentication Debug and Fix Script
-- This script identifies and fixes common authentication and RLS issues
-- Run this script to diagnose and resolve session problems

\echo '=== AUTHENTICATION DIAGNOSTICS AND FIXES ==='

-- 1. Check current authentication status
\echo '--- Checking current auth status ---'
SELECT
    'CURRENT_AUTH' as check_type,
    CASE
        WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
        ELSE 'NOT_AUTHENTICATED'
    END as status,
    auth.uid() as user_id,
    now() as checked_at;

-- 2. Check if profiles table exists and is properly configured
\echo '--- Checking profiles table ---'
DO $$
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            role TEXT DEFAULT 'user',
            settings JSONB DEFAULT '{}'::jsonb
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own profile" ON public.profiles 
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile" ON public.profiles 
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Users can insert own profile" ON public.profiles 
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Profiles table created with proper RLS policies';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- 3. Check and fix weddings table RLS policies
\echo '--- Checking weddings table policies ---'
DO $$
BEGIN
    -- Ensure weddings table has proper owner-based policies
    DROP POLICY IF EXISTS "Users can manage their weddings" ON public.weddings;
    DROP POLICY IF EXISTS "Wedding owners can do everything" ON public.weddings;
    DROP POLICY IF EXISTS "Users can view own weddings" ON public.weddings;
    DROP POLICY IF EXISTS "Users can update own weddings" ON public.weddings;
    DROP POLICY IF EXISTS "Users can delete own weddings" ON public.weddings;
    DROP POLICY IF EXISTS "Users can insert own weddings" ON public.weddings;
    
    -- Create comprehensive policies
    CREATE POLICY "Wedding owners full access" ON public.weddings 
        USING (owner_id = auth.uid())
        WITH CHECK (owner_id = auth.uid());
    
    RAISE NOTICE 'Wedding policies updated';
END $$;

-- 4. Check other critical tables
\echo '--- Checking other table policies ---'
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN VALUES ('guests'), ('tasks'), ('expenses'), ('vendors'), ('cash_gifts'), ('invitations')
    LOOP
        -- Check if table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            -- Enable RLS if not already enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Drop existing policies to avoid conflicts
            EXECUTE format('DROP POLICY IF EXISTS "Wedding-based access" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Users access via wedding" ON public.%I', tbl);
            
            -- Create policy based on wedding ownership
            IF tbl = 'invitations' THEN
                -- Special handling for invitations (no direct wedding_id, uses token)
                EXECUTE format('
                    CREATE POLICY "Users access via wedding" ON public.%I 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.weddings w 
                            WHERE w.id = wedding_id AND w.owner_id = auth.uid()
                        )
                    )
                    WITH CHECK (
                        EXISTS (
                            SELECT 1 FROM public.weddings w 
                            WHERE w.id = wedding_id AND w.owner_id = auth.uid()
                        )
                    )', tbl);
            ELSE
                -- Standard policy for tables with wedding_id
                EXECUTE format('
                    CREATE POLICY "Users access via wedding" ON public.%I 
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.weddings w 
                            WHERE w.id = wedding_id AND w.owner_id = auth.uid()
                        )
                    )
                    WITH CHECK (
                        EXISTS (
                            SELECT 1 FROM public.weddings w 
                            WHERE w.id = wedding_id AND w.owner_id = auth.uid()
                        )
                    )', tbl);
            END IF;
            
            RAISE NOTICE 'Updated policies for table: %', tbl;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping', tbl;
        END IF;
    END LOOP;
END $$;

-- 5. Create function for invitation RSVP updates (for the invitation page)
\echo '--- Creating/updating RSVP function ---'
CREATE OR REPLACE FUNCTION update_rsvp_by_token(
    p_token TEXT,
    p_status TEXT,
    p_apply_all BOOLEAN DEFAULT FALSE,
    p_attendee_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(updated_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inv_record RECORD;
    target_guest_id UUID;
    group_ids UUID[];
    ids_to_update UUID[];
BEGIN
    -- Get invitation details
    SELECT * INTO inv_record
    FROM public.invitations
    WHERE token = p_token;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invitation token';
    END IF;
    
    -- Determine target guest
    target_guest_id := inv_record.guest_id;
    
    IF target_guest_id IS NULL AND inv_record.group_id IS NOT NULL THEN
        SELECT primary_guest_id INTO target_guest_id
        FROM public.guest_groups
        WHERE id = inv_record.group_id;
    END IF;
    
    IF target_guest_id IS NULL THEN
        RAISE EXCEPTION 'Could not determine target guest';
    END IF;
    
    -- Get all group member IDs
    group_ids := ARRAY[target_guest_id];
    
    -- Add group members if applicable
    INSERT INTO group_ids
    SELECT g.id
    FROM public.guests g
    WHERE (g.group_id = target_guest_id OR g.group_id = inv_record.group_id)
      AND g.id != target_guest_id;
    
    -- Determine which IDs to update
    IF p_apply_all THEN
        ids_to_update := group_ids;
    ELSIF p_attendee_ids IS NOT NULL THEN
        -- Filter attendee IDs to only include valid group members
        SELECT ARRAY_AGG(id) INTO ids_to_update
        FROM (
            SELECT unnest(p_attendee_ids) as id
            INTERSECT
            SELECT unnest(group_ids)
        ) valid_ids;
    ELSE
        ids_to_update := ARRAY[target_guest_id];
    END IF;
    
    -- Update guests
    IF array_length(ids_to_update, 1) > 0 THEN
        UPDATE public.guests
        SET rsvp_status = p_status,
            rsvp_responded_at = now(),
            updated_at = now()
        WHERE id = ANY(ids_to_update);
    END IF;
    
    -- Update invitation
    UPDATE public.invitations
    SET responded_at = now(),
        opened_at = now(),
        updated_at = now()
    WHERE token = p_token;
    
    -- Return updated IDs
    RETURN QUERY
    SELECT unnest(ids_to_update);
END;
$$;

-- 6. Final verification
\echo '--- Final verification ---'
SELECT
    'VERIFICATION' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'weddings', 'guests', 'tasks', 'expenses', 'vendors', 'cash_gifts', 'invitations')
ORDER BY tablename;

\echo '=== AUTHENTICATION FIXES COMPLETED ==='
\echo 'You should now run the application and test the authentication flow.'
\echo 'If issues persist, check the application logs for more specific error messages.'
