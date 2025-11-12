-- Enable and configure RLS for project_activities and project_milestones

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.project_activities TO authenticated;
GRANT ALL ON TABLE public.project_milestones TO authenticated;

DROP POLICY IF EXISTS "project_activities_select_members" ON public.project_activities;
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

DROP POLICY IF EXISTS "project_milestones_select_members" ON public.project_milestones;
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

DROP POLICY IF EXISTS "project_activities_insert_members" ON public.project_activities;
CREATE POLICY "project_activities_insert_members"
  ON public.project_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_activities.organization_id
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

DROP POLICY IF EXISTS "project_milestones_insert_members" ON public.project_milestones;
CREATE POLICY "project_milestones_insert_members"
  ON public.project_milestones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_milestones.organization_id
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

DROP POLICY IF EXISTS "project_activities_update_members" ON public.project_activities;
CREATE POLICY "project_activities_update_members"
  ON public.project_activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_activities.organization_id
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
        AND up.organization_id = project_activities.organization_id
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

DROP POLICY IF EXISTS "project_milestones_update_members" ON public.project_milestones;
CREATE POLICY "project_milestones_update_members"
  ON public.project_milestones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_milestones.organization_id
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
        AND up.organization_id = project_milestones.organization_id
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

DROP POLICY IF EXISTS "project_activities_delete_members" ON public.project_activities;
CREATE POLICY "project_activities_delete_members"
  ON public.project_activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_activities.organization_id
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

DROP POLICY IF EXISTS "project_milestones_delete_members" ON public.project_milestones;
CREATE POLICY "project_milestones_delete_members"
  ON public.project_milestones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = project_milestones.organization_id
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

