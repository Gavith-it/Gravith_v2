-- Fix site allocations constraints and trigger to use correct formula
-- Available Qty = Opening Balance + Inward - Utilization
-- Constraint should check: Utilization <= Opening Balance + Inward

-- ============================================================================
-- Drop old constraint
-- ============================================================================

ALTER TABLE public.material_site_allocations
  DROP CONSTRAINT IF EXISTS material_site_allocations_utilization_not_exceed_inward;

-- ============================================================================
-- Add new constraint with correct formula
-- ============================================================================

-- Ensure utilization_qty <= (opening_balance + inward_qty)
ALTER TABLE public.material_site_allocations
  ADD CONSTRAINT material_site_allocations_utilization_not_exceed_available
  CHECK (utilization_qty <= COALESCE(opening_balance, 0) + inward_qty);

-- ============================================================================
-- Update trigger function to use correct formula
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_available_qty()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate available_qty = Opening Balance + Inward - Utilization
  NEW.available_qty = GREATEST(0, COALESCE(NEW.opening_balance, 0) + NEW.inward_qty - NEW.utilization_qty);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update trigger to include opening_balance in the update list
-- ============================================================================

DROP TRIGGER IF EXISTS material_site_allocations_calculate_available_qty ON public.material_site_allocations;

CREATE TRIGGER material_site_allocations_calculate_available_qty
  BEFORE INSERT OR UPDATE OF opening_balance, inward_qty, utilization_qty ON public.material_site_allocations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_available_qty();

-- ============================================================================
-- Recalculate available_qty for all existing records with correct formula
-- ============================================================================

UPDATE public.material_site_allocations
SET available_qty = GREATEST(0, COALESCE(opening_balance, 0) + inward_qty - utilization_qty);

