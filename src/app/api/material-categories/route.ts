import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToMaterialCategory, resolveContext } from './_utils';
import type { MaterialCategoryRow } from './_utils';

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    // Fetch all categories for the organization (or global if org_id is null)
    const { data, error } = await supabase
      .from('material_categories')
      .select(MATERIAL_CATEGORY_SELECT)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching material categories:', error);
      return NextResponse.json({ error: 'Failed to load material categories.' }, { status: 500 });
    }

    const categories = (data ?? []).map((row) =>
      mapRowToMaterialCategory(row as MaterialCategoryRow),
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Unexpected error fetching material categories:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching material categories.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as Omit<
      MaterialCategoryItem,
      'id' | 'createdAt' | 'updatedAt'
    >;

    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Code and name are required.' }, { status: 400 });
    }

    const payload = {
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      is_active: body.isActive ?? true,
      org_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_categories')
      .insert(payload)
      .select(MATERIAL_CATEGORY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating material category:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A category with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to create material category: ${errorMessage}` },
        { status: 500 },
      );
    }

    const category = mapRowToMaterialCategory(data as MaterialCategoryRow);
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Unexpected error creating material category:', error);
    return NextResponse.json(
      { error: 'Unexpected error creating material category.' },
      { status: 500 },
    );
  }
}
