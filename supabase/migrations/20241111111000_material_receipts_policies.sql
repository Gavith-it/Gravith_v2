-- Row Level Security policies for material_receipts

-- Ensure table has RLS enabled (no-op if already enabled)
ALTER TABLE public.material_receipts ENABLE ROW LEVEL SECURITY;

-- Allow organization members to read their receipts
DROP POLICY IF EXISTS "material_receipts_select_members" ON public.material_receipts;
CREATE POLICY "material_receipts_select_members"
  ON public.material_receipts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_receipts.organization_id
        AND up.is_active = true
    )
  );

-- Allow authorized roles (including standard users) to insert receipts for their organization
DROP POLICY IF EXISTS "material_receipts_insert_members" ON public.material_receipts;
CREATE POLICY "material_receipts_insert_members"
  ON public.material_receipts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_receipts.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'site-supervisor',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

-- Allow authorized roles to update receipts within their organization
DROP POLICY IF EXISTS "material_receipts_update_members" ON public.material_receipts;
CREATE POLICY "material_receipts_update_members"
  ON public.material_receipts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_receipts.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'site-supervisor',
          'finance-manager',
          'executive',
          'user'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_receipts.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'site-supervisor',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

-- Allow authorized roles to delete receipts within their organization
DROP POLICY IF EXISTS "material_receipts_delete_members" ON public.material_receipts;
CREATE POLICY "material_receipts_delete_members"
  ON public.material_receipts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_receipts.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager',
          'site-supervisor',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

