-- Fix tasks/task_boards RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies for task_boards
DROP POLICY IF EXISTS "task_boards_select_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_insert_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_update_wedding_access" ON public.task_boards;
DROP POLICY IF EXISTS "task_boards_delete_wedding_access" ON public.task_boards;

-- Drop existing policies for tasks
DROP POLICY IF EXISTS "tasks_select_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_wedding_access" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_wedding_access" ON public.tasks;

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
    AND created_by = auth.uid()
  );

CREATE POLICY "tasks_update_owner_only"
  ON public.tasks FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));

CREATE POLICY "tasks_delete_owner_only"
  ON public.tasks FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid()));
