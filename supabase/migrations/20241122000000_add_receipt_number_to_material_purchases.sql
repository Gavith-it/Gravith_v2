-- Add receipt_number column to material_purchases table
ALTER TABLE public.material_purchases
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- Create index for receipt_number lookups
CREATE INDEX IF NOT EXISTS idx_material_purchases_receipt_number 
ON public.material_purchases (receipt_number);

-- Add a unique constraint for receipt_number per organization, allowing NULLs
CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_purchases_org_receipt_number
ON public.material_purchases (organization_id, receipt_number)
WHERE receipt_number IS NOT NULL;

