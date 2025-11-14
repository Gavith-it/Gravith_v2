-- Allow privileged roles to delete material masters within their organization
DROP POLICY IF EXISTS "material_masters_delete_roles" ON public.material_masters;

CREATE POLICY "material_masters_delete_roles"
  ON public.material_masters
  FOR DELETE
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
  );

