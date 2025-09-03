-- Ensure required extension for gen_random_uuid/gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create cash gifts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cash_gifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
    guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
    guest_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_currency TEXT DEFAULT 'EUR',
    gift_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on cash_gifts
ALTER TABLE public.cash_gifts ENABLE ROW LEVEL SECURITY;

-- Add missing columns to existing table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_gifts') THEN
        ALTER TABLE public.cash_gifts 
        ADD COLUMN IF NOT EXISTS guest_name TEXT,
        ADD COLUMN IF NOT EXISTS amount_currency TEXT DEFAULT 'EUR',
        ADD COLUMN IF NOT EXISTS gift_date DATE DEFAULT CURRENT_DATE,
        ADD COLUMN IF NOT EXISTS notes TEXT;
    END IF;
END $$;

-- Update RLS policies for cash gifts to allow proper access
DROP POLICY IF EXISTS "Users can manage cash gifts for their weddings" ON public.cash_gifts;

CREATE POLICY "Users can manage cash gifts for their weddings" ON public.cash_gifts
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

-- Add ceremony_time and venue columns to weddings if missing
ALTER TABLE public.weddings 
ADD COLUMN IF NOT EXISTS ceremony_time TIME DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS venue TEXT DEFAULT 'Salla Elegance';

-- Create function to generate invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
DECLARE
    raw TEXT;
BEGIN
    -- Use standard Base64 then convert to URL-safe by translating +/ to -_ and stripping = padding
    raw := encode(gen_random_bytes(32), 'base64');
    raw := translate(raw, '+/', '-_');
    RETURN regexp_replace(raw, '=+$', '');
END;
$$ LANGUAGE plpgsql;

-- Add invitation token generation trigger
CREATE OR REPLACE FUNCTION create_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.invitations (wedding_id, guest_id, token)
    VALUES (NEW.wedding_id, NEW.id, generate_invitation_token());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invitations for new guests
DROP TRIGGER IF EXISTS auto_create_invitation ON public.guests;
CREATE TRIGGER auto_create_invitation
    AFTER INSERT ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION create_invitation_token();

-- Update existing guests to have invitations
INSERT INTO public.invitations (wedding_id, guest_id, token)
SELECT g.wedding_id, g.id, generate_invitation_token()
FROM public.guests g
LEFT JOIN public.invitations i ON i.guest_id = g.id
WHERE i.id IS NULL;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS cash_gifts_wedding_id_idx ON public.cash_gifts(wedding_id);
CREATE INDEX IF NOT EXISTS cash_gifts_guest_id_idx ON public.cash_gifts(guest_id);
CREATE INDEX IF NOT EXISTS cash_gifts_gift_date_idx ON public.cash_gifts(gift_date);

-- Create view for invitation analytics
CREATE OR REPLACE VIEW invitation_stats AS
SELECT 
    w.id as wedding_id,
    w.bride_name,
    w.groom_name,
    COUNT(i.id) as total_invitations,
    COUNT(CASE WHEN i.sent_at IS NOT NULL THEN 1 END) as sent_count,
    COUNT(CASE WHEN i.responded_at IS NOT NULL THEN 1 END) as responded_count,
    COUNT(CASE WHEN g.rsvp_status = 'attending' THEN 1 END) as attending_count,
    COUNT(CASE WHEN g.rsvp_status = 'not_attending' THEN 1 END) as not_attending_count,
    COUNT(CASE WHEN g.rsvp_status = 'maybe' THEN 1 END) as maybe_count
FROM public.weddings w
LEFT JOIN public.invitations i ON i.wedding_id = w.id
LEFT JOIN public.guests g ON g.id = i.guest_id
GROUP BY w.id, w.bride_name, w.groom_name;
