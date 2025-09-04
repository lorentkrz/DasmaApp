-- Ensure required extension for gen_random_uuid/gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create invitations table for public access
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already existed without a token column, add it
ALTER TABLE public.invitations
ADD COLUMN IF NOT EXISTS token TEXT;

-- Create unique index on token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS invitations_token_idx ON public.invitations(token);

-- Create index on wedding_id for performance
CREATE INDEX IF NOT EXISTS invitations_wedding_id_idx ON public.invitations(wedding_id);

-- Create index on guest_id for performance
CREATE INDEX IF NOT EXISTS invitations_guest_id_idx ON public.invitations(guest_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (wedding owners/collaborators)
DROP POLICY IF EXISTS "Users can manage invitations for their weddings" ON public.invitations;
CREATE POLICY "Users can manage invitations for their weddings" ON public.invitations
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

-- Policy for public access via token (no authentication required)
DROP POLICY IF EXISTS "Public can view invitations by token" ON public.invitations;
CREATE POLICY "Public can view invitations by token" ON public.invitations
    FOR SELECT USING (true);

-- Policy for public RSVP updates via token
DROP POLICY IF EXISTS "Public can update RSVP via token" ON public.invitations;
CREATE POLICY "Public can update RSVP via token" ON public.invitations
    FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invitations_updated_at ON public.invitations;
CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_invitations_updated_at();

-- Add group_id to guests table for group invitations
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;

-- Add plus_one fields to guests table
ALTER TABLE public.guests 
ADD COLUMN IF NOT EXISTS plus_one BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plus_one_name TEXT;

-- Create index on group_id for performance
CREATE INDEX IF NOT EXISTS guests_group_id_idx ON public.guests(group_id);
