/**
 * Materials Data Service
 * Provides CRUD operations for MaterialMaster entities
 * Ready for Supabase backend integration
 */

import { MOCK_MATERIALS } from '../mock/materials.mock';

import type { MaterialMaster } from '@/types';
import { formatDateOnly } from '@/lib/utils/date';


/**
 * Get all materials for an organization
 * @param orgId - Organization ID
 * @returns Array of materials
 */
export async function getAllMaterials(orgId: string): Promise<MaterialMaster[]> {
  // TODO: Replace with Supabase query
  // const { data, error } = await supabase
  //   .from('materials')
  //   .select('*')
  //   .eq('organizationId', orgId);
  // if (error) throw error;
  // return data;

  return MOCK_MATERIALS.filter((m) => m.organizationId === orgId);
}

/**
 * Get active materials only
 * @param orgId - Organization ID
 * @returns Array of active materials
 */
export async function getActiveMaterials(orgId: string): Promise<MaterialMaster[]> {
  // TODO: Replace with Supabase query
  const materials = await getAllMaterials(orgId);
  return materials.filter((m) => m.isActive);
}

/**
 * Get materials by category
 * @param orgId - Organization ID
 * @param category - Material category
 * @returns Array of materials in category
 */
export async function getMaterialsByCategory(
  orgId: string,
  category: MaterialMaster['category'],
): Promise<MaterialMaster[]> {
  // TODO: Replace with Supabase query
  const materials = await getAllMaterials(orgId);
  return materials.filter((m) => m.category === category && m.isActive);
}

/**
 * Search materials by name or category
 * @param orgId - Organization ID
 * @param searchTerm - Search query
 * @returns Array of matching materials
 */
export async function searchMaterials(
  orgId: string,
  searchTerm: string,
): Promise<MaterialMaster[]> {
  // TODO: Replace with Supabase query
  const term = searchTerm.toLowerCase();
  const materials = await getActiveMaterials(orgId);
  return materials.filter(
    (m) => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term),
  );
}

/**
 * Get a single material by ID
 * @param orgId - Organization ID
 * @param materialId - Material ID
 * @returns Material or undefined
 */
export async function getMaterialById(
  orgId: string,
  materialId: string,
): Promise<MaterialMaster | undefined> {
  // TODO: Replace with Supabase query
  const materials = await getAllMaterials(orgId);
  return materials.find((m) => m.id === materialId);
}

/**
 * Create a new material
 * @param orgId - Organization ID
 * @param material - Material data (without id and timestamps)
 * @returns Created material
 */
export async function createMaterial(
  orgId: string,
  material: Omit<
    MaterialMaster,
    'id' | 'createdAt' | 'updatedAt' | 'createdDate' | 'lastUpdated' | 'organizationId'
  >,
): Promise<MaterialMaster> {
  // TODO: Replace with Supabase query
  // const { data, error } = await supabase
  //   .from('materials')
  //   .insert({ ...material, organizationId: orgId })
  //   .select()
  //   .single();
  // if (error) throw error;
  // return data;

  const now = formatDateOnly(new Date());
  const newMaterial: MaterialMaster = {
    ...material,
    id: (MOCK_MATERIALS.length + 1).toString(),
    organizationId: orgId,
    createdDate: now,
    lastUpdated: now,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MOCK_MATERIALS.push(newMaterial);
  return newMaterial;
}

/**
 * Update an existing material
 * @param orgId - Organization ID
 * @param materialId - Material ID
 * @param updates - Partial material data
 * @returns Updated material
 */
export async function updateMaterial(
  orgId: string,
  materialId: string,
  updates: Partial<Omit<MaterialMaster, 'id' | 'organizationId' | 'createdAt' | 'createdDate'>>,
): Promise<MaterialMaster> {
  // TODO: Replace with Supabase query
  // const { data, error } = await supabase
  //   .from('materials')
  //   .update({ ...updates, updatedAt: new Date().toISOString() })
  //   .eq('id', materialId)
  //   .eq('organizationId', orgId)
  //   .select()
  //   .single();
  // if (error) throw error;
  // return data;

  const materialIndex = MOCK_MATERIALS.findIndex(
    (m) => m.id === materialId && m.organizationId === orgId,
  );

  if (materialIndex === -1) {
    throw new Error(`Material ${materialId} not found`);
  }

  const updatedMaterial: MaterialMaster = {
    ...MOCK_MATERIALS[materialIndex],
    ...updates,
    lastUpdated: formatDateOnly(new Date()),
    updatedAt: new Date().toISOString(),
  };

  MOCK_MATERIALS[materialIndex] = updatedMaterial;
  return updatedMaterial;
}

/**
 * Delete a material (soft delete by setting isActive = false)
 * @param orgId - Organization ID
 * @param materialId - Material ID
 */
export async function deleteMaterial(orgId: string, materialId: string): Promise<void> {
  // TODO: Replace with Supabase query
  // const { error } = await supabase
  //   .from('materials')
  //   .update({ isActive: false, updatedAt: new Date().toISOString() })
  //   .eq('id', materialId)
  //   .eq('organizationId', orgId);
  // if (error) throw error;

  await updateMaterial(orgId, materialId, { isActive: false });
}
