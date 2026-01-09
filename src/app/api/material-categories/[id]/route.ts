import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToMaterialCategory, resolveContext } from '../_utils';
import type { MaterialCategoryRow } from '../_utils';

import type { MaterialCategoryItem } from '@/components/shared/masterData';
import { createClient } from '@/lib/supabase/server';

const MATERIAL_CATEGORY_SELECT = `
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
      .from('material_categories')
      .select(MATERIAL_CATEGORY_SELECT)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching material category:', error);
      return NextResponse.json({ error: 'Failed to load material category.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Material category not found.' }, { status: 404 });
    }

    return NextResponse.json({ category: mapRowToMaterialCategory(data as MaterialCategoryRow) });
  } catch (error) {
    console.error('Unexpected error fetching material category:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching material category.' },
      { status: 500 },
    );
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

    const body = (await request.json()) as Partial<MaterialCategoryItem>;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.code !== undefined) updates['code'] = body.code;
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.description !== undefined) updates['description'] = body.description ?? null;
    if (body.isActive !== undefined) updates['is_active'] = body.isActive;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('material_categories')
      .update(updates)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .select(MATERIAL_CATEGORY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating material category:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A category with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to update material category: ${errorMessage}` },
        { status: 500 },
      );
    }

    const category = mapRowToMaterialCategory(data as MaterialCategoryRow);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Unexpected error updating material category:', error);
    return NextResponse.json(
      { error: 'Unexpected error updating material category.' },
      { status: 500 },
    );
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
      .from('material_categories')
      .delete()
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`);

    if (error) {
      console.error('Error deleting material category:', error);
      return NextResponse.json({ error: 'Failed to delete material category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting material category:', error);
    return NextResponse.json(
      { error: 'Unexpected error deleting material category.' },
      { status: 500 },
    );
  }
}
