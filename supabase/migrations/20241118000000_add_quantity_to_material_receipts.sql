-- Add quantity column to material_receipts table
-- This stores the quantity received in the material's UOM (Unit of Measure)
-- This is separate from net_weight which is always in kg

ALTER TABLE public.material_receipts
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,2);

-- Set default quantity to net_weight for existing records (temporary, should be updated manually)
-- For new records, quantity will be entered by user in material's UOM
UPDATE public.material_receipts
SET quantity = net_weight
WHERE quantity IS NULL;

-- Add constraint to ensure quantity is non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'material_receipts_quantity_non_negative'
  ) THEN
    ALTER TABLE public.material_receipts
      ADD CONSTRAINT material_receipts_quantity_non_negative 
      CHECK (quantity IS NULL OR quantity >= 0);
  END IF;
END
$$;

-- Add index for quantity lookups
CREATE INDEX IF NOT EXISTS idx_material_receipts_quantity 
  ON public.material_receipts(quantity)
  WHERE quantity IS NOT NULL;

