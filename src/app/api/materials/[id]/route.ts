import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

// Force dynamic rendering to prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type MaterialRow = {
  id: string;
  name: string;
  category: MaterialMaster['category'];
  unit: string;
  site_id: string | null;
  site_name: string | null;
  quantity: number | string | null;
  consumed_quantity: number | string | null;
  standard_rate: number | string | null;
  is_active: boolean | null;
  hsn: string | null;
  tax_rate: number | string | null;
  tax_rate_id?: string | null;
  opening_balance: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type SiteAllocationRow = {
  id: string;
  material_id: string;
  site_id: string;
  opening_balance: number | string | null;
  inward_qty: number | string | null;
  utilization_qty: number | string | null;
  available_qty: number | string | null;
  organization_id: string;
  created_at: string | null;
  updated_at: string | null;
};

function mapRowToMaterial(row: MaterialRow): MaterialMaster & {
  createdDate: string;
  lastUpdated: string;
} {
  const createdAt = row.created_at ?? new Date().toISOString();
  const updatedAt = row.updated_at ?? createdAt;
  // Use opening_balance as quantity if available
  const quantityValue = row.opening_balance
    ? Number(row.opening_balance)
    : Number(row.quantity ?? 0);

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    siteId: row.site_id ?? null,
    siteName: row.site_name ?? null,
    quantity: quantityValue,
    consumedQuantity: Number(row.consumed_quantity ?? 0),
    standardRate: Number(row.standard_rate ?? 0),
    isActive: Boolean(row.is_active ?? true),
    hsn: row.hsn ?? '',
    taxRate: Number(row.tax_rate ?? 0),
    taxRateId: row.tax_rate_id ?? null,
    organizationId: row.organization_id,
    createdAt,
    updatedAt,
    createdDate: createdAt.split('T')[0] ?? createdAt,
    lastUpdated: updatedAt.split('T')[0] ?? updatedAt,
    openingBalance: row.opening_balance ? Number(row.opening_balance) : null,
  };
}

type SiteResolution =
  | { ok: true; siteId: string | null; siteName: string | null }
  | { ok: false; status: number; message: string };

type SiteRow = {
  id: string;
  name: string;
  organization_id: string;
};

async function resolveSiteSelection(
  supabase: SupabaseServerClient,
  siteId: string | null | undefined,
  organizationId: string,
): Promise<SiteResolution> {
  if (!siteId) {
    return { ok: true, siteId: null, siteName: null };
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('id', siteId)
    .maybeSingle();

  const site = (data as SiteRow | null) ?? null;

  if (error) {
    console.error('Error validating site for material master', error);
    return { ok: false, status: 500, message: 'Unable to validate site selection.' };
  }

  if (!site || site.organization_id !== organizationId) {
    return { ok: false, status: 400, message: 'Invalid site selection.' };
  }

  return { ok: true, siteId: site.id, siteName: site.name };
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
    .select('organization_id, organization_role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return {
    organizationId: profile.organization_id,
    role: profile.organization_role,
    userId: user.id,
  };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('material_masters')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching material before update', fetchError);
      return NextResponse.json({ error: 'Unable to update material.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<MaterialMasterInput> & {
      standardRate?: number;
      openingBalance?: number | null;
      siteAllocations?: Array<{
        siteId: string;
        siteName?: string;
        openingBalance?: number;
        quantity?: number;
        inwardQty?: number;
        utilizationQty?: number;
        availableQty?: number;
      }>;
    };

    // Validate site allocations if provided
    if (body.siteAllocations && body.siteAllocations.length > 0) {
      for (const allocation of body.siteAllocations) {
        if (!allocation.siteId) {
          return NextResponse.json(
            { error: 'Each site allocation must have a valid site.' },
            { status: 400 },
          );
        }

        // Validate quantities - openingBalance is required, inwardQty and utilizationQty are read-only
        const openingBalance = allocation.openingBalance ?? allocation.quantity ?? 0;
        const inwardQty = allocation.inwardQty ?? 0;
        const utilizationQty = allocation.utilizationQty ?? 0;

        if (openingBalance <= 0) {
          return NextResponse.json(
            { error: 'Opening balance must be greater than zero.' },
            { status: 400 },
          );
        }

        if (inwardQty < 0) {
          return NextResponse.json(
            { error: 'Inward quantity must be greater than or equal to zero.' },
            { status: 400 },
          );
        }

        if (utilizationQty < 0) {
          return NextResponse.json(
            { error: 'Utilization quantity must be greater than or equal to zero.' },
            { status: 400 },
          );
        }

        // Validate utilization doesn't exceed available (Opening Balance + Inward)
        if (utilizationQty > openingBalance + inwardQty) {
          return NextResponse.json(
            { error: 'Utilization quantity cannot exceed available quantity (Opening Balance + Inward).' },
            { status: 400 },
          );
        }

        // Validate site belongs to organization
        const siteRes = await resolveSiteSelection(supabase, allocation.siteId, ctx.organizationId);
        if (!siteRes.ok) {
          return NextResponse.json(
            { error: `Invalid site in allocation: ${siteRes.message}` },
            { status: siteRes.status },
          );
        }
      }
    }

    const updatePayload: Record<string, unknown> = {
      updated_by: ctx.userId,
    };

    if (body.name) updatePayload['name'] = body.name;
    if (body.category) updatePayload['category'] = body.category;
    if (body.unit) updatePayload['unit'] = body.unit;
    if (typeof body.standardRate === 'number') updatePayload['standard_rate'] = body.standardRate;
    if (typeof body.isActive === 'boolean') updatePayload['is_active'] = body.isActive;
    if (typeof body.hsn === 'string') updatePayload['hsn'] = body.hsn;
    if (typeof body.taxRateId === 'string') {
      // Validate tax rate ID
      const validTaxRateIds = [
        'GST0',
        'GST5',
        'GST12',
        'GST18',
        'GST28',
        'CGST9',
        'SGST9',
        'IGST18',
        'TDS2',
      ];
      if (!validTaxRateIds.includes(body.taxRateId)) {
        return NextResponse.json({ error: 'Invalid tax rate ID.' }, { status: 400 });
      }
      updatePayload['tax_rate_id'] = body.taxRateId;
      // Also update tax_rate for backward compatibility
      const taxRateMap: Record<string, number> = {
        GST0: 0,
        GST5: 5,
        GST12: 12,
        GST18: 18,
        GST28: 28,
        CGST9: 9,
        SGST9: 9,
        IGST18: 18,
        TDS2: 2,
      };
      updatePayload['tax_rate'] = taxRateMap[body.taxRateId] ?? 18;
    }

    // Handle opening balance and site allocations
    // Priority: siteAllocations > openingBalance
    if (body.siteAllocations !== undefined) {
      // If siteAllocations is explicitly provided (even if empty array), use it
      if (body.siteAllocations && body.siteAllocations.length > 0) {
        // Calculate opening balance from site allocations (sum of opening balances)
        const calculatedOpeningBalance = body.siteAllocations.reduce(
          (sum, alloc) => sum + (alloc.openingBalance ?? alloc.quantity ?? 0),
          0,
        );
        updatePayload['opening_balance'] = calculatedOpeningBalance;
        updatePayload['quantity'] = calculatedOpeningBalance;
      } else {
        // Empty array means clear opening balance
        // Use body.openingBalance if provided, otherwise null
        const openingBalanceValue = body.openingBalance !== undefined ? body.openingBalance : null;
        updatePayload['opening_balance'] = openingBalanceValue;
        // Explicitly clear quantity when opening balance is cleared
        updatePayload['quantity'] = 0;
      }
    } else if (body.openingBalance !== undefined) {
      // Only openingBalance provided (no siteAllocations)
      updatePayload['opening_balance'] = body.openingBalance;
      if (body.openingBalance !== null && body.openingBalance !== undefined) {
        updatePayload['quantity'] = body.openingBalance;
      } else {
        // Explicitly clear quantity when opening balance is cleared
        updatePayload['quantity'] = 0;
      }
    }

    if ('siteId' in body) {
      const siteResolution = await resolveSiteSelection(
        supabase,
        body.siteId ?? null,
        ctx.organizationId,
      );
      if (!siteResolution.ok) {
        return NextResponse.json(
          { error: siteResolution.message },
          { status: siteResolution.status },
        );
      }
      updatePayload['site_id'] = siteResolution.siteId;
      updatePayload['site_name'] = siteResolution.siteName;
    }

    const { data: updated, error: updateError } = await supabase
      .from('material_masters')
      .update(updatePayload)
      .eq('id', id)
      .select(
        'id, name, category, unit, site_id, site_name, quantity, consumed_quantity, standard_rate, is_active, hsn, tax_rate, tax_rate_id, opening_balance, organization_id, created_at, updated_at',
      )
      .single();

    if (updateError || !updated) {
      console.error('Error updating material', updateError);
      return NextResponse.json({ error: 'Failed to update material.' }, { status: 500 });
    }

    // Handle site allocations update if provided
    if (body.siteAllocations !== undefined) {
      if (body.siteAllocations.length === 0) {
        // Empty array means delete all allocations
        const { error: deleteError } = await supabase
          .from('material_site_allocations')
          .delete()
          .eq('material_id', id)
          .eq('organization_id', ctx.organizationId);

        if (deleteError) {
          console.error('Error deleting site allocations', deleteError);
          return NextResponse.json({ error: 'Failed to delete site allocations.' }, { status: 500 });
        }
      } else {
        // Fetch existing allocations to preserve values that aren't being updated
        const { data: existingAllocations } = await supabase
          .from('material_site_allocations')
          .select('site_id, opening_balance, inward_qty, utilization_qty, available_qty')
          .eq('material_id', id)
          .eq('organization_id', ctx.organizationId);

        const existingAllocationsMap = new Map<string, {
          site_id: string;
          opening_balance: number | string | null;
          inward_qty: number | string | null;
          utilization_qty: number | string | null;
          available_qty: number | string | null;
        }>();
        (existingAllocations || []).forEach((alloc) => {
          const typedAlloc = alloc as {
            site_id: unknown;
            opening_balance: unknown;
            inward_qty: unknown;
            utilization_qty: unknown;
            available_qty: unknown;
          };
          existingAllocationsMap.set(String(typedAlloc.site_id), {
            site_id: String(typedAlloc.site_id),
            opening_balance: typedAlloc.opening_balance as number | string | null,
            inward_qty: typedAlloc.inward_qty as number | string | null,
            utilization_qty: typedAlloc.utilization_qty as number | string | null,
            available_qty: typedAlloc.available_qty as number | string | null,
          });
        });

        // Use upsert to update existing or insert new allocations
        const allocationPayloads = body.siteAllocations.map((allocation) => {
          // Get existing allocation for this site to preserve values
          const existing = existingAllocationsMap.get(allocation.siteId) as {
            site_id: string;
            opening_balance: number | string | null;
            inward_qty: number | string | null;
            utilization_qty: number | string | null;
            available_qty: number | string | null;
          } | undefined;
          
          // Use openingBalance from form, fallback to existing, then quantity for backward compatibility
          const openingBalance = Number(allocation.openingBalance ?? existing?.opening_balance ?? allocation.quantity ?? 0);
          // ALWAYS preserve existing inwardQty (it's read-only and managed by receipts)
          // Only use provided inwardQty if there's no existing allocation (new allocation)
          const inwardQty = existing 
            ? Number(existing.inward_qty ?? 0)
            : (allocation.inwardQty ?? 0);
          // Use utilizationQty from request (it's being updated), fallback to existing
          const utilizationQty = allocation.utilizationQty !== undefined && allocation.utilizationQty !== null
            ? allocation.utilizationQty
            : (existing?.utilization_qty ? Number(existing.utilization_qty) : 0);
          // Available qty = Opening Balance + Inward - Utilization (calculated by trigger)
          const availableQty = Math.max(0, openingBalance + inwardQty - utilizationQty);

          return {
            material_id: id,
            site_id: allocation.siteId,
            opening_balance: openingBalance,
            inward_qty: inwardQty,
            utilization_qty: utilizationQty,
            available_qty: availableQty,
            organization_id: ctx.organizationId,
            created_by: ctx.userId,
            updated_by: ctx.userId,
          };
        });

        // Update or insert each allocation
        for (const payload of allocationPayloads) {
          // Check if allocation exists
          const { data: existing } = await supabase
            .from('material_site_allocations')
            .select('id')
            .eq('material_id', payload.material_id)
            .eq('site_id', payload.site_id)
            .eq('organization_id', payload.organization_id)
            .maybeSingle();

          if (existing) {
            // Update existing allocation
            const { error: updateError } = await supabase
              .from('material_site_allocations')
              .update({
                opening_balance: payload.opening_balance,
                inward_qty: payload.inward_qty,
                utilization_qty: payload.utilization_qty,
                available_qty: payload.available_qty,
                updated_by: payload.updated_by,
              })
              .eq('id', String(existing.id));

            if (updateError) {
              console.error('Error updating site allocation', updateError);
              return NextResponse.json(
                { error: 'Failed to update site allocation.' },
                { status: 500 },
              );
            }
          } else {
            // Insert new allocation
            const { error: insertError } = await supabase
              .from('material_site_allocations')
              .insert(payload);

            if (insertError) {
              console.error('Error creating site allocation', insertError);
              return NextResponse.json(
                { error: 'Failed to create site allocation.' },
                { status: 500 },
              );
            }
          }
        }
      }
    }

    // Fetch site allocations for response
    const { data: allocationsData } = await supabase
      .from('material_site_allocations')
      .select('material_id, site_id, opening_balance, inward_qty, utilization_qty, available_qty')
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    let siteAllocationsResponse: Array<{
      siteId: string;
      siteName: string;
      openingBalance?: number;
      quantity?: number;
      inwardQty: number;
      utilizationQty: number;
      availableQty: number;
    }> = [];
    if (allocationsData && allocationsData.length > 0) {
      const siteIds = [...new Set((allocationsData as SiteAllocationRow[]).map((a) => a.site_id))];
      const { data: sitesData } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', siteIds)
        .eq('organization_id', ctx.organizationId);

      const siteNameMap = new Map<string, string>();
      ((sitesData || []) as Array<{ id: string; name: string }>).forEach((site) => {
        siteNameMap.set(site.id, site.name);
      });

      siteAllocationsResponse = (allocationsData as SiteAllocationRow[]).map((allocation) => {
        const openingBalance = Number(allocation.opening_balance ?? 0);
        const inwardQty = Number(allocation.inward_qty ?? 0);
        const utilizationQty = Number(allocation.utilization_qty ?? 0);
        const availableQty = Number(allocation.available_qty ?? Math.max(0, openingBalance + inwardQty - utilizationQty));

        return {
          siteId: allocation.site_id,
          siteName: siteNameMap.get(allocation.site_id) || '',
          openingBalance,
          quantity: openingBalance, // Backward compatibility
          inwardQty,
          utilizationQty,
          availableQty,
        };
      });
    }

    const material = mapRowToMaterial(updated as MaterialRow);
    const response = NextResponse.json({
      material: {
        ...material,
        siteAllocations: siteAllocationsResponse.length > 0 ? siteAllocationsResponse : undefined,
      },
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
    console.error('Unexpected error updating material', error);
    return NextResponse.json({ error: 'Unexpected error updating material.' }, { status: 500 });
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

    if (
      !['owner', 'admin', 'manager', 'project-manager', 'materials-manager', 'user'].includes(
        ctx.role,
      )
    ) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('material_masters')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error loading material before delete', fetchError);
      return NextResponse.json({ error: 'Unable to delete material.' }, { status: 500 });
    }

    if (!existing || existing.organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Material not found.' }, { status: 404 });
    }

    const { count: purchaseCount, error: purchaseCheckError } = await supabase
      .from('material_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    if (purchaseCheckError) {
      console.error('Error checking purchase dependencies before delete', purchaseCheckError);
      return NextResponse.json(
        { error: 'Unable to verify material dependencies.' },
        { status: 500 },
      );
    }

    if ((purchaseCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'This material has purchase records linked to it. Remove or relink those purchases before deleting the material master.',
        },
        { status: 400 },
      );
    }

    const { count: receiptCount, error: receiptCheckError } = await supabase
      .from('material_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    if (receiptCheckError) {
      console.error('Error checking receipt dependencies before delete', receiptCheckError);
      return NextResponse.json(
        { error: 'Unable to verify material dependencies.' },
        { status: 500 },
      );
    }

    if ((receiptCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            'This material has receipts linked to it. Remove or update those receipts before deleting the material master.',
        },
        { status: 400 },
      );
    }

    // Delete site allocations first (they have FK cascade, but explicit delete is cleaner)
    const { error: allocationsDeleteError } = await supabase
      .from('material_site_allocations')
      .delete()
      .eq('material_id', id)
      .eq('organization_id', ctx.organizationId);

    if (allocationsDeleteError) {
      console.error(
        'Error deleting site allocations before material delete',
        allocationsDeleteError,
      );
      // Continue with material delete even if allocations delete fails (FK cascade will handle it)
    }

    const { error: deleteError } = await supabase.from('material_masters').delete().eq('id', id);

    if (deleteError) {
      console.error('Error deleting material', deleteError);
      return NextResponse.json({ error: 'Failed to delete material.' }, { status: 500 });
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
    console.error('Unexpected error deleting material', error);
    return NextResponse.json({ error: 'Unexpected error deleting material.' }, { status: 500 });
  }
}
