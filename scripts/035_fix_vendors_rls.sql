-- Fix vendors RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies
DROP POLICY IF EXISTS "vendors_select_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete_wedding_access" ON public.vendors;

-- Create owner-only policies for vendors
CREATE POLICY "vendors_select_owner_only"
  ON public.vendors FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_insert_owner_only"
  ON public.vendors FOR INSERT
  WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_update_owner_only"
  ON public.vendors FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_delete_owner_only"
  ON public.vendors FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));
