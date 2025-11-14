import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { WorkProgressEntry, WorkProgressMaterial } from '@/types/entities';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type MutationRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'project-manager'
  | 'site-supervisor'
  | 'materials-manager'
  | 'finance-manager'
  | 'executive'
  | 'user';

interface WorkProgressPayload {
  siteId?: string | null;
  siteName: string;
  workType: string;
  description?: string | null;
  workDate: string;
  unit: string;
  length?: number | null;
  breadth?: number | null;
  thickness?: number | null;
  totalQuantity: number;
  laborHours?: number | null;
  progressPercentage?: number | null;
  status: 'in_progress' | 'completed' | 'on_hold';
  notes?: string | null;
  photos?: string[];
  materials?: Array<{
    materialId?: string | null;
    purchaseId?: string | null;
    materialName: string;
    unit: string;
    quantity: number;
    balanceQuantity?: number | null;
  }>;
}

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
    .select('organization_id, organization_role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  if (profile.is_active === false) {
    return { error: 'Inactive user.' as const };
  }

  return {
    organizationId: profile.organization_id as string,
    role: profile.organization_role as MutationRole,
    userId: user.id,
  };
}

type WorkProgressMaterialRow = {
  id: string;
  work_progress_id: string;
  organization_id: string;
  material_id: string | null;
  purchase_id: string | null;
  material_name: string;
  unit: string;
  quantity: number | string | null;
  balance_quantity: number | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type WorkProgressRow = {
  id: string;
  organization_id: string;
  site_id: string | null;
  site_name: string;
  work_type: string;
  description: string | null;
  work_date: string;
  unit: string;
  length: number | string | null;
  breadth: number | string | null;
  thickness: number | string | null;
  total_quantity: number | string;
  labor_hours: number | string | null;
  progress_percentage: number | string | null;
  status: WorkProgressEntry['status'];
  notes: string | null;
  photos: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  materials?: WorkProgressMaterialRow[] | null;
};

function mapRowToWorkProgress(row: WorkProgressRow): WorkProgressEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id ?? null,
    siteName: row.site_name,
    workType: row.work_type,
    description: row.description ?? undefined,
    workDate: row.work_date,
    unit: row.unit,
    length: row.length !== null ? Number(row.length) : null,
    breadth: row.breadth !== null ? Number(row.breadth) : null,
    thickness: row.thickness !== null ? Number(row.thickness) : null,
    totalQuantity: Number(row.total_quantity),
    laborHours: Number(row.labor_hours ?? 0),
    progressPercentage: Number(row.progress_percentage ?? 0),
    status: row.status,
    notes: row.notes ?? undefined,
    photos: Array.isArray(row.photos) ? row.photos : [],
    materials: (row.materials ?? []).map(
      (material: WorkProgressMaterialRow): WorkProgressMaterial => ({
        id: material.id,
        workProgressId: material.work_progress_id,
        materialId: material.material_id,
        purchaseId: material.purchase_id,
        materialName: material.material_name,
        unit: material.unit,
        quantity: Number(material.quantity ?? 0),
        balanceQuantity:
          material.balance_quantity !== null && material.balance_quantity !== undefined
            ? Number(material.balance_quantity)
            : null,
        organizationId: material.organization_id,
        createdAt: material.created_at ?? '',
        updatedAt: material.updated_at ?? '',
      }),
    ),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('work_progress_entries')
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by,
        materials:work_progress_materials(
          id,
          work_progress_id,
          organization_id,
          material_id,
          purchase_id,
          material_name,
          unit,
          quantity,
          balance_quantity,
          created_at,
          updated_at
        )
      `,
      )
      .eq('organization_id', ctx.organizationId)
      .order('work_date', { ascending: false });

    if (error) {
      console.error('Error fetching work progress entries', error);
      return NextResponse.json({ error: 'Failed to load work progress data.' }, { status: 500 });
    }

    const entries = (data ?? []).map((row) =>
      mapRowToWorkProgress(row as unknown as WorkProgressRow),
    );
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Unexpected error fetching work progress entries', error);
    return NextResponse.json({ error: 'Unexpected error loading work progress.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      ![
        'owner',
        'admin',
        'manager',
        'project-manager',
        'site-supervisor',
        'materials-manager',
        'finance-manager',
        'executive',
        'user',
      ].includes(ctx.role)
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as WorkProgressPayload;

    if (!body.siteName || !body.workType || !body.workDate || !body.unit) {
      return NextResponse.json(
        { error: 'Missing required work progress fields.' },
        { status: 400 },
      );
    }

    if (typeof body.totalQuantity !== 'number' || Number.isNaN(body.totalQuantity)) {
      return NextResponse.json({ error: 'Invalid total quantity.' }, { status: 400 });
    }

    const entryPayload = {
      organization_id: ctx.organizationId,
      site_id: body.siteId ?? null,
      site_name: body.siteName,
      work_type: body.workType,
      description: body.description ?? null,
      work_date: body.workDate,
      unit: body.unit,
      length: body.length ?? null,
      breadth: body.breadth ?? null,
      thickness: body.thickness ?? null,
      total_quantity: body.totalQuantity,
      labor_hours: body.laborHours ?? 0,
      progress_percentage: body.progressPercentage ?? 0,
      status: body.status,
      notes: body.notes ?? null,
      photos: body.photos ?? [],
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data: insertedEntry, error: insertError } = await supabase
      .from('work_progress_entries')
      .insert(entryPayload)
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by
      `,
      )
      .single();

    if (insertError || !insertedEntry) {
      console.error('Error inserting work progress entry', insertError);
      return NextResponse.json({ error: 'Failed to create work progress entry.' }, { status: 500 });
    }

    const insertedRow = insertedEntry as WorkProgressRow;

    const materialsPayload = (body.materials ?? []).map((material) => ({
      work_progress_id: insertedRow.id,
      organization_id: ctx.organizationId,
      material_id: material.materialId ?? null,
      purchase_id: material.purchaseId ?? null,
      material_name: material.materialName,
      unit: material.unit,
      quantity: material.quantity,
      balance_quantity: material.balanceQuantity ?? null,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    }));

    if (materialsPayload.length > 0) {
      const { error: materialsError } = await supabase
        .from('work_progress_materials')
        .insert(materialsPayload);

      if (materialsError) {
        console.error('Error inserting work progress materials', materialsError);
        // Attempt to clean up orphan entry
        await supabase.from('work_progress_entries').delete().eq('id', insertedRow.id);
        return NextResponse.json(
          { error: 'Failed to create work progress entry materials.' },
          { status: 500 },
        );
      }
    }

    const { data: entryWithMaterials, error: fetchError } = await supabase
      .from('work_progress_entries')
      .select(
        `
        id,
        organization_id,
        site_id,
        site_name,
        work_type,
        description,
        work_date,
        unit,
        length,
        breadth,
        thickness,
        total_quantity,
        labor_hours,
        progress_percentage,
        status,
        notes,
        photos,
        created_at,
        updated_at,
        created_by,
        updated_by,
        materials:work_progress_materials(
          id,
          work_progress_id,
          organization_id,
          material_id,
          purchase_id,
          material_name,
          unit,
          quantity,
          balance_quantity,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', insertedRow.id)
      .maybeSingle();

    if (fetchError || !entryWithMaterials) {
      console.error('Error fetching inserted work progress entry', fetchError);
      return NextResponse.json(
        { error: 'Failed to load created work progress entry.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      entry: mapRowToWorkProgress(entryWithMaterials as unknown as WorkProgressRow),
    });
  } catch (error) {
    console.error('Unexpected error creating work progress entry', error);
    return NextResponse.json(
      { error: 'Unexpected error creating work progress entry.' },
      { status: 500 },
    );
  }
}
