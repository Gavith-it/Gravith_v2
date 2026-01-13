import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToVendor, resolveContext } from '../_utils';
import type { VendorRow } from '../_utils';

import { createClient } from '@/lib/supabase/server';
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
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor:', error);
      return NextResponse.json({ error: 'Failed to load vendor.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    }

    // Calculate Total Paid from payments table
    let totalPaid = 0;
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', id)
      .not('vendor_id', 'is', null);

    if (paymentsData) {
      totalPaid = paymentsData.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    }

    // Calculate Total Bill from purchases + expenses
    let totalPurchases = 0;
    const { data: purchasesData } = await supabase
      .from('material_purchases')
      .select('total_amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', id)
      .not('vendor_id', 'is', null);

    if (purchasesData) {
      totalPurchases = purchasesData.reduce(
        (sum, purchase) => sum + (Number(purchase.total_amount) || 0),
        0,
      );
    }

    let totalExpenses = 0;
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', id)
      .not('vendor_id', 'is', null);

    if (expensesData) {
      totalExpenses = expensesData.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    }

    const totalBill = totalPurchases + totalExpenses;
    const balance = totalBill - totalPaid;

    const vendor = mapRowToVendor(data as VendorRow);
    // Override with calculated values
    const vendorWithCalculatedTotals = {
      ...vendor,
      totalPaid,
      pendingAmount: balance, // Using pendingAmount field to store balance
    };

    return NextResponse.json({ vendor: vendorWithCalculatedTotals });
  } catch (error) {
    console.error('Unexpected error fetching vendor:', error);
    return NextResponse.json({ error: 'Unexpected error fetching vendor.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<Vendor> & {
      bankAccountNumber?: string;
    };

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.name !== undefined) updates['name'] = body.name;
    if (body.category !== undefined) updates['category'] = body.category;
    if (body.contactPerson !== undefined) updates['contact_person'] = body.contactPerson;
    if (body.email !== undefined) updates['email'] = body.email.length > 0 ? body.email : null;
    if (body.phone !== undefined) updates['phone'] = body.phone;
    if (body.address !== undefined) updates['address'] = body.address;
    if (body.gstNumber !== undefined) updates['gst_number'] = body.gstNumber ?? null;
    if (body.panNumber !== undefined) updates['pan_number'] = body.panNumber ?? null;
    if (body.bankAccount !== undefined || body.bankAccountNumber !== undefined) {
      updates['bank_account'] = body.bankAccount ?? body.bankAccountNumber ?? null;
    }
    if (body.ifscCode !== undefined) updates['ifsc_code'] = body.ifscCode ?? null;
    if (body.paymentTerms !== undefined) updates['payment_terms'] = body.paymentTerms ?? null;
    if (body.notes !== undefined) updates['notes'] = body.notes ?? null;
    if (body.registrationDate !== undefined)
      updates['registration_date'] = body.registrationDate ?? null;
    if (body.status !== undefined) updates['status'] = body.status;

    // Note: totalPaid and pendingAmount are now calculated dynamically from payments, purchases, and expenses
    // Manual updates to these fields are not allowed as they are computed values

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(VENDOR_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating vendor:', error);
      return NextResponse.json({ error: 'Failed to update vendor.' }, { status: 500 });
    }

    // Calculate financial totals after update
    const vendorId = id;
    let totalPaid = 0;
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', vendorId)
      .not('vendor_id', 'is', null);

    if (paymentsData) {
      totalPaid = paymentsData.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    }

    let totalPurchases = 0;
    const { data: purchasesData } = await supabase
      .from('material_purchases')
      .select('total_amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', vendorId)
      .not('vendor_id', 'is', null);

    if (purchasesData) {
      totalPurchases = purchasesData.reduce(
        (sum, purchase) => sum + (Number(purchase.total_amount) || 0),
        0,
      );
    }

    let totalExpenses = 0;
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('organization_id', ctx.organizationId)
      .eq('vendor_id', vendorId)
      .not('vendor_id', 'is', null);

    if (expensesData) {
      totalExpenses = expensesData.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    }

    const totalBill = totalPurchases + totalExpenses;
    const balance = totalBill - totalPaid;

    const vendor = mapRowToVendor(data as VendorRow);
    const vendorWithCalculatedTotals = {
      ...vendor,
      totalPaid,
      pendingAmount: balance,
    };

    return NextResponse.json({ vendor: vendorWithCalculatedTotals });
  } catch (error) {
    console.error('Unexpected error updating vendor:', error);
    return NextResponse.json({ error: 'Unexpected error updating vendor.' }, { status: 500 });
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
      .from('vendors')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting vendor:', error);
      return NextResponse.json({ error: 'Failed to delete vendor.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting vendor:', error);
    return NextResponse.json({ error: 'Unexpected error deleting vendor.' }, { status: 500 });
  }
}
