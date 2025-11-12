-- Material purchases policies and structure updates

-- Ensure additional columns exist
ALTER TABLE public.material_purchases
  ADD COLUMN IF NOT EXISTS vendor_name text,
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS consumed_quantity numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_quantity numeric;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "material_purchases_select_members" ON public.material_purchases;
DROP POLICY IF EXISTS "material_purchases_insert_roles" ON public.material_purchases;
DROP POLICY IF EXISTS "material_purchases_update_roles" ON public.material_purchases;

-- Allow members to read material purchases
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

-- Allow designated roles to create purchases
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
          'materials-manager'
        )
    )
  );

-- Allow designated roles to update purchases
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
          'materials-manager'
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
          'materials-manager'
        )
    )
  );

