-- Work Progress schema + RLS

CREATE TABLE work_progress_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  site_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  description TEXT,
  work_date DATE NOT NULL,
  unit TEXT NOT NULL,
  length NUMERIC(12, 2),
  breadth NUMERIC(12, 2),
  thickness NUMERIC(12, 2),
  total_quantity NUMERIC(14, 2) NOT NULL CHECK (total_quantity >= 0),
  labor_hours NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (labor_hours >= 0),
  progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'on_hold')),
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE work_progress_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_progress_id UUID NOT NULL REFERENCES work_progress_entries(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  material_id UUID REFERENCES material_masters(id) ON DELETE SET NULL,
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL CHECK (quantity >= 0),
  balance_quantity NUMERIC(14, 2),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_progress_entries_org ON work_progress_entries(organization_id);
CREATE INDEX idx_work_progress_entries_site ON work_progress_entries(site_id);
CREATE INDEX idx_work_progress_entries_status ON work_progress_entries(status);
CREATE INDEX idx_work_progress_materials_entry ON work_progress_materials(work_progress_id);
CREATE INDEX idx_work_progress_materials_org ON work_progress_materials(organization_id);

-- Trigger for updated_at
CREATE TRIGGER update_work_progress_entries_updated_at
  BEFORE UPDATE ON work_progress_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_progress_materials_updated_at
  BEFORE UPDATE ON work_progress_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE work_progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_progress_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies (members including standard users)
CREATE POLICY "work_progress_entries_select_members"
  ON work_progress_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_entries.organization_id
        AND up.is_active = true
    )
  );

CREATE POLICY "work_progress_entries_insert_members"
  ON work_progress_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_entries.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

CREATE POLICY "work_progress_entries_update_members"
  ON work_progress_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_entries.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_entries.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

CREATE POLICY "work_progress_entries_delete_members"
  ON work_progress_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_entries.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

CREATE POLICY "work_progress_materials_select_members"
  ON work_progress_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_materials.organization_id
        AND up.is_active = true
    )
  );

CREATE POLICY "work_progress_materials_insert_members"
  ON work_progress_materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_materials.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

CREATE POLICY "work_progress_materials_update_members"
  ON work_progress_materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_materials.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_materials.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

CREATE POLICY "work_progress_materials_delete_members"
  ON work_progress_materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.organization_id = work_progress_materials.organization_id
        AND up.is_active = true
        AND up.organization_role IN (
          'owner',
          'admin',
          'manager',
          'project-manager',
          'site-supervisor',
          'materials-manager',
          'finance-manager',
          'executive',
          'user'
        )
    )
  );

-- Grant table privileges to authenticated role (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON work_progress_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_progress_materials TO authenticated;

