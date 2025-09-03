-- Fix wedding_tables RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies
DROP POLICY IF EXISTS "tables_select_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_insert_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_update_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_delete_wedding_access" ON public.wedding_tables;

-- Create owner-only policies for wedding_tables
CREATE POLICY "tables_select_owner_only"
  ON public.wedding_tables FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tables_insert_owner_only"
  ON public.wedding_tables FOR INSERT
  WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tables_update_owner_only"
  ON public.wedding_tables FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tables_delete_owner_only"
  ON public.wedding_tables FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));
