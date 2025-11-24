# Opening Balance (OB) with Site Allocation - Complete Flow

## Overview
Opening Balance (OB) allows you to allocate initial stock quantities of materials across multiple sites. This document explains the complete flow from creation to display.

---

## 📊 Database Schema

### 1. `material_masters` Table
Stores the main material record with total opening balance:
```sql
- opening_balance: NUMERIC (Total OB across all sites)
- quantity: NUMERIC (Backward compatibility, same as opening_balance)
- site_id: UUID (Optional, for backward compatibility)
- site_name: TEXT (Optional, for backward compatibility)
```

### 2. `material_site_allocations` Table (Junction Table)
Stores site-specific OB allocations:
```sql
- id: UUID (Primary Key)
- material_id: UUID (Foreign Key → material_masters.id)
- site_id: UUID (Foreign Key → sites.id)
- opening_balance: NUMERIC (OB quantity for THIS site)
- organization_id: UUID
- UNIQUE(material_id, site_id) -- One allocation per material-site pair
```

---

## 🔄 Complete Flow

### **Step 1: User Creates Material with OB in Material Master Form**

**Location**: `MaterialMasterForm.tsx`

1. User enables "Add Opening Balance" toggle
2. User adds one or more site allocations:
   - Selects a site from dropdown
   - Enters OB quantity for that site
   - Can add multiple sites with different quantities
3. Form calculates total OB: `totalAllocatedOB = sum of all site allocations`

**Code Reference** (lines 232-269):
```typescript
const totalAllocatedOB = siteAllocations.reduce((sum, alloc) => sum + (alloc.quantity || 0), 0);

if (hasOpeningBalance && siteAllocations.length > 0) {
  materialData.openingBalance = totalAllocatedOB;
  materialData.siteAllocations = siteAllocations.filter(
    (alloc) => alloc.siteId && alloc.quantity > 0,
  );
}
```

---

### **Step 2: API Saves Material and Site Allocations**

**Location**: `src/app/api/materials/route.ts` (POST handler)

#### 2.1. Calculate Total Opening Balance
```typescript
const calculatedOpeningBalance =
  siteAllocations && siteAllocations.length > 0
    ? siteAllocations.reduce((sum, alloc) => sum + (alloc.quantity || 0), 0)
    : openingBalance ?? null;
```

#### 2.2. Insert Material Master Record
```typescript
const payload = {
  name,
  category,
  unit,
  site_id: siteResolution.siteId,      // Optional (backward compatibility)
  site_name: siteResolution.siteName,   // Optional (backward compatibility)
  quantity: finalQuantity,              // Same as opening_balance
  opening_balance: calculatedOpeningBalance, // Total OB
  // ... other fields
};

await supabase.from('material_masters').insert(payload);
```

#### 2.3. Insert Site Allocations (Junction Table)
```typescript
if (siteAllocations && siteAllocations.length > 0) {
  const allocationPayloads = siteAllocations.map((allocation) => ({
    material_id: materialId,
    site_id: allocation.siteId,
    opening_balance: allocation.quantity, // Site-specific OB
    organization_id: ctx.organizationId,
  }));

  await supabase
    .from('material_site_allocations')
    .insert(allocationPayloads);
}
```

**Database State After Creation**:
```
material_masters:
  id: "mat-123"
  name: "Cement OPC 53"
  opening_balance: 1000  (Total: 500 + 300 + 200)
  quantity: 1000

material_site_allocations:
  { material_id: "mat-123", site_id: "site-1", opening_balance: 500 }
  { material_id: "mat-123", site_id: "site-2", opening_balance: 300 }
  { material_id: "mat-123", site_id: "site-3", opening_balance: 200 }
```

---

### **Step 3: API Retrieves Materials with Site Allocations**

**Location**: `src/app/api/materials/route.ts` (GET handler)

#### 3.1. Fetch Material Masters
```typescript
const { data } = await supabase
  .from('material_masters')
  .select('id, name, category, unit, opening_balance, quantity, ...')
  .eq('organization_id', organizationId);
```

#### 3.2. Fetch Site Allocations for All Materials
```typescript
const { data: allocationsData } = await supabase
  .from('material_site_allocations')
  .select('material_id, site_id, opening_balance')
  .in('material_id', materialIds)
  .eq('organization_id', organizationId);

// Fetch site names
const { data: sitesData } = await supabase
  .from('sites')
  .select('id, name')
  .in('id', siteIds);
```

#### 3.3. Build Site Allocations Map
```typescript
const siteAllocationsMap = new Map<string, Array<{ siteId: string; siteName: string; quantity: number }>>();

allocationsData.forEach((allocation) => {
  const materialId = allocation.material_id;
  const siteId = allocation.site_id;
  const quantity = Number(allocation.opening_balance ?? 0);
  const siteName = siteNameMap.get(siteId) || '';

  siteAllocationsMap.get(materialId)!.push({ siteId, siteName, quantity });
});
```

#### 3.4. Attach Allocations to Materials
```typescript
const materials = data.map((row) => {
  const material = mapRowToMaterial(row);
  const allocations = siteAllocationsMap.get(row.id) || [];
  return {
    ...material,
    openingBalance: row.opening_balance ? Number(row.opening_balance) : null,
    siteAllocations: allocations.length > 0 ? allocations : undefined,
  };
});
```

**API Response Structure**:
```json
{
  "materials": [
    {
      "id": "mat-123",
      "name": "Cement OPC 53",
      "openingBalance": 1000,
      "quantity": 1000,
      "siteAllocations": [
        { "siteId": "site-1", "siteName": "Site A", "quantity": 500 },
        { "siteId": "site-2", "siteName": "Site B", "quantity": 300 },
        { "siteId": "site-3", "siteName": "Site C", "quantity": 200 }
      ]
    }
  ]
}
```

---

### **Step 4: Materials Page Displays OB**

**Location**: `src/components/materials.tsx`

#### 4.1. Normalize Materials Data
```typescript
const normalized: MaterialMasterItem[] = materials.map((material) => {
  // If material has site allocations but no direct siteId/siteName,
  // use the first allocation's site info for display
  let displaySiteId = material.siteId ?? null;
  let displaySiteName = material.siteName ?? null;
  
  if (!displaySiteId && !displaySiteName && material.siteAllocations && material.siteAllocations.length > 0) {
    displaySiteId = material.siteAllocations[0].siteId;
    displaySiteName = material.siteAllocations[0].siteName;
  }
  
  return {
    ...base,
    siteId: displaySiteId,
    siteName: displaySiteName,
    siteAllocations: material.siteAllocations,
  };
});
```

#### 4.2. Filter by Site (if filterBySite is provided)
```typescript
const scopedMaterials = materialMasterData.filter((material) => {
  // Check direct siteId match
  if (material.siteId?.toLowerCase() === filterLower) return true;
  
  // Check siteName match
  if ((material.siteName ?? '').toLowerCase() === filterLower) return true;
  
  // Check site allocations
  if (material.siteAllocations && material.siteAllocations.length > 0) {
    return material.siteAllocations.some(
      (alloc) =>
        alloc.siteId?.toLowerCase() === filterLower ||
        alloc.siteName?.toLowerCase() === filterLower,
    );
  }
  return false;
});
```

#### 4.3. Display Available Quantity
```typescript
// In table row rendering
const availableQuantity = material.openingBalance ?? material.quantity ?? 0;

<TableCell className="text-right font-semibold">
  {availableQuantity.toLocaleString()} {getShortUnit(material.unit)}
</TableCell>
```

**Display Logic**:
- **Priority 1**: `material.openingBalance` (if exists)
- **Priority 2**: `material.quantity` (backward compatibility)
- **Priority 3**: `0` (fallback)

---

### **Step 5: Site Detail Page Shows Site-Specific OB**

**Location**: `src/components/sites/SiteDetailPage.tsx`

#### 5.1. Fetch Materials for Site
```typescript
const response = await fetch('/api/materials', { cache: 'no-store' });
const materials = payload.materials ?? [];
```

#### 5.2. Filter Materials by Site
```typescript
const materials = (payload.materials ?? []).filter((m) => {
  // Check direct siteId match
  if (m.siteId === siteId) return true;
  
  // Check site allocations for this site
  if (m.siteAllocations && m.siteAllocations.length > 0) {
    return m.siteAllocations.some((alloc) => alloc.siteId === siteId);
  }
  return false;
});
```

#### 5.3. Map to Site-Specific Material Display
```typescript
const mappedMaterials: SiteMaterialMaster[] = materials.map((m) => {
  // Find the site allocation for THIS specific site
  const siteAllocation = m.siteAllocations?.find((alloc) => alloc.siteId === siteId);
  
  // Use OB from site allocation if available, otherwise use material's quantity
  const allocatedOB = siteAllocation?.quantity ?? m.quantity;
  const siteStock = allocatedOB - m.consumedQuantity;

  return {
    id: m.id,
    siteId: siteId,
    materialName: m.name,
    category: m.category,
    unit: m.unit,
    siteStock: siteStock,        // Site-specific available stock
    allocated: allocatedOB,      // Site-specific OB
    reserved: 0,
    status: siteStock > 0 ? (siteStock < allocatedOB * 0.2 ? 'low' : 'available') : 'critical',
  };
});
```

**Display in Site Detail Page**:
- Shows only materials allocated to that site
- Displays **site-specific OB** (not total OB)
- Calculates **site-specific stock** = `allocatedOB - consumedQuantity`
- Shows status based on site-specific stock levels

---

## 📍 Where OB is Displayed

### 1. **Materials Page** (`/materials`)
- **Column**: "Available Qty"
- **Value**: Total opening balance across all sites
- **Formula**: `openingBalance ?? quantity ?? 0`
- **Shows**: Aggregate OB for the material

### 2. **Site Detail Page - Materials Tab** (`/sites/:siteId`)
- **Column**: "Site Stock" / "Allocated"
- **Value**: Site-specific opening balance
- **Formula**: `siteAllocation.quantity` (for that specific site)
- **Shows**: Only OB allocated to that site

### 3. **Material Master Form (Edit Mode)**
- **Shows**: All site allocations in a list
- **Displays**: Site name + OB quantity for each allocation
- **Allows**: Adding/removing/modifying site allocations

---

## 🔍 Key Points

### ✅ **Total OB vs Site-Specific OB**
- **Total OB** (`material_masters.opening_balance`): Sum of all site allocations
- **Site-Specific OB** (`material_site_allocations.opening_balance`): OB for one site

### ✅ **Backward Compatibility**
- Materials without site allocations use `material_masters.quantity`
- Materials with site allocations use `material_masters.opening_balance`
- Both are supported for display

### ✅ **Filtering Logic**
- Materials page filters by checking:
  1. Direct `siteId` match
  2. Direct `siteName` match  
  3. Site allocations array
- Site detail page only shows materials with allocations for that site

### ✅ **Quantity Calculation Priority**
1. **Materials Page**: `openingBalance` → `quantity` → `0`
2. **Site Detail Page**: `siteAllocation.quantity` → `material.quantity` → `0`

---

## 🎯 Example Scenario

**Material**: Cement OPC 53
- **Total OB**: 1000 bags
- **Site Allocations**:
  - Site A: 500 bags
  - Site B: 300 bags
  - Site C: 200 bags

**Display**:
- **Materials Page**: Shows "1000 bags" (total)
- **Site A Detail Page**: Shows "500 bags" (site-specific)
- **Site B Detail Page**: Shows "300 bags" (site-specific)
- **Site C Detail Page**: Shows "200 bags" (site-specific)

---

## 🔧 Troubleshooting

### Material not showing in Materials Page?
1. Check if `isActive = true`
2. Check status filter (should be "All Statuses")
3. Verify material has `openingBalance` or `quantity` > 0

### Material not showing in Site Detail Page?
1. Verify site allocation exists in `material_site_allocations`
2. Check `site_id` matches the site being viewed
3. Ensure material is active

### OB quantity incorrect?
1. Check `material_masters.opening_balance` = sum of all allocations
2. Verify `material_site_allocations` records exist
3. Check for consumption via work progress (affects available stock)

