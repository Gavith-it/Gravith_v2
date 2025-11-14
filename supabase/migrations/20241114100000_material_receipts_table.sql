-- Ensure UUID support for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create material_receipts table if it does not exist (fresh environments)
CREATE TABLE IF NOT EXISTS public.material_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  vehicle_number TEXT NOT NULL,
  material_id UUID NOT NULL REFERENCES material_masters(id) ON DELETE RESTRICT,
  filled_weight NUMERIC(12,2) NOT NULL CHECK (filled_weight >= 0),
  empty_weight NUMERIC(12,2) NOT NULL CHECK (empty_weight >= 0),
  net_weight NUMERIC(12,2) NOT NULL CHECK (net_weight >= 0),
  vendor_id UUID NULL REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name TEXT NULL,
  linked_purchase_id UUID NULL REFERENCES material_purchases(id) ON DELETE SET NULL,
  site_id UUID NULL REFERENCES sites(id) ON DELETE SET NULL,
  site_name TEXT NULL,
  material_name TEXT NOT NULL DEFAULT '',
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NULL REFERENCES auth.users(id),
  updated_by UUID NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Bring legacy tables (if any) up to date with the expected columns/constraints
ALTER TABLE public.material_receipts
  ADD COLUMN IF NOT EXISTS material_name TEXT DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS linked_purchase_id UUID REFERENCES material_purchases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_name TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

UPDATE public.material_receipts
SET material_name = ''
WHERE material_name IS NULL;

ALTER TABLE public.material_receipts
  ALTER COLUMN material_name SET DEFAULT ''::text,
  ALTER COLUMN material_name SET NOT NULL;

-- Ensure numeric precision is consistent
ALTER TABLE public.material_receipts
  ALTER COLUMN filled_weight TYPE NUMERIC(12,2) USING filled_weight::numeric(12,2),
  ALTER COLUMN empty_weight TYPE NUMERIC(12,2) USING empty_weight::numeric(12,2),
  ALTER COLUMN net_weight TYPE NUMERIC(12,2) USING net_weight::numeric(12,2);

-- Guarantee non-negative weights even if previous migrations were skipped
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_receipts_filled_weight_non_negative'
  ) THEN
    ALTER TABLE public.material_receipts
      ADD CONSTRAINT material_receipts_filled_weight_non_negative CHECK (filled_weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_receipts_empty_weight_non_negative'
  ) THEN
    ALTER TABLE public.material_receipts
      ADD CONSTRAINT material_receipts_empty_weight_non_negative CHECK (empty_weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_receipts_net_weight_non_negative'
  ) THEN
    ALTER TABLE public.material_receipts
      ADD CONSTRAINT material_receipts_net_weight_non_negative CHECK (net_weight >= 0);
  END IF;
END
$$;

-- Helpful indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_material_receipts_org_date
  ON public.material_receipts (organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_material_receipts_material
  ON public.material_receipts (material_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_receipts_linked_purchase
  ON public.material_receipts (linked_purchase_id)
  WHERE linked_purchase_id IS NOT NULL;

-- Re-assert RLS + policies (older migration may have been skipped previously)
ALTER TABLE public.material_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_receipts_select_members" ON public.material_receipts;
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

DROP POLICY IF EXISTS "material_receipts_insert_members" ON public.material_receipts;
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

DROP POLICY IF EXISTS "material_receipts_update_members" ON public.material_receipts;
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

DROP POLICY IF EXISTS "material_receipts_delete_members" ON public.material_receipts;
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

