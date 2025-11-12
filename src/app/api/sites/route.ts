import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Site, SiteInput } from '@/types/sites';

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

async function resolveOrganizationId(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return { organizationId: profile.organization_id, userId: user.id };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveOrganizationId(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const { data, error } = await supabase
      .from('sites')
      .select(
        'id, name, location, status, start_date, expected_end_date, budget, spent, progress, description, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sites', error);
      return NextResponse.json({ error: 'Failed to load sites.' }, { status: 500 });
    }

    const sites = (data ?? []).map((row) => mapRowToSite(row as SiteRow));
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Unexpected error fetching sites', error);
    return NextResponse.json({ error: 'Unexpected error loading sites.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveOrganizationId(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const body = (await request.json()) as Partial<SiteInput>;
    const { name, location, startDate, expectedEndDate, status, budget, description } = body;

    if (!name || !location || !startDate || !expectedEndDate || !status || !budget) {
      return NextResponse.json({ error: 'Missing required site fields.' }, { status: 400 });
    }

    const payload = {
      name,
      location,
      status,
      start_date: startDate,
      expected_end_date: expectedEndDate,
      budget,
      spent: 0,
      progress: 0,
      description: description ?? '',
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('sites')
      .insert(payload)
      .select(
        'id, name, location, status, start_date, expected_end_date, budget, spent, progress, description, created_at, updated_at',
      )
      .single();

    if (error || !data) {
      console.error('Error creating site', error);
      return NextResponse.json({ error: 'Failed to create site.' }, { status: 500 });
    }

    return NextResponse.json({ site: mapRowToSite(data as SiteRow) }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating site', error);
    return NextResponse.json({ error: 'Unexpected error creating site.' }, { status: 500 });
  }
}
