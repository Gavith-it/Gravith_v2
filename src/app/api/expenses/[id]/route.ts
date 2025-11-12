import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

import { ensureMutationAccess, mapRowToExpense, resolveContext } from '../_utils';

const EXPENSE_SELECT = `
  id,
  description,
  amount,
  category,
  subcategory,
  date,
  vendor,
  site_id,
  site_name,
  receipt,
  status,
  approved_by,
  approved_by_name,
  organization_id,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

const VALID_STATUSES: Expense['status'][] = ['paid', 'pending', 'overdue'];

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
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching expense:', error);
      return NextResponse.json({ error: 'Failed to load expense.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    }

    return NextResponse.json({ expense: mapRowToExpense(data) });
  } catch (error) {
    console.error('Unexpected error fetching expense:', error);
    return NextResponse.json({ error: 'Unexpected error fetching expense.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Expense> & {
      siteId?: string | null;
      siteName?: string | null;
    };

    const updates: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.description !== undefined) updates['description'] = body.description;

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (Number.isNaN(amount) || amount < 0) {
        return NextResponse.json({ error: 'Amount must be non-negative.' }, { status: 400 });
      }
      updates['amount'] = Math.round(amount * 100) / 100;
    }

    if (body.category !== undefined) updates['category'] = body.category;
    if (body.subcategory !== undefined) updates['subcategory'] = body.subcategory ?? null;
    if (body.date !== undefined) updates['date'] = body.date;
    if (body.vendor !== undefined) {
      updates['vendor'] = body.vendor && body.vendor.length > 0 ? body.vendor : null;
    }
    if (body.siteId !== undefined) {
      updates['site_id'] = body.siteId && body.siteId.length > 0 ? body.siteId : null;
    }
    if (body.siteName !== undefined) {
      updates['site_name'] = body.siteName && body.siteName.length > 0 ? body.siteName : null;
    }
    if (body.receipt !== undefined) {
      updates['receipt'] = body.receipt && body.receipt.length > 0 ? body.receipt : null;
    }
    if (body.approvedBy !== undefined) {
      updates['approved_by'] = null;
      updates['approved_by_name'] =
        body.approvedBy && body.approvedBy.length > 0 ? body.approvedBy.slice(0, 255) : null;
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid expense status.' }, { status: 400 });
      }
      updates['status'] = body.status;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(EXPENSE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: 'Failed to update expense.' }, { status: 500 });
    }

    return NextResponse.json({ expense: mapRowToExpense(data) });
  } catch (error) {
    console.error('Unexpected error updating expense:', error);
    return NextResponse.json({ error: 'Unexpected error updating expense.' }, { status: 500 });
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
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: 'Failed to delete expense.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting expense:', error);
    return NextResponse.json({ error: 'Unexpected error deleting expense.' }, { status: 500 });
  }
}

