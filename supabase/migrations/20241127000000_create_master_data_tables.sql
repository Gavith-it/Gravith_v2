-- ============================================================================
-- Master Data Tables
-- ============================================================================
-- This migration creates tables for master data management:
-- 1. uoms - Units of Measurement
-- 2. material_categories - Material Categories
-- 3. expense_categories - Expense Categories
-- 4. tax_rates - Tax Rates
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- UOMs (Units of Measurement) Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT uoms_code_org_unique UNIQUE (code, org_id)
);

-- Indexes for UOMs
CREATE INDEX IF NOT EXISTS idx_uoms_org_id ON public.uoms(org_id);
CREATE INDEX IF NOT EXISTS idx_uoms_is_active ON public.uoms(is_active);
CREATE INDEX IF NOT EXISTS idx_uoms_code ON public.uoms(code);

-- ============================================================================
-- Material Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.material_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT material_categories_code_org_unique UNIQUE (code, org_id)
);

-- Indexes for Material Categories
CREATE INDEX IF NOT EXISTS idx_material_categories_org_id ON public.material_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_material_categories_is_active ON public.material_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_material_categories_code ON public.material_categories(code);

-- ============================================================================
-- Expense Categories Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT expense_categories_code_org_unique UNIQUE (code, org_id)
);

-- Indexes for Expense Categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_org_id ON public.expense_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_is_active ON public.expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_code ON public.expense_categories(code);

-- ============================================================================
-- Tax Rates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT tax_rates_code_org_unique UNIQUE (code, org_id)
);

-- Indexes for Tax Rates
CREATE INDEX IF NOT EXISTS idx_tax_rates_org_id ON public.tax_rates(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_is_active ON public.tax_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_tax_rates_code ON public.tax_rates(code);

-- ============================================================================
-- Updated_at trigger function (if not exists)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_uoms_updated_at
  BEFORE UPDATE ON public.uoms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_categories_updated_at
  BEFORE UPDATE ON public.material_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_rates_updated_at
  BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.uoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- UOMs Policies
CREATE POLICY "Users can view uoms in their organization"
  ON public.uoms FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert uoms in their organization"
  ON public.uoms FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update uoms in their organization"
  ON public.uoms FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete uoms in their organization"
  ON public.uoms FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Material Categories Policies
CREATE POLICY "Users can view material_categories in their organization"
  ON public.material_categories FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert material_categories in their organization"
  ON public.material_categories FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update material_categories in their organization"
  ON public.material_categories FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete material_categories in their organization"
  ON public.material_categories FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Expense Categories Policies
CREATE POLICY "Users can view expense_categories in their organization"
  ON public.expense_categories FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expense_categories in their organization"
  ON public.expense_categories FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update expense_categories in their organization"
  ON public.expense_categories FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expense_categories in their organization"
  ON public.expense_categories FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Tax Rates Policies
CREATE POLICY "Users can view tax_rates in their organization"
  ON public.tax_rates FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tax_rates in their organization"
  ON public.tax_rates FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update tax_rates in their organization"
  ON public.tax_rates FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tax_rates in their organization"
  ON public.tax_rates FOR DELETE
  USING (
    org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

