-- Dashboard backend support: timestamps, indexes, KPIs view, and activity feed
-- This script is idempotent and safe to run multiple times.

-- 1) Ensure updated_at columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guests' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.guests ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.tasks ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.vendors ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.expenses ADD COLUMN updated_at timestamptz DEFAULT now() NOT NULL';
  END IF;
END $$;

-- 2) Generic trigger function to bump updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 3) Attach triggers (if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_guests_set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER tr_guests_set_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_tasks_set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER tr_tasks_set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_vendors_set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER tr_vendors_set_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_expenses_set_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER tr_expenses_set_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()';
  END IF;
END $$;

-- 4) Helpful indexes for dashboard filters
CREATE INDEX IF NOT EXISTS idx_guests_wedding_rsvp ON public.guests (wedding_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_tasks_wedding_completed ON public.tasks (wedding_id, completed);
CREATE INDEX IF NOT EXISTS idx_vendors_wedding_status ON public.vendors (wedding_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_wedding_amount ON public.expenses (wedding_id, amount);
CREATE INDEX IF NOT EXISTS idx_guests_updated_at ON public.guests (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_updated_at ON public.vendors (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_updated_at ON public.expenses (updated_at DESC);

-- 5) KPIs per wedding
-- Assumptions:
--   guests.rsvp_status uses values like 'attending', 'pending', etc.
--   tasks.completed is boolean
--   vendors.status uses 'booked' or 'confirmed' when finalized
--   expenses.amount is numeric
--   weddings.budget_total is numeric (nullable)
CREATE OR REPLACE VIEW public.dashboard_kpis AS
WITH g AS (
  SELECT wedding_id,
         count(*)::int AS guests_total,
         count(*) FILTER (WHERE rsvp_status = 'attending')::int AS guests_attending
  FROM public.guests
  GROUP BY wedding_id
), t AS (
  SELECT wedding_id,
         count(*)::int AS tasks_total,
         count(*) FILTER (WHERE completed IS TRUE)::int AS tasks_completed
  FROM public.tasks
  GROUP BY wedding_id
), v AS (
  SELECT wedding_id,
         count(*)::int AS vendors_total,
         count(*) FILTER (WHERE status IN ('booked','confirmed'))::int AS vendors_confirmed
  FROM public.vendors
  GROUP BY wedding_id
), e AS (
  SELECT wedding_id,
         COALESCE(sum(CASE WHEN amount IS NULL THEN 0 ELSE amount::numeric END), 0)::numeric AS budget_spent
  FROM public.expenses
  GROUP BY wedding_id
), la AS (
  SELECT wedding_id, max(ts) AS last_activity_at FROM (
    SELECT wedding_id, max(updated_at) AS ts FROM public.guests GROUP BY wedding_id
    UNION ALL
    SELECT wedding_id, max(updated_at) AS ts FROM public.tasks GROUP BY wedding_id
    UNION ALL
    SELECT wedding_id, max(updated_at) AS ts FROM public.vendors GROUP BY wedding_id
    UNION ALL
    SELECT wedding_id, max(updated_at) AS ts FROM public.expenses GROUP BY wedding_id
  ) u GROUP BY wedding_id
)
SELECT
  w.id AS wedding_id,
  COALESCE(g.guests_total, 0) AS guests_total,
  COALESCE(g.guests_attending, 0) AS guests_attending,
  CASE WHEN COALESCE(g.guests_total, 0) > 0
       THEN round((g.guests_attending::numeric / g.guests_total::numeric) * 100)
       ELSE 0 END::int AS rsvp_rate_pct,

  COALESCE(t.tasks_total, 0) AS tasks_total,
  COALESCE(t.tasks_completed, 0) AS tasks_completed,
  CASE WHEN COALESCE(t.tasks_total, 0) > 0
       THEN round((t.tasks_completed::numeric / t.tasks_total::numeric) * 100)
       ELSE 0 END::int AS tasks_completed_pct,

  COALESCE(v.vendors_total, 0) AS vendors_total,
  COALESCE(v.vendors_confirmed, 0) AS vendors_confirmed,
  CASE WHEN COALESCE(v.vendors_total, 0) > 0
       THEN round((v.vendors_confirmed::numeric / v.vendors_total::numeric) * 100)
       ELSE 0 END::int AS vendors_confirmed_pct,

  COALESCE(e.budget_spent, 0)::numeric AS budget_spent,
  COALESCE(w.budget_total, 0)::numeric AS budget_total,
  CASE WHEN COALESCE(w.budget_total, 0) > 0
       THEN round((COALESCE(e.budget_spent, 0) / NULLIF(w.budget_total,0)) * 100)
       ELSE 0 END::int AS budget_spent_pct,

  CASE 
    WHEN 1=1 THEN round((
      COALESCE(
        CASE WHEN COALESCE(t.tasks_total, 0) > 0 THEN (t.tasks_completed::numeric / t.tasks_total::numeric) * 100 ELSE 0 END,
      0
      ) +
      COALESCE(
        CASE WHEN COALESCE(g.guests_total, 0) > 0 THEN (g.guests_attending::numeric / g.guests_total::numeric) * 100 ELSE 0 END,
      0
      ) +
      COALESCE(
        CASE WHEN COALESCE(v.vendors_total, 0) > 0 THEN (v.vendors_confirmed::numeric / v.vendors_total::numeric) * 100 ELSE 0 END,
      0
      )
    ) / 3)
  END::int AS overall_progress_pct,

  la.last_activity_at
FROM public.weddings w
LEFT JOIN g ON g.wedding_id = w.id
LEFT JOIN t ON t.wedding_id = w.id
LEFT JOIN v ON v.wedding_id = w.id
LEFT JOIN e ON e.wedding_id = w.id
LEFT JOIN la ON la.wedding_id = w.id;

-- 6) Last activity feed (union of latest changes across core tables)
CREATE OR REPLACE VIEW public.dashboard_last_activity AS
SELECT 'guest'::text AS entity_type,
       g.id::uuid AS entity_id,
       g.wedding_id,
       COALESCE(g.updated_at, g.created_at) AS occurred_at,
       CASE WHEN g.rsvp_status = 'attending'
            THEN 'RSVP konfirmuar'
            ELSE 'Mysafir i përditësuar' END AS title,
       COALESCE(NULLIF(trim((COALESCE(g.first_name,'') || ' ' || COALESCE(g.last_name,''))), ''), 'Mysafir') AS detail
FROM public.guests g
UNION ALL
SELECT 'task'::text AS entity_type,
       t.id::uuid AS entity_id,
       t.wedding_id,
       COALESCE(t.updated_at, t.created_at) AS occurred_at,
       CASE WHEN t.completed IS TRUE THEN 'Detyrë e përfunduar' ELSE 'Detyrë e përditësuar' END AS title,
       COALESCE(t.title, 'Detyrë') AS detail
FROM public.tasks t
UNION ALL
SELECT 'vendor'::text AS entity_type,
       v.id::uuid AS entity_id,
       v.wedding_id,
       COALESCE(v.updated_at, v.created_at) AS occurred_at,
       CASE WHEN v.status IN ('booked','confirmed') THEN 'Shitës i konfirmuar' ELSE 'Shitës i përditësuar' END AS title,
       COALESCE(v.name, 'Shitës') AS detail
FROM public.vendors v
UNION ALL
SELECT 'expense'::text AS entity_type,
       e.id::uuid AS entity_id,
       e.wedding_id,
       COALESCE(e.updated_at, e.created_at) AS occurred_at,
       'Shpenzim i shtuar' AS title,
       ('€' || COALESCE(e.amount::text,'0')) AS detail
FROM public.expenses e;

-- 7) Convenience: a limited, ordered activity view
CREATE OR REPLACE VIEW public.dashboard_last_activity_recent AS
SELECT *
FROM public.dashboard_last_activity
ORDER BY occurred_at DESC
LIMIT 50;

-- Add missing columns to weddings table
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS ceremony_time TIME,
ADD COLUMN IF NOT EXISTS reception_time TIME,
ADD COLUMN IF NOT EXISTS dress_code TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Add guest_type column for AI seating suggestions
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS guest_type TEXT DEFAULT 'regular' CHECK (guest_type IN ('family', 'friend', 'colleague', 'plus_one', 'child', 'regular'));

-- Create wedding_collaborators table for real-time collaboration
CREATE TABLE IF NOT EXISTS public.wedding_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator', 'viewer')),
    permissions JSONB DEFAULT '{"can_edit": true, "can_delete": false, "can_invite": false}',
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_page TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wedding_id, user_id)
);

-- If the table existed previously without new columns, add them
ALTER TABLE public.wedding_collaborators
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS current_page TEXT;

-- Enable RLS on wedding_collaborators
ALTER TABLE public.wedding_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy for wedding collaborators
DROP POLICY IF EXISTS "Users can manage collaborators for their weddings" ON public.wedding_collaborators;
CREATE POLICY "Users can manage collaborators for their weddings" ON public.wedding_collaborators
    FOR ALL USING (
        wedding_id IN (
            SELECT w.id FROM public.weddings w
            WHERE w.owner_id = auth.uid()
            OR w.id IN (
                SELECT wc.wedding_id FROM public.wedding_collaborators wc
                WHERE wc.user_id = auth.uid()
            )
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS wedding_collaborators_wedding_id_idx ON public.wedding_collaborators(wedding_id);
CREATE INDEX IF NOT EXISTS wedding_collaborators_user_id_idx ON public.wedding_collaborators(user_id);
CREATE INDEX IF NOT EXISTS wedding_collaborators_last_active_idx ON public.wedding_collaborators(last_active_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_wedding_collaborators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is recreated idempotently
DROP TRIGGER IF EXISTS update_wedding_collaborators_updated_at ON public.wedding_collaborators;

CREATE TRIGGER update_wedding_collaborators_updated_at
    BEFORE UPDATE ON public.wedding_collaborators
    FOR EACH ROW
    EXECUTE FUNCTION update_wedding_collaborators_updated_at();

-- Create analytics tracking table
CREATE TABLE IF NOT EXISTS public.wedding_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics
ALTER TABLE public.wedding_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for analytics
DROP POLICY IF EXISTS "Users can view analytics for their weddings" ON public.wedding_analytics;
CREATE POLICY "Users can view analytics for their weddings" ON public.wedding_analytics
    FOR ALL USING (
        wedding_id IN (
            SELECT w.id FROM public.weddings w
            WHERE w.owner_id = auth.uid()
            OR w.id IN (
                SELECT wc.wedding_id FROM public.wedding_collaborators wc
                WHERE wc.user_id = auth.uid()
            )
        )
    );

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS wedding_analytics_wedding_id_idx ON public.wedding_analytics(wedding_id);
CREATE INDEX IF NOT EXISTS wedding_analytics_metric_name_idx ON public.wedding_analytics(metric_name);
CREATE INDEX IF NOT EXISTS wedding_analytics_recorded_at_idx ON public.wedding_analytics(recorded_at);
