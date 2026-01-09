-- ============================================================================
-- Seed Master Data
-- ============================================================================
-- This migration inserts the initial/default master data into the tables.
-- Note: This inserts data with org_id = NULL for global/shared master data.
-- For organization-specific data, set org_id to the appropriate organization UUID.
-- ============================================================================

-- ============================================================================
-- Insert UOMs (Units of Measurement)
-- ============================================================================
INSERT INTO public.uoms (id, code, name, description, is_active, created_at, updated_at, org_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'KG', 'Kilogram', 'Unit of mass measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000002', 'MT', 'Metric Ton', 'Unit of mass measurement (1000 kg)', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000003', 'MTR', 'Meter', 'Unit of length measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000004', 'CFT', 'Cubic Feet', 'Unit of volume measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000005', 'CUM', 'Cubic Meter', 'Unit of volume measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000006', 'LTR', 'Liter', 'Unit of liquid volume measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000007', 'BAG', 'Bag', 'Unit for packaged materials', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000008', 'PCS', 'Pieces', 'Unit for countable items', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000009', 'SQM', 'Square Meter', 'Unit of area measurement', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('00000000-0000-0000-0000-000000000010', 'SQFT', 'Square Feet', 'Unit of area measurement', false, '2024-01-01T00:00:00Z', '2024-02-15T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Insert Material Categories
-- ============================================================================
INSERT INTO public.material_categories (id, code, name, description, is_active, created_at, updated_at, org_id)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'CEMENT', 'Cement', 'Portland cement and cement products', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000002', 'STEEL', 'Steel', 'Steel bars, rods, and structural steel', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000003', 'CONCRETE', 'Concrete', 'Ready-mix concrete and concrete products', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000004', 'BRICKS', 'Bricks', 'Clay bricks, fly ash bricks, and blocks', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000005', 'SAND', 'Sand', 'Fine and coarse sand for construction', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000006', 'AGGREGATE', 'Aggregate', 'Stone aggregates of various sizes', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000007', 'TIMBER', 'Timber', 'Wood and timber products', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000008', 'ELECTRICAL', 'Electrical', 'Electrical wires, cables, and fittings', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000009', 'PLUMBING', 'Plumbing', 'Pipes, fittings, and plumbing fixtures', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('10000000-0000-0000-0000-000000000010', 'PAINT', 'Paint', 'Paints, primers, and coating materials', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Insert Expense Categories
-- ============================================================================
INSERT INTO public.expense_categories (id, code, name, description, is_active, created_at, updated_at, org_id)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'LABOUR', 'Labour', 'Labour and workforce expenses', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('20000000-0000-0000-0000-000000000002', 'MATERIALS', 'Materials', 'Construction materials and supplies', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('20000000-0000-0000-0000-000000000003', 'EQUIPMENT', 'Equipment', 'Equipment rental and maintenance', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('20000000-0000-0000-0000-000000000004', 'TRANSPORT', 'Transport', 'Transportation and logistics expenses', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('20000000-0000-0000-0000-000000000005', 'UTILITIES', 'Utilities', 'Utilities and service expenses', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('20000000-0000-0000-0000-000000000006', 'OTHER', 'Other', 'Other miscellaneous expenses', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Insert Tax Rates
-- ============================================================================
INSERT INTO public.tax_rates (id, code, name, rate, description, is_active, created_at, updated_at, org_id)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'GST18', 'GST 18%', 18.00, 'Goods and Services Tax at 18% for construction materials', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000002', 'GST12', 'GST 12%', 12.00, 'Goods and Services Tax at 12% for selected materials', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000003', 'GST5', 'GST 5%', 5.00, 'Goods and Services Tax at 5% for basic materials', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000004', 'GST28', 'GST 28%', 28.00, 'Goods and Services Tax at 28% for luxury items', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000005', 'GST0', 'GST Exempt', 0.00, 'Tax-exempt items', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000006', 'CGST9', 'CGST 9%', 9.00, 'Central GST at 9%', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000007', 'SGST9', 'SGST 9%', 9.00, 'State GST at 9%', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000008', 'IGST18', 'IGST 18%', 18.00, 'Integrated GST at 18% for interstate transactions', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000009', 'TDS2', 'TDS 2%', 2.00, 'Tax Deducted at Source at 2%', true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z', NULL),
  ('30000000-0000-0000-0000-000000000010', 'VAT14', 'VAT 14%', 14.00, 'Value Added Tax at 14% (legacy)', false, '2024-01-01T00:00:00Z', '2024-02-15T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

