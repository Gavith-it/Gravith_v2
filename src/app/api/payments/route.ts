import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Payment } from '@/types';

import { ensureMutationAccess, mapRowToPayment, resolveContext } from './_utils';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('payments')
      .select(PAYMENT_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to load payments.' }, { status: 500 });
    }

    const payments = (data ?? []).map(mapRowToPayment);
    return NextResponse.json({ payments });
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

    const payment = mapRowToPayment(data);
    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Unexpected error creating payment:', error);
    return NextResponse.json({ error: 'Unexpected error creating payment.' }, { status: 500 });
  }
}

