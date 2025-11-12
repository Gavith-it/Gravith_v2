import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Vehicle } from '@/types/entities';
import type { VehiclePayload } from '../route';

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

function mapRowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    vehicleNumber: row.vehicle_number,
    name: row.name ?? undefined,
    type: row.type,
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    year: row.year ?? undefined,
    status: row.status,
    siteId: row.site_id ?? undefined,
    siteName: row.site_name ?? undefined,
    operator: row.operator ?? undefined,
    isRental: row.is_rental ?? false,
    vendor: row.vendor ?? undefined,
    rentalCostPerDay: row.rental_cost_per_day !== null ? Number(row.rental_cost_per_day) : undefined,
    rentalStartDate: row.rental_start_date ?? undefined,
    rentalEndDate: row.rental_end_date ?? undefined,
    totalRentalDays: row.total_rental_days !== null ? Number(row.total_rental_days) : undefined,
    totalRentalCost: row.total_rental_cost !== null ? Number(row.total_rental_cost) : undefined,
    fuelCapacity: row.fuel_capacity !== null ? Number(row.fuel_capacity) : undefined,
    currentFuelLevel:
      row.current_fuel_level !== null ? Number(row.current_fuel_level) : undefined,
    mileage: row.mileage !== null ? Number(row.mileage) : undefined,
    lastMaintenanceDate: row.last_maintenance_date ?? undefined,
    nextMaintenanceDate: row.next_maintenance_date ?? undefined,
    insuranceExpiry: row.insurance_expiry ?? undefined,
    registrationExpiry: row.registration_expiry ?? undefined,
    organizationId: row.organization_id,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
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

function mapStatusForUpdate(status?: Vehicle['status']) {
  if (!status) return undefined;
  switch (status) {
    case 'available':
    case 'in_use':
    case 'maintenance':
    case 'idle':
    case 'returned':
      return status;
    default:
      return 'available';
  }
}

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select(
        `
        id,
        organization_id,
        vehicle_number,
        name,
        type,
        make,
        model,
        year,
        status,
        site_id,
        site_name,
        operator,
        is_rental,
        vendor,
        rental_cost_per_day,
        rental_start_date,
        rental_end_date,
        total_rental_days,
        total_rental_cost,
        fuel_capacity,
        current_fuel_level,
        mileage,
        last_maintenance_date,
        next_maintenance_date,
        insurance_expiry,
        registration_expiry,
        created_at,
        updated_at,
        created_by,
        updated_by
      `,
      )
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vehicle', error);
      return NextResponse.json({ error: 'Failed to load vehicle.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
    }

    return NextResponse.json({ vehicle: mapRowToVehicle(data) });
  } catch (error) {
    console.error('Unexpected error fetching vehicle', error);
    return NextResponse.json({ error: 'Unexpected error loading vehicle.' }, { status: 500 });
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

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'site-supervisor', 'materials-manager', 'finance-manager', 'executive', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as Partial<VehiclePayload>;
    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.vehicleNumber !== undefined) updates.vehicle_number = body.vehicleNumber;
    if (body.name !== undefined) updates.name = body.name ?? null;
    if (body.type !== undefined) updates.type = body.type;
    if (body.make !== undefined) updates.make = body.make ?? null;
    if (body.model !== undefined) updates.model = body.model ?? null;
    if (body.year !== undefined) updates.year = body.year ?? null;
    if (body.status !== undefined) updates.status = mapStatusForUpdate(body.status);
    if (body.siteId !== undefined) updates.site_id = body.siteId ?? null;
    if (body.siteName !== undefined) updates.site_name = body.siteName ?? null;
    if (body.operator !== undefined) updates.operator = body.operator ?? null;
    if (body.isRental !== undefined) updates.is_rental = body.isRental;
    if (body.vendor !== undefined) updates.vendor = body.vendor ?? null;
    if (body.rentalCostPerDay !== undefined) updates.rental_cost_per_day = body.rentalCostPerDay ?? null;
    if (body.rentalStartDate !== undefined) updates.rental_start_date = body.rentalStartDate ?? null;
    if (body.rentalEndDate !== undefined) updates.rental_end_date = body.rentalEndDate ?? null;
    if (body.totalRentalDays !== undefined) updates.total_rental_days = body.totalRentalDays ?? null;
    if (body.totalRentalCost !== undefined) updates.total_rental_cost = body.totalRentalCost ?? null;
    if (body.fuelCapacity !== undefined) updates.fuel_capacity = body.fuelCapacity ?? null;
    if (body.currentFuelLevel !== undefined) updates.current_fuel_level = body.currentFuelLevel ?? null;
    if (body.mileage !== undefined) updates.mileage = body.mileage ?? null;
    if (body.lastMaintenanceDate !== undefined) updates.last_maintenance_date = body.lastMaintenanceDate ?? null;
    if (body.nextMaintenanceDate !== undefined) updates.next_maintenance_date = body.nextMaintenanceDate ?? null;
    if (body.insuranceExpiry !== undefined) updates.insurance_expiry = body.insuranceExpiry ?? null;
    if (body.registrationExpiry !== undefined) updates.registration_expiry = body.registrationExpiry ?? null;

    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(
        `
        id,
        organization_id,
        vehicle_number,
        name,
        type,
        make,
        model,
        year,
        status,
        site_id,
        site_name,
        operator,
        is_rental,
        vendor,
        rental_cost_per_day,
        rental_start_date,
        rental_end_date,
        total_rental_days,
        total_rental_cost,
        fuel_capacity,
        current_fuel_level,
        mileage,
        last_maintenance_date,
        next_maintenance_date,
        insurance_expiry,
        registration_expiry,
        created_at,
        updated_at,
        created_by,
        updated_by
      `,
      )
      .single();

    if (error || !data) {
      console.error('Error updating vehicle', error);
      return NextResponse.json({ error: 'Failed to update vehicle.' }, { status: 500 });
    }

    return NextResponse.json({ vehicle: mapRowToVehicle(data) });
  } catch (error) {
    console.error('Unexpected error updating vehicle', error);
    return NextResponse.json({ error: 'Unexpected error updating vehicle.' }, { status: 500 });
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
      !['owner', 'admin', 'manager', 'project-manager', 'site-supervisor', 'materials-manager', 'finance-manager', 'executive', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting vehicle', error);
      return NextResponse.json({ error: 'Failed to delete vehicle.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting vehicle', error);
    return NextResponse.json({ error: 'Unexpected error deleting vehicle.' }, { status: 500 });
  }
}

