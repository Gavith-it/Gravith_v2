import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToVendor, resolveContext } from './_utils';
import type { VendorRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import { formatDateOnly } from '@/lib/utils/date';
import type { Vendor } from '@/types';

const VENDOR_SELECT = `
  id,
  name,
  category,
  contact_person,
  email,
  phone,
  address,
  gst_number,
  pan_number,
  bank_account,
  ifsc_code,
  payment_terms,
  total_paid,
  pending_amount,
  status,
  registration_date,
  notes,
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

    // Get total count for pagination (optimized: use 'id' instead of '*' for faster counting)
    const { count, error: countError } = await supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (countError) {
      console.error('Error counting vendors', countError);
      return NextResponse.json({ error: 'Failed to load vendors.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({ error: 'Failed to load vendors.' }, { status: 500 });
    }

    const vendorRows = data ?? [];
    const vendorIds = vendorRows.map((row) => row.id);

    // Calculate Total Paid from payments table for all vendors in this page
    const paymentsTotalMap = new Map<string, number>();
    if (vendorIds.length > 0) {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('vendor_id, amount')
        .eq('organization_id', ctx.organizationId)
        .in('vendor_id', vendorIds)
        .not('vendor_id', 'is', null);

      if (!paymentsError && paymentsData) {
        paymentsData.forEach((payment) => {
          if (payment.vendor_id && payment.amount) {
            const vendorId = String(payment.vendor_id);
            const currentTotal = paymentsTotalMap.get(vendorId) || 0;
            paymentsTotalMap.set(vendorId, currentTotal + Number(payment.amount));
          }
        });
      }
    }

    // Calculate Total Bill from purchases + expenses for all vendors in this page
    const purchasesTotalMap = new Map<string, number>();
    if (vendorIds.length > 0) {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('material_purchases')
        .select('vendor_id, total_amount')
        .eq('organization_id', ctx.organizationId)
        .in('vendor_id', vendorIds)
        .not('vendor_id', 'is', null);

      if (!purchasesError && purchasesData) {
        purchasesData.forEach((purchase) => {
          if (purchase.vendor_id && purchase.total_amount) {
            const vendorId = String(purchase.vendor_id);
            const currentTotal = purchasesTotalMap.get(vendorId) || 0;
            purchasesTotalMap.set(vendorId, currentTotal + Number(purchase.total_amount));
          }
        });
      }
    }

    const expensesTotalMap = new Map<string, number>();
    if (vendorIds.length > 0) {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('vendor_id, amount')
        .eq('organization_id', ctx.organizationId)
        .in('vendor_id', vendorIds)
        .not('vendor_id', 'is', null);

      if (!expensesError && expensesData) {
        expensesData.forEach((expense) => {
          if (expense.vendor_id && expense.amount) {
            const vendorId = String(expense.vendor_id);
            const currentTotal = expensesTotalMap.get(vendorId) || 0;
            expensesTotalMap.set(vendorId, currentTotal + Number(expense.amount));
          }
        });
      }
    }

    // Map vendors and calculate financial totals
    const vendors = vendorRows.map((row) => {
      const vendor = mapRowToVendor(row as VendorRow);
      const vendorId = String(row.id);
      const totalPaid = paymentsTotalMap.get(vendorId) || 0;
      const totalPurchases = purchasesTotalMap.get(vendorId) || 0;
      const totalExpenses = expensesTotalMap.get(vendorId) || 0;
      const totalBill = totalPurchases + totalExpenses;
      const balance = totalBill - totalPaid;

      // Override with calculated values
      return {
        ...vendor,
        totalPaid,
        pendingAmount: balance, // Using pendingAmount field to store balance
      };
    });
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Unexpected error fetching vendors:', error);
    return NextResponse.json({ error: 'Unexpected error fetching vendors.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Vendor> & {
      bankAccountNumber?: string;
      accountName?: string;
      bankName?: string;
      bankBranch?: string;
    };
    const {
      name,
      category,
      contactPerson,
      email,
      phone,
      address,
      gstNumber,
      panNumber,
      bankAccount,
      bankAccountNumber,
      ifscCode,
      paymentTerms,
      notes,
    } = body;

    if (!name || !category || !contactPerson || !phone || !address) {
      return NextResponse.json({ error: 'Missing required vendor fields.' }, { status: 400 });
    }

    const payload = {
      name,
      category,
      contact_person: contactPerson,
      email: email && email.length > 0 ? email : null,
      phone,
      address,
      gst_number: gstNumber ?? null,
      pan_number: panNumber ?? null,
      bank_account: bankAccount ?? bankAccountNumber ?? null,
      ifsc_code: ifscCode ?? null,
      payment_terms: paymentTerms ?? null,
      notes: notes ?? null,
      status: (body.status ?? 'active') as Vendor['status'],
      registration_date: body.registrationDate ?? formatDateOnly(new Date()),
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('vendors')
      .insert(payload)
      .select(VENDOR_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating vendor:', error);
      const errorMessage = error?.message || 'Unknown database error';
      return NextResponse.json(
        { error: `Failed to create vendor: ${errorMessage}` },
        { status: 500 },
      );
    }

    const vendor = mapRowToVendor(data as VendorRow);
    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Unexpected error creating vendor:', error);
    return NextResponse.json({ error: 'Unexpected error creating vendor.' }, { status: 500 });
  }
}
