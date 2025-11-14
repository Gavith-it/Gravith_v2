DROP POLICY IF EXISTS "material_purchases_delete_roles" ON public.material_purchases;

CREATE POLICY "material_purchases_delete_roles"
  ON public.material_purchases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_purchases.organization_id
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

