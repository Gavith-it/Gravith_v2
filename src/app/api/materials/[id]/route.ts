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
  site_id: string | null;
  site_name: string | null;
  quantity: number | string | null;
  consumed_quantity: number | string | null;
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
    siteId: row.site_id ?? null,
    siteName: row.site_name ?? null,
    quantity: Number(row.quantity ?? 0),
    consumedQuantity: Number(row.consumed_quantity ?? 0),
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

type SiteResolution =
  | { ok: true; siteId: string | null; siteName: string | null }
  | { ok: false; status: number; message: string };

type SiteRow = {
  id: string;
  name: string;
  organization_id: string;
};

async function resolveSiteSelection(
  supabase: SupabaseServerClient,
  siteId: string | null | undefined,
  organizationId: string,
): Promise<SiteResolution> {
  if (!siteId) {
    return { ok: true, siteId: null, siteName: null };
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('id', siteId)
    .maybeSingle();

  const site = (data as SiteRow | null) ?? null;

  if (error) {
    console.error('Error validating site for material master', error);
    return { ok: false, status: 500, message: 'Unable to validate site selection.' };
  }

  if (!site || site.organization_id !== organizationId) {
    return { ok: false, status: 400, message: 'Invalid site selection.' };
  }

  return { ok: true, siteId: site.id, siteName: site.name };
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
    if (typeof body.quantity === 'number') updatePayload['quantity'] = body.quantity;
    if (typeof body.consumedQuantity === 'number') {
      const normalizedConsumed = Math.max(0, body.consumedQuantity);
      updatePayload['consumed_quantity'] = normalizedConsumed;
    }
    if (typeof body.quantity === 'number') updatePayload['quantity'] = body.quantity;
    if (typeof body.standardRate === 'number') updatePayload['standard_rate'] = body.standardRate;
    if (typeof body.isActive === 'boolean') updatePayload['is_active'] = body.isActive;
    if (typeof body.hsn === 'string') updatePayload['hsn'] = body.hsn;
    if (typeof body.taxRate === 'number') updatePayload['tax_rate'] = body.taxRate;

    if ('siteId' in body) {
      const siteResolution = await resolveSiteSelection(supabase, body.siteId ?? null, ctx.organizationId);
      if (!siteResolution.ok) {
        return NextResponse.json({ error: siteResolution.message }, { status: siteResolution.status });
      }
      updatePayload['site_id'] = siteResolution.siteId;
      updatePayload['site_name'] = siteResolution.siteName;
    }

    const { data: updated, error: updateError } = await supabase
      .from('material_masters')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, name, category, unit, site_id, site_name, quantity, consumed_quantity, standard_rate, is_active, hsn, tax_rate, organization_id, created_at, updated_at',
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

export async function DELETE(_: NextRequest, { params }: RouteContext) {
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
      console.error('Error loading material before delete', fetchError);
      return NextResponse.json({ error: 'Unable to delete material.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
    }

    const { count: purchaseCount, error: purchaseCheckError } = await supabase
      .from('material_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    if (purchaseCheckError) {
      console.error('Error checking purchase dependencies before delete', purchaseCheckError);
      return NextResponse.json(
        { error: 'Unable to verify material dependencies.' },
        { status: 500 },
      );
    }

    if ((purchaseCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'This material has purchase records linked to it. Remove or relink those purchases before deleting the material master.',
        },
        { status: 400 },
      );
    }

    const { count: receiptCount, error: receiptCheckError } = await supabase
      .from('material_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    if (receiptCheckError) {
      console.error('Error checking receipt dependencies before delete', receiptCheckError);
      return NextResponse.json(
        { error: 'Unable to verify material dependencies.' },
        { status: 500 },
      );
    }

    if ((receiptCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'This material has receipts linked to it. Remove or update those receipts before deleting the material master.',
        },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase.from('material_masters').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting material', deleteError);
      return NextResponse.json({ error: 'Failed to delete material.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting material', error);
    return NextResponse.json({ error: 'Unexpected error deleting material.' }, { status: 500 });
  }
}
