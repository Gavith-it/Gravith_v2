alter table if exists work_progress_materials
  add column if not exists purchase_id uuid;

comment on column work_progress_materials.purchase_id is 'References the material purchase where the stock originated';

