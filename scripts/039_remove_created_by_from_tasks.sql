-- Remove created_by requirement from tasks table
-- This fixes the "null value in column created_by violates not-null constraint" error

DO $$ 
BEGIN
    -- Drop the NOT NULL constraint on created_by if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'created_by' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.tasks ALTER COLUMN created_by DROP NOT NULL;
    END IF;
    
    -- Update RLS policies to remove created_by requirement
    DROP POLICY IF EXISTS "tasks_insert_wedding_access" ON public.tasks;
    DROP POLICY IF EXISTS "tasks_insert_owner_only" ON public.tasks;
    
    -- Recreate insert policy without created_by requirement
    CREATE POLICY "tasks_insert_owner_only"
      ON public.tasks FOR INSERT
      WITH CHECK (
        wedding_id IN (SELECT id FROM weddings WHERE owner_id = auth.uid())
      );
      
END $$;
