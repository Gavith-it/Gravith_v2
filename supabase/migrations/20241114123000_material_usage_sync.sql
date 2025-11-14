begin;

create or replace function refresh_material_purchase_usage(target_purchase_id uuid) returns void as $$
declare
  total_consumed numeric := 0;
  purchase_quantity numeric := 0;
begin
  if target_purchase_id is null then
    return;
  end if;

  select coalesce(sum(quantity), 0)
    into total_consumed
    from work_progress_materials
   where purchase_id = target_purchase_id;

  select coalesce(quantity, 0)
    into purchase_quantity
    from material_purchases
   where id = target_purchase_id;

  update material_purchases
     set consumed_quantity = total_consumed,
         remaining_quantity = greatest(purchase_quantity - total_consumed, 0)
   where id = target_purchase_id;
end;
$$ language plpgsql;

create or replace function trg_refresh_purchase_usage() returns trigger as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.purchase_id, old.purchase_id);
  perform refresh_material_purchase_usage(target_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_work_progress_materials_purchase_usage on work_progress_materials;
create trigger trg_work_progress_materials_purchase_usage
after insert or update or delete on work_progress_materials
for each row execute function trg_refresh_purchase_usage();

with usage_totals as (
  select purchase_id, coalesce(sum(quantity), 0) as consumed
    from work_progress_materials
   where purchase_id is not null
   group by purchase_id
)
update material_purchases mp
   set consumed_quantity = usage_totals.consumed,
       remaining_quantity = greatest(coalesce(mp.quantity, 0) - usage_totals.consumed, 0)
  from usage_totals
 where mp.id = usage_totals.purchase_id;

update material_purchases
   set consumed_quantity = coalesce(consumed_quantity, 0),
       remaining_quantity = coalesce(remaining_quantity, quantity)
 where consumed_quantity is null
    or remaining_quantity is null;

create or replace function refresh_material_master_usage(target_material_id uuid, target_org_id uuid) returns void as $$
declare
  aggregate_consumed numeric := 0;
begin
  if target_material_id is null or target_org_id is null then
    return;
  end if;

  select coalesce(sum(consumed_quantity), 0)
    into aggregate_consumed
    from material_purchases
   where material_id = target_material_id
     and organization_id = target_org_id;

  update material_masters
     set consumed_quantity = aggregate_consumed
   where id = target_material_id
     and organization_id = target_org_id;
end;
$$ language plpgsql;

create or replace function trg_refresh_material_master_usage() returns trigger as $$
declare
  material_id uuid;
  org_id uuid;
begin
  material_id := coalesce(new.material_id, old.material_id);
  org_id := coalesce(new.organization_id, old.organization_id);
  perform refresh_material_master_usage(material_id, org_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_material_purchases_master_usage on material_purchases;
create trigger trg_material_purchases_master_usage
after insert or update or delete on material_purchases
for each row execute function trg_refresh_material_master_usage();

with master_usage as (
  select material_id,
         organization_id,
         coalesce(sum(consumed_quantity), 0) as total_consumed
    from material_purchases
   where material_id is not null
   group by material_id, organization_id
)
update material_masters mm
   set consumed_quantity = master_usage.total_consumed
  from master_usage
 where mm.id = master_usage.material_id
   and mm.organization_id = master_usage.organization_id;

update material_masters
   set consumed_quantity = coalesce(consumed_quantity, 0)
 where consumed_quantity is null;

commit;

