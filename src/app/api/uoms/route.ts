import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToUOM, resolveContext } from './_utils';
import type { UOMRow } from './_utils';

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    // Fetch all UOMs for the organization (or global if org_id is null)
    // Use is() for null check and eq() for organization match
    const { data, error } = await supabase
      .from('uoms')
      .select(UOM_SELECT)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching UOMs:', error);
      return NextResponse.json({ error: 'Failed to load UOMs.' }, { status: 500 });
    }

    const uoms = (data ?? []).map((row) => mapRowToUOM(row as UOMRow));

    return NextResponse.json({ uoms });
  } catch (error) {
    console.error('Unexpected error fetching UOMs:', error);
    return NextResponse.json({ error: 'Unexpected error fetching UOMs.' }, { status: 500 });
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

    const body = (await request.json()) as Omit<UOMItem, 'id' | 'createdAt' | 'updatedAt'>;

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

    const { data, error } = await supabase.from('uoms').insert(payload).select(UOM_SELECT).single();

    if (error || !data) {
      console.error('Error creating UOM:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A UOM with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: `Failed to create UOM: ${errorMessage}` }, { status: 500 });
    }

    const uom = mapRowToUOM(data as UOMRow);
    return NextResponse.json({ uom });
  } catch (error) {
    console.error('Unexpected error creating UOM:', error);
    return NextResponse.json({ error: 'Unexpected error creating UOM.' }, { status: 500 });
  }
}
