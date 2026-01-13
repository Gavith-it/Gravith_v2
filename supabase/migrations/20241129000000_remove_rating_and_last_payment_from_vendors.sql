-- Remove rating and last_payment columns from vendors table
-- These fields are no longer needed in the vendor schema

ALTER TABLE public.vendors
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS last_payment;

-- Add comment
COMMENT ON TABLE public.vendors IS 'Vendors table without rating and last_payment fields.';
