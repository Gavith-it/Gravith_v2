-- Materials policies to allow organization-scoped access

-- Drop existing policies if they already exist (re-running migration manually)
DROP POLICY IF EXISTS "material_masters_select_members" ON public.material_masters;
DROP POLICY IF EXISTS "material_masters_insert_roles" ON public.material_masters;
DROP POLICY IF EXISTS "material_masters_update_roles" ON public.material_masters;

-- Allow members to read material master
CREATE POLICY "material_masters_select_members"
  ON public.material_masters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_masters.organization_id
        AND up.is_active = true
    )
  );

-- Allow designated roles to insert materials
CREATE POLICY "material_masters_insert_roles"
  ON public.material_masters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_masters.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager'
        )
    )
  );

-- Allow designated roles to update materials
CREATE POLICY "material_masters_update_roles"
  ON public.material_masters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_masters.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_masters.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'materials-manager'
        )
    )
  );

