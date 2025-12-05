import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToExpense, resolveContext } from './_utils';
import type { ExpenseRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import type { Expense } from '@/types';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (countError) {
      console.error('Error counting expenses', countError);
      return NextResponse.json({ error: 'Failed to load expenses.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('expenses')
      .select(EXPENSE_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to load expenses.' }, { status: 500 });
    }

    const expenses = (data ?? []).map((row) => mapRowToExpense(row as ExpenseRow));
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      expenses,
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

    const approvedByValue = approvedBy && approvedBy.length > 0 ? approvedBy.slice(0, 255) : null;

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

    const expense = mapRowToExpense(data as ExpenseRow);
    const response = NextResponse.json({ expense }, { status: 201 });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error creating expense:', error);
    return NextResponse.json({ error: 'Unexpected error creating expense.' }, { status: 500 });
  }
}
