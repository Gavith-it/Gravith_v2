import { NextResponse } from 'next/server';

import { ensureMutationAccess, mapRowToMilestone, resolveContext } from '../_utils';
import type { MilestoneRow } from '../_utils';

import { createClient } from '@/lib/supabase/server';
import type { ProjectMilestone } from '@/types';


const MILESTONE_SELECT = `
  id,
  site_id,
  name,
  date,
  description,
  status,
  organization_id,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

const VALID_MILESTONE_STATUSES: ProjectMilestone['status'][] = ['pending', 'achieved'];

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
        { error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.' },
        { status: 400 },
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('project_milestones')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId);

    if (countError) {
      console.error('Error counting milestones', countError);
      return NextResponse.json({ error: 'Failed to load milestones.' }, { status: 500 });
    }

    // Fetch paginated data
    const { data, error } = await supabase
      .from('project_milestones')
      .select(MILESTONE_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching project milestones:', error);
      return NextResponse.json({ error: 'Failed to load milestones.' }, { status: 500 });
    }

    const milestones = (data ?? []).map((row) => mapRowToMilestone(row as MilestoneRow));
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      milestones,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120',
    );

    return response;
  } catch (error) {
    console.error('Unexpected error fetching project milestones:', error);
    return NextResponse.json({ error: 'Unexpected error fetching milestones.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as Partial<ProjectMilestone>;
    const { siteId, name, date, description, status } = body;

    if (!siteId || !name || !date) {
      return NextResponse.json({ error: 'Site, name, and date are required.' }, { status: 400 });
    }

    const normalizedStatus = (status ?? 'pending') as ProjectMilestone['status'];
    if (!VALID_MILESTONE_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid milestone status.' }, { status: 400 });
    }

    const payload = {
      site_id: siteId,
      name,
      date,
      description: description ?? null,
      status: normalizedStatus,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('project_milestones')
      .insert(payload)
      .select(MILESTONE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating project milestone:', error);
      return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
    }

    const milestone = mapRowToMilestone(data as MilestoneRow);
    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Unexpected error creating project milestone:', error);
    return NextResponse.json({ error: 'Unexpected error creating milestone.' }, { status: 500 });
  }
}
