import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { ProjectActivity } from '@/types';

import { ensureMutationAccess, mapRowToActivity, resolveContext } from '../_utils';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('project_activities')
      .select(ACTIVITY_SELECT)
      .eq('organization_id', ctx.organizationId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching project activities:', error);
      return NextResponse.json({ error: 'Failed to load activities.' }, { status: 500 });
    }

    const activities = (data ?? []).map(mapRowToActivity);
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Unexpected error fetching project activities:', error);
    return NextResponse.json({ error: 'Unexpected error fetching activities.' }, { status: 500 });
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

    const body = (await request.json()) as Partial<ProjectActivity>;
    const {
      siteId,
      siteName,
      name,
      description,
      startDate,
      endDate,
      duration,
      progress,
      status,
      dependencies,
      assignedTeam,
      priority,
      category,
      resources,
      milestones,
    } = body;

    if (!siteId || !name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Site, name, start date, and end date are required.' }, { status: 400 });
    }

    const normalizedStatus = (status ?? 'not-started') as ProjectActivity['status'];
    if (!VALID_ACTIVITY_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json({ error: 'Invalid activity status.' }, { status: 400 });
    }

    const normalizedPriority = (priority ?? 'medium') as ProjectActivity['priority'];
    if (!VALID_ACTIVITY_PRIORITIES.includes(normalizedPriority)) {
      return NextResponse.json({ error: 'Invalid activity priority.' }, { status: 400 });
    }

    const normalizedCategory = (category ?? 'Foundation') as ProjectActivity['category'];
    if (!VALID_ACTIVITY_CATEGORIES.includes(normalizedCategory)) {
      return NextResponse.json({ error: 'Invalid activity category.' }, { status: 400 });
    }

    const payload = {
      site_id: siteId,
      site_name: siteName ?? null,
      name,
      description: description ?? null,
      start_date: startDate,
      end_date: endDate,
      duration: typeof duration === 'number' ? duration : Number(duration ?? 0),
      progress: typeof progress === 'number' ? progress : Number(progress ?? 0),
      status: normalizedStatus,
      dependencies: dependencies ?? [],
      assigned_team: assignedTeam ?? null,
      priority: normalizedPriority,
      category: normalizedCategory,
      resources: resources ?? [],
      milestones: Boolean(milestones),
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('project_activities')
      .insert(payload)
      .select(ACTIVITY_SELECT)
      .single();

    if (error || !data) {
      console.error('Error creating project activity:', error);
      return NextResponse.json({ error: 'Failed to create activity.' }, { status: 500 });
    }

    const activity = mapRowToActivity(data);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Unexpected error creating project activity:', error);
    return NextResponse.json({ error: 'Unexpected error creating activity.' }, { status: 500 });
  }
}

