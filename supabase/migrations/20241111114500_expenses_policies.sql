-- Enable and configure RLS for expenses table

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.expenses TO authenticated;

DROP POLICY IF EXISTS "expenses_select_members" ON public.expenses;
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

DROP POLICY IF EXISTS "expenses_insert_members" ON public.expenses;
CREATE POLICY "expenses_insert_members"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = expenses.organization_id
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

DROP POLICY IF EXISTS "expenses_update_members" ON public.expenses;
CREATE POLICY "expenses_update_members"
  ON public.expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = expenses.organization_id
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
        AND up.organization_id = expenses.organization_id
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

DROP POLICY IF EXISTS "expenses_delete_members" ON public.expenses;
CREATE POLICY "expenses_delete_members"
  ON public.expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = expenses.organization_id
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

