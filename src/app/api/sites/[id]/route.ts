import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Site, SiteInput } from '@/types/sites';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type SiteRow = {
  id: string;
  name: string;
  location: string;
  status: string;
  start_date: string | null;
  expected_end_date: string | null;
  budget: number | string | null;
  spent: number | string | null;
  progress: number | null;
  description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  organization_id?: string;
};

function mapRowToSite(row: SiteRow): Site {
  return {
    id: row.id,
    name: row.name,
    location: row.location ?? '',
    status: (row.status as Site['status']) ?? 'Active',
    startDate: row.start_date ?? '',
    expectedEndDate: row.expected_end_date ?? '',
    budget: Number(row.budget ?? 0),
    spent: Number(row.spent ?? 0),
    progress: Number(row.progress ?? 0),
    description: row.description ?? '',
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
    .select('organization_id, organization_role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.organization_role,
  };
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sites')
      .select(
        'id, name, location, status, start_date, expected_end_date, budget, spent, progress, description, created_at, updated_at, organization_id',
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error loading site', error);
      return NextResponse.json({ error: 'Failed to load site.' }, { status: 500 });
    }

    if (!data || data.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    }

    const response = NextResponse.json({ site: mapRowToSite(data as SiteRow) });

    // Disable caching to ensure fresh data in production
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error retrieving site', error);
    return NextResponse.json({ error: 'Unexpected error retrieving site.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager', 'user'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site before update', fetchError);
      return NextResponse.json({ error: 'Unable to update site.' }, { status: 500 });
    }

    if (!site || site.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<SiteInput> & {
      progress?: number;
      spent?: number;
    };

    const updatePayload: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.name) updatePayload['name'] = body.name;
    if (body.location) updatePayload['location'] = body.location;
    if (body.status) updatePayload['status'] = body.status;
    if (body.startDate) updatePayload['start_date'] = body.startDate;
    if (body.expectedEndDate) updatePayload['expected_end_date'] = body.expectedEndDate;
    if (typeof body.budget === 'number') updatePayload['budget'] = body.budget;
    if (typeof body.spent === 'number') updatePayload['spent'] = body.spent;
    if (typeof body.progress === 'number') updatePayload['progress'] = body.progress;
    if (typeof body.description === 'string') updatePayload['description'] = body.description;

    const { data: updated, error: updateError } = await supabase
      .from('sites')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, name, location, status, start_date, expected_end_date, budget, spent, progress, description, created_at, updated_at',
      )
      .single();

    if (updateError || !updated) {
      console.error('Error updating site', updateError);
      return NextResponse.json({ error: 'Failed to update site.' }, { status: 500 });
    }

    const response = NextResponse.json({ site: mapRowToSite(updated as SiteRow) });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error updating site', error);
    return NextResponse.json({ error: 'Unexpected error updating site.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager', 'user'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // Check if site exists
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site before delete', fetchError);
      return NextResponse.json({ error: 'Unable to verify site.' }, { status: 500 });
    }

    if (!site || site.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    }

    // Check for transactions linked to this site
    // 1. Check material purchases
    const { count: purchaseCount, error: purchaseCheckError } = await supabase
      .from('material_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (purchaseCheckError) {
      console.error('Error checking purchase dependencies', purchaseCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    // 2. Check expenses
    const { count: expenseCount, error: expenseCheckError } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (expenseCheckError) {
      console.error('Error checking expense dependencies', expenseCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    // 3. Check payments
    const { count: paymentCount, error: paymentCheckError } = await supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (paymentCheckError) {
      console.error('Error checking payment dependencies', paymentCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    // 4. Check vehicle usage
    const { count: vehicleUsageCount, error: vehicleUsageCheckError } = await supabase
      .from('vehicle_usage')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (vehicleUsageCheckError) {
      console.error('Error checking vehicle usage dependencies', vehicleUsageCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    // 5. Check work progress
    const { count: workProgressCount, error: workProgressCheckError } = await supabase
      .from('work_progress_entries')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (workProgressCheckError) {
      console.error('Error checking work progress dependencies', workProgressCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    // 6. Check material masters (optional - sites can be null)
    const { count: materialCount, error: materialCheckError } = await supabase
      .from('material_masters')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', id)
      .eq('organization_id', ctx.organizationId);

    if (materialCheckError) {
      console.error('Error checking material master dependencies', materialCheckError);
      return NextResponse.json({ error: 'Unable to verify site dependencies.' }, { status: 500 });
    }

    const totalTransactions =
      (purchaseCount ?? 0) +
      (expenseCount ?? 0) +
      (paymentCount ?? 0) +
      (vehicleUsageCount ?? 0) +
      (workProgressCount ?? 0) +
      (materialCount ?? 0);

    if (totalTransactions > 0) {
      const dependencies: string[] = [];
      if ((purchaseCount ?? 0) > 0) dependencies.push(`${purchaseCount} purchase(s)`);
      if ((expenseCount ?? 0) > 0) dependencies.push(`${expenseCount} expense(s)`);
      if ((paymentCount ?? 0) > 0) dependencies.push(`${paymentCount} payment(s)`);
      if ((vehicleUsageCount ?? 0) > 0)
        dependencies.push(`${vehicleUsageCount} vehicle usage record(s)`);
      if ((workProgressCount ?? 0) > 0)
        dependencies.push(`${workProgressCount} work progress entry/entries`);
      if ((materialCount ?? 0) > 0) dependencies.push(`${materialCount} material(s)`);

      return NextResponse.json(
        {
          error: 'Cannot delete site with existing transactions.',
          dependencies: dependencies.join(', '),
          counts: {
            purchases: purchaseCount ?? 0,
            expenses: expenseCount ?? 0,
            payments: paymentCount ?? 0,
            vehicleUsage: vehicleUsageCount ?? 0,
            workProgress: workProgressCount ?? 0,
            materials: materialCount ?? 0,
          },
        },
        { status: 400 },
      );
    }

    // All checks passed - delete the site
    const { error: deleteError } = await supabase.from('sites').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting site', deleteError);
      return NextResponse.json({ error: 'Failed to delete site.' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error deleting site', error);
    return NextResponse.json({ error: 'Unexpected error deleting site.' }, { status: 500 });
  }
}
