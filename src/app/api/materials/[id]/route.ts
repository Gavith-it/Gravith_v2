import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager', 'project-manager', 'materials-manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('material_masters')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching material before update', fetchError);
      return NextResponse.json({ error: 'Unable to update material.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<MaterialMasterInput> & {
      standardRate?: number;
    };

    const updatePayload: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.name) updatePayload['name'] = body.name;
    if (body.category) updatePayload['category'] = body.category;
    if (body.unit) updatePayload['unit'] = body.unit;
    if (typeof body.standardRate === 'number') updatePayload['standard_rate'] = body.standardRate;
    if (typeof body.isActive === 'boolean') updatePayload['is_active'] = body.isActive;
    if (typeof body.hsn === 'string') updatePayload['hsn'] = body.hsn;
    if (typeof body.taxRate === 'number') updatePayload['tax_rate'] = body.taxRate;

    const { data: updated, error: updateError } = await supabase
      .from('material_masters')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, name, category, unit, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
      )
      .single();

    if (updateError || !updated) {
      console.error('Error updating material', updateError);
      return NextResponse.json({ error: 'Failed to update material.' }, { status: 500 });
    }

    return NextResponse.json({ material: mapRowToMaterial(updated as MaterialRow) });
  } catch (error) {
    console.error('Unexpected error updating material', error);
    return NextResponse.json({ error: 'Unexpected error updating material.' }, { status: 500 });
  }
}
