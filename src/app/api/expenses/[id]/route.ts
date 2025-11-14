import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToExpense, resolveContext } from '../_utils';
import type { ExpenseRow } from '../_utils';

import { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
  material_id,
  purchase_id,
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

    const expense = mapRowToExpense(data as ExpenseRow);
    await enrichLinkedData([expense], supabase, ctx.organizationId);
    return NextResponse.json({ expense });
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
    if (body.purchaseId !== undefined) {
      updates['purchase_id'] = body.purchaseId && body.purchaseId.length > 0 ? body.purchaseId : null;
    }
    if (body.materialId !== undefined) {
      updates['material_id'] = body.materialId && body.materialId.length > 0 ? body.materialId : null;
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

    const expense = mapRowToExpense(data as ExpenseRow);
    await enrichLinkedData([expense], supabase, ctx.organizationId);
    return NextResponse.json({ expense });
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

async function enrichLinkedData(
  expenses: Expense[],
  supabase: SupabaseServerClient,
  organizationId: string,
) {
  const materialIds = Array.from(
    new Set(expenses.map((expense) => expense.materialId).filter((id): id is string => Boolean(id))),
  );
  const purchaseIds = Array.from(
    new Set(expenses.map((expense) => expense.purchaseId).filter((id): id is string => Boolean(id))),
  );

  if (materialIds.length > 0) {
    const { data: materials } = await supabase
      .from('material_masters')
      .select('id, name')
      .eq('organization_id', organizationId)
      .in('id', materialIds);

    const materialEntries: Array<[string, string]> = [];
    (materials ?? []).forEach((material) => {
      const id = material?.id;
      if (typeof id !== 'string') {
        return;
      }
      const name = typeof material?.name === 'string' ? material.name : undefined;
      materialEntries.push([id, name ?? 'Unnamed material']);
    });
    const materialMap = new Map<string, string>(materialEntries);

    expenses.forEach((expense) => {
      if (expense.materialId) {
        expense.materialName = materialMap.get(expense.materialId) ?? expense.materialName;
      }
    });
  }

  if (purchaseIds.length > 0) {
    const { data: purchases } = await supabase
      .from('material_purchases')
      .select('id, material_name, vendor_name, invoice_number, site_name')
      .eq('organization_id', organizationId)
      .in('id', purchaseIds);

    const purchaseEntries: Array<[string, string]> = [];
    (purchases ?? []).forEach((purchase) => {
      const id = purchase?.id;
      if (typeof id !== 'string') {
        return;
      }
      const label =
        (typeof purchase?.invoice_number === 'string' && purchase.invoice_number) ||
        (typeof purchase?.vendor_name === 'string' && purchase.vendor_name) ||
        (typeof purchase?.site_name === 'string' && purchase.site_name) ||
        (typeof purchase?.material_name === 'string' && purchase.material_name) ||
        'Purchase';
      purchaseEntries.push([id, label]);
    });
    const purchaseMap = new Map<string, string>(purchaseEntries);

    expenses.forEach((expense) => {
      if (expense.purchaseId) {
        expense.purchaseReference = purchaseMap.get(expense.purchaseId) ?? expense.purchaseReference;
      }
    });
  }
}
