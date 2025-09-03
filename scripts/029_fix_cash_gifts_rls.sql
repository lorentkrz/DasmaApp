-- Fix cash_gifts RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies
DROP POLICY IF EXISTS "cash_gifts_select_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_insert_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_update_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_delete_wedding_access" ON public.cash_gifts;

-- Also drop the policy from the fix script if it exists
DROP POLICY IF EXISTS "Users can manage cash gifts for their weddings" ON public.cash_gifts;

-- Drop any existing owner-only policies before creating new ones
DROP POLICY IF EXISTS "cash_gifts_select_owner_only" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_insert_owner_only" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_update_owner_only" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_delete_owner_only" ON public.cash_gifts;

-- Create owner-only policies for cash_gifts
CREATE POLICY "cash_gifts_select_owner_only"
  ON public.cash_gifts FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "cash_gifts_insert_owner_only"
  ON public.cash_gifts FOR INSERT
  WITH CHECK (
    wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid())
  );

CREATE POLICY "cash_gifts_update_owner_only"
  ON public.cash_gifts FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "cash_gifts_delete_owner_only"
  ON public.cash_gifts FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));
