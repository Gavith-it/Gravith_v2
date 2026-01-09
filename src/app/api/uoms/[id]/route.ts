import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToUOM, resolveContext } from '../_utils';
import type { UOMRow } from '../_utils';

import type { UOMItem } from '@/components/shared/masterData';
import { createClient } from '@/lib/supabase/server';

const UOM_SELECT = `
  id,
  code,
  name,
  description,
  is_active,
  created_at,
  updated_at,
  org_id,
  created_by,
  updated_by
`;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('uoms')
      .select(UOM_SELECT)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching UOM:', error);
      return NextResponse.json({ error: 'Failed to load UOM.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'UOM not found.' }, { status: 404 });
    }

    return NextResponse.json({ uom: mapRowToUOM(data as UOMRow) });
  } catch (error) {
    console.error('Unexpected error fetching UOM:', error);
    return NextResponse.json({ error: 'Unexpected error fetching UOM.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as Partial<UOMItem>;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.code !== undefined) updates['code'] = body.code;
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.description !== undefined) updates['description'] = body.description ?? null;
    if (body.isActive !== undefined) updates['is_active'] = body.isActive;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('uoms')
      .update(updates)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .select(UOM_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating UOM:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A UOM with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: `Failed to update UOM: ${errorMessage}` }, { status: 500 });
    }

    const uom = mapRowToUOM(data as UOMRow);
    return NextResponse.json({ uom });
  } catch (error) {
    console.error('Unexpected error updating UOM:', error);
    return NextResponse.json({ error: 'Unexpected error updating UOM.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const { error } = await supabase
      .from('uoms')
      .delete()
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`);

    if (error) {
      console.error('Error deleting UOM:', error);
      return NextResponse.json({ error: 'Failed to delete UOM.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting UOM:', error);
    return NextResponse.json({ error: 'Unexpected error deleting UOM.' }, { status: 500 });
  }
}
