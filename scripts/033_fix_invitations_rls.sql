-- Fix invitations and related tables RLS policies to avoid infinite recursion
-- Replace wedding_collaborators union with owner-only policies

-- Drop existing policies for invitation_templates
DROP POLICY IF EXISTS "invitation_templates_select_wedding_access" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_insert_wedding_access" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_update_wedding_access" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_delete_wedding_access" ON public.invitation_templates;

-- Drop existing policies for invitations
DROP POLICY IF EXISTS "invitations_select_wedding_access" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_wedding_access" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_wedding_access" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_wedding_access" ON public.invitations;

-- Drop existing policies for guest_groups
DROP POLICY IF EXISTS "guest_groups_select_wedding_access" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_insert_wedding_access" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_update_wedding_access" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_delete_wedding_access" ON public.guest_groups;

-- Drop existing owner-only policies (in case they exist)
DROP POLICY IF EXISTS "invitation_templates_owner_only_select" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_owner_only_insert" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_owner_only_update" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitation_templates_owner_only_delete" ON public.invitation_templates;
DROP POLICY IF EXISTS "invitations_owner_only_select" ON public.invitations;
DROP POLICY IF EXISTS "invitations_owner_only_insert" ON public.invitations;
DROP POLICY IF EXISTS "invitations_owner_only_update" ON public.invitations;
DROP POLICY IF EXISTS "invitations_owner_only_delete" ON public.invitations;
DROP POLICY IF EXISTS "guest_groups_owner_only_select" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_owner_only_insert" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_owner_only_update" ON public.guest_groups;
DROP POLICY IF EXISTS "guest_groups_owner_only_delete" ON public.guest_groups;

-- Create owner-only policies for invitation_templates
CREATE POLICY "invitation_templates_owner_only_select" ON public.invitation_templates
    FOR SELECT USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitation_templates_owner_only_insert" ON public.invitation_templates
    FOR INSERT WITH CHECK (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitation_templates_owner_only_update" ON public.invitation_templates
    FOR UPDATE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitation_templates_owner_only_delete" ON public.invitation_templates
    FOR DELETE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

-- Create owner-only policies for invitations
CREATE POLICY "invitations_owner_only_select" ON public.invitations
    FOR SELECT USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitations_owner_only_insert" ON public.invitations
    FOR INSERT WITH CHECK (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitations_owner_only_update" ON public.invitations
    FOR UPDATE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "invitations_owner_only_delete" ON public.invitations
    FOR DELETE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

-- Create owner-only policies for guest_groups
CREATE POLICY "guest_groups_owner_only_select" ON public.guest_groups
    FOR SELECT USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "guest_groups_owner_only_insert" ON public.guest_groups
    FOR INSERT WITH CHECK (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "guest_groups_owner_only_update" ON public.guest_groups
    FOR UPDATE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "guest_groups_owner_only_delete" ON public.guest_groups
    FOR DELETE USING (
        wedding_id IN (
            SELECT id FROM public.weddings WHERE owner_id = auth.uid()
        )
    );
