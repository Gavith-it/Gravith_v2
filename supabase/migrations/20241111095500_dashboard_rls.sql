-- Dashboard-related RLS policies to allow organization members to read their data

-- Helper pattern: members belong to same organization via user_profiles

-- Sites
CREATE POLICY "sites_select_members"
  ON public.sites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = sites.organization_id
        AND up.is_active = true
    )
  );

-- Vendors
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

-- Vehicles
CREATE POLICY "vehicles_select_members"
  ON public.vehicles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicles.organization_id
        AND up.is_active = true
    )
  );

-- Material masters
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

-- Material purchases
CREATE POLICY "material_purchases_select_members"
  ON public.material_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = material_purchases.organization_id
        AND up.is_active = true
    )
  );

-- Expenses
CREATE POLICY "expenses_select_members"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = expenses.organization_id
        AND up.is_active = true
    )
  );

-- Payments
CREATE POLICY "payments_select_members"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = payments.organization_id
        AND up.is_active = true
    )
  );

-- Project activities
CREATE POLICY "project_activities_select_members"
  ON public.project_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_activities.organization_id
        AND up.is_active = true
    )
  );

-- Project milestones
CREATE POLICY "project_milestones_select_members"
  ON public.project_milestones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_milestones.organization_id
        AND up.is_active = true
    )
  );

