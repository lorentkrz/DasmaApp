-- Unify wedding budget column: keep budget_total, backfill from total_budget, then drop total_budget
-- Safe, idempotent migration.

begin;

-- Ensure budget_total exists (legacy projects may vary)
alter table if exists public.weddings
  add column if not exists budget_total numeric(10,2) default 0;

-- Backfill from total_budget if it exists and budget_total looks empty
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'weddings' AND column_name = 'total_budget'
  ) THEN
    -- Copy values where budget_total is null or zero but total_budget has data
    EXECUTE $$
      update public.weddings w
         set budget_total = COALESCE(NULLIF(w.budget_total, 0), w.total_budget)
       where w.total_budget is not null
         and (w.budget_total is null or w.budget_total = 0)
    $$;

    -- Drop the redundant column
    EXECUTE 'alter table public.weddings drop column if exists total_budget';
  END IF;
END $$;

comment on column public.weddings.budget_total is 'Total planned budget for the wedding (authoritative)';

commit;
