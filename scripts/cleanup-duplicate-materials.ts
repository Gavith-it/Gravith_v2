/**
 * Script to find and remove duplicate materials from the database
 *
 * This script identifies duplicate materials (same ID or same name+category) and
 * helps clean them up. Run this with: npx tsx scripts/cleanup-duplicate-materials.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function findDuplicateMaterials() {
  console.log('🔍 Searching for duplicate materials...\n');

  // Find duplicates by ID (should never happen, but let's check)
  const { data: allMaterials, error: fetchError } = await supabase
    .from('material_masters')
    .select('id, name, category, organization_id, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching materials:', fetchError);
    return;
  }

  if (!allMaterials || allMaterials.length === 0) {
    console.log('✅ No materials found.');
    return;
  }

  console.log(`📊 Total materials in database: ${allMaterials.length}\n`);

  // Group by ID to find exact duplicates
  const idMap = new Map<string, typeof allMaterials>();
  allMaterials.forEach((material) => {
    if (!idMap.has(material.id)) {
      idMap.set(material.id, []);
    }
    idMap.get(material.id)!.push(material);
  });

  // Find IDs with duplicates
  const duplicateIds: string[] = [];
  idMap.forEach((materials, id) => {
    if (materials.length > 1) {
      duplicateIds.push(id);
    }
  });

  if (duplicateIds.length === 0) {
    console.log('✅ No duplicate IDs found.\n');
  } else {
    console.log(`⚠️  Found ${duplicateIds.length} material(s) with duplicate IDs:\n`);
    duplicateIds.forEach((id) => {
      const materials = idMap.get(id)!;
      console.log(`  ID: ${id}`);
      materials.forEach((m, index) => {
        console.log(
          `    ${index + 1}. ${m.name} (${m.category}) - Created: ${m.created_at} - Org: ${m.organization_id}`,
        );
      });
      console.log('');
    });
  }

  // Also check for duplicates by name+category+organization (logical duplicates)
  const nameMap = new Map<string, typeof allMaterials>();
  allMaterials.forEach((material) => {
    const key = `${material.organization_id}:${material.name}:${material.category}`;
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(material);
  });

  const logicalDuplicates: Array<{ key: string; materials: typeof allMaterials }> = [];
  nameMap.forEach((materials, key) => {
    if (materials.length > 1) {
      logicalDuplicates.push({ key, materials });
    }
  });

  if (logicalDuplicates.length > 0) {
    console.log(
      `\n⚠️  Found ${logicalDuplicates.length} logical duplicate(s) (same name+category+org):\n`,
    );
    logicalDuplicates.forEach(({ key, materials }) => {
      const [orgId, name, category] = key.split(':');
      console.log(`  ${name} (${category}) in org ${orgId}:`);
      materials.forEach((m, index) => {
        console.log(
          `    ${index + 1}. ID: ${m.id} - Created: ${m.created_at} - Updated: ${m.updated_at}`,
        );
      });
      console.log('');
    });
  }

  return { duplicateIds, logicalDuplicates, allMaterials };
}

async function cleanupDuplicateById(materialId: string, keepIndex: number = 0) {
  console.log(`\n🧹 Cleaning up duplicates for material ID: ${materialId}\n`);

  const { data: materials, error } = await supabase
    .from('material_masters')
    .select('id, name, category, organization_id, created_at')
    .eq('id', materialId);

  if (error || !materials || materials.length <= 1) {
    console.log('✅ No duplicates found for this ID or error occurred.');
    return;
  }

  // Keep the first one (oldest), delete the rest
  const toKeep = materials[keepIndex];
  const toDelete = materials.filter((_, index) => index !== keepIndex);

  console.log(`📌 Keeping: ${toKeep.name} (created: ${toKeep.created_at})`);
  console.log(`🗑️  Deleting ${toDelete.length} duplicate(s):\n`);

  for (const material of toDelete) {
    console.log(`  - Deleting ${material.name} (ID: ${material.id})...`);

    // Check for dependencies first
    const { count: purchaseCount } = await supabase
      .from('material_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', material.id);

    const { count: receiptCount } = await supabase
      .from('material_receipts')
      .select('id', { count: 'exact', head: true })
      .eq('material_id', material.id);

    if ((purchaseCount ?? 0) > 0 || (receiptCount ?? 0) > 0) {
      console.log(
        `    ⚠️  Skipping - has ${purchaseCount ?? 0} purchases and ${receiptCount ?? 0} receipts`,
      );
      continue;
    }

    // Delete site allocations first
    await supabase.from('material_site_allocations').delete().eq('material_id', material.id);

    // Delete the material
    const { error: deleteError } = await supabase
      .from('material_masters')
      .delete()
      .eq('id', material.id);

    if (deleteError) {
      console.log(`    ❌ Error: ${deleteError.message}`);
    } else {
      console.log(`    ✅ Deleted successfully`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'find') {
    await findDuplicateMaterials();
  } else if (command === 'cleanup' && args[1]) {
    const materialId = args[1];
    const keepIndex = args[2] ? parseInt(args[2], 10) : 0;
    await cleanupDuplicateById(materialId, keepIndex);
  } else if (command === 'cleanup-all') {
    const result = await findDuplicateMaterials();
    if (result && result.duplicateIds && result.duplicateIds.length > 0) {
      console.log('\n🧹 Cleaning up all duplicate IDs...\n');
      for (const id of result.duplicateIds) {
        await cleanupDuplicateById(id);
      }
    }
  } else {
    console.log(`
Usage:
  npx tsx scripts/cleanup-duplicate-materials.ts find
    - Find all duplicate materials

  npx tsx scripts/cleanup-duplicate-materials.ts cleanup <material-id> [keep-index]
    - Clean up duplicates for a specific material ID
    - keep-index: which duplicate to keep (0 = first/oldest, default: 0)

  npx tsx scripts/cleanup-duplicate-materials.ts cleanup-all
    - Clean up all duplicate IDs (keeps the oldest of each)

Example:
  npx tsx scripts/cleanup-duplicate-materials.ts find
  npx tsx scripts/cleanup-duplicate-materials.ts cleanup 9cb3de27-8715-4fdc-a705-dbe82c55871f
    `);
  }
}

main().catch(console.error);
