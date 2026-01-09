import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToTaxRate, resolveContext } from '../_utils';
import type { TaxRateRow } from '../_utils';

import type { TaxRateItem } from '@/components/shared/masterData';
import { createClient } from '@/lib/supabase/server';

const TAX_RATE_SELECT = `
  id,
  code,
  name,
  rate,
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
      .from('tax_rates')
      .select(TAX_RATE_SELECT)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tax rate:', error);
      return NextResponse.json({ error: 'Failed to load tax rate.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Tax rate not found.' }, { status: 404 });
    }

    return NextResponse.json({ taxRate: mapRowToTaxRate(data as TaxRateRow) });
  } catch (error) {
    console.error('Unexpected error fetching tax rate:', error);
    return NextResponse.json({ error: 'Unexpected error fetching tax rate.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<TaxRateItem>;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.code !== undefined) updates['code'] = body.code;
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.rate !== undefined) {
      if (body.rate < 0 || body.rate > 100) {
        return NextResponse.json({ error: 'Rate must be between 0 and 100.' }, { status: 400 });
      }
      updates['rate'] = body.rate;
    }
    if (body.description !== undefined) updates['description'] = body.description ?? null;
    if (body.isActive !== undefined) updates['is_active'] = body.isActive;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tax_rates')
      .update(updates)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .select(TAX_RATE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating tax rate:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A tax rate with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to update tax rate: ${errorMessage}` },
        { status: 500 },
      );
    }

    const taxRate = mapRowToTaxRate(data as TaxRateRow);
    return NextResponse.json({ taxRate });
  } catch (error) {
    console.error('Unexpected error updating tax rate:', error);
    return NextResponse.json({ error: 'Unexpected error updating tax rate.' }, { status: 500 });
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
      .from('tax_rates')
      .delete()
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`);

    if (error) {
      console.error('Error deleting tax rate:', error);
      return NextResponse.json({ error: 'Failed to delete tax rate.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting tax rate:', error);
    return NextResponse.json({ error: 'Unexpected error deleting tax rate.' }, { status: 500 });
  }
}
