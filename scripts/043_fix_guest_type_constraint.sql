-- Harmonize guests.guest_type constraint to accept the categories used by the app
-- Safe, idempotent migration: drops old constraint if present, sets default, and re-creates a unified CHECK.

DO $$
BEGIN
  -- Drop the old constraint if it exists (name seen in errors)
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class t ON t.oid = c.conrelid
    JOIN   pg_namespace n ON n.oid = t.relnamespace
    WHERE  n.nspname = 'public'
      AND  t.relname = 'guests'
      AND  c.conname = 'guests_guest_type_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.guests DROP CONSTRAINT guests_guest_type_check';
  END IF;

  -- Ensure the column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'guests' AND column_name = 'guest_type'
  ) THEN
    EXECUTE 'ALTER TABLE public.guests ADD COLUMN guest_type TEXT DEFAULT ''regular''';
  END IF;

  -- Standardize default to 'regular'
  EXECUTE 'ALTER TABLE public.guests ALTER COLUMN guest_type SET DEFAULT ''regular''';

  -- Backfill nulls to default
  EXECUTE 'UPDATE public.guests SET guest_type = ''regular'' WHERE guest_type IS NULL';

  -- Recreate a unified, forward-compatible CHECK constraint
  -- Accept both legacy values and new app categories
  EXECUTE 'ALTER TABLE public.guests 
    ADD CONSTRAINT guests_guest_type_check 
    CHECK (guest_type IN (
      ''adult'', ''child'', ''infant'',
      ''family'', ''friend'', ''colleague'', ''plus_one'', ''regular''
    ))';
END $$;
