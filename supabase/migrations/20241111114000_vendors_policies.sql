-- Enable and configure RLS for vendors table

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.vendors TO authenticated;

DROP POLICY IF EXISTS "vendors_select_members" ON public.vendors;
CREATE POLICY "vendors_select_members"
  ON public.vendors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vendors.organization_id
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS "vendors_insert_members" ON public.vendors;
CREATE POLICY "vendors_insert_members"
  ON public.vendors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vendors.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

DROP POLICY IF EXISTS "vendors_update_members" ON public.vendors;
CREATE POLICY "vendors_update_members"
  ON public.vendors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vendors.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
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
        AND up.organization_id = vendors.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

DROP POLICY IF EXISTS "vendors_delete_members" ON public.vendors;
CREATE POLICY "vendors_delete_members"
  ON public.vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vendors.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );
