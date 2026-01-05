import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToPayment, resolveContext } from './_utils';
import type { PaymentRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import type { Payment } from '@/types';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAYMENT_SELECT = `
  id,
  client_name,
  amount,
  status,
  due_date,
  paid_date,
  site_id,
  site_name,
  organization_id,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

const VALID_STATUSES: Payment['status'][] = ['pending', 'completed', 'overdue'];

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    // Get pagination params from URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error:
            'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.',
        },
        { status: 400 },
      );
    }

    // Get total count for pagination (optimized: use 'id' instead of '*' for faster counting)
    const { count, error: countError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (countError) {
      console.error('Error counting payments', countError);
      return NextResponse.json({ error: 'Failed to load payments.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('payments')
      .select(PAYMENT_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('due_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to load payments.' }, { status: 500 });
    }

    const payments = (data ?? []).map((row) => mapRowToPayment(row as PaymentRow));
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    // Disable caching to ensure fresh data in production
    // This prevents Vercel edge cache from serving stale data after mutations
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error fetching payments:', error);
    return NextResponse.json({ error: 'Unexpected error fetching payments.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Payment>;
    const { clientName, amount, status, dueDate, paidDate, siteId, siteName } = body;

    if (!clientName || typeof amount !== 'number' || Number.isNaN(amount)) {
      return NextResponse.json({ error: 'Client name and amount are required.' }, { status: 400 });
    }

    if (amount < 0) {
      return NextResponse.json({ error: 'Amount must be non-negative.' }, { status: 400 });
    }

    const normalizedStatus = (status ?? 'pending') as Payment['status'];
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    const payload = {
      client_name: clientName,
      amount,
      status: normalizedStatus,
      due_date: dueDate ?? null,
      paid_date: paidDate ?? null,
      site_id: siteId ?? null,
      site_name: siteName ?? null,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('payments')
      .insert(payload)
      .select(PAYMENT_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating payment:', error);
      return NextResponse.json({ error: 'Failed to create payment.' }, { status: 500 });
    }

    const payment = mapRowToPayment(data as PaymentRow);
    const response = NextResponse.json({ payment }, { status: 201 });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error creating payment:', error);
    return NextResponse.json({ error: 'Unexpected error creating payment.' }, { status: 500 });
  }
}
