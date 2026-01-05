-- Add tracked quantity to material master records
alter table if exists material_masters
  add column if not exists quantity numeric default 0 not null,
  add column if not exists consumed_quantity numeric default 0 not null;

comment on column material_masters.quantity is 'Total tracked quantity available for this material';
comment on column material_masters.consumed_quantity is 'Total quantity consumed across work progress entries';

update material_masters
set quantity = 0
where quantity is null;

update material_masters
set consumed_quantity = 0
where consumed_quantity is null;

