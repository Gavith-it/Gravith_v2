import { NextResponse, type NextRequest } from 'next/server';

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

type VehicleUsageRow = {
  id: string;
  vehicle_id: string;
  vehicle_number: string;
  date: string;
  start_time: string;
  end_time: string;
  start_odometer: number | string | null;
  end_odometer: number | string | null;
  total_distance: number | string | null;
  work_description: string;
  work_category: VehicleUsage['workCategory'];
  site_id: string;
  site_name: string;
  operator: string;
  fuel_consumed: number | string | null;
  is_rental: boolean | null;
  rental_cost: number | string | null;
  vendor: string | null;
  status: VehicleUsage['status'];
  notes: string | null;
  recorded_by: string;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

interface UsagePayload {
  date?: string;
  startTime?: string;
  endTime?: string;
  startOdometer?: number;
  endOdometer?: number;
  totalDistance?: number;
  workDescription?: string;
  workCategory?: VehicleUsage['workCategory'];
  siteId?: string;
  siteName?: string;
  operator?: string;
  fuelConsumed?: number;
  isRental?: boolean;
  rentalCost?: number | null;
  vendor?: string | null;
  status?: VehicleUsage['status'];
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

function mapRowToUsage(row: VehicleUsageRow): VehicleUsage {
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

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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

    const body = (await request.json()) as UsagePayload;
    const updates: Record<string, unknown> = {};

    if (body.date !== undefined) updates['date'] = body.date;
    if (body.startTime !== undefined) updates['start_time'] = body.startTime;
    if (body.endTime !== undefined) updates['end_time'] = body.endTime;
    if (body.startOdometer !== undefined) updates['start_odometer'] = body.startOdometer;
    if (body.endOdometer !== undefined) updates['end_odometer'] = body.endOdometer;
    if (body.totalDistance !== undefined) updates['total_distance'] = body.totalDistance;
    if (body.workDescription !== undefined) updates['work_description'] = body.workDescription;
    if (body.workCategory !== undefined) updates['work_category'] = body.workCategory;
    if (body.siteId !== undefined) updates['site_id'] = body.siteId;
    if (body.siteName !== undefined) updates['site_name'] = body.siteName;
    if (body.operator !== undefined) updates['operator'] = body.operator;
    if (body.fuelConsumed !== undefined) updates['fuel_consumed'] = body.fuelConsumed;
    if (body.isRental !== undefined) updates['is_rental'] = body.isRental;
    if (body.rentalCost !== undefined) updates['rental_cost'] = body.rentalCost ?? null;
    if (body.vendor !== undefined) updates['vendor'] = body.vendor ?? null;
    if (body.status !== undefined) updates['status'] = body.status;
    if (body.notes !== undefined) updates['notes'] = body.notes;

    const { data, error } = await supabase
      .from('vehicle_usage')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
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
      console.error('Error updating usage record', error);
      return NextResponse.json({ error: 'Failed to update usage record.' }, { status: 500 });
    }

    return NextResponse.json({ record: mapRowToUsage(data as VehicleUsageRow) });
  } catch (error) {
    console.error('Unexpected error updating usage record', error);
    return NextResponse.json({ error: 'Unexpected error updating usage record.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from('vehicle_usage')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting usage record', error);
      return NextResponse.json({ error: 'Failed to delete usage record.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting usage record', error);
    return NextResponse.json({ error: 'Unexpected error deleting usage record.' }, { status: 500 });
  }
}
