-- Vehicles module RLS & grants

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_refueling ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_members" ON public.vehicles;
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

DROP POLICY IF EXISTS "vehicles_insert_members" ON public.vehicles;
CREATE POLICY "vehicles_insert_members"
  ON public.vehicles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicles.organization_id
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

DROP POLICY IF EXISTS "vehicles_update_members" ON public.vehicles;
CREATE POLICY "vehicles_update_members"
  ON public.vehicles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicles.organization_id
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
        AND up.organization_id = vehicles.organization_id
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

DROP POLICY IF EXISTS "vehicles_delete_members" ON public.vehicles;
CREATE POLICY "vehicles_delete_members"
  ON public.vehicles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicles.organization_id
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

DROP POLICY IF EXISTS "vehicle_usage_select_members" ON public.vehicle_usage;
CREATE POLICY "vehicle_usage_select_members"
  ON public.vehicle_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_usage.organization_id
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS "vehicle_usage_insert_members" ON public.vehicle_usage;
CREATE POLICY "vehicle_usage_insert_members"
  ON public.vehicle_usage
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_usage.organization_id
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

DROP POLICY IF EXISTS "vehicle_usage_update_members" ON public.vehicle_usage;
CREATE POLICY "vehicle_usage_update_members"
  ON public.vehicle_usage
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_usage.organization_id
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
        AND up.organization_id = vehicle_usage.organization_id
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

DROP POLICY IF EXISTS "vehicle_usage_delete_members" ON public.vehicle_usage;
CREATE POLICY "vehicle_usage_delete_members"
  ON public.vehicle_usage
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_usage.organization_id
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

DROP POLICY IF EXISTS "vehicle_refueling_select_members" ON public.vehicle_refueling;
CREATE POLICY "vehicle_refueling_select_members"
  ON public.vehicle_refueling
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_refueling.organization_id
        AND up.is_active = true
    )
  );

DROP POLICY IF EXISTS "vehicle_refueling_insert_members" ON public.vehicle_refueling;
CREATE POLICY "vehicle_refueling_insert_members"
  ON public.vehicle_refueling
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_refueling.organization_id
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

DROP POLICY IF EXISTS "vehicle_refueling_update_members" ON public.vehicle_refueling;
CREATE POLICY "vehicle_refueling_update_members"
  ON public.vehicle_refueling
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_refueling.organization_id
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
        AND up.organization_id = vehicle_refueling.organization_id
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

DROP POLICY IF EXISTS "vehicle_refueling_delete_members" ON public.vehicle_refueling;
CREATE POLICY "vehicle_refueling_delete_members"
  ON public.vehicle_refueling
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = vehicle_refueling.organization_id
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_refueling TO authenticated;

