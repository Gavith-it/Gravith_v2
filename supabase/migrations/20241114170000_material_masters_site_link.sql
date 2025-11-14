-- Link material masters to sites so inventory can be scoped per project/site
ALTER TABLE public.material_masters
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS site_name TEXT;

-- Backfill any existing material records with the latest site names
UPDATE public.material_masters mm
SET site_name = s.name
FROM public.sites s
WHERE mm.site_id = s.id
  AND (mm.site_name IS NULL OR mm.site_name <> s.name);

-- Helpful index for filtering materials by site
CREATE INDEX IF NOT EXISTS idx_material_masters_site ON public.material_masters (site_id);

