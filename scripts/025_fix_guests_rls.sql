-- Fix RLS policies for guests table to ensure proper access
-- Remove infinite recursion by simplifying policies

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "guests_select_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_insert_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_update_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_delete_wedding_access" ON public.guests;

-- Create simplified RLS policies for guests (owner-only to avoid recursion)
CREATE POLICY "guests_select_owner_only" ON public.guests
  FOR SELECT USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "guests_insert_owner_only" ON public.guests
  FOR INSERT WITH CHECK (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "guests_update_owner_only" ON public.guests
  FOR UPDATE USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "guests_delete_owner_only" ON public.guests
  FOR DELETE USING (
    wedding_id IN (
      SELECT id FROM public.weddings WHERE owner_id = auth.uid()
    )
  );
