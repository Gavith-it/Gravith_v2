import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

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

    // Check if site exists
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, name, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching site', fetchError);
      return NextResponse.json({ error: 'Unable to verify site.' }, { status: 500 });
    }

    if (!site || site.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    }

    // Check for transactions linked to this site
    const [purchaseResult, expenseResult, paymentResult, vehicleUsageResult, workProgressResult, materialResult] =
      await Promise.all([
        supabase
          .from('material_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
        supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
        supabase
          .from('vehicle_usage')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
        supabase
          .from('work_progress_entries')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
        supabase
          .from('material_masters')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', id)
          .eq('organization_id', ctx.organizationId),
      ]);

    const purchaseCount = purchaseResult.count ?? 0;
    const expenseCount = expenseResult.count ?? 0;
    const paymentCount = paymentResult.count ?? 0;
    const vehicleUsageCount = vehicleUsageResult.count ?? 0;
    const workProgressCount = workProgressResult.count ?? 0;
    const materialCount = materialResult.count ?? 0;

    const totalTransactions =
      purchaseCount + expenseCount + paymentCount + vehicleUsageCount + workProgressCount + materialCount;

    return NextResponse.json({
      hasTransactions: totalTransactions > 0,
      counts: {
        purchases: purchaseCount,
        expenses: expenseCount,
        payments: paymentCount,
        vehicleUsage: vehicleUsageCount,
        workProgress: workProgressCount,
        materials: materialCount,
      },
    });
  } catch (error) {
    console.error('Unexpected error checking site dependencies', error);
    return NextResponse.json({ error: 'Unexpected error checking site dependencies.' }, { status: 500 });
  }
}

