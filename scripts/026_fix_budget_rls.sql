-- Fix budget/expenses RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies
DROP POLICY IF EXISTS "budget_categories_select_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_insert_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_update_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_delete_wedding_access" ON public.budget_categories;

DROP POLICY IF EXISTS "expenses_select_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_wedding_access" ON public.expenses;

-- Create owner-only policies for budget_categories
CREATE POLICY "budget_categories_select_owner_only"
  ON public.budget_categories FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "budget_categories_insert_owner_only"
  ON public.budget_categories FOR INSERT
  WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "budget_categories_update_owner_only"
  ON public.budget_categories FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "budget_categories_delete_owner_only"
  ON public.budget_categories FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- Create owner-only policies for expenses
CREATE POLICY "expenses_select_owner_only"
  ON public.expenses FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "expenses_insert_owner_only"
  ON public.expenses FOR INSERT
  WITH CHECK (
    wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "expenses_update_owner_only"
  ON public.expenses FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "expenses_delete_owner_only"
  ON public.expenses FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));
