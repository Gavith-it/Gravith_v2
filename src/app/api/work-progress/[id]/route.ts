import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { WorkProgressEntry, WorkProgressMaterial } from '@/types/entities';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface WorkProgressPayload {
  siteId?: string | null;
  siteName?: string;
  workType?: string;
  description?: string | null;
  workDate?: string;
  unit?: string;
  length?: number | null;
  breadth?: number | null;
  thickness?: number | null;
  totalQuantity?: number;
  laborHours?: number | null;
  progressPercentage?: number | null;
  status?: 'in_progress' | 'completed' | 'on_hold';
  notes?: string | null;
  photos?: string[];
  materials?: Array<{
    id?: string;
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

const MUTATION_ROLES: MutationRole[] = [
  'owner',
  'admin',
  'manager',
  'project-manager',
  'site-supervisor',
  'materials-manager',
  'finance-manager',
  'executive',
  'user',
];

export async function GET(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
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
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error loading work progress entry', error);
      return NextResponse.json({ error: 'Failed to load work progress entry.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Work progress entry not found.' }, { status: 404 });
    }

    return NextResponse.json({
      entry: mapRowToWorkProgress(data as unknown as WorkProgressRow),
    });
  } catch (error) {
    console.error('Unexpected error loading work progress entry', error);
    return NextResponse.json(
      { error: 'Unexpected error loading work progress entry.' },
      { status: 500 },
    );
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

    if (!MUTATION_ROLES.includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as WorkProgressPayload;

    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.siteId !== undefined) updates['site_id'] = body.siteId;
    if (body.siteName !== undefined) updates['site_name'] = body.siteName;
    if (body.workType !== undefined) updates['work_type'] = body.workType;
    if (body.description !== undefined) updates['description'] = body.description;
    if (body.workDate !== undefined) updates['work_date'] = body.workDate;
    if (body.unit !== undefined) updates['unit'] = body.unit;
    if (body.length !== undefined) updates['length'] = body.length;
    if (body.breadth !== undefined) updates['breadth'] = body.breadth;
    if (body.thickness !== undefined) updates['thickness'] = body.thickness;
    if (body.totalQuantity !== undefined) updates['total_quantity'] = body.totalQuantity;
    if (body.laborHours !== undefined) updates['labor_hours'] = body.laborHours;
    if (body.progressPercentage !== undefined)
      updates['progress_percentage'] = body.progressPercentage;
    if (body.status !== undefined) updates['status'] = body.status;
    if (body.notes !== undefined) updates['notes'] = body.notes;
    if (body.photos !== undefined) updates['photos'] = body.photos;

    const { data: updatedEntry, error: updateError } = await supabase
      .from('work_progress_entries')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
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

    if (updateError || !updatedEntry) {
      console.error('Error updating work progress entry', updateError);
      return NextResponse.json({ error: 'Failed to update work progress entry.' }, { status: 500 });
    }

    if (Array.isArray(body.materials)) {
      const { error: deleteError } = await supabase
        .from('work_progress_materials')
        .delete()
        .eq('work_progress_id', id)
        .eq('organization_id', ctx.organizationId);

      if (deleteError) {
        console.error('Error clearing existing materials', deleteError);
        return NextResponse.json(
          { error: 'Failed to update work progress materials.' },
          { status: 500 },
        );
      }

      if (body.materials.length > 0) {
        const materialRows = body.materials.map((material) => ({
          work_progress_id: id,
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

        const { error: insertError } = await supabase
          .from('work_progress_materials')
          .insert(materialRows);

        if (insertError) {
          console.error('Error inserting updated materials', insertError);
          return NextResponse.json(
            { error: 'Failed to update work progress materials.' },
            { status: 500 },
          );
        }
      }
    }

    const { data: refreshedEntry, error: fetchError } = await supabase
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
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (fetchError || !refreshedEntry) {
      console.error('Error fetching updated entry', fetchError);
      return NextResponse.json(
        { error: 'Failed to load updated work progress entry.' },
        { status: 500 },
      );
    }

    // Recalculate utilization_qty for affected materials
    // Get old entry data before update
    const { data: oldEntryData } = await supabase
      .from('work_progress_entries')
      .select('site_id')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    const { data: oldMaterialsData } = await supabase
      .from('work_progress_materials')
      .select('material_id')
      .eq('work_progress_id', id)
      .eq('organization_id', ctx.organizationId);

    const oldSiteId: string | null = oldEntryData ? (oldEntryData as { site_id: string | null }).site_id : null;
    const newSiteId: string | null = body.siteId !== undefined ? (body.siteId ?? null) : ((refreshedEntry as { site_id: string | null }).site_id ?? null);
    const materialsToRecalculate = new Set<string>();

    // Get materials from old entry
    if (oldMaterialsData) {
      (oldMaterialsData as Array<{ material_id: string | null }>).forEach((m) => {
        if (m.material_id) materialsToRecalculate.add(m.material_id);
      });
    }

    // Get materials from new entry
    if (body.materials) {
      body.materials.forEach((m) => {
        if (m.materialId) materialsToRecalculate.add(m.materialId);
      });
    }

    // Recalculate for old site if it changed
    if (oldSiteId && oldSiteId !== newSiteId) {
      try {
        const materialIds: string[] = Array.from(materialsToRecalculate).filter((id): id is string => typeof id === 'string');
        for (const materialId of materialIds) {
          await recalculateUtilizationQty(supabase, ctx, materialId, oldSiteId);
        }
      } catch (error) {
        console.error('Error recalculating utilization_qty for old site', error);
      }
    }

    // Recalculate for new site
    if (materialsToRecalculate.size > 0 && newSiteId) {
      try {
        const materialIds: string[] = Array.from(materialsToRecalculate).filter((id): id is string => typeof id === 'string');
        for (const materialId of materialIds) {
          await recalculateUtilizationQty(supabase, ctx, materialId, newSiteId);
        }
      } catch (error) {
        console.error('Error recalculating utilization_qty for new site', error);
        // Don't fail the update if utilization_qty update fails
      }
    }

    const response = NextResponse.json({
      entry: mapRowToWorkProgress(refreshedEntry as unknown as WorkProgressRow),
    });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error updating work progress entry', error);
    return NextResponse.json(
      { error: 'Unexpected error updating work progress entry.' },
      { status: 500 },
    );
  }
}

// Helper function to recalculate utilization_qty from all work progress entries for a material+site combination
async function recalculateUtilizationQty(
  supabase: SupabaseServerClient,
  ctx: { organizationId: string; userId: string },
  materialId: string,
  siteId: string | null | undefined,
) {
  try {
    if (!siteId) {
      return;
    }

    // First, get all work progress entry IDs for this site
    const { data: workProgressEntries, error: entriesError } = await supabase
      .from('work_progress_entries')
      .select('id')
      .eq('site_id', siteId)
      .eq('organization_id', ctx.organizationId);

    if (entriesError) {
      console.error('Error fetching work progress entries for utilization_qty calculation', entriesError);
      return;
    }

    const entryIds = (workProgressEntries ?? []).map((entry) => entry.id);
    let totalUtilizationQty = 0;

    if (entryIds.length > 0) {
      // Sum all material quantities consumed in work progress entries for this material+site combination
      const { data: materialsData, error: materialsError } = await supabase
        .from('work_progress_materials')
        .select('quantity')
        .eq('material_id', materialId)
        .eq('organization_id', ctx.organizationId)
        .in('work_progress_id', entryIds);

      if (materialsError) {
        console.error('Error fetching work progress materials for utilization_qty calculation', materialsError);
        return;
      }

      totalUtilizationQty = (materialsData ?? []).reduce(
        (sum, material) => sum + Number((material as { quantity: number | string | null }).quantity ?? 0),
        0,
      );
    }

    // Check if allocation exists
    const { data: existingAllocation, error: allocationError } = await supabase
      .from('material_site_allocations')
      .select('id')
      .eq('material_id', materialId)
      .eq('site_id', siteId)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (allocationError && allocationError.code !== 'PGRST116') {
      console.error('Error checking site allocation', allocationError);
      return;
    }

    if (existingAllocation) {
      const { error: updateError } = await supabase
        .from('material_site_allocations')
        .update({ utilization_qty: totalUtilizationQty, updated_by: ctx.userId })
        .eq('id', String(existingAllocation.id));

      if (updateError) {
        console.error('Error updating site allocation utilization_qty', updateError);
      }
    }
  } catch (error) {
    console.error('Error recalculating utilization_qty', error);
  }
}

export async function DELETE(_: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!MUTATION_ROLES.includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    // Get entry data before deleting to recalculate utilization_qty
    const { data: entryData } = await supabase
      .from('work_progress_entries')
      .select('site_id, materials:work_progress_materials(material_id)')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    const { error } = await supabase
      .from('work_progress_entries')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId);

    if (error) {
      console.error('Error deleting work progress entry', error);
      return NextResponse.json({ error: 'Failed to delete work progress entry.' }, { status: 500 });
    }

    // Recalculate utilization_qty for affected materials
    if (entryData && !('error' in entryData)) {
      const entryDataTyped = entryData as unknown as { site_id: string | null; materials?: Array<{ material_id: string | null }> };
      const siteId = entryDataTyped.site_id;
      const materials = Array.isArray(entryDataTyped.materials) ? entryDataTyped.materials : [];
      
      if (siteId) {
        try {
          for (const material of materials) {
            if (material.material_id) {
              await recalculateUtilizationQty(supabase, ctx, material.material_id, siteId);
            }
          }
        } catch (error) {
          console.error('Error recalculating utilization_qty', error);
          // Don't fail the deletion if utilization_qty update fails
        }
      }
    }

    const response = NextResponse.json({ success: true });

    // Invalidate cache to ensure fresh data is fetched on next request
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Unexpected error deleting work progress entry', error);
    return NextResponse.json(
      { error: 'Unexpected error deleting work progress entry.' },
      { status: 500 },
    );
  }
}
