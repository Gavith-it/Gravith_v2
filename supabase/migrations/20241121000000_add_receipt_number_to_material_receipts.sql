-- Add receipt_number column to material_receipts table
-- This migration adds a receipt number field for better tracking and identification

-- Add receipt_number column if it doesn't exist
ALTER TABLE public.material_receipts
  ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Create an index on receipt_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_material_receipts_receipt_number
  ON public.material_receipts(receipt_number)
  WHERE receipt_number IS NOT NULL;

-- Add a unique constraint on receipt_number per organization (optional, but recommended)
-- This ensures each receipt number is unique within an organization
DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_receipts_receipt_number_org_unique'
  ) THEN
    -- Create unique index on (organization_id, receipt_number) where receipt_number is not null
    CREATE UNIQUE INDEX IF NOT EXISTS material_receipts_receipt_number_org_unique
      ON public.material_receipts(organization_id, receipt_number)
      WHERE receipt_number IS NOT NULL;
  END IF;
END
$$;

