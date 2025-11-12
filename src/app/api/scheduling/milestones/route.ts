import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { ProjectMilestone } from '@/types';

import { ensureMutationAccess, mapRowToMilestone, resolveContext } from '../_utils';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select(MILESTONE_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching project milestones:', error);
      return NextResponse.json({ error: 'Failed to load milestones.' }, { status: 500 });
    }

    const milestones = (data ?? []).map(mapRowToMilestone);
    return NextResponse.json({ milestones });
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

    const milestone = mapRowToMilestone(data);
    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Unexpected error creating project milestone:', error);
    return NextResponse.json({ error: 'Unexpected error creating milestone.' }, { status: 500 });
  }
}

