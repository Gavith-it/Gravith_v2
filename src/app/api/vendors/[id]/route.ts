import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types';

import { ensureMutationAccess, mapRowToVendor, resolveContext } from '../_utils';

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

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vendors')
      .select(VENDOR_SELECT)
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor:', error);
      return NextResponse.json({ error: 'Failed to load vendor.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    }

    return NextResponse.json({ vendor: mapRowToVendor(data) });
  } catch (error) {
    console.error('Unexpected error fetching vendor:', error);
    return NextResponse.json({ error: 'Unexpected error fetching vendor.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

    const updates: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.contactPerson !== undefined) updates.contact_person = body.contactPerson;
    if (body.email !== undefined) updates.email = body.email.length > 0 ? body.email : null;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.address !== undefined) updates.address = body.address;
    if (body.gstNumber !== undefined) updates.gst_number = body.gstNumber ?? null;
    if (body.panNumber !== undefined) updates.pan_number = body.panNumber ?? null;
    if (body.bankAccount !== undefined) updates.bank_account = body.bankAccount ?? null;
    if (body.ifscCode !== undefined) updates.ifsc_code = body.ifscCode ?? null;
    if (body.paymentTerms !== undefined) updates.payment_terms = body.paymentTerms ?? null;
    if (body.notes !== undefined) updates.notes = body.notes ?? null;
    if (body.registrationDate !== undefined) updates.registration_date = body.registrationDate ?? null;
    if (body.status !== undefined) updates.status = body.status;

    if (body.rating !== undefined) {
      const rating = Number(body.rating);
      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        return NextResponse.json({ error: 'Invalid rating value.' }, { status: 400 });
      }
      updates.rating = rating;
    }

    if (body.totalPaid !== undefined) {
      const totalPaid = Number(body.totalPaid);
      if (Number.isNaN(totalPaid) || totalPaid < 0) {
        return NextResponse.json({ error: 'Invalid total paid value.' }, { status: 400 });
      }
      updates.total_paid = totalPaid;
    }

    if (body.pendingAmount !== undefined) {
      const pendingAmount = Number(body.pendingAmount);
      if (Number.isNaN(pendingAmount) || pendingAmount < 0) {
        return NextResponse.json({ error: 'Invalid pending amount value.' }, { status: 400 });
      }
      updates.pending_amount = pendingAmount;
    }

    if (body.lastPayment !== undefined) {
      updates.last_payment = body.lastPayment ?? null;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId)
      .select(VENDOR_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating vendor:', error);
      return NextResponse.json({ error: 'Failed to update vendor.' }, { status: 500 });
    }

    return NextResponse.json({ vendor: mapRowToVendor(data) });
  } catch (error) {
    console.error('Unexpected error updating vendor:', error);
    return NextResponse.json({ error: 'Unexpected error updating vendor.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', params.id)
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
