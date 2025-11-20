-- Performance Optimization: Add critical database indexes
-- This migration adds indexes to improve query performance for high-traffic scenarios
-- Created: 2024-11-20

-- Index for materials by organization (most common query)
CREATE INDEX IF NOT EXISTS idx_materials_org_id 
ON public.material_masters(organization_id);

-- Index for active materials filter (commonly used filter)
CREATE INDEX IF NOT EXISTS idx_materials_active 
ON public.material_masters(is_active) 
WHERE is_active = true;

-- Composite index for common filters (organization + active status)
CREATE INDEX IF NOT EXISTS idx_materials_org_active 
ON public.material_masters(organization_id, is_active);

-- Index for material receipts by date (for reports and filtering)
CREATE INDEX IF NOT EXISTS idx_receipts_date 
ON public.material_receipts(date DESC);

-- Index for material receipts by material_id (for OB lookups)
CREATE INDEX IF NOT EXISTS idx_receipts_material 
ON public.material_receipts(material_id);

-- Index for material receipts by organization (for filtering)
CREATE INDEX IF NOT EXISTS idx_receipts_org 
ON public.material_receipts(organization_id);

-- Index for site allocations (for OB calculations)
CREATE INDEX IF NOT EXISTS idx_site_allocations_material 
ON public.material_site_allocations(material_id, site_id);

-- Index for site allocations by organization
CREATE INDEX IF NOT EXISTS idx_site_allocations_org 
ON public.material_site_allocations(organization_id);

-- Index for vehicles by organization
CREATE INDEX IF NOT EXISTS idx_vehicles_org 
ON public.vehicles(organization_id);

-- Index for vehicles by status (common filter)
CREATE INDEX IF NOT EXISTS idx_vehicles_status 
ON public.vehicles(status);

-- Index for sites by organization
CREATE INDEX IF NOT EXISTS idx_sites_org 
ON public.sites(organization_id);

-- Index for sites by status (if status column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sites' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_sites_status 
    ON public.sites(status);
  END IF;
END
$$;

-- Index for work progress entries by site and date (for reports)
-- Note: Table is named work_progress_entries, column is work_date (not date)
CREATE INDEX IF NOT EXISTS idx_work_progress_entries_site_date 
ON public.work_progress_entries(site_id, work_date DESC);

-- Index for work progress entries by organization
CREATE INDEX IF NOT EXISTS idx_work_progress_entries_org 
ON public.work_progress_entries(organization_id);

-- Index for material purchases by organization
CREATE INDEX IF NOT EXISTS idx_purchases_org 
ON public.material_purchases(organization_id);

-- Index for material purchases by material_id
CREATE INDEX IF NOT EXISTS idx_purchases_material 
ON public.material_purchases(material_id);

-- Index for vendors by organization
CREATE INDEX IF NOT EXISTS idx_vendors_org 
ON public.vendors(organization_id);

-- Index for vendors by status (common filter)
CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON public.vendors(status) 
WHERE status = 'active';

-- Index for expenses by organization
CREATE INDEX IF NOT EXISTS idx_expenses_org 
ON public.expenses(organization_id);

-- Index for expenses by date (for reports)
CREATE INDEX IF NOT EXISTS idx_expenses_date 
ON public.expenses(date DESC);

-- Index for payments by organization
CREATE INDEX IF NOT EXISTS idx_payments_org 
ON public.payments(organization_id);

-- Index for payments by due_date (for reports and filtering)
CREATE INDEX IF NOT EXISTS idx_payments_due_date 
ON public.payments(due_date DESC);

-- Index for payments by paid_date (for reports)
CREATE INDEX IF NOT EXISTS idx_payments_paid_date 
ON public.payments(paid_date DESC);

-- Index for project activities by organization
-- Note: Table is named project_activities, not scheduling_activities
CREATE INDEX IF NOT EXISTS idx_activities_org 
ON public.project_activities(organization_id);

-- Index for project activities by site
CREATE INDEX IF NOT EXISTS idx_activities_site 
ON public.project_activities(site_id);

-- Index for project milestones by organization
-- Note: Table is named project_milestones, not scheduling_milestones
CREATE INDEX IF NOT EXISTS idx_milestones_org 
ON public.project_milestones(organization_id);

-- Index for project milestones by site
CREATE INDEX IF NOT EXISTS idx_milestones_site 
ON public.project_milestones(site_id);

-- Index for vehicle refueling by organization
CREATE INDEX IF NOT EXISTS idx_refueling_org 
ON public.vehicle_refueling(organization_id);

-- Index for vehicle refueling by vehicle_id
CREATE INDEX IF NOT EXISTS idx_refueling_vehicle 
ON public.vehicle_refueling(vehicle_id);

-- Index for vehicle usage by organization
CREATE INDEX IF NOT EXISTS idx_usage_org 
ON public.vehicle_usage(organization_id);

-- Index for vehicle usage by vehicle_id
CREATE INDEX IF NOT EXISTS idx_usage_vehicle 
ON public.vehicle_usage(vehicle_id);

