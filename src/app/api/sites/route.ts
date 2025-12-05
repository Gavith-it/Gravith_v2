import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { Site, SiteInput } from '@/types/sites';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveOrganizationId(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

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

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('Error counting sites', countError);
      return NextResponse.json({ error: 'Failed to load sites.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('sites')
      .select(
        'id, name, location, status, start_date, expected_end_date, budget, spent, progress, description, created_at, updated_at',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching sites', error);
      return NextResponse.json({ error: 'Failed to load sites.' }, { status: 500 });
    }

    const sites = (data ?? []).map((row) => mapRowToSite(row as SiteRow));
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      sites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    // Disable caching to ensure fresh data in production
    // This prevents Vercel edge cache from serving stale data after mutations
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
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

    const response = NextResponse.json({ site: mapRowToSite(data as SiteRow) }, { status: 201 });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error creating site', error);
    return NextResponse.json({ error: 'Unexpected error creating site.' }, { status: 500 });
  }
}
