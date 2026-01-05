alter table if exists material_masters
  add column if not exists consumed_quantity numeric default 0 not null;

comment on column material_masters.consumed_quantity is 'Total quantity consumed across work progress entries';

update material_masters
set consumed_quantity = 0
where consumed_quantity is null;

