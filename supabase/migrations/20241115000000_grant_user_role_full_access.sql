-- Grant 'user' role full create/edit/delete access to all modules except organization
-- This migration updates RLS policies to include 'user' role in INSERT, UPDATE, DELETE operations

-- ============================================================================
-- MATERIAL MASTERS: Add 'user' to INSERT, UPDATE, DELETE policies
-- ============================================================================

DROP POLICY IF EXISTS "material_masters_insert_roles" ON public.material_masters;
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
          'materials-manager',
          'user'
        )
    )
  );

DROP POLICY IF EXISTS "material_masters_update_roles" ON public.material_masters;
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
        AND up.organization_id = material_masters.organization_id
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
          'materials-manager',
          'user'
        )
    )
  );

-- ============================================================================
-- SITES: Add 'user' to INSERT, UPDATE policies and create DELETE policy
-- ============================================================================

DROP POLICY IF EXISTS "sites_insert_admins" ON public.sites;
CREATE POLICY "sites_insert_admins"
  ON public.sites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
        AND up.organization_role IN ('owner', 'admin', 'manager', 'user')
    )
  );

DROP POLICY IF EXISTS "sites_update_admins" ON public.sites;
CREATE POLICY "sites_update_admins"
  ON public.sites
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
        AND up.organization_role IN ('owner', 'admin', 'manager', 'user')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
        AND up.organization_role IN ('owner', 'admin', 'manager', 'user')
    )
  );

-- Create DELETE policy for sites (if it doesn't exist)
DROP POLICY IF EXISTS "sites_delete_admins" ON public.sites;
CREATE POLICY "sites_delete_admins"
  ON public.sites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
        AND up.organization_role IN ('owner', 'admin', 'manager', 'user')
    )
  );

-- ============================================================================
-- MATERIAL PURCHASES: Add 'user' to INSERT, UPDATE, DELETE policies
-- ============================================================================

DROP POLICY IF EXISTS "material_purchases_insert_roles" ON public.material_purchases;
CREATE POLICY "material_purchases_insert_roles"
  ON public.material_purchases
  FOR INSERT
  WITH CHECK (
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
          'materials-manager',
          'user'
        )
    )
  );

DROP POLICY IF EXISTS "material_purchases_update_roles" ON public.material_purchases;
CREATE POLICY "material_purchases_update_roles"
  ON public.material_purchases
  FOR UPDATE
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
        AND up.organization_id = material_purchases.organization_id
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
          'materials-manager',
          'user'
        )
    )
  );

