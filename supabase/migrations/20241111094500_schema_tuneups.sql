-- Migration: normalize enums, enforce non-negative amounts, add unique constraints

-- ============================================
-- ENUM CLEANUP
-- ============================================

-- vehicle_status normalization
ALTER TYPE vehicle_status RENAME TO vehicle_status_old;

CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'idle', 'returned');

ALTER TABLE vehicles
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE vehicles
  ALTER COLUMN status TYPE vehicle_status USING
    CASE status::text
      WHEN 'Active' THEN 'available'
      WHEN 'Maintenance' THEN 'maintenance'
      WHEN 'Idle' THEN 'idle'
      WHEN 'Returned' THEN 'returned'
      WHEN 'in-use' THEN 'in_use'
      ELSE status::text
    END::vehicle_status;

ALTER TABLE vehicles
  ALTER COLUMN status SET DEFAULT 'available';

DROP TYPE vehicle_status_old;

-- vehicle_work_category normalization
ALTER TYPE vehicle_work_category RENAME TO vehicle_work_category_old;

CREATE TYPE vehicle_work_category AS ENUM (
  'construction',
  'transport',
  'delivery',
  'maintenance',
  'inspection',
  'other'
);

ALTER TABLE vehicle_usage
  ALTER COLUMN work_category TYPE vehicle_work_category USING
    CASE work_category::text
      WHEN 'Construction' THEN 'construction'
      WHEN 'Transport' THEN 'transport'
      WHEN 'Transportation' THEN 'transport'
      WHEN 'Material Hauling' THEN 'transport'
      WHEN 'Delivery' THEN 'delivery'
      WHEN 'Maintenance' THEN 'maintenance'
      WHEN 'Site Inspection' THEN 'inspection'
      WHEN 'Equipment Transport' THEN 'transport'
      ELSE 'other'
    END::vehicle_work_category;

DROP TYPE vehicle_work_category_old;

-- vehicle_type_enum normalization (dedupe, lowercase)
ALTER TYPE vehicle_type_enum RENAME TO vehicle_type_enum_old;

CREATE TYPE vehicle_type_enum AS ENUM (
  'excavator',
  'crane',
  'truck',
  'mixer',
  'jcb',
  'loader',
  'compactor',
  'generator',
  'other'
);

ALTER TABLE site_vehicles
  ALTER COLUMN vehicle_type TYPE vehicle_type_enum USING
    CASE vehicle_type::text
      WHEN 'Excavator' THEN 'excavator'
      WHEN 'Crane' THEN 'crane'
      WHEN 'Truck' THEN 'truck'
      WHEN 'Mixer' THEN 'mixer'
      WHEN 'JCB' THEN 'jcb'
      WHEN 'Loader' THEN 'loader'
      WHEN 'Compactor' THEN 'compactor'
      WHEN 'Generator' THEN 'generator'
      ELSE 'other'
    END::vehicle_type_enum;

DROP TYPE vehicle_type_enum_old;

-- vendor_status normalization (lowercase)
ALTER TYPE vendor_status RENAME TO vendor_status_old;

CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'blocked');

ALTER TABLE vendors
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE vendors
  ALTER COLUMN status TYPE vendor_status USING LOWER(status::text)::vendor_status;

ALTER TABLE vendors
  ALTER COLUMN status SET DEFAULT 'active';
DROP TYPE vendor_status_old;

-- ============================================
-- INTEGRITY CHECKS
-- ============================================

DO $material_purchases$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_quantity_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_quantity_non_negative CHECK (quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_unit_rate_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_unit_rate_non_negative CHECK (unit_rate >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_total_amount_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_total_amount_non_negative CHECK (total_amount >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_filled_weight_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_filled_weight_non_negative CHECK (filled_weight IS NULL OR filled_weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_empty_weight_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_empty_weight_non_negative CHECK (empty_weight IS NULL OR empty_weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_net_weight_non_negative'
  ) THEN
    ALTER TABLE material_purchases
      ADD CONSTRAINT material_purchases_net_weight_non_negative CHECK (net_weight IS NULL OR net_weight >= 0);
  END IF;
END
$material_purchases$;

ALTER TABLE IF EXISTS material_receipts
  ADD CONSTRAINT material_receipts_filled_weight_non_negative CHECK (filled_weight >= 0),
  ADD CONSTRAINT material_receipts_empty_weight_non_negative CHECK (empty_weight >= 0),
  ADD CONSTRAINT material_receipts_net_weight_non_negative CHECK (net_weight >= 0);

ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_rental_cost_per_day_non_negative CHECK (rental_cost_per_day IS NULL OR rental_cost_per_day >= 0),
  ADD CONSTRAINT vehicles_total_rental_cost_non_negative CHECK (total_rental_cost IS NULL OR total_rental_cost >= 0),
  ADD CONSTRAINT vehicles_fuel_capacity_non_negative CHECK (fuel_capacity IS NULL OR fuel_capacity >= 0),
  ADD CONSTRAINT vehicles_current_fuel_level_non_negative CHECK (current_fuel_level IS NULL OR current_fuel_level >= 0),
  ADD CONSTRAINT vehicles_mileage_non_negative CHECK (mileage IS NULL OR mileage >= 0);

ALTER TABLE vehicle_usage
  ADD CONSTRAINT vehicle_usage_total_distance_non_negative CHECK (total_distance >= 0),
  ADD CONSTRAINT vehicle_usage_distance_non_negative CHECK (distance IS NULL OR distance >= 0),
  ADD CONSTRAINT vehicle_usage_fuel_consumed_non_negative CHECK (fuel_consumed >= 0);

ALTER TABLE vehicle_refueling
  ADD CONSTRAINT vehicle_refueling_quantity_non_negative CHECK (quantity >= 0),
  ADD CONSTRAINT vehicle_refueling_cost_non_negative CHECK (cost >= 0),
  ADD CONSTRAINT vehicle_refueling_odometer_non_negative CHECK (odometer_reading >= 0);

ALTER TABLE expenses
  ADD CONSTRAINT expenses_amount_non_negative CHECK (amount >= 0);

ALTER TABLE payments
  ADD CONSTRAINT payments_amount_non_negative CHECK (amount >= 0);

ALTER TABLE site_labour
  ADD CONSTRAINT site_labour_daily_wage_non_negative CHECK (daily_wage >= 0),
  ADD CONSTRAINT site_labour_hourly_rate_non_negative CHECK (hourly_rate >= 0),
  ADD CONSTRAINT site_labour_days_worked_non_negative CHECK (days_worked >= 0),
  ADD CONSTRAINT site_labour_hours_worked_non_negative CHECK (hours_worked >= 0);

ALTER TABLE site_vehicles
  ADD CONSTRAINT site_vehicles_rental_cost_non_negative CHECK (rental_cost_per_day >= 0),
  ADD CONSTRAINT site_vehicles_fuel_cost_non_negative CHECK (fuel_cost_per_day >= 0),
  ADD CONSTRAINT site_vehicles_total_cost_non_negative CHECK (total_cost >= 0),
  ADD CONSTRAINT site_vehicles_fuel_consumed_non_negative CHECK (fuel_consumed >= 0);

ALTER TABLE site_expenses
  ADD CONSTRAINT site_expenses_amount_non_negative CHECK (amount >= 0);

-- Ensure created_by/updated_by nullable to avoid insert failures
ALTER TABLE material_purchases
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE IF EXISTS material_receipts
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE vendors
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE vehicles
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE vehicle_usage
  ALTER COLUMN recorded_by DROP NOT NULL;

ALTER TABLE vehicle_refueling
  ALTER COLUMN recorded_by DROP NOT NULL;

ALTER TABLE expenses
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE payments
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE project_activities
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE project_milestones
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE site_labour
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE site_vehicles
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

ALTER TABLE site_documents
  ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE site_expenses
  ALTER COLUMN created_by DROP NOT NULL,
  ALTER COLUMN updated_by DROP NOT NULL;

-- ============================================
-- UNIQUE CONSTRAINTS / INDEXES
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_masters_org_name
  ON material_masters (organization_id, LOWER(name));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vendors_org_email
  ON vendors (organization_id, LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vendors_org_phone
  ON vendors (organization_id, phone);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vehicles_org_number
  ON vehicles (organization_id, LOWER(vehicle_number));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_sites_org_name
  ON sites (organization_id, LOWER(name));

