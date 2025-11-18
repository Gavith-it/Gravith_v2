-- Migrate quantity to opening_balance and add tax_rate_id column
-- This migration:
-- 1. Copies existing quantity values to opening_balance
-- 2. Adds tax_rate_id column to material_masters
-- 3. Sets default opening_balance to 0 where NULL

-- ============================================================================
-- Migrate quantity to opening_balance
-- ============================================================================

-- Copy quantity to opening_balance where opening_balance is NULL
UPDATE public.material_masters
SET opening_balance = quantity
WHERE opening_balance IS NULL AND quantity IS NOT NULL AND quantity > 0;

-- Set opening_balance to 0 where it's still NULL
UPDATE public.material_masters
SET opening_balance = 0
WHERE opening_balance IS NULL;

-- ============================================================================
-- Add tax_rate_id column to material_masters
-- ============================================================================

ALTER TABLE public.material_masters
  ADD COLUMN IF NOT EXISTS tax_rate_id VARCHAR(50);

-- Create index for tax_rate_id lookups
CREATE INDEX IF NOT EXISTS idx_material_masters_tax_rate_id 
  ON public.material_masters(tax_rate_id);

-- ============================================================================
-- Migrate existing tax_rate values to tax_rate_id (convert number to code)
-- This maps common tax rates to their codes from masters
-- ============================================================================

-- Map tax_rate numbers to tax_rate_id codes based on common GST rates
UPDATE public.material_masters
SET tax_rate_id = CASE
  WHEN tax_rate = 0 THEN 'GST0'
  WHEN tax_rate = 5 THEN 'GST5'
  WHEN tax_rate = 12 THEN 'GST12'
  WHEN tax_rate = 18 THEN 'GST18'
  WHEN tax_rate = 28 THEN 'GST28'
  ELSE 'GST18' -- Default to GST18 for unmatched rates
END
WHERE tax_rate_id IS NULL;

-- Set default tax_rate_id for any remaining NULL values
UPDATE public.material_masters
SET tax_rate_id = 'GST18'
WHERE tax_rate_id IS NULL;

