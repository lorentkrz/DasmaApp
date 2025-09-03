-- Fix guests table schema - add missing created_by column if it doesn't exist
-- This addresses the "column created_by does not exist" error for guests table

DO $$ 
BEGIN
    -- Check if created_by column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'guests' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.guests 
        ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
        
        -- Update existing records to set created_by to the wedding owner
        UPDATE public.guests 
        SET created_by = (
            SELECT owner_id 
            FROM public.weddings 
            WHERE weddings.id = guests.wedding_id
        )
        WHERE created_by IS NULL;
        
        -- Make the column NOT NULL after setting values
        ALTER TABLE public.guests 
        ALTER COLUMN created_by SET NOT NULL;
    END IF;
END $$;
