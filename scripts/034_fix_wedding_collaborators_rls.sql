-- Fix wedding_collaborators infinite recursion RLS policy
-- The current policy references itself causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can manage collaborators for their weddings" ON public.wedding_collaborators;

-- Create a simple owner-only policy to break the recursion
CREATE POLICY "wedding_collaborators_owner_only" ON public.wedding_collaborators
    FOR ALL USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );
