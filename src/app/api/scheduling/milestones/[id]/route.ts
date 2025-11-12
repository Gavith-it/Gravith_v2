import { NextResponse, type NextRequest } from 'next/server';

import { ensureMutationAccess, mapRowToMilestone, resolveContext } from '../../_utils';
import type { MilestoneRow } from '../../_utils';

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .select(MILESTONE_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project milestone:', error);
      return NextResponse.json({ error: 'Failed to load milestone.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Milestone not found.' }, { status: 404 });
    }

    return NextResponse.json({ milestone: mapRowToMilestone(data as MilestoneRow) });
  } catch (error) {
    console.error('Unexpected error fetching project milestone:', error);
    return NextResponse.json({ error: 'Unexpected error fetching milestone.' }, { status: 500 });
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

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as Partial<ProjectMilestone>;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.siteId !== undefined) updates['site_id'] = body.siteId;
    if (body.name !== undefined) updates['name'] = body.name;
    if (body.date !== undefined) updates['date'] = body.date;
    if (body.description !== undefined) updates['description'] = body.description ?? null;

    if (body.status !== undefined) {
      if (!VALID_MILESTONE_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid milestone status.' }, { status: 400 });
      }
      updates['status'] = body.status;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('project_milestones')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(MILESTONE_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating project milestone:', error);
      return NextResponse.json({ error: 'Failed to update milestone.' }, { status: 500 });
    }

    return NextResponse.json({ milestone: mapRowToMilestone(data as MilestoneRow) });
  } catch (error) {
    console.error('Unexpected error updating project milestone:', error);
    return NextResponse.json({ error: 'Unexpected error updating milestone.' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const accessError = ensureMutationAccess(ctx.role);
    if (accessError) {
      return accessError;
    }

    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting project milestone:', error);
      return NextResponse.json({ error: 'Failed to delete milestone.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting project milestone:', error);
    return NextResponse.json({ error: 'Unexpected error deleting milestone.' }, { status: 500 });
  }
}
