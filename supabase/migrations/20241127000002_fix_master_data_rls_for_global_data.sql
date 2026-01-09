-- ============================================================================
-- Fix RLS Policies for Master Data Tables to Allow Global Data Access
-- ============================================================================
-- This migration updates the RLS policies to allow users to view
-- global master data (where org_id IS NULL) in addition to their
-- organization's data.
-- ============================================================================

-- Drop existing SELECT policies (they don't allow NULL org_id)
DROP POLICY IF EXISTS "Users can view uoms in their organization" ON public.uoms;
DROP POLICY IF EXISTS "Users can view material_categories in their organization" ON public.material_categories;
DROP POLICY IF EXISTS "Users can view expense_categories in their organization" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view tax_rates in their organization" ON public.tax_rates;

-- Create new SELECT policies that allow both global (NULL) and organization-specific data
CREATE POLICY "Users can view uoms (global and org-specific)"
  ON public.uoms FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view material_categories (global and org-specific)"
  ON public.material_categories FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view expense_categories (global and org-specific)"
  ON public.expense_categories FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view tax_rates (global and org-specific)"
  ON public.tax_rates FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT organization_id FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Note: INSERT/UPDATE/DELETE policies remain unchanged as users should only
-- be able to modify their organization's data, not global master data.

