import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToTaxRate, resolveContext } from './_utils';
import type { TaxRateRow } from './_utils';

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    // Fetch all tax rates for the organization (or global if org_id is null)
    const { data, error } = await supabase
      .from('tax_rates')
      .select(TAX_RATE_SELECT)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching tax rates:', error);
      return NextResponse.json({ error: 'Failed to load tax rates.' }, { status: 500 });
    }

    const taxRates = (data ?? []).map((row) => mapRowToTaxRate(row as TaxRateRow));

    return NextResponse.json({ taxRates });
  } catch (error) {
    console.error('Unexpected error fetching tax rates:', error);
    return NextResponse.json({ error: 'Unexpected error fetching tax rates.' }, { status: 500 });
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

    const body = (await request.json()) as Omit<TaxRateItem, 'id' | 'createdAt' | 'updatedAt'>;

    if (!body.code || !body.name || body.rate === undefined) {
      return NextResponse.json({ error: 'Code, name, and rate are required.' }, { status: 400 });
    }

    if (body.rate < 0 || body.rate > 100) {
      return NextResponse.json({ error: 'Rate must be between 0 and 100.' }, { status: 400 });
    }

    const payload = {
      code: body.code,
      name: body.name,
      rate: body.rate,
      description: body.description ?? null,
      is_active: body.isActive ?? true,
      org_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('tax_rates')
      .insert(payload)
      .select(TAX_RATE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating tax rate:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'A tax rate with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to create tax rate: ${errorMessage}` },
        { status: 500 },
      );
    }

    const taxRate = mapRowToTaxRate(data as TaxRateRow);
    return NextResponse.json({ taxRate });
  } catch (error) {
    console.error('Unexpected error creating tax rate:', error);
    return NextResponse.json({ error: 'Unexpected error creating tax rate.' }, { status: 500 });
  }
}
