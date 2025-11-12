import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Payment } from '@/types';

import { ensureMutationAccess, mapRowToPayment, resolveContext } from '../_utils';

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
      .from('payments')
      .select(PAYMENT_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment:', error);
      return NextResponse.json({ error: 'Failed to load payment.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    return NextResponse.json({ payment: mapRowToPayment(data) });
  } catch (error) {
    console.error('Unexpected error fetching payment:', error);
    return NextResponse.json({ error: 'Unexpected error fetching payment.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Payment>;

    const updates: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.clientName !== undefined) updates['client_name'] = body.clientName;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ error: 'Amount must be non-negative.' }, { status: 400 });
      }
      updates['amount'] = amount;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
      }
      updates['status'] = body.status;
    }

    if (body.dueDate !== undefined) updates['due_date'] = body.dueDate ?? null;
    if (body.paidDate !== undefined) updates['paid_date'] = body.paidDate ?? null;
    if (body.siteId !== undefined) updates['site_id'] = body.siteId ?? null;
    if (body.siteName !== undefined) updates['site_name'] = body.siteName ?? null;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(PAYMENT_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating payment:', error);
      return NextResponse.json({ error: 'Failed to update payment.' }, { status: 500 });
    }

    return NextResponse.json({ payment: mapRowToPayment(data) });
  } catch (error) {
    console.error('Unexpected error updating payment:', error);
    return NextResponse.json({ error: 'Unexpected error updating payment.' }, { status: 500 });
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
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting payment:', error);
      return NextResponse.json({ error: 'Failed to delete payment.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting payment:', error);
    return NextResponse.json({ error: 'Unexpected error deleting payment.' }, { status: 500 });
  }
}

