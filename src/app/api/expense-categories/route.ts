import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToExpenseCategory, resolveContext } from './_utils';
import type { ExpenseCategoryRow } from './_utils';

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    // Fetch all expense categories for the organization (or global if org_id is null)
    const { data, error } = await supabase
      .from('expense_categories')
      .select(EXPENSE_CATEGORY_SELECT)
      .or(`org_id.is.null,org_id.eq.${ctx.organizationId}`)
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching expense categories:', error);
      return NextResponse.json({ error: 'Failed to load expense categories.' }, { status: 500 });
    }

    const expenseCategories = (data ?? []).map((row) =>
      mapRowToExpenseCategory(row as ExpenseCategoryRow),
    );

    return NextResponse.json({ expenseCategories });
  } catch (error) {
    console.error('Unexpected error fetching expense categories:', error);
    return NextResponse.json(
      { error: 'Unexpected error fetching expense categories.' },
      { status: 500 },
    );
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

    const body = (await request.json()) as Omit<
      ExpenseCategoryItem,
      'id' | 'createdAt' | 'updatedAt'
    >;

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

    const { data, error } = await supabase
      .from('expense_categories')
      .insert(payload)
      .select(EXPENSE_CATEGORY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating expense category:', error);
      const errorMessage = error?.message || 'Unknown database error';
      if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        return NextResponse.json(
          { error: 'An expense category with this code already exists.' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Failed to create expense category: ${errorMessage}` },
        { status: 500 },
      );
    }

    const expenseCategory = mapRowToExpenseCategory(data as ExpenseCategoryRow);
    return NextResponse.json({ expenseCategory });
  } catch (error) {
    console.error('Unexpected error creating expense category:', error);
    return NextResponse.json(
      { error: 'Unexpected error creating expense category.' },
      { status: 500 },
    );
  }
}
