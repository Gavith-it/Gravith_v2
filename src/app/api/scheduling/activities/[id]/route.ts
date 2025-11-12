import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { ProjectActivity } from '@/types';

import { ensureMutationAccess, mapRowToActivity, resolveContext } from '../../_utils';

const ACTIVITY_SELECT = `
  id,
  site_id,
  site_name,
  name,
  description,
  start_date,
  end_date,
  duration,
  progress,
  status,
  dependencies,
  assigned_team,
  priority,
  category,
  resources,
  milestones,
  organization_id,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

const VALID_ACTIVITY_STATUSES: ProjectActivity['status'][] = ['not-started', 'in-progress', 'completed', 'delayed'];
const VALID_ACTIVITY_PRIORITIES: ProjectActivity['priority'][] = ['low', 'medium', 'high', 'critical'];
const VALID_ACTIVITY_CATEGORIES: ProjectActivity['category'][] = ['Foundation', 'Structure', 'MEP', 'Finishing', 'External'];

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('project_activities')
      .select(ACTIVITY_SELECT)
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching project activity:', error);
      return NextResponse.json({ error: 'Failed to load activity.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Activity not found.' }, { status: 404 });
    }

    return NextResponse.json({ activity: mapRowToActivity(data) });
  } catch (error) {
    console.error('Unexpected error fetching project activity:', error);
    return NextResponse.json({ error: 'Unexpected error fetching activity.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

    const body = (await request.json()) as Partial<ProjectActivity>;

    const updates: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.siteId !== undefined) updates.site_id = body.siteId;
    if (body.siteName !== undefined) updates.site_name = body.siteName ?? null;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description ?? null;
    if (body.startDate !== undefined) updates.start_date = body.startDate;
    if (body.endDate !== undefined) updates.end_date = body.endDate;

    if (body.duration !== undefined) {
      const duration = Number(body.duration);
      if (Number.isNaN(duration) || duration < 0) {
        return NextResponse.json({ error: 'Duration must be non-negative.' }, { status: 400 });
      }
      updates.duration = duration;
    }

    if (body.progress !== undefined) {
      const progress = Number(body.progress);
      if (Number.isNaN(progress) || progress < 0 || progress > 100) {
        return NextResponse.json({ error: 'Progress must be between 0 and 100.' }, { status: 400 });
      }
      updates.progress = progress;
    }

    if (body.status !== undefined) {
      if (!VALID_ACTIVITY_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid activity status.' }, { status: 400 });
      }
      updates.status = body.status;
    }

    if (body.dependencies !== undefined) updates.dependencies = body.dependencies ?? [];
    if (body.assignedTeam !== undefined) updates.assigned_team = body.assignedTeam ?? null;

    if (body.priority !== undefined) {
      if (!VALID_ACTIVITY_PRIORITIES.includes(body.priority)) {
        return NextResponse.json({ error: 'Invalid activity priority.' }, { status: 400 });
      }
      updates.priority = body.priority;
    }

    if (body.category !== undefined) {
      if (!VALID_ACTIVITY_CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: 'Invalid activity category.' }, { status: 400 });
      }
      updates.category = body.category;
    }

    if (body.resources !== undefined) updates.resources = body.resources ?? [];
    if (body.milestones !== undefined) updates.milestones = Boolean(body.milestones);

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'No updates provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('project_activities')
      .update(updates)
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId)
      .select(ACTIVITY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating project activity:', error);
      return NextResponse.json({ error: 'Failed to update activity.' }, { status: 500 });
    }

    return NextResponse.json({ activity: mapRowToActivity(data) });
  } catch (error) {
    console.error('Unexpected error updating project activity:', error);
    return NextResponse.json({ error: 'Unexpected error updating activity.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

    const { error } = await supabase
      .from('project_activities')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting project activity:', error);
      return NextResponse.json({ error: 'Failed to delete activity.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting project activity:', error);
    return NextResponse.json({ error: 'Unexpected error deleting activity.' }, { status: 500 });
  }
}

