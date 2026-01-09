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
  vendor_id,
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
    const vendorId = searchParams.get('vendorId');

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

    // Build query for count
    let countQuery = supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (vendorId) {
      countQuery = countQuery.eq('vendor_id', vendorId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting payments', countError);
      return NextResponse.json({ error: 'Failed to load payments.' }, { status: 500 });
    }

    // Build query for data
    let dataQuery = supabase
      .from('payments')
      .select(PAYMENT_SELECT)
      .eq('organization_id', ctx.organizationId);

    if (vendorId) {
      dataQuery = dataQuery.eq('vendor_id', vendorId);
    }

    const { data, error } = await dataQuery
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

    const body = (await request.json()) as Partial<Payment & { date?: string }>;
    const { clientName, vendorId, amount, status } = body;

    // Validate amount
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      return NextResponse.json(
        { error: 'Amount is required and must be a number.' },
        { status: 400 },
      );
    }

    if (amount < 0) {
      return NextResponse.json({ error: 'Amount must be non-negative.' }, { status: 400 });
    }

    const normalizedStatus = (status ?? 'pending') as Payment['status'];
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    // If vendorId is provided, fetch vendor name; otherwise use clientName
    let finalClientName = clientName?.trim() || '';
    let normalizedVendorId: string | null = null;

    if (vendorId && vendorId.trim().length > 0) {
      // Validate vendor exists and belongs to organization
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('id', vendorId.trim())
        .eq('organization_id', ctx.organizationId)
        .maybeSingle();

      if (vendorError || !vendor) {
        return NextResponse.json(
          { error: 'Vendor not found or does not belong to your organization.' },
          { status: 400 },
        );
      }

      normalizedVendorId = vendor.id as string;
      finalClientName = vendor.name as string; // Use vendor name as client name
    } else if (!clientName || clientName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Either vendor ID or client name is required.' },
        { status: 400 },
      );
    }

    // Store date in due_date field (keeping paid_date and site fields as null for future use)
    const normalizedDate =
      (body as { date?: string }).date && (body as { date?: string }).date!.trim().length > 0
        ? (body as { date?: string }).date!.trim()
        : null;

    const payload = {
      client_name: finalClientName,
      vendor_id: normalizedVendorId,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      status: normalizedStatus,
      due_date: normalizedDate,
      paid_date: null,
      site_id: null,
      site_name: null,
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
      console.error('Payload that failed:', JSON.stringify(payload, null, 2));
      const errorMessage = error?.message || 'Failed to create payment.';
      return NextResponse.json(
        { error: errorMessage || 'Failed to create payment.' },
        { status: 500 },
      );
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
