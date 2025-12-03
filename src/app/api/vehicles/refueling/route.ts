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

interface RefuelingPayload {
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  fuelType: VehicleRefueling['fuelType'];
  quantity: number;
  unit: VehicleRefueling['unit'];
  cost: number;
  odometerReading: number;
  location: string;
  vendor: string;
  invoiceNumber: string;
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

type VehicleRefuelingRow = {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  date: string;
  fuel_type: VehicleRefueling['fuelType'];
  quantity: number | string | null;
  unit: VehicleRefueling['unit'];
  cost: number | string | null;
  odometer_reading: number | string | null;
  location: string;
  vendor: string;
  invoice_number: string;
  receipt_url: string | null;
  notes: string | null;
  recorded_by: string;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

function mapRowToRefueling(row: VehicleRefuelingRow): VehicleRefueling {
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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vehicle_refueling')
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
      .eq('organization_id', ctx.organizationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching vehicle refueling records', error);
      return NextResponse.json({ error: 'Failed to load refueling records.' }, { status: 500 });
    }

    const records = (data ?? []).map((row) => mapRowToRefueling(row as VehicleRefuelingRow));

    const response = NextResponse.json({ records });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Unexpected error fetching refueling records', error);
    return NextResponse.json(
      { error: 'Unexpected error loading refueling records.' },
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

    if (
      ![
        'owner',
        'admin',
        'manager',
        'project-manager',
        'site-supervisor',
        'materials-manager',
        'finance-manager',
        'executive',
        'user',
      ].includes(ctx.role)
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as RefuelingPayload;

    if (!body.vehicleId || !body.vehicleNumber || !body.date) {
      return NextResponse.json(
        { error: 'Vehicle, date, and fuel details are required.' },
        { status: 400 },
      );
    }

    const payload = {
      vehicle_id: body.vehicleId,
      vehicle_number: body.vehicleNumber,
      date: body.date,
      fuel_type: body.fuelType,
      quantity: body.quantity,
      unit: body.unit,
      cost: body.cost,
      odometer_reading: body.odometerReading,
      location: body.location,
      vendor: body.vendor,
      invoice_number: body.invoiceNumber,
      receipt_url: body.receiptUrl ?? null,
      notes: body.notes ?? null,
      recorded_by: ctx.userId,
      organization_id: ctx.organizationId,
    };

    const { data, error } = await supabase
      .from('vehicle_refueling')
      .insert(payload)
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
      console.error('Error creating refueling record', error);
      return NextResponse.json(
        { error: error?.message || 'Failed to create refueling record.' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { record: mapRowToRefueling(data as VehicleRefuelingRow) },
      { status: 201 },
    );
  } catch (error) {
    console.error('Unexpected error creating refueling record', error);
    return NextResponse.json(
      { error: 'Unexpected error creating refueling record.' },
      { status: 500 },
    );
  }
}
