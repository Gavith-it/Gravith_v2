-- Additional RLS policies for site management features

-- Allow organization admins to insert sites
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
        AND up.organization_role IN ('owner', 'admin', 'manager')
    )
  );

-- Allow organization admins to update their sites
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
        AND up.organization_role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
        AND up.organization_role IN ('owner', 'admin', 'manager')
    )
  );

-- Site expenses visibility
CREATE POLICY "site_expenses_select_members"
  ON public.site_expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = site_expenses.organization_id
        AND up.is_active = true
    )
  );

-- Site documents visibility
CREATE POLICY "site_documents_select_members"
  ON public.site_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = site_documents.organization_id
        AND up.is_active = true
    )
  );

-- Site labour visibility
CREATE POLICY "site_labour_select_members"
  ON public.site_labour
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = site_labour.organization_id
        AND up.is_active = true
    )
  );

-- Site vehicles visibility
CREATE POLICY "site_vehicles_select_members"
  ON public.site_vehicles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = site_vehicles.organization_id
        AND up.is_active = true
    )
  );

