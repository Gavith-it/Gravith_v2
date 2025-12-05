import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id, organization_role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Unable to resolve organization.' }, { status: 500 });
    }

    // Only allow admins/owners to run cleanup
    if (!['owner', 'admin'].includes(profile.organization_role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const organizationId = profile.organization_id;

    // Find all materials for this organization
    const { data: allMaterials, error: fetchError } = await adminClient
      .from('material_masters')
      .select('id, name, category, organization_id, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching materials:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch materials.' }, { status: 500 });
    }

    if (!allMaterials || allMaterials.length === 0) {
      return NextResponse.json({
        duplicates: [],
        message: 'No materials found.',
      });
    }

    // Type the materials properly
    type MaterialRow = {
      id: string;
      name: string;
      category: string;
      organization_id: string;
      created_at: string;
      updated_at: string;
    };

    const typedMaterials = (allMaterials ?? []) as MaterialRow[];

    // Group by ID to find exact duplicates
    const idMap = new Map<string, MaterialRow[]>();
    typedMaterials.forEach((material) => {
      if (!idMap.has(material.id)) {
        idMap.set(material.id, []);
      }
      idMap.get(material.id)!.push(material);
    });

    // Find IDs with duplicates
    const duplicateIds: Array<{
      id: string;
      name: string;
      category: string;
      count: number;
      materials: MaterialRow[];
    }> = [];

    idMap.forEach((materials, id) => {
      if (materials.length > 1) {
        duplicateIds.push({
          id,
          name: materials[0].name,
          category: materials[0].category,
          count: materials.length,
          materials,
        });
      }
    });

    return NextResponse.json({
      duplicates: duplicateIds,
      totalMaterials: typedMaterials.length,
      duplicateCount: duplicateIds.length,
    });
  } catch (error) {
    console.error('Unexpected error finding duplicates:', error);
    return NextResponse.json({ error: 'Unexpected error finding duplicates.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get user context
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id, organization_role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Unable to resolve organization.' }, { status: 500 });
    }

    // Only allow admins/owners to run cleanup
    if (!['owner', 'admin'].includes(profile.organization_role)) {
      return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
    }

    const organizationId = profile.organization_id;
    const body = (await request.json()) as {
      materialId: string;
      keepIndex?: number;
    };

    if (!body.materialId) {
      return NextResponse.json({ error: 'Material ID is required.' }, { status: 400 });
    }

    const materialId = body.materialId;
    const keepIndex = body.keepIndex ?? 0;

    // Type for material row
    type MaterialRow = {
      id: string;
      name: string;
      category: string;
      organization_id: string;
      created_at: string;
    };

    // Get all materials with this ID
    const { data: materials, error: fetchError } = await adminClient
      .from('material_masters')
      .select('id, name, category, organization_id, created_at')
      .eq('id', materialId)
      .eq('organization_id', organizationId);

    const typedMaterials = (materials ?? []) as MaterialRow[];

    if (fetchError || !typedMaterials || typedMaterials.length <= 1) {
      return NextResponse.json({
        success: false,
        message: 'No duplicates found for this material ID.',
      });
    }

    // Keep the one at keepIndex (default: 0 = oldest)
    const toKeep = typedMaterials[keepIndex];
    const toDelete = typedMaterials.filter((_, index) => index !== keepIndex);

    const deleted: string[] = [];
    const skipped: Array<{ id: string; reason: string }> = [];
    const transferred: Array<{ from: string; to: string; type: string; count: number }> = [];

    for (const material of toDelete) {
      // Check for dependencies
      const { count: purchaseCount } = await adminClient
        .from('material_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('material_id', material.id as string);

      const { count: receiptCount } = await adminClient
        .from('material_receipts')
        .select('id', { count: 'exact', head: true })
        .eq('material_id', material.id as string);

      // Transfer receipts to the kept material
      if ((receiptCount ?? 0) > 0) {
        const { error: transferReceiptsError } = await adminClient
          .from('material_receipts')
          .update({ material_id: toKeep.id as string })
          .eq('material_id', material.id as string)
          .eq('organization_id', organizationId);

        if (transferReceiptsError) {
          skipped.push({
            id: material.id,
            reason: `Failed to transfer receipts: ${transferReceiptsError.message}`,
          });
          continue;
        } else {
          transferred.push({
            from: material.id as string,
            to: toKeep.id as string,
            type: 'receipts',
            count: receiptCount ?? 0,
          });
        }
      }

      // Transfer purchases to the kept material
      if ((purchaseCount ?? 0) > 0) {
        const { error: transferPurchasesError } = await adminClient
          .from('material_purchases')
          .update({ material_id: toKeep.id as string })
          .eq('material_id', material.id as string)
          .eq('organization_id', organizationId);

        if (transferPurchasesError) {
          skipped.push({
            id: material.id,
            reason: `Failed to transfer purchases: ${transferPurchasesError.message}`,
          });
          continue;
        } else {
          transferred.push({
            from: material.id as string,
            to: toKeep.id as string,
            type: 'purchases',
            count: purchaseCount ?? 0,
          });
        }
      }

      // Delete site allocations first
      await adminClient
        .from('material_site_allocations')
        .delete()
        .eq('material_id', material.id as string)
        .eq('organization_id', organizationId);

      // Now delete the material (dependencies have been transferred)
      const { error: deleteError } = await adminClient
        .from('material_masters')
        .delete()
        .eq('id', material.id as string);

      if (deleteError) {
        skipped.push({
          id: material.id as string,
          reason: deleteError.message,
        });
      } else {
        deleted.push(material.id as string);
      }
    }

    return NextResponse.json({
      success: true,
      kept: toKeep.id as string,
      deleted,
      skipped,
      transferred,
      message: `Deleted ${deleted.length} duplicate(s), kept ${toKeep.name} (${toKeep.id}). ${
        transferred.length > 0
          ? `Transferred ${transferred.reduce((sum, t) => sum + t.count, 0)} linked record(s) to the kept material.`
          : ''
      }`,
    });
  } catch (error) {
    console.error('Unexpected error cleaning up duplicates:', error);
    return NextResponse.json(
      { error: 'Unexpected error cleaning up duplicates.' },
      { status: 500 },
    );
  }
}
