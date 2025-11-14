alter table if exists expenses
  add column if not exists material_id uuid references material_masters(id) on delete set null,
  add column if not exists purchase_id uuid references material_purchases(id) on delete set null;

comment on column expenses.material_id is 'Optional reference to the material master this expense is associated with';
comment on column expenses.purchase_id is 'Optional reference to the material purchase that generated this expense';

create index if not exists idx_expenses_material_id on expenses(material_id);
create index if not exists idx_expenses_purchase_id on expenses(purchase_id);

