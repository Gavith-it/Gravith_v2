import { NextResponse } from 'next/server';

import { mapRowToReceipt, MUTATION_ROLES, resolveContext } from './_utils';
import type { ReceiptRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import type { MaterialReceipt } from '@/types/entities';

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const { data, error } = await supabase
      .from('material_receipts')
      .select(
        `
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
      `,
      )
      .eq('organization_id', organizationId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching material receipts', error);
      return NextResponse.json({ error: 'Failed to load receipts.' }, { status: 500 });
    }

    const receipts = (data ?? []).map((row) => mapRowToReceipt(row as ReceiptRow));
    return NextResponse.json({ receipts });
  } catch (error) {
    console.error('Unexpected error fetching receipts', error);
    return NextResponse.json({ error: 'Unexpected error loading receipts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    if (!MUTATION_ROLES.includes(ctx.role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as Partial<MaterialReceipt>;
    const {
      date,
      vehicleNumber,
      materialId,
      materialName,
      filledWeight,
      emptyWeight,
      vendorId,
      vendorName,
      linkedPurchaseId,
      siteId,
      siteName,
    } = body;

    if (
      !date ||
      !vehicleNumber ||
      !materialId ||
      !materialName ||
      typeof filledWeight !== 'number' ||
      typeof emptyWeight !== 'number'
    ) {
      return NextResponse.json({ error: 'Missing required receipt fields.' }, { status: 400 });
    }

    const netWeight = Number(filledWeight) - Number(emptyWeight);

    if (Number.isNaN(netWeight) || netWeight < 0) {
      return NextResponse.json(
        { error: 'Invalid weight values. Net weight cannot be negative.' },
        { status: 400 },
      );
    }

    const payload = {
      date,
      vehicle_number: vehicleNumber,
      material_id: materialId,
      material_name: materialName,
      filled_weight: Number(filledWeight),
      empty_weight: Number(emptyWeight),
      net_weight: netWeight,
      vendor_id: vendorId ?? null,
      vendor_name: vendorName ?? null,
      linked_purchase_id: linkedPurchaseId ?? null,
      site_id: siteId ?? null,
      site_name: siteName ?? null,
      organization_id: ctx.organizationId,
      created_by: ctx.userId,
      updated_by: ctx.userId,
    };

    const { data, error } = await supabase
      .from('material_receipts')
      .insert(payload)
      .select(
        `
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
      `,
      )
      .single();

    if (error || !data) {
      console.error('Error creating material receipt', error);
      return NextResponse.json({ error: 'Failed to create receipt.' }, { status: 500 });
    }

    // Update Opening Balance in material_site_allocations if material and site are provided
    if (materialId && siteId) {
      try {
        // Check if allocation exists
        const { data: existingAllocation, error: allocationError } = await supabase
          .from('material_site_allocations')
          .select('id, opening_balance')
          .eq('material_id', materialId)
          .eq('site_id', siteId)
          .eq('organization_id', ctx.organizationId)
          .maybeSingle();

        if (allocationError) {
          console.error('Error checking site allocation', allocationError);
        } else if (existingAllocation) {
          // Update existing allocation
          const newOB = Number(existingAllocation.opening_balance ?? 0) + netWeight;
          const { error: updateError } = await supabase
            .from('material_site_allocations')
            .update({ opening_balance: newOB, updated_by: ctx.userId })
            .eq('id', String(existingAllocation.id));

          if (updateError) {
            console.error('Error updating site allocation OB', updateError);
          }
        } else {
          // Create new allocation
          const { error: insertError } = await supabase
            .from('material_site_allocations')
            .insert({
              material_id: materialId,
              site_id: siteId,
              opening_balance: netWeight,
              organization_id: ctx.organizationId,
              created_by: ctx.userId,
              updated_by: ctx.userId,
            });

          if (insertError) {
            console.error('Error creating site allocation', insertError);
          }
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
      } catch (obError) {
        console.error('Error updating opening balance', obError);
        // Don't fail the receipt creation if OB update fails
      }
    }

    const receipt = mapRowToReceipt(data as ReceiptRow);
    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Unexpected error creating receipt', error);
    return NextResponse.json({ error: 'Unexpected error creating receipt.' }, { status: 500 });
  }
}
