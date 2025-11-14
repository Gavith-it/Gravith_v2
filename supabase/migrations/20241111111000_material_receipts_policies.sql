-- Row Level Security policies for material_receipts
DO $policies$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'material_receipts'
  ) THEN
    RAISE NOTICE 'material_receipts table not found, skipping policy setup.';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.material_receipts ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "material_receipts_select_members" ON public.material_receipts';
  EXECUTE $create_select$
    CREATE POLICY "material_receipts_select_members"
      ON public.material_receipts
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          WHERE up.id = auth.uid()
            AND up.organization_id = material_receipts.organization_id
            AND up.is_active = true
        )
      );
  $create_select$;

  EXECUTE 'DROP POLICY IF EXISTS "material_receipts_insert_members" ON public.material_receipts';
  EXECUTE $create_insert$
    CREATE POLICY "material_receipts_insert_members"
      ON public.material_receipts
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          WHERE up.id = auth.uid()
            AND up.organization_id = material_receipts.organization_id
            AND up.is_active = true
            AND up.organization_role IN (
              'owner',
              'admin',
              'manager',
              'project-manager',
              'materials-manager',
              'site-supervisor',
              'finance-manager',
              'executive',
              'user'
            )
        )
      );
  $create_insert$;

  EXECUTE 'DROP POLICY IF EXISTS "material_receipts_update_members" ON public.material_receipts';
  EXECUTE $create_update$
    CREATE POLICY "material_receipts_update_members"
      ON public.material_receipts
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          WHERE up.id = auth.uid()
            AND up.organization_id = material_receipts.organization_id
            AND up.is_active = true
            AND up.organization_role IN (
              'owner',
              'admin',
              'manager',
              'project-manager',
              'materials-manager',
              'site-supervisor',
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
            AND up.organization_id = material_receipts.organization_id
            AND up.is_active = true
            AND up.organization_role IN (
              'owner',
              'admin',
              'manager',
              'project-manager',
              'materials-manager',
              'site-supervisor',
              'finance-manager',
              'executive',
              'user'
            )
        )
      );
  $create_update$;

  EXECUTE 'DROP POLICY IF EXISTS "material_receipts_delete_members" ON public.material_receipts';
  EXECUTE $create_delete$
    CREATE POLICY "material_receipts_delete_members"
      ON public.material_receipts
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM user_profiles up
          WHERE up.id = auth.uid()
            AND up.organization_id = material_receipts.organization_id
            AND up.is_active = true
            AND up.organization_role IN (
              'owner',
              'admin',
              'manager',
              'project-manager',
              'materials-manager',
              'site-supervisor',
              'finance-manager',
              'executive',
              'user'
            )
        )
      );
  $create_delete$;
END
$policies$;
