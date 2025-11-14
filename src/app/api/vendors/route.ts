import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToVendor, resolveContext } from './_utils';
import type { VendorRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types';
import { formatDateOnly } from '@/lib/utils/date';


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
  rating,
  total_paid,
  pending_amount,
  last_payment,
  status,
  registration_date,
  notes,
  organization_id,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json({ error: 'Failed to load vendors.' }, { status: 500 });
    }

    const vendors = (data ?? []).map((row) => mapRowToVendor(row as VendorRow));
    return NextResponse.json({ vendors });
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

    const body = (await request.json()) as Partial<Vendor>;
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
      bank_account: bankAccount ?? null,
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
      return NextResponse.json({ error: 'Failed to create vendor.' }, { status: 500 });
    }

    const vendor = mapRowToVendor(data as VendorRow);
    return NextResponse.json({ vendor });
  } catch (error) {
    console.error('Unexpected error creating vendor:', error);
    return NextResponse.json({ error: 'Unexpected error creating vendor.' }, { status: 500 });
  }
}
