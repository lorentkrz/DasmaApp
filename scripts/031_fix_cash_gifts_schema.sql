-- Fix cash_gifts table schema - add missing created_by column if it doesn't exist
-- This addresses the "column created_by does not exist" error

DO $$ 
BEGIN
    -- Check if created_by column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cash_gifts' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.cash_gifts 
        ADD COLUMN created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid();
        
        -- Update existing records to set created_by to the wedding owner
        UPDATE public.cash_gifts 
        SET created_by = (
            SELECT owner_id 
            FROM public.weddings 
            WHERE weddings.id = cash_gifts.wedding_id
        )
        WHERE created_by IS NULL;
    END IF;
END $$;
