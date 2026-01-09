-- Add vendor_id column to payments table to link payments with vendors
-- This allows payments to be linked to vendors instead of just using free-text client names

-- Add vendor_id column (nullable for backward compatibility)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payments_vendor_id ON public.payments(vendor_id);

-- Add comment
COMMENT ON COLUMN public.payments.vendor_id IS 'Foreign key reference to vendors table. Links payment to a vendor/client.';

