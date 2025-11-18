import { NextResponse } from 'next/server';

import { mapRowToReceipt, MUTATION_ROLES, resolveContext } from '../_utils';
import type { ReceiptRow } from '../_utils';

import { createClient } from '@/lib/supabase/server';
import type { MaterialReceipt } from '@/types/entities';


type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const RECEIPT_SELECT = `
  id,
  date,
  vehicle_number,
  material_id,
  material_name,
  filled_weight,
  empty_weight,
  net_weight,
  vendor_id,
  vendor_name,
  linked_purchase_id,
  site_id,
  site_name,
  organization_id,
  created_at,
  updated_at
`;

export async function GET(_: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('material_receipts')
      .select(RECEIPT_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error loading receipt', error);
      return NextResponse.json({ error: 'Failed to load receipt.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({ receipt: mapRowToReceipt(data as ReceiptRow) });
  } catch (error) {
    console.error('Unexpected error loading receipt', error);
    return NextResponse.json({ error: 'Unexpected error loading receipt.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!MUTATION_ROLES.includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { id } = await params;

    const { data: existing, error: fetchError } = await supabase
      .from('material_receipts')
      .select(RECEIPT_SELECT)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error loading receipt prior to update', fetchError);
      return NextResponse.json({ error: 'Failed to update receipt.' }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    const body = (await request.json()) as Partial<MaterialReceipt>;
    const updates: Record<string, unknown> = { updated_by: ctx.userId };

    if (body.date !== undefined) {
      updates.date = body.date;
    }

    if (body.vehicleNumber !== undefined) {
      updates.vehicle_number = body.vehicleNumber;
    }

    if (body.materialId !== undefined) {
      updates.material_id = body.materialId;
    }

    if (body.materialName !== undefined) {
      updates.material_name = body.materialName;
    }

    let nextFilled = Number(existing.filled_weight ?? 0);
    let nextEmpty = Number(existing.empty_weight ?? 0);
    let shouldRecalculateNetWeight = false;

    if (typeof body.filledWeight === 'number') {
      nextFilled = Number(body.filledWeight);
      updates.filled_weight = nextFilled;
      shouldRecalculateNetWeight = true;
    }

    if (typeof body.emptyWeight === 'number') {
      nextEmpty = Number(body.emptyWeight);
      updates.empty_weight = nextEmpty;
      shouldRecalculateNetWeight = true;
    }

    if (typeof body.netWeight === 'number') {
      const net = Number(body.netWeight);
      if (Number.isNaN(net) || net < 0) {
        return NextResponse.json(
          { error: 'Invalid net weight. Net weight cannot be negative.' },
          { status: 400 },
        );
      }
      updates.net_weight = net;
      shouldRecalculateNetWeight = false;
    } else if (shouldRecalculateNetWeight) {
      const net = nextFilled - nextEmpty;
      if (Number.isNaN(net) || net < 0) {
        return NextResponse.json(
          { error: 'Invalid weight values. Net weight cannot be negative.' },
          { status: 400 },
        );
      }
      updates.net_weight = net;
    }

    if ('vendorId' in body) {
      updates.vendor_id = body.vendorId ?? null;
    }

    if ('vendorName' in body) {
      updates.vendor_name = body.vendorName ?? null;
    }

    if ('linkedPurchaseId' in body) {
      updates.linked_purchase_id = body.linkedPurchaseId ?? null;
    }

    if ('siteId' in body) {
      updates.site_id = body.siteId ?? null;
    }

    if ('siteName' in body) {
      updates.site_name = body.siteName ?? null;
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_by present; nothing to change
      return NextResponse.json({ receipt: mapRowToReceipt(existing as ReceiptRow) });
    }

    const { data, error } = await supabase
      .from('material_receipts')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select(RECEIPT_SELECT)
      .single();

    if (error || !data) {
      console.error('Error updating material receipt', error);
      return NextResponse.json({ error: 'Failed to update receipt.' }, { status: 500 });
    }

    // Update Opening Balance: subtract old netWeight, add new netWeight
    const oldMaterialId = existing.material_id;
    const oldSiteId = existing.site_id;
    const oldNetWeight = Number(existing.net_weight ?? 0);
    const receiptData = data as ReceiptRow;
    const newMaterialId = receiptData.material_id ?? oldMaterialId;
    const newSiteId = receiptData.site_id ?? oldSiteId;
    const newNetWeight = Number(receiptData.net_weight ?? oldNetWeight);

    try {
      // Helper function to update OB for a material+site combination
      const updateOB = async (materialId: string | null, siteId: string | null, delta: number) => {
        if (!materialId || !siteId) return;

        const { data: allocation } = await supabase
          .from('material_site_allocations')
          .select('id, opening_balance')
          .eq('material_id', materialId)
          .eq('site_id', siteId)
          .eq('organization_id', ctx.organizationId)
          .maybeSingle();

        if (allocation && allocation.id) {
          const newOB = Math.max(0, Number(allocation.opening_balance ?? 0) + delta);
          await supabase
            .from('material_site_allocations')
            .update({ opening_balance: newOB, updated_by: ctx.userId })
            .eq('id', String(allocation.id));
        } else if (delta > 0) {
          // Create new allocation if adding quantity
          await supabase
            .from('material_site_allocations')
            .insert({
              material_id: materialId,
              site_id: siteId,
              opening_balance: delta,
              organization_id: ctx.organizationId,
              created_by: ctx.userId,
              updated_by: ctx.userId,
            });
        }

        // Recalculate total opening_balance for material_masters
        const { data: allAllocations } = await supabase
          .from('material_site_allocations')
          .select('opening_balance')
          .eq('material_id', materialId)
          .eq('organization_id', ctx.organizationId);

        if (allAllocations) {
          const totalOB = allAllocations.reduce(
            (sum, alloc) => sum + Number(alloc.opening_balance ?? 0),
            0,
          );

          await supabase
            .from('material_masters')
            .update({ opening_balance: totalOB, updated_by: ctx.userId })
            .eq('id', materialId)
            .eq('organization_id', ctx.organizationId);
        }
      };

      // If material or site changed, subtract from old, add to new
      if (oldMaterialId !== newMaterialId || oldSiteId !== newSiteId) {
        // Subtract old netWeight from old material+site
        if (oldMaterialId && oldSiteId && typeof oldMaterialId === 'string' && typeof oldSiteId === 'string') {
          await updateOB(oldMaterialId, oldSiteId, -oldNetWeight);
        }
        // Add new netWeight to new material+site
        if (newMaterialId && newSiteId && typeof newMaterialId === 'string' && typeof newSiteId === 'string') {
          await updateOB(newMaterialId, newSiteId, newNetWeight);
        }
      } else if (oldNetWeight !== newNetWeight && oldMaterialId && oldSiteId && typeof oldMaterialId === 'string' && typeof oldSiteId === 'string') {
        // Same material+site, just adjust by the difference
        const delta = newNetWeight - oldNetWeight;
        await updateOB(oldMaterialId, oldSiteId, delta);
      }
    } catch (obError) {
      console.error('Error updating opening balance', obError);
      // Don't fail the receipt update if OB update fails
    }

    return NextResponse.json({ receipt: mapRowToReceipt(data as ReceiptRow) });
  } catch (error) {
    console.error('Unexpected error updating receipt', error);
    return NextResponse.json({ error: 'Unexpected error updating receipt.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!MUTATION_ROLES.includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const { id } = await params;

    // Get receipt data before deleting to update OB
    const { data: receiptData } = await supabase
      .from('material_receipts')
      .select('material_id, site_id, net_weight')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('material_receipts')
      .delete()
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('Error deleting material receipt', error);
      return NextResponse.json({ error: 'Failed to delete receipt.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    // Update Opening Balance: subtract netWeight from material_site_allocations
    if (receiptData && receiptData.material_id && receiptData.site_id) {
      try {
        const materialId = receiptData.material_id;
        const siteId = receiptData.site_id;
        const netWeight = Number(receiptData.net_weight ?? 0);

        const { data: allocation } = await supabase
          .from('material_site_allocations')
          .select('id, opening_balance')
          .eq('material_id', materialId)
          .eq('site_id', siteId)
          .eq('organization_id', ctx.organizationId)
          .maybeSingle();

        if (allocation && allocation.id) {
          const newOB = Math.max(0, Number(allocation.opening_balance ?? 0) - netWeight);
          await supabase
            .from('material_site_allocations')
            .update({ opening_balance: newOB, updated_by: ctx.userId })
            .eq('id', String(allocation.id));

          // Recalculate total opening_balance for material_masters
          const { data: allAllocations } = await supabase
            .from('material_site_allocations')
            .select('opening_balance')
            .eq('material_id', materialId)
            .eq('organization_id', ctx.organizationId);

          if (allAllocations) {
            const totalOB = allAllocations.reduce(
              (sum, alloc) => sum + Number(alloc.opening_balance ?? 0),
              0,
            );

            await supabase
              .from('material_masters')
              .update({ opening_balance: totalOB, updated_by: ctx.userId })
              .eq('id', materialId)
              .eq('organization_id', ctx.organizationId);
          }
        }
      } catch (obError) {
        console.error('Error updating opening balance', obError);
        // Don't fail the receipt deletion if OB update fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error deleting receipt', error);
    return NextResponse.json({ error: 'Unexpected error deleting receipt.' }, { status: 500 });
  }
}
