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

type VehicleRow = {
  id: string;
  organization_id: string;
  vehicle_number: string;
  name: string | null;
  type: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: string;
  site_id: string | null;
  site_name: string | null;
  operator: string | null;
  is_rental: boolean | null;
  vendor: string | null;
  rental_cost_per_day: number | string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  total_rental_days: number | string | null;
  total_rental_cost: number | string | null;
  fuel_capacity: number | string | null;
  current_fuel_level: number | string | null;
  mileage: number | string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

function mapRowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    vehicleNumber: row.vehicle_number,
    name: row.name ?? undefined,
    type: row.type,
    make: row.make ?? undefined,
    model: row.model ?? undefined,
    year: row.year ?? undefined,
    status: row.status as Vehicle['status'],
    siteId: row.site_id ?? undefined,
    siteName: row.site_name ?? undefined,
    operator: row.operator ?? undefined,
    isRental: row.is_rental ?? false,
    vendor: row.vendor ?? undefined,
    rentalCostPerDay:
      row.rental_cost_per_day !== null ? Number(row.rental_cost_per_day) : undefined,
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

    // ============================================================================
    // COUNT QUERY - COMMENTED OUT FOR PERFORMANCE (3.56s -> ~0.5s improvement)
    // If you need exact count in the future, uncomment this section
    // ============================================================================
    // Get total count for pagination
    // const { count, error: countError } = await supabase
    //   .from('vehicles')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('organization_id', ctx.organizationId);
    //
    // if (countError) {
    //   console.error('Error counting vehicles', countError);
    //   return NextResponse.json({ error: 'Failed to load vehicles.' }, { status: 500 });
    // }
    // ============================================================================

    // Fetch paginated data - fetch limit+1 to check if there's more data (faster than count)
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit); // Fetch limit+1 to check for more data

    if (error) {
      console.error('Error fetching vehicles', error);
      return NextResponse.json({ error: 'Failed to load vehicles.' }, { status: 500 });
    }

    // Check if there's more data by checking if we got more than limit
    const hasMore = (data ?? []).length > limit;
    // Return only the requested limit (slice off the extra one)
    const vehiclesData = (data ?? []).slice(0, limit);
    const vehicles = vehiclesData.map((row) => mapRowToVehicle(row as VehicleRow));

    // ============================================================================
    // OLD PAGINATION WITH COUNT - COMMENTED OUT
    // If you need exact count in the future, uncomment and use this
    // ============================================================================
    // const total = count ?? 0;
    // const totalPages = Math.ceil(total / limit);
    // ============================================================================

    const response = NextResponse.json({
      vehicles,
      pagination: {
        page,
        limit,
        hasMore, // Use hasMore instead of total/totalPages for faster performance
        // total,      // Uncomment if using count query above
        // totalPages, // Uncomment if using count query above
      },
    });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
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

    return NextResponse.json({ vehicle: mapRowToVehicle(data as VehicleRow) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating vehicle', error);
    return NextResponse.json({ error: 'Unexpected error creating vehicle.' }, { status: 500 });
  }
}
