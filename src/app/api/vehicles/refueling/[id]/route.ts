import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { VehicleRefueling } from '@/types/entities';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type MutationRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'project-manager'
  | 'site-supervisor'
  | 'materials-manager'
  | 'finance-manager'
  | 'executive'
  | 'user';

interface RouteContext {
  params: { id: string };
}

interface RefuelingPayload {
  date?: string;
  fuelType?: VehicleRefueling['fuelType'];
  quantity?: number;
  unit?: VehicleRefueling['unit'];
  cost?: number;
  odometerReading?: number;
  location?: string;
  vendor?: string;
  invoiceNumber?: string;
  receiptUrl?: string | null;
  notes?: string | null;
}

async function resolveContext(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, organization_role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  if (profile.is_active === false) {
    return { error: 'Inactive user.' as const };
  }

  return {
    organizationId: profile.organization_id as string,
    role: profile.organization_role as MutationRole,
    userId: user.id,
  };
}

function mapRowToRefueling(row: any): VehicleRefueling {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleNumber: row.vehicle_number,
    date: row.date,
    fuelType: row.fuel_type,
    quantity: Number(row.quantity ?? 0),
    unit: row.unit,
    cost: Number(row.cost ?? 0),
    odometerReading: Number(row.odometer_reading ?? 0),
    location: row.location,
    vendor: row.vendor,
    invoiceNumber: row.invoice_number,
    receiptUrl: row.receipt_url ?? undefined,
    notes: row.notes ?? undefined,
    recordedBy: row.recorded_by,
    organizationId: row.organization_id,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'site-supervisor', 'materials-manager', 'finance-manager', 'executive', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as RefuelingPayload;
    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.date !== undefined) updates.date = body.date;
    if (body.fuelType !== undefined) updates.fuel_type = body.fuelType;
    if (body.quantity !== undefined) updates.quantity = body.quantity;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.cost !== undefined) updates.cost = body.cost;
    if (body.odometerReading !== undefined) updates.odometer_reading = body.odometerReading;
    if (body.location !== undefined) updates.location = body.location;
    if (body.vendor !== undefined) updates.vendor = body.vendor;
    if (body.invoiceNumber !== undefined) updates.invoice_number = body.invoiceNumber;
    if (body.receiptUrl !== undefined) updates.receipt_url = body.receiptUrl;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabase
      .from('vehicle_refueling')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId)
      .select(
        `
        id,
        vehicle_id,
        vehicle_number,
        date,
        fuel_type,
        quantity,
        unit,
        cost,
        odometer_reading,
        location,
        vendor,
        invoice_number,
        receipt_url,
        notes,
        recorded_by,
        organization_id,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error || !data) {
      console.error('Error updating refueling record', error);
      return NextResponse.json({ error: 'Failed to update refueling record.' }, { status: 500 });
    }

    return NextResponse.json({ record: mapRowToRefueling(data) });
  } catch (error) {
    console.error('Unexpected error updating refueling record', error);
    return NextResponse.json(
      { error: 'Unexpected error updating refueling record.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'site-supervisor', 'materials-manager', 'finance-manager', 'executive', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('vehicle_refueling')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting refueling record', error);
      return NextResponse.json({ error: 'Failed to delete refueling record.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting refueling record', error);
    return NextResponse.json(
      { error: 'Unexpected error deleting refueling record.' },
      { status: 500 },
    );
  }
}

