import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Site, SiteInput } from '@/types/sites';

type Params = {
  params: {
    id: string;
  };
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

export async function GET(_: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { id } = params;

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

    return NextResponse.json({ site: mapRowToSite(data) });
  } catch (error) {
    console.error('Unexpected error retrieving site', error);
    return NextResponse.json({ error: 'Unexpected error retrieving site.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!['owner', 'admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { id } = params;

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

    return NextResponse.json({ site: mapRowToSite(updated) });
  } catch (error) {
    console.error('Unexpected error updating site', error);
    return NextResponse.json({ error: 'Unexpected error updating site.' }, { status: 500 });
  }
}

