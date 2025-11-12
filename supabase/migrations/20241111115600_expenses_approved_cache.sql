-- Ensure Supabase cache sees approved_by_name column

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS approved_by_name text;

COMMENT ON COLUMN public.expenses.approved_by_name IS 'Free-text name of the person who approved the expense.';

