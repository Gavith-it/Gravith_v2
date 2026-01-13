-- Add paid and balance columns to material_purchases table

-- Add paid column (amount paid for this purchase)
ALTER TABLE public.material_purchases
ADD COLUMN IF NOT EXISTS paid NUMERIC(15, 2) DEFAULT 0 NOT NULL;

-- Add balance column (outstanding amount = total_amount - paid)
ALTER TABLE public.material_purchases
ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure non-negative values
ALTER TABLE public.material_purchases
ADD CONSTRAINT material_purchases_paid_non_negative CHECK (paid >= 0);

ALTER TABLE public.material_purchases
ADD CONSTRAINT material_purchases_balance_non_negative CHECK (balance >= 0);

-- Create index for filtering/sorting by paid and balance
CREATE INDEX IF NOT EXISTS idx_material_purchases_paid ON public.material_purchases(paid);
CREATE INDEX IF NOT EXISTS idx_material_purchases_balance ON public.material_purchases(balance);

-- Update balance to be calculated as total_amount - paid for existing records
-- This ensures balance is consistent with total_amount and paid
UPDATE public.material_purchases
SET balance = GREATEST(0, COALESCE(total_amount, 0) - COALESCE(paid, 0))
WHERE balance = 0 AND total_amount IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.material_purchases.paid IS 'Amount paid for this material purchase. Should be less than or equal to total_amount.';
COMMENT ON COLUMN public.material_purchases.balance IS 'Outstanding balance for this purchase (total_amount - paid). Should be non-negative.';
