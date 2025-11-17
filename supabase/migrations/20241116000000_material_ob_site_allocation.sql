-- Add Opening Balance (OB) support for material masters with multi-site allocation
-- This migration adds:
-- 1. opening_balance field to material_masters table
-- 2. material_site_allocations junction table for OB allocation across sites

-- ============================================================================
-- Add opening_balance field to material_masters
-- ============================================================================

ALTER TABLE public.material_masters
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC;

-- ============================================================================
-- Create material_site_allocations junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.material_site_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.material_masters(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  opening_balance NUMERIC NOT NULL CHECK (opening_balance > 0),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  -- Ensure one allocation per material-site combination
  UNIQUE(material_id, site_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_site_allocations_material 
  ON public.material_site_allocations(material_id);

CREATE INDEX IF NOT EXISTS idx_material_site_allocations_site 
  ON public.material_site_allocations(site_id);

CREATE INDEX IF NOT EXISTS idx_material_site_allocations_org 
  ON public.material_site_allocations(organization_id);

-- Enable RLS
ALTER TABLE public.material_site_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for material_site_allocations
-- ============================================================================

-- Allow members to read site allocations
CREATE POLICY "material_site_allocations_select_members"
  ON public.material_site_allocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_site_allocations.organization_id
        AND up.is_active = true
    )
  );

-- Allow designated roles to insert site allocations
CREATE POLICY "material_site_allocations_insert_roles"
  ON public.material_site_allocations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_site_allocations.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'user'
        )
    )
  );

-- Allow designated roles to update site allocations
CREATE POLICY "material_site_allocations_update_roles"
  ON public.material_site_allocations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_site_allocations.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'user'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_site_allocations.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'user'
        )
    )
  );

-- Allow designated roles to delete site allocations
CREATE POLICY "material_site_allocations_delete_roles"
  ON public.material_site_allocations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_site_allocations.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'user'
        )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_material_site_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER material_site_allocations_updated_at
  BEFORE UPDATE ON public.material_site_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_material_site_allocations_updated_at();

