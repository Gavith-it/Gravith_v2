import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { VehicleUsage } from '@/types/entities';

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

interface UsagePayload {
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  startOdometer: number;
  endOdometer: number;
  totalDistance: number;
  workDescription: string;
  workCategory: VehicleUsage['workCategory'];
  siteId: string;
  siteName: string;
  operator: string;
  fuelConsumed: number;
  isRental: boolean;
  rentalCost?: number | null;
  vendor?: string | null;
  status: VehicleUsage['status'];
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

function mapRowToUsage(row: any): VehicleUsage {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleNumber: row.vehicle_number,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    startOdometer: Number(row.start_odometer ?? 0),
    endOdometer: Number(row.end_odometer ?? 0),
    totalDistance: Number(row.total_distance ?? 0),
    workDescription: row.work_description,
    workCategory: row.work_category,
    siteId: row.site_id,
    siteName: row.site_name,
    operator: row.operator,
    fuelConsumed: Number(row.fuel_consumed ?? 0),
    isRental: row.is_rental ?? false,
    rentalCost: row.rental_cost !== null ? Number(row.rental_cost) : undefined,
    vendor: row.vendor ?? undefined,
    status: row.status,
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
      .from('vehicle_usage')
      .select(
        `
        id,
        vehicle_id,
        vehicle_number,
        date,
        start_time,
        end_time,
        start_odometer,
        end_odometer,
        total_distance,
        work_description,
        work_category,
        site_id,
        site_name,
        operator,
        fuel_consumed,
        is_rental,
        rental_cost,
        vendor,
        status,
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
      console.error('Error fetching vehicle usage records', error);
      return NextResponse.json({ error: 'Failed to load usage records.' }, { status: 500 });
    }

    const records = (data ?? []).map(mapRowToUsage);
    return NextResponse.json({ records });
  } catch (error) {
    console.error('Unexpected error fetching usage records', error);
    return NextResponse.json(
      { error: 'Unexpected error loading usage records.' },
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
      !['owner', 'admin', 'manager', 'project-manager', 'site-supervisor', 'materials-manager', 'finance-manager', 'executive', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as UsagePayload;

    if (!body.vehicleId || !body.vehicleNumber || !body.date) {
      return NextResponse.json({ error: 'Vehicle, date, and work details are required.' }, { status: 400 });
    }

    const payload = {
      vehicle_id: body.vehicleId,
      vehicle_number: body.vehicleNumber,
      date: body.date,
      start_time: body.startTime,
      end_time: body.endTime,
      start_odometer: body.startOdometer,
      end_odometer: body.endOdometer,
      total_distance: body.totalDistance,
      work_description: body.workDescription,
      work_category: body.workCategory,
      site_id: body.siteId,
      site_name: body.siteName,
      operator: body.operator,
      fuel_consumed: body.fuelConsumed,
      is_rental: body.isRental,
      rental_cost: body.rentalCost ?? null,
      vendor: body.vendor ?? null,
      status: body.status,
      notes: body.notes ?? null,
      recorded_by: ctx.userId,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('vehicle_usage')
      .insert(payload)
      .select(
        `
        id,
        vehicle_id,
        vehicle_number,
        date,
        start_time,
        end_time,
        start_odometer,
        end_odometer,
        total_distance,
        work_description,
        work_category,
        site_id,
        site_name,
        operator,
        fuel_consumed,
        is_rental,
        rental_cost,
        vendor,
        status,
        notes,
        recorded_by,
        organization_id,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error || !data) {
      console.error('Error creating usage record', error);
      return NextResponse.json({ error: 'Failed to create usage record.' }, { status: 500 });
    }

    return NextResponse.json({ record: mapRowToUsage(data) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating usage record', error);
    return NextResponse.json(
      { error: 'Unexpected error creating usage record.' },
      { status: 500 },
    );
  }
}

