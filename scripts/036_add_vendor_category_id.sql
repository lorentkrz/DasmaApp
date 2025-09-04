-- Add category_id column to vendors table to link with budget_categories
-- This allows vendor contracts to be properly categorized in budget calculations

-- Add the category_id column
ALTER TABLE public.vendors 
ADD COLUMN category_id uuid REFERENCES public.budget_categories(id) ON DELETE SET NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_category_id ON public.vendors(category_id);

-- Update existing vendors to map their text category to budget category IDs
-- This assumes budget categories exist with matching names
UPDATE public.vendors 
SET category_id = (
  SELECT bc.id 
  FROM public.budget_categories bc 
  WHERE bc.wedding_id = vendors.wedding_id 
  AND (
    (vendors.category = 'photographer' AND LOWER(bc.name) LIKE '%photo%') OR
    (vendors.category = 'videographer' AND LOWER(bc.name) LIKE '%video%') OR
    (vendors.category = 'florist' AND LOWER(bc.name) LIKE '%flower%') OR
    (vendors.category = 'caterer' AND LOWER(bc.name) LIKE '%cater%') OR
    (vendors.category = 'venue' AND LOWER(bc.name) LIKE '%venue%') OR
    (vendors.category = 'dj' AND (LOWER(bc.name) LIKE '%music%' OR LOWER(bc.name) LIKE '%dj%')) OR
    (vendors.category = 'band' AND (LOWER(bc.name) LIKE '%music%' OR LOWER(bc.name) LIKE '%band%')) OR
    (vendors.category = 'baker' AND LOWER(bc.name) LIKE '%cake%') OR
    (vendors.category = 'decorator' AND LOWER(bc.name) LIKE '%decor%') OR
    (vendors.category = 'transportation' AND LOWER(bc.name) LIKE '%transport%') OR
    (vendors.category = 'other' AND LOWER(bc.name) LIKE '%misc%')
  )
  LIMIT 1
)
WHERE category_id IS NULL;

-- Add contact_date column if it doesn't exist (needed for budget integration)
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS contact_date timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Update contact_date to created_at for existing records if null
UPDATE public.vendors 
SET contact_date = created_at 
WHERE contact_date IS NULL;
