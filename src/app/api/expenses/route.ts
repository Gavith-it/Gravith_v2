import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

import { ensureMutationAccess, mapRowToExpense, resolveContext } from './_utils';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to load expenses.' }, { status: 500 });
    }

    const expenses = (data ?? []).map(mapRowToExpense);
    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Unexpected error fetching expenses:', error);
    return NextResponse.json({ error: 'Unexpected error fetching expenses.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Expense> & {
      siteId?: string | null;
      siteName?: string | null;
    };
    const {
      description,
      amount,
      category,
      subcategory,
      date,
      vendor,
      siteId,
      siteName,
      receipt,
      status,
      approvedBy,
    } = body;

    const numericAmount = Number(amount);

    if (!description || Number.isNaN(numericAmount)) {
      return NextResponse.json({ error: 'Description and amount are required.' }, { status: 400 });
    }

    if (numericAmount < 0) {
      return NextResponse.json({ error: 'Amount must be non-negative.' }, { status: 400 });
    }

    if (!category || !date) {
      return NextResponse.json({ error: 'Category and date are required.' }, { status: 400 });
    }

    const normalizedStatus = (status ?? 'pending') as Expense['status'];
    if (!VALID_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid expense status.' }, { status: 400 });
    }

    const normalizedAmount = Math.round(numericAmount * 100) / 100;

    const approvedByValue =
      approvedBy && approvedBy.length > 0 ? approvedBy.slice(0, 255) : null;

    const payload = {
      description,
      amount: normalizedAmount,
      category,
      subcategory: subcategory ?? null,
      date,
      vendor: vendor && vendor.length > 0 ? vendor : null,
      site_id: siteId && siteId.length > 0 ? siteId : null,
      site_name: siteName && siteName.length > 0 ? siteName : null,
      receipt: receipt && receipt.length > 0 ? receipt : null,
      status: normalizedStatus,
      approved_by: null,
      approved_by_name: approvedByValue,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(payload)
      .select(EXPENSE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Failed to create expense.' }, { status: 500 });
    }

    const expense = mapRowToExpense(data);
    return NextResponse.json({ expense });
  } catch (error) {
    console.error('Unexpected error creating expense:', error);
    return NextResponse.json({ error: 'Unexpected error creating expense.' }, { status: 500 });
  }
}

