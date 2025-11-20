import { NextResponse } from 'next/server';

import { mapRowToReceipt, MUTATION_ROLES, resolveContext } from './_utils';
import type { ReceiptRow } from './_utils';

import { createClient } from '@/lib/supabase/server';
import type { MaterialReceipt } from '@/types/entities';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

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
      .from('material_receipts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) {
      console.error('Error counting receipts', countError);
      return NextResponse.json({ error: 'Failed to load receipts.' }, { status: 500 });
    }

    // Fetch paginated data
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
        quantity,
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
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching material receipts', error);
      return NextResponse.json({ error: 'Failed to load receipts.' }, { status: 500 });
    }

    const receipts = (data ?? []).map((row) => mapRowToReceipt(row as ReceiptRow));
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const response = NextResponse.json({
      receipts,
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
    console.error('Unexpected error fetching receipts', error);
    return NextResponse.json({ error: 'Unexpected error loading receipts.' }, { status: 500 });
  }
}

// Helper function to update opening balance for a single receipt
async function updateOpeningBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ctx: { organizationId: string; userId: string },
  materialId: string,
  siteId: string | null | undefined,
  receiptQuantity: number,
) {
  try {
    if (siteId === 'unallocated' || !siteId) {
      // For unallocated: update material_masters.opening_balance directly
      const { data: material } = await supabase
        .from('material_masters')
        .select('opening_balance')
        .eq('id', materialId)
        .eq('organization_id', ctx.organizationId)
        .maybeSingle();

      const currentOB = Number(material?.opening_balance ?? 0);
      const newOB = currentOB + receiptQuantity;

      await supabase
        .from('material_masters')
        .update({ opening_balance: newOB, updated_by: ctx.userId })
        .eq('id', materialId)
        .eq('organization_id', ctx.organizationId);
    } else {
      // For allocated sites: update material_site_allocations
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
        const newOB = Number(existingAllocation.opening_balance ?? 0) + receiptQuantity;
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
            opening_balance: receiptQuantity,
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
    }
  } catch (obError) {
    console.error('Error updating opening balance', obError);
    // Don't fail the receipt creation if OB update fails
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

    const body = (await request.json()) as
      | Partial<MaterialReceipt>
      | { receipts: Array<Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>> };

    // Check if it's bulk creation (has receipts array) or single creation
    const isBulk = 'receipts' in body && Array.isArray(body.receipts);
    const receiptsData = isBulk
      ? (body as { receipts: Array<Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>> })
          .receipts
      : [body as Partial<MaterialReceipt>];

    // Validate all receipts
    const payloads = receiptsData.map((receipt) => {
      const {
        date,
        vehicleNumber,
        materialId,
        materialName,
        filledWeight,
        emptyWeight,
        quantity,
        vendorId,
        vendorName,
        linkedPurchaseId,
        siteId,
        siteName,
      } = receipt;

      if (
        !date ||
        !vehicleNumber ||
        !materialId ||
        !materialName ||
        typeof filledWeight !== 'number' ||
        typeof emptyWeight !== 'number' ||
        typeof quantity !== 'number'
      ) {
        throw new Error('Missing required receipt fields.');
      }

      const netWeight = Number(filledWeight) - Number(emptyWeight);

      if (Number.isNaN(netWeight) || netWeight < 0) {
        throw new Error('Invalid weight values. Net weight cannot be negative.');
      }

      return {
        date,
        vehicle_number: vehicleNumber,
        material_id: materialId,
        material_name: materialName,
        filled_weight: Number(filledWeight),
        empty_weight: Number(emptyWeight),
        net_weight: netWeight,
        quantity: Number(quantity),
        vendor_id: vendorId ?? null,
        vendor_name: vendorName ?? null,
        linked_purchase_id: linkedPurchaseId ?? null,
        site_id: siteId === 'unallocated' ? null : siteId ?? null,
        site_name: siteName === 'Unallocated' ? null : siteName ?? null,
        organization_id: ctx.organizationId,
        created_by: ctx.userId,
        updated_by: ctx.userId,
      };
    });

    // Insert all receipts in a transaction
    const { data, error } = await supabase
      .from('material_receipts')
      .insert(payloads)
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
        quantity,
        vendor_id,
        vendor_name,
        linked_purchase_id,
        site_id,
        site_name,
        organization_id,
        created_at,
        updated_at
      `,
      );

    if (error || !data || data.length === 0) {
      console.error('Error creating material receipts', error);
      return NextResponse.json({ error: 'Failed to create receipt(s).' }, { status: 500 });
    }

    // Update Opening Balance for each receipt
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const receiptData = receiptsData[i];
      await updateOpeningBalance(
        supabase,
        ctx,
        payload.material_id,
        payload.site_id,
        payload.quantity,
      );
    }

    const receipts = data.map((row) => mapRowToReceipt(row as ReceiptRow));
    
    // Return single receipt for backward compatibility, or array for bulk
    if (isBulk) {
      return NextResponse.json({ receipts });
    } else {
      return NextResponse.json({ receipt: receipts[0] });
    }
  } catch (error) {
    console.error('Unexpected error creating receipt', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unexpected error creating receipt.',
      },
      { status: 500 },
    );
  }
}
