import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type MaterialRow = {
  id: string;
  name: string;
  category: MaterialMaster['category'];
  unit: string;
  standard_rate: number | string | null;
  is_active: boolean | null;
  hsn: string | null;
  tax_rate: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

function mapRowToMaterial(row: MaterialRow): MaterialMaster & {
  createdDate: string;
  lastUpdated: string;
} {
  const createdAt = row.created_at ?? new Date().toISOString();
  const updatedAt = row.updated_at ?? createdAt;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    standardRate: Number(row.standard_rate ?? 0),
    isActive: Boolean(row.is_active ?? true),
    hsn: row.hsn ?? '',
    taxRate: Number(row.tax_rate ?? 0),
    organizationId: row.organization_id,
    createdAt,
    updatedAt,
    createdDate: createdAt.split('T')[0] ?? createdAt,
    lastUpdated: updatedAt.split('T')[0] ?? updatedAt,
  };
}

async function resolveContext(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, organization_role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return {
    organizationId: profile.organization_id,
    role: profile.organization_role,
    userId: user.id,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const { data, error } = await supabase
      .from('material_masters')
      .select(
        'id, name, category, unit, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching materials', error);
      return NextResponse.json({ error: 'Failed to load materials.' }, { status: 500 });
    }

    const materials = (data ?? []).map((row) => mapRowToMaterial(row as MaterialRow));
    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Unexpected error fetching materials', error);
    return NextResponse.json({ error: 'Unexpected error loading materials.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager', 'project-manager', 'materials-manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as Partial<MaterialMasterInput>;
    const { name, category, unit, standardRate, isActive, hsn, taxRate } = body;

    if (!name || !category || !unit || typeof standardRate !== 'number') {
      return NextResponse.json({ error: 'Missing required material fields.' }, { status: 400 });
    }

    const payload = {
      name,
      category,
      unit,
      standard_rate: standardRate,
      is_active: isActive ?? true,
      hsn: hsn ?? '',
      tax_rate: taxRate ?? 0,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_masters')
      .insert(payload)
      .select(
        'id, name, category, unit, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      console.error('Error creating material', error);
      return NextResponse.json({ error: 'Failed to create material.' }, { status: 500 });
    }

    return NextResponse.json({ material: mapRowToMaterial(data as MaterialRow) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating material', error);
    return NextResponse.json({ error: 'Unexpected error creating material.' }, { status: 500 });
  }
}
