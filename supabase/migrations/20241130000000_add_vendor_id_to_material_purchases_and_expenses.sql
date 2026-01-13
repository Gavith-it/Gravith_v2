-- Add vendor_id columns to material_purchases and expenses tables
-- This allows purchases and expenses to be linked to vendors for financial calculations

-- Add vendor_id column to material_purchases table (nullable for backward compatibility)
ALTER TABLE public.material_purchases
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_material_purchases_vendor_id ON public.material_purchases(vendor_id);

-- Add comment
COMMENT ON COLUMN public.material_purchases.vendor_id IS 'Foreign key reference to vendors table. Links purchase to a vendor.';

-- Add vendor_id column to expenses table (nullable for backward compatibility)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_expenses_vendor_id ON public.expenses(vendor_id);

-- Add comment
COMMENT ON COLUMN public.expenses.vendor_id IS 'Foreign key reference to vendors table. Links expense to a vendor.';
