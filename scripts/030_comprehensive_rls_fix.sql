-- Comprehensive RLS Fix for Wedding ERP
-- This script fixes all infinite recursion issues by replacing wedding_collaborators unions with owner-only policies
-- Run this script to resolve all RLS policy issues across all domains

-- ============================================================================
-- 1. GUESTS DOMAIN
-- ============================================================================

-- Drop existing guest policies
DROP POLICY IF EXISTS "guests_select_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_insert_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_update_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_delete_wedding_access" ON public.guests;
DROP POLICY IF EXISTS "guests_select_owner_only" ON public.guests;
DROP POLICY IF EXISTS "guests_insert_owner_only" ON public.guests;
DROP POLICY IF EXISTS "guests_update_owner_only" ON public.guests;
DROP POLICY IF EXISTS "guests_delete_owner_only" ON public.guests;

-- Create owner-only policies for guests
CREATE POLICY "guests_select_owner_only"
  ON public.guests FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "guests_insert_owner_only"
  ON public.guests FOR INSERT
  WITH CHECK (
    wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid())
  );

CREATE POLICY "guests_update_owner_only"
  ON public.guests FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "guests_delete_owner_only"
  ON public.guests FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- ============================================================================
-- 2. BUDGET/EXPENSES DOMAIN
-- ============================================================================

-- Drop existing budget_categories policies
DROP POLICY IF EXISTS "budget_categories_select_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_insert_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_update_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_delete_wedding_access" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_select_owner_only" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_insert_owner_only" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_update_owner_only" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_delete_owner_only" ON public.budget_categories;

-- Drop existing expenses policies
DROP POLICY IF EXISTS "expenses_select_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_wedding_access" ON public.expenses;
DROP POLICY IF EXISTS "expenses_select_owner_only" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_owner_only" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_owner_only" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_owner_only" ON public.expenses;

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
  );

CREATE POLICY "expenses_update_owner_only"
  ON public.expenses FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "expenses_delete_owner_only"
  ON public.expenses FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- ============================================================================
-- 3. TASKS DOMAIN
-- ============================================================================

-- Drop existing task_boards policies
DROP POLICY IF EXISTS "task_boards_select_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_insert_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_update_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_delete_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_select_owner_only" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_insert_owner_only" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_update_owner_only" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_delete_owner_only" ON public.task_boards;

-- Drop existing tasks policies
DROP POLICY IF EXISTS "tasks_select_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_owner_only" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_owner_only" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_owner_only" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_owner_only" ON public.tasks;

-- Create owner-only policies for task_boards
CREATE POLICY "task_boards_select_owner_only"
  ON public.task_boards FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "task_boards_insert_owner_only"
  ON public.task_boards FOR INSERT
  WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "task_boards_update_owner_only"
  ON public.task_boards FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "task_boards_delete_owner_only"
  ON public.task_boards FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- Create owner-only policies for tasks
CREATE POLICY "tasks_select_owner_only"
  ON public.tasks FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tasks_insert_owner_only"
  ON public.tasks FOR INSERT
  WITH CHECK (
    wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid())
  );

CREATE POLICY "tasks_update_owner_only"
  ON public.tasks FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tasks_delete_owner_only"
  ON public.tasks FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- ============================================================================
-- 4. SEATING DOMAIN
-- ============================================================================

-- Drop existing wedding_tables policies
DROP POLICY IF EXISTS "tables_select_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_insert_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_update_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_delete_wedding_access" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_select_owner_only" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_insert_owner_only" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_update_owner_only" ON public.wedding_tables;
DROP POLICY IF EXISTS "tables_delete_owner_only" ON public.wedding_tables;

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

-- ============================================================================
-- 5. CASH GIFTS DOMAIN
-- ============================================================================

-- Drop existing cash_gifts policies
DROP POLICY IF EXISTS "cash_gifts_select_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_insert_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_update_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "cash_gifts_delete_wedding_access" ON public.cash_gifts;
DROP POLICY IF EXISTS "Users can manage cash gifts for their weddings" ON public.cash_gifts;
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

-- ============================================================================
-- 6. VENDORS DOMAIN (Already working, but included for completeness)
-- ============================================================================

-- Drop existing vendors policies
DROP POLICY IF EXISTS "vendors_select_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete_wedding_access" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select_owner_only" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert_owner_only" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_owner_only" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete_owner_only" ON public.vendors;

-- Create owner-only policies for vendors
CREATE POLICY "vendors_select_owner_only"
  ON public.vendors FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_insert_owner_only"
  ON public.vendors FOR INSERT
  WITH CHECK (
    wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid())
  );

CREATE POLICY "vendors_update_owner_only"
  ON public.vendors FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "vendors_delete_owner_only"
  ON public.vendors FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script has fixed RLS policies for all major domains:
-- ✅ Guests (with table assignments)
-- ✅ Budget Categories & Expenses  
-- ✅ Task Boards & Tasks
-- ✅ Wedding Tables (seating)
-- ✅ Cash Gifts
-- ✅ Vendors (contracts)
--
-- All policies now use owner-only access patterns to avoid infinite recursion
-- with wedding_collaborators table while maintaining security.
--
-- After running this script, all pages should load data correctly:
-- - /dashboard/guests
-- - /dashboard/budget  
-- - /dashboard/tasks
-- - /dashboard/seating
-- - /dashboard/cash-gifts
-- - /dashboard/vendors
