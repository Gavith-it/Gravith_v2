-- Allow storing approver names by converting approved_by to text

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS approved_by_name text;

COMMENT ON COLUMN public.expenses.approved_by_name IS 'Free-text name of the person who approved the expense.';



