import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToExpense, resolveContext } from '../_utils';
import type { ExpenseRow } from '../_utils';

import { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = supabase
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('organization_id', ctx.organizationId);

    // Apply filters
    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    // Order by date descending
    query = query.order('date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expense report:', error);
      return NextResponse.json({ error: 'Failed to load expense report.' }, { status: 500 });
    }

    const expenses = (data ?? []).map((row) => mapRowToExpense(row as ExpenseRow));

    // Calculate summary
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<Expense['category'], number>,
    );

    return NextResponse.json({
      expenses,
      summary: {
        totalAmount,
        totalCount: expenses.length,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching expense report:', error);
    return NextResponse.json({ error: 'Unexpected error fetching expense report.' }, { status: 500 });
  }
}

