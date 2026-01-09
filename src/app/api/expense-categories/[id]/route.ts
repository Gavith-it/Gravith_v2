import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToExpenseCategory, resolveContext } from '../_utils';
import type { ExpenseCategoryRow } from '../_utils';

import type { ExpenseCategoryItem } from '@/components/shared/masterData';
import { createClient } from '@/lib/supabase/server';

const EXPENSE_CATEGORY_SELECT = `
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
      .from('expense_categories')
      .select(EXPENSE_CATEGORY_SELECT)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching expense category:', error);
      return NextResponse.json({ error: 'Failed to load expense category.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Expense category not found.' }, { status: 404 });
    }

    return NextResponse.json({
      expenseCategory: mapRowToExpenseCategory(data as ExpenseCategoryRow),
    });
  } catch (error) {
    console.error('Unexpected error fetching expense category:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching expense category.' },
      { status: 500 },
    );
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

    const body = (await request.json()) as Partial<ExpenseCategoryItem>;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.code !== undefined) updates['code'] = body.code;
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.description !== undefined) updates['description'] = body.description ?? null;
    if (body.isActive !== undefined) updates['is_active'] = body.isActive;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expense_categories')
      .update(updates)
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .select(EXPENSE_CATEGORY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating expense category:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'An expense category with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to update expense category: ${errorMessage}` },
        { status: 500 },
      );
    }

    const expenseCategory = mapRowToExpenseCategory(data as ExpenseCategoryRow);
    return NextResponse.json({ expenseCategory });
  } catch (error) {
    console.error('Unexpected error updating expense category:', error);
    return NextResponse.json(
      { error: 'Unexpected error updating expense category.' },
      { status: 500 },
    );
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
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`);

    if (error) {
      console.error('Error deleting expense category:', error);
      return NextResponse.json({ error: 'Failed to delete expense category.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting expense category:', error);
    return NextResponse.json(
      { error: 'Unexpected error deleting expense category.' },
      { status: 500 },
    );
  }
}
