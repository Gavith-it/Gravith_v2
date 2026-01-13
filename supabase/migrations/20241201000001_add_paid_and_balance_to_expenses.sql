-- Add paid and balance columns to expenses table

-- Add paid column (amount paid for this expense)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS paid NUMERIC(15, 2) DEFAULT 0 NOT NULL;

-- Add balance column (outstanding amount = amount - paid)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS balance NUMERIC(15, 2) DEFAULT 0 NOT NULL;

-- Add constraints to ensure non-negative values
ALTER TABLE public.expenses
ADD CONSTRAINT expenses_paid_non_negative CHECK (paid >= 0);

ALTER TABLE public.expenses
ADD CONSTRAINT expenses_balance_non_negative CHECK (balance >= 0);

-- Create index for filtering/sorting by paid and balance
CREATE INDEX IF NOT EXISTS idx_expenses_paid ON public.expenses(paid);
CREATE INDEX IF NOT EXISTS idx_expenses_balance ON public.expenses(balance);

-- Update balance to be calculated as amount - paid for existing records
-- This ensures balance is consistent with amount and paid
UPDATE public.expenses
SET balance = GREATEST(0, COALESCE(amount, 0) - COALESCE(paid, 0))
WHERE balance = 0 AND amount IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.expenses.paid IS 'Amount paid for this expense. Should be less than or equal to amount.';
COMMENT ON COLUMN public.expenses.balance IS 'Outstanding balance for this expense (amount - paid). Should be non-negative.';
