import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Vehicle } from '@/types/entities';

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

export interface VehiclePayload {
  vehicleNumber: string;
  name?: string | null;
  type: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  status: Vehicle['status'];
  siteId?: string | null;
  siteName?: string | null;
  operator?: string | null;
  isRental: boolean;
  vendor?: string | null;
  rentalCostPerDay?: number | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  totalRentalDays?: number | null;
  totalRentalCost?: number | null;
  fuelCapacity?: number | null;
  currentFuelLevel?: number | null;
  mileage?: number | null;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  insuranceExpiry?: string | null;
  registrationExpiry?: string | null;
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

function mapRowToVehicle(row: any): Vehicle {
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
    currentFuelLevel: row.current_fuel_level !== null ? Number(row.current_fuel_level) : undefined,
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

function mapStatusForInsert(status: Vehicle['status']): string {
  switch (status) {
    case 'available':
    case 'in_use':
    case 'maintenance':
    case 'idle':
    case 'returned':
      return status;
    case 'in_use':
      return 'in_use';
    default:
      return status;
  }
}

export async function GET() {
  try {
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
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles', error);
      return NextResponse.json({ error: 'Failed to load vehicles.' }, { status: 500 });
    }

    const vehicles = (data ?? []).map(mapRowToVehicle);
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error('Unexpected error fetching vehicles', error);
    return NextResponse.json({ error: 'Unexpected error loading vehicles.' }, { status: 500 });
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

    const body = (await request.json()) as VehiclePayload;

    if (!body.vehicleNumber || !body.type) {
      return NextResponse.json({ error: 'Vehicle number and type are required.' }, { status: 400 });
    }

    const payload = {
      organization_id: ctx.organizationId,
      vehicle_number: body.vehicleNumber,
      name: body.name ?? null,
      type: body.type,
      make: body.make ?? null,
      model: body.model ?? null,
      year: body.year ?? null,
      status: mapStatusForInsert(body.status),
      site_id: body.siteId ?? null,
      site_name: body.siteName ?? null,
      operator: body.operator ?? null,
      is_rental: body.isRental,
      vendor: body.vendor ?? null,
      rental_cost_per_day: body.rentalCostPerDay ?? null,
      rental_start_date: body.rentalStartDate ?? null,
      rental_end_date: body.rentalEndDate ?? null,
      total_rental_days: body.totalRentalDays ?? null,
      total_rental_cost: body.totalRentalCost ?? null,
      fuel_capacity: body.fuelCapacity ?? null,
      current_fuel_level: body.currentFuelLevel ?? null,
      mileage: body.mileage ?? null,
      last_maintenance_date: body.lastMaintenanceDate ?? null,
      next_maintenance_date: body.nextMaintenanceDate ?? null,
      insurance_expiry: body.insuranceExpiry ?? null,
      registration_expiry: body.registrationExpiry ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload)
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
      console.error('Error creating vehicle', error);
      return NextResponse.json({ error: 'Failed to create vehicle.' }, { status: 500 });
    }

    return NextResponse.json({ vehicle: mapRowToVehicle(data) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating vehicle', error);
    return NextResponse.json({ error: 'Unexpected error creating vehicle.' }, { status: 500 });
  }
}

