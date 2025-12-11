-- Add three quantity fields (Inward, Utilization, Available) to material_site_allocations
-- This migration:
-- 1. Adds inward_qty, utilization_qty, available_qty columns
-- 2. Migrates existing opening_balance to inward_qty
-- 3. Sets utilization_qty = 0 for existing records
-- 4. Calculates available_qty = inward_qty - utilization_qty
-- 5. Adds validation constraints

-- ============================================================================
-- Add new quantity columns
-- ============================================================================

ALTER TABLE public.material_site_allocations
  ADD COLUMN IF NOT EXISTS inward_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS utilization_qty NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_qty NUMERIC NOT NULL DEFAULT 0;

-- ============================================================================
-- Migrate existing data
-- ============================================================================

-- Migrate opening_balance to inward_qty, set utilization_qty = 0, calculate available_qty
UPDATE public.material_site_allocations
SET 
  inward_qty = COALESCE(opening_balance, 0),
  utilization_qty = 0,
  available_qty = COALESCE(opening_balance, 0)
WHERE inward_qty = 0 AND utilization_qty = 0 AND available_qty = 0;

-- ============================================================================
-- Add validation constraints
-- ============================================================================

-- Ensure inward_qty >= 0
ALTER TABLE public.material_site_allocations
  ADD CONSTRAINT material_site_allocations_inward_qty_non_negative
  CHECK (inward_qty >= 0);

-- Ensure utilization_qty >= 0
ALTER TABLE public.material_site_allocations
  ADD CONSTRAINT material_site_allocations_utilization_qty_non_negative
  CHECK (utilization_qty >= 0);

-- Ensure utilization_qty <= inward_qty (no negative available quantity)
ALTER TABLE public.material_site_allocations
  ADD CONSTRAINT material_site_allocations_utilization_not_exceed_inward
  CHECK (utilization_qty <= inward_qty);

-- Ensure available_qty >= 0
ALTER TABLE public.material_site_allocations
  ADD CONSTRAINT material_site_allocations_available_qty_non_negative
  CHECK (available_qty >= 0);

-- ============================================================================
-- Create function to automatically calculate available_qty
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_available_qty()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_qty = GREATEST(0, NEW.inward_qty - NEW.utilization_qty);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate available_qty before insert/update
CREATE TRIGGER material_site_allocations_calculate_available_qty
  BEFORE INSERT OR UPDATE OF inward_qty, utilization_qty ON public.material_site_allocations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_available_qty();

-- ============================================================================
-- Update existing records to ensure available_qty is correct
-- ============================================================================

UPDATE public.material_site_allocations
SET available_qty = GREATEST(0, inward_qty - utilization_qty);

