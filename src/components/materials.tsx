'use client';

import {
  Package,
  BarChart3,
  TrendingUp,
  Edit,
  Search,
  Building2,
  Grid3X3,
  Plus,
  Filter,
  CheckCircle2,
  Pause,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

import { useTableState } from '../lib/hooks/useTableState';
import { fetcher, swrConfig } from '../lib/swr';
import { formatDate } from '../lib/utils';

import MaterialMasterForm from './forms/MaterialMasterForm';
import { getActiveTaxRates } from './shared/masterData';
import type { MaterialMasterItem } from './shared/materialMasterData';

import { FilterSheet } from '@/components/filters/FilterSheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MaterialMasterInput } from '@/types/materials';

type MaterialAdvancedFilterState = {
  units: string[];
  taxRates: number[];
  rateMin: string;
  rateMax: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
};

const createDefaultMaterialAdvancedFilters = (): MaterialAdvancedFilterState => ({
  units: [],
  taxRates: [],
  rateMin: '',
  rateMax: '',
  createdFrom: undefined,
  createdTo: undefined,
  updatedFrom: undefined,
  updatedTo: undefined,
});

const cloneMaterialAdvancedFilters = (
  filters: MaterialAdvancedFilterState,
): MaterialAdvancedFilterState => ({
  ...filters,
  units: [...filters.units],
  taxRates: [...filters.taxRates],
});

const isMaterialAdvancedFilterDefault = (filters: MaterialAdvancedFilterState): boolean => {
  return (
    filters.units.length === 0 &&
    filters.taxRates.length === 0 &&
    filters.rateMin === '' &&
    filters.rateMax === '' &&
    !filters.createdFrom &&
    !filters.createdTo &&
    !filters.updatedFrom &&
    !filters.updatedTo
  );
};

const countMaterialAdvancedFilters = (filters: MaterialAdvancedFilterState): number => {
  let count = 0;
  count += filters.units.length;
  count += filters.taxRates.length;
  if (filters.rateMin !== '' || filters.rateMax !== '') count += 1;
  if (filters.createdFrom || filters.createdTo) count += 1;
  if (filters.updatedFrom || filters.updatedTo) count += 1;
  return count;
};

const parseDateValue = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

interface MaterialsPageProps {
  filterBySite?: string;
}

export function MaterialsPage({ filterBySite }: MaterialsPageProps = {}) {
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [masterCategoryFilter, setMasterCategoryFilter] = useState<string>('all');
  const [masterStatusFilter, setMasterStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialMasterItem | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMaterials, setTotalMaterials] = useState<number>(0);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<MaterialAdvancedFilterState>(
    () => createDefaultMaterialAdvancedFilters(),
  );
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<MaterialAdvancedFilterState>(
    () => createDefaultMaterialAdvancedFilters(),
  );

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'name',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  // Fetch materials using SWR with pagination
  const {
    data: materialsData,
    error: materialsError,
    isLoading,
    mutate: mutateMaterials,
  } = useSWR<{
    materials: MaterialMasterItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/materials?page=${page}&limit=${limit}`, fetcher, swrConfig);

  // Normalize materials data
  const materialMasterData = useMemo(() => {
    if (!materialsData?.materials) return [];

    return materialsData.materials.map((material) => {
      // If material has site allocations but no direct siteId/siteName, use the first allocation's site info
      let displaySiteId = material.siteId ?? null;
      let displaySiteName = material.siteName ?? null;

      if (
        !displaySiteId &&
        !displaySiteName &&
        material.siteAllocations &&
        material.siteAllocations.length > 0
      ) {
        displaySiteId = material.siteAllocations[0].siteId;
        displaySiteName = material.siteAllocations[0].siteName;
      }

      const base = {
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        siteId: displaySiteId,
        siteName: displaySiteName,
        quantity: material.quantity,
        consumedQuantity: material.consumedQuantity,
        standardRate: material.standardRate,
        isActive: material.isActive,
        hsn: material.hsn,
        taxRate: material.taxRate,
        createdDate: material.createdDate ?? material.createdAt?.split('T')[0] ?? '',
        lastUpdated: material.lastUpdated ?? material.updatedAt?.split('T')[0] ?? '',
      } as MaterialMasterItem;

      if (material.openingBalance !== undefined && material.openingBalance !== null) {
        base.openingBalance = material.openingBalance;
      }
      if (material.taxRateId) {
        base.taxRateId = material.taxRateId;
      }
      if (material.siteAllocations) {
        base.siteAllocations = material.siteAllocations;
      }
      return base;
    });
  }, [materialsData]);

  // Update pagination state when data changes
  useEffect(() => {
    if (materialsData?.pagination) {
      setTotalPages(materialsData.pagination.totalPages);
      setTotalMaterials(materialsData.pagination.total);
    }
  }, [materialsData]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (materialsError) {
      toast.error(
        materialsError instanceof Error ? materialsError.message : 'Failed to load materials.',
      );
    }
  }, [materialsError]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [masterCategoryFilter, masterStatusFilter, searchQuery, appliedAdvancedFilters]);

  const scopedMaterials = useMemo(() => {
    if (!filterBySite) return materialMasterData;
    const filterLower = filterBySite.toLowerCase();
    return materialMasterData.filter((material) => {
      // Check if material has direct siteId match (backward compatibility)
      if (material.siteId?.toLowerCase() === filterLower) {
        return true;
      }
      // Check if material has siteName match (backward compatibility)
      if ((material.siteName ?? '').toLowerCase() === filterLower) {
        return true;
      }
      // Check if material has site allocations for this site (OB allocated via material_site_allocations)
      if (material.siteAllocations && material.siteAllocations.length > 0) {
        return material.siteAllocations.some(
          (alloc) =>
            alloc.siteId?.toLowerCase() === filterLower ||
            alloc.siteName?.toLowerCase() === filterLower,
        );
      }
      return false;
    });
  }, [filterBySite, materialMasterData]);

  const unitOptions = useMemo(() => {
    const units = new Set<string>();
    scopedMaterials.forEach((material) => {
      if (material.unit) {
        units.add(material.unit);
      }
    });
    return Array.from(units).sort((a, b) => a.localeCompare(b));
  }, [scopedMaterials]);

  const taxRateOptions = useMemo(() => {
    const taxRates = new Set<number>();
    materialMasterData.forEach((material) => {
      if (typeof material.taxRate === 'number') {
        taxRates.add(material.taxRate);
      }
    });
    return Array.from(taxRates).sort((a, b) => a - b);
  }, [materialMasterData]);

  const activeAdvancedFilterCount = useMemo(
    () => countMaterialAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const sortedAndFilteredMaterials = useMemo(() => {
    const minRate =
      appliedAdvancedFilters.rateMin !== '' ? Number(appliedAdvancedFilters.rateMin) : undefined;
    const maxRate =
      appliedAdvancedFilters.rateMax !== '' ? Number(appliedAdvancedFilters.rateMax) : undefined;
    const createdFrom = parseDateValue(appliedAdvancedFilters.createdFrom);
    const createdTo = parseDateValue(appliedAdvancedFilters.createdTo);
    const updatedFrom = parseDateValue(appliedAdvancedFilters.updatedFrom);
    const updatedTo = parseDateValue(appliedAdvancedFilters.updatedTo);

    return scopedMaterials
      .filter((material) => {
        const matchesSearch =
          searchQuery === '' ||
          material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (material.siteName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          masterCategoryFilter === 'all' || material.category === masterCategoryFilter;
        const matchesStatus =
          masterStatusFilter === 'all' ||
          (masterStatusFilter === 'active' && material.isActive) ||
          (masterStatusFilter === 'inactive' && !material.isActive);
        const matchesUnits =
          appliedAdvancedFilters.units.length === 0 ||
          appliedAdvancedFilters.units.includes(material.unit);
        const matchesTaxRates =
          appliedAdvancedFilters.taxRates.length === 0 ||
          appliedAdvancedFilters.taxRates.includes(material.taxRate);
        const matchesMinRate =
          minRate === undefined || Number.isNaN(minRate) || material.standardRate >= minRate;
        const matchesMaxRate =
          maxRate === undefined || Number.isNaN(maxRate) || material.standardRate <= maxRate;

        const createdDate = parseDateValue(material.createdDate);
        const updatedDate = parseDateValue(material.lastUpdated);

        const matchesCreatedFrom =
          !createdFrom || (createdDate !== null && createdDate >= createdFrom);
        const matchesCreatedTo = !createdTo || (createdDate !== null && createdDate <= createdTo);
        const matchesUpdatedFrom =
          !updatedFrom || (updatedDate !== null && updatedDate >= updatedFrom);
        const matchesUpdatedTo = !updatedTo || (updatedDate !== null && updatedDate <= updatedTo);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesUnits &&
          matchesTaxRates &&
          matchesMinRate &&
          matchesMaxRate &&
          matchesCreatedFrom &&
          matchesCreatedTo &&
          matchesUpdatedFrom &&
          matchesUpdatedTo
        );
      })
      .sort((a, b) => {
        const aValue = a[tableState.sortField as keyof MaterialMasterItem];
        const bValue = b[tableState.sortField as keyof MaterialMasterItem];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return tableState.sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return tableState.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });
  }, [
    appliedAdvancedFilters,
    scopedMaterials,
    masterCategoryFilter,
    masterStatusFilter,
    searchQuery,
    tableState,
  ]);

  // Material Master functions
  const handleMaterialSubmit = useCallback(
    async (formData: MaterialMasterInput) => {
      setIsSaving(true);
      try {
        const isEditing = Boolean(editingMaterial);
        const response = await fetch(
          isEditing ? `/api/materials/${editingMaterial?.id}` : '/api/materials',
          {
            method: isEditing ? 'PATCH' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              category: formData.category,
              unit: formData.unit,
              standardRate: formData.standardRate,
              isActive: formData.isActive,
              hsn: formData.hsn,
              taxRateId: formData.taxRateId,
              siteId: formData.siteId ?? null,
              openingBalance: formData.openingBalance,
              siteAllocations: formData.siteAllocations,
            }),
          },
        );

        const payload = (await response.json().catch(() => ({}))) as {
          material?: MaterialMasterItem;
          error?: string;
        };

        if (!response.ok || !payload.material) {
          throw new Error(payload.error || 'Failed to save material.');
        }

        // Optimistically update the cache - add/update the material immediately
        // Note: This works for the current page cache, but we also invalidate all material caches
        const updateCache = (currentData: { materials: MaterialMasterItem[] } | undefined) => {
          if (!currentData || !currentData.materials) {
            return undefined; // Let revalidation handle it
          }

          if (isEditing) {
            // Update existing material
            const updatedMaterials = currentData.materials.map((m: MaterialMasterItem) =>
              m.id === editingMaterial?.id ? payload.material! : m,
            );
            return {
              ...currentData,
              materials: updatedMaterials,
            };
          } else {
            // Add new material to the beginning
            return {
              ...currentData,
              materials: [payload.material!, ...currentData.materials],
              pagination: {
                ...currentData.pagination,
                total: (currentData.pagination?.total || 0) + 1,
              },
            };
          }
        };

        // Update cache optimistically for instant UI update
        mutateMaterials(updateCache, { revalidate: false });
        mutate((key) => typeof key === 'string' && key.startsWith('/api/materials'), updateCache, {
          revalidate: false,
        });

        // Reset to first page after create/update to see the new/updated material
        setPage(1);
        toast.success(
          isEditing ? 'Material updated successfully.' : 'Material added successfully.',
        );
        setEditingMaterial(null);
        setIsMaterialDialogOpen(false);

        // Immediately revalidate to fetch fresh data from server (bypassing all caches)
        // This ensures production gets the latest data immediately
        await Promise.all([
          mutateMaterials(undefined, {
            revalidate: true,
            rollbackOnError: false,
          }),
          mutate((key) => typeof key === 'string' && key.startsWith('/api/materials'), undefined, {
            revalidate: true,
            rollbackOnError: false,
          }),
        ]);
      } catch (error) {
        console.error('Failed to save material', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save material.');
      } finally {
        setIsSaving(false);
      }
    },
    [editingMaterial, mutateMaterials],
  );

  const handleEditMaterial = (material: MaterialMasterItem) => {
    setEditingMaterial(material);
    setIsMaterialDialogOpen(true);
  };

  const handleAddNewMaterial = () => {
    setEditingMaterial(null);
    setIsMaterialDialogOpen(true);
  };

  const handleDeleteMaterial = useCallback(
    async (materialId: string) => {
      const target = materialMasterData.find((material) => material.id === materialId);
      if (!target) {
        return;
      }

      const confirmed = window.confirm(
        `Delete "${target.name}" from material master? This action cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }

      // Optimistically update the cache IMMEDIATELY - remove the deleted material from UI right away
      // This provides instant UI feedback before the API call completes
      const updateCache = (
        currentData:
          | {
              materials: MaterialMasterItem[];
              pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
              };
            }
          | undefined,
      ) => {
        if (!currentData) return undefined;
        return {
          materials: currentData.materials.filter((m) => m.id !== materialId),
          pagination: {
            ...currentData.pagination,
            total: Math.max(0, currentData.pagination.total - 1),
          },
        };
      };

      // Rollback function in case deletion fails
      const rollbackCache = (
        currentData:
          | {
              materials: MaterialMasterItem[];
              pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
              };
            }
          | undefined,
      ) => {
        if (!currentData) return undefined;
        // Restore material to its original position (sorted by created_at)
        const restoredMaterials = [...currentData.materials, target].sort((a, b) => {
          if (a.createdDate && b.createdDate) {
            return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
          }
          return 0;
        });
        return {
          materials: restoredMaterials,
          pagination: {
            ...currentData.pagination,
            total: currentData.pagination.total + 1,
          },
        };
      };

      // Update cache optimistically for INSTANT UI update
      mutateMaterials(updateCache, { revalidate: false });
      mutate((key) => typeof key === 'string' && key.startsWith('/api/materials'), updateCache, {
        revalidate: false,
      });

      // Show success toast IMMEDIATELY (before API call completes)
      toast.success('Material deleted successfully.');

      // Perform the actual deletion in the background
      try {
        const response = await fetch(`/api/materials/${materialId}`, {
          method: 'DELETE',
        });

        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || !payload.success) {
          // Rollback optimistic update on error
          mutateMaterials(rollbackCache, { revalidate: false });
          mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/materials'),
            rollbackCache,
            { revalidate: false },
          );

          toast.error(payload.error || 'Failed to delete material. Please try again.');
          return;
        }

        // Revalidate in the background to ensure consistency (non-blocking)
        // This ensures production gets the latest data but doesn't block the UI
        void Promise.all([
          mutateMaterials(undefined, {
            revalidate: true,
            rollbackOnError: false,
          }),
          mutate((key) => typeof key === 'string' && key.startsWith('/api/materials'), undefined, {
            revalidate: true,
            rollbackOnError: false,
          }),
        ]);
      } catch (error) {
        // Rollback optimistic update on error
        mutateMaterials(rollbackCache, { revalidate: false });
        mutate(
          (key) => typeof key === 'string' && key.startsWith('/api/materials'),
          rollbackCache,
          { revalidate: false },
        );

        console.error('Failed to delete material', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to delete material. Please try again.',
        );
      }
    },
    [materialMasterData, mutateMaterials],
  );

  const toggleMasterMaterialStatus = useCallback(
    async (materialId: string) => {
      try {
        const material = materialMasterData.find((m) => m.id === materialId);
        if (!material) return;

        const response = await fetch(`/api/materials/${materialId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !material.isActive,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          material?: MaterialMasterItem;
          error?: string;
        };

        if (!response.ok || !payload.material) {
          throw new Error(payload.error || 'Failed to update material status.');
        }

        await mutateMaterials(); // Refresh materials data
      } catch (error) {
        console.error('Failed to update material status', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update status.');
      }
    },
    [materialMasterData],
  );

  const getMasterCategoryIcon = (category: string) => {
    switch (category) {
      case 'Cement':
        return Building2;
      case 'Steel':
        return Grid3X3;
      default:
        return Package;
    }
  };

  const activeMaterials = useMemo(
    () => scopedMaterials.filter((m) => m.isActive).length,
    [scopedMaterials],
  );
  const totalCategories = useMemo(
    () => new Set(scopedMaterials.map((m) => m.category)).size,
    [scopedMaterials],
  );
  const totalTrackedQuantity = useMemo(() => {
    return scopedMaterials.reduce((sum, m) => sum + (m.openingBalance ?? m.quantity ?? 0), 0);
  }, [scopedMaterials]);

  const totalConsumedQuantity = useMemo(() => {
    return scopedMaterials.reduce((sum, m) => sum + (m.consumedQuantity ?? 0), 0);
  }, [scopedMaterials]);

  return (
    <div className="w-full bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        {/* Material Master Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Materials</p>
                      <p className="text-2xl font-bold text-primary">{totalMaterials}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Active Materials</p>
                      <p className="text-2xl font-bold text-green-600">{activeMaterials}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Categories</p>
                      <p className="text-2xl font-bold text-orange-600">{totalCategories}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tracked Quantity</p>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {totalTrackedQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Consumed:{' '}
                          {totalConsumedQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-[400px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search materials..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={masterCategoryFilter} onValueChange={setMasterCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Cement">Cement</SelectItem>
                      <SelectItem value="Steel">Steel</SelectItem>
                      <SelectItem value="Concrete">Concrete</SelectItem>
                      <SelectItem value="Bricks">Bricks</SelectItem>
                      <SelectItem value="Sand">Sand</SelectItem>
                      <SelectItem value="Aggregate">Aggregate</SelectItem>
                      <SelectItem value="Timber">Timber</SelectItem>
                      <SelectItem value="Electrical">Electrical</SelectItem>
                      <SelectItem value="Plumbing">Plumbing</SelectItem>
                      <SelectItem value="Paint">Paint</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={masterStatusFilter} onValueChange={setMasterStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 transition-all hover:shadow-md"
                          onClick={() => {
                            setDraftAdvancedFilters(
                              cloneMaterialAdvancedFilters(appliedAdvancedFilters),
                            );
                            setIsFilterSheetOpen(true);
                          }}
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                          {hasActiveAdvancedFilters ? (
                            <Badge variant="secondary" className="ml-2">
                              {activeAdvancedFilterCount}
                            </Badge>
                          ) : null}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open advanced filter options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-all hover:shadow-md"
                    disabled={!hasActiveAdvancedFilters}
                    onClick={() => {
                      const resetFilters = createDefaultMaterialAdvancedFilters();
                      setAppliedAdvancedFilters(resetFilters);
                      setDraftAdvancedFilters(resetFilters);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear filters</span>
                  </Button>
                  <Dialog
                    open={isMaterialDialogOpen}
                    onOpenChange={(open) => {
                      setIsMaterialDialogOpen(open);
                      if (!open) {
                        setEditingMaterial(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={handleAddNewMaterial}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Material</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-xl">
                          {editingMaterial ? 'Edit Material' : 'Add New Material'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingMaterial
                            ? 'Update material details in the master database'
                            : 'Create a new material entry in the master database'}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea
                        className="flex-1 min-h-0 overflow-y-auto"
                        style={{ maxHeight: 'calc(90vh - 140px)' }}
                      >
                        <div className="px-6 py-6">
                          <MaterialMasterForm
                            onSubmit={handleMaterialSubmit}
                            onCancel={() => setIsMaterialDialogOpen(false)}
                            defaultValues={
                              editingMaterial
                                ? {
                                    name: editingMaterial.name,
                                    category: editingMaterial.category,
                                    unit: editingMaterial.unit,
                                    siteId: editingMaterial.siteId ?? undefined,
                                    standardRate: editingMaterial.standardRate,
                                    isActive: editingMaterial.isActive,
                                    hsn: editingMaterial.hsn,
                                    taxRateId:
                                      editingMaterial.taxRateId ??
                                      (editingMaterial.taxRate &&
                                      typeof editingMaterial.taxRate === 'number'
                                        ? (() => {
                                            const taxRate = getActiveTaxRates().find(
                                              (tr) => tr.rate === editingMaterial.taxRate,
                                            );
                                            return taxRate?.code || 'GST18';
                                          })()
                                        : 'GST18'),
                                    openingBalance: editingMaterial.openingBalance,
                                    siteAllocations: editingMaterial.siteAllocations,
                                  }
                                : undefined
                            }
                            isEdit={!!editingMaterial}
                          />
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {isLoading
                  ? 'Loading materials…'
                  : `${sortedAndFilteredMaterials.length} material${
                      sortedAndFilteredMaterials.length !== 1 ? 's' : ''
                    } found`}
              </Badge>
              {hasActiveAdvancedFilters ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(() => {
                    const chips: string[] = [];
                    if (appliedAdvancedFilters.units.length > 0) {
                      chips.push(`Units: ${appliedAdvancedFilters.units.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.taxRates.length > 0) {
                      chips.push(`GST: ${appliedAdvancedFilters.taxRates.join('%, ')}%`);
                    }
                    if (appliedAdvancedFilters.rateMin || appliedAdvancedFilters.rateMax) {
                      const min = appliedAdvancedFilters.rateMin || 'Any';
                      const max = appliedAdvancedFilters.rateMax || 'Any';
                      chips.push(`Rate: ₹${min} - ₹${max}`);
                    }
                    if (appliedAdvancedFilters.createdFrom || appliedAdvancedFilters.createdTo) {
                      chips.push(
                        `Created: ${appliedAdvancedFilters.createdFrom ?? 'Any'} → ${appliedAdvancedFilters.createdTo ?? 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.updatedFrom || appliedAdvancedFilters.updatedTo) {
                      chips.push(
                        `Updated: ${appliedAdvancedFilters.updatedFrom ?? 'Any'} → ${appliedAdvancedFilters.updatedTo ?? 'Any'}`,
                      );
                    }
                    return chips;
                  })().map((chip) => (
                    <Badge key={chip} variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {chip}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Materials Table */}
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="space-y-3 text-center text-muted-foreground">
                <p className="text-sm">Loading materials…</p>
              </div>
            </CardContent>
          </Card>
        ) : sortedAndFilteredMaterials.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Materials Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {materialMasterData.length === 0
                    ? 'Start by adding your first material to manage inventory.'
                    : 'No materials match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={handleAddNewMaterial}
                  className="gap-2 transition-all hover:shadow-md"
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Material</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[80px]">Unit</TableHead>
                      <TableHead className="min-w-[120px] text-right">Available Qty</TableHead>
                      <TableHead className="min-w-[120px] text-right">Rate (₹)</TableHead>
                      <TableHead className="min-w-[100px]">HSN Code</TableHead>
                      <TableHead className="min-w-[80px]">Tax Rate</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Last Updated</TableHead>
                      <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredMaterials.map((material) => {
                      const IconComponent = getMasterCategoryIcon(material.category);

                      // Convert units to short forms
                      const getShortUnit = (unit: string) => {
                        const unitMap: { [key: string]: string } = {
                          bags: 'bags',
                          kg: 'kg',
                          kilograms: 'kg',
                          tons: 'tons',
                          tonnes: 'tons',
                          'cubic meters': 'm³',
                          'cubic feet': 'ft³',
                          'square meters': 'm²',
                          'square feet': 'ft²',
                          meters: 'm',
                          feet: 'ft',
                          pieces: 'pcs',
                          units: 'units',
                          liters: 'L',
                          gallons: 'gal',
                          boxes: 'boxes',
                          rolls: 'rolls',
                          sheets: 'sheets',
                          bars: 'bars',
                          rods: 'rods',
                          pipes: 'pipes',
                          tubes: 'tubes',
                          cables: 'cables',
                          wires: 'wires',
                          switches: 'switches',
                          outlets: 'outlets',
                          fixtures: 'fixtures',
                          bulbs: 'bulbs',
                          tiles: 'tiles',
                          panels: 'panels',
                          boards: 'boards',
                          blocks: 'blocks',
                          bricks: 'bricks',
                          stones: 'stones',
                          gravel: 'gravel',
                          sand: 'sand',
                          cement: 'cement',
                          concrete: 'concrete',
                          mortar: 'mortar',
                          plaster: 'plaster',
                          paint: 'paint',
                          primer: 'primer',
                          varnish: 'varnish',
                          sealant: 'sealant',
                          adhesive: 'adhesive',
                          glue: 'glue',
                          screws: 'screws',
                          nails: 'nails',
                          bolts: 'bolts',
                          nuts: 'nuts',
                          washers: 'washers',
                          brackets: 'brackets',
                          hinges: 'hinges',
                          handles: 'handles',
                          locks: 'locks',
                          keys: 'keys',
                          chains: 'chains',
                          ropes: 'ropes',
                          cords: 'cords',
                          straps: 'straps',
                          belts: 'belts',
                          gaskets: 'gaskets',
                          'o-rings': 'o-rings',
                          seals: 'seals',
                          filters: 'filters',
                          screens: 'screens',
                          mesh: 'mesh',
                          netting: 'netting',
                          fabric: 'fabric',
                          cloth: 'cloth',
                          canvas: 'canvas',
                          plastic: 'plastic',
                          rubber: 'rubber',
                          foam: 'foam',
                          insulation: 'insulation',
                          padding: 'padding',
                          cushioning: 'cushioning',
                          packaging: 'pkg',
                          wrapping: 'wrap',
                          tape: 'tape',
                          labels: 'labels',
                          tags: 'tags',
                          markers: 'markers',
                          pens: 'pens',
                          pencils: 'pencils',
                          chalk: 'chalk',
                          crayons: 'crayons',
                          brushes: 'brushes',
                          rollers: 'rollers',
                          sponges: 'sponges',
                          cloths: 'cloths',
                          towels: 'towels',
                          rags: 'rags',
                          wipes: 'wipes',
                          cleaners: 'cleaners',
                          solvents: 'solvents',
                          detergents: 'detergents',
                          soaps: 'soaps',
                          disinfectants: 'disinfectants',
                          sanitizers: 'sanitizers',
                          lubricants: 'lubricants',
                          oils: 'oils',
                          greases: 'greases',
                          fuels: 'fuels',
                          gases: 'gases',
                          chemicals: 'chemicals',
                          powders: 'powders',
                          granules: 'granules',
                          pellets: 'pellets',
                          beads: 'beads',
                          chips: 'chips',
                          flakes: 'flakes',
                          shavings: 'shavings',
                          dust: 'dust',
                          powder: 'powder',
                          paste: 'paste',
                          gel: 'gel',
                          cream: 'cream',
                          lotion: 'lotion',
                          spray: 'spray',
                          aerosol: 'aerosol',
                          liquid: 'liquid',
                          solution: 'solution',
                          mixture: 'mixture',
                          compound: 'compound',
                          alloy: 'alloy',
                          blend: 'blend',
                          mix: 'mix',
                          batch: 'batch',
                          lot: 'lot',
                          set: 'set',
                          kit: 'kit',
                          package: 'pkg',
                          bundle: 'bundle',
                          group: 'group',
                          collection: 'collection',
                          assortment: 'assortment',
                          variety: 'variety',
                          selection: 'selection',
                          range: 'range',
                          series: 'series',
                          line: 'line',
                          family: 'family',
                          category: 'category',
                          type: 'type',
                          kind: 'kind',
                          sort: 'sort',
                          class: 'class',
                          grade: 'grade',
                          quality: 'quality',
                          standard: 'standard',
                          specification: 'spec',
                          model: 'model',
                          version: 'version',
                          edition: 'edition',
                          release: 'release',
                          update: 'update',
                          patch: 'patch',
                          fix: 'fix',
                          upgrade: 'upgrade',
                          enhancement: 'enhancement',
                          improvement: 'improvement',
                          modification: 'modification',
                          customization: 'customization',
                          personalization: 'personalization',
                          adaptation: 'adaptation',
                          adjustment: 'adjustment',
                          calibration: 'calibration',
                          configuration: 'config',
                          setup: 'setup',
                          installation: 'install',
                          assembly: 'assembly',
                          construction: 'construction',
                          fabrication: 'fabrication',
                          manufacturing: 'manufacturing',
                          production: 'production',
                          creation: 'creation',
                          generation: 'generation',
                          development: 'development',
                          design: 'design',
                          planning: 'planning',
                          scheduling: 'scheduling',
                          coordination: 'coordination',
                          management: 'management',
                          administration: 'administration',
                          supervision: 'supervision',
                          oversight: 'oversight',
                          monitoring: 'monitoring',
                          tracking: 'tracking',
                          logging: 'logging',
                          recording: 'recording',
                          documentation: 'documentation',
                          reporting: 'reporting',
                          analysis: 'analysis',
                          evaluation: 'evaluation',
                          assessment: 'assessment',
                          review: 'review',
                          inspection: 'inspection',
                          examination: 'examination',
                          testing: 'testing',
                          validation: 'validation',
                          verification: 'verification',
                          confirmation: 'confirmation',
                          approval: 'approval',
                          authorization: 'authorization',
                          permission: 'permission',
                          license: 'license',
                          certificate: 'certificate',
                          credential: 'credential',
                          qualification: 'qualification',
                          competency: 'competency',
                          skill: 'skill',
                          ability: 'ability',
                          capability: 'capability',
                          capacity: 'capacity',
                          potential: 'potential',
                          possibility: 'possibility',
                          opportunity: 'opportunity',
                          chance: 'chance',
                          probability: 'probability',
                          likelihood: 'likelihood',
                          risk: 'risk',
                          threat: 'threat',
                          danger: 'danger',
                          hazard: 'hazard',
                          safety: 'safety',
                          security: 'security',
                          protection: 'protection',
                          defense: 'defense',
                          prevention: 'prevention',
                          avoidance: 'avoidance',
                          mitigation: 'mitigation',
                          reduction: 'reduction',
                          minimization: 'minimization',
                          optimization: 'optimization',
                          maximization: 'maximization',
                        };
                        return unitMap[unit.toLowerCase()] || unit;
                      };

                      // Calculate available quantity based on context
                      // If filterBySite is provided, use site-specific OB from allocations
                      // Otherwise, use total OB
                      let availableQuantity: number;
                      if (
                        filterBySite &&
                        material.siteAllocations &&
                        material.siteAllocations.length > 0
                      ) {
                        // Find site-specific allocation
                        const normalizedFilterSiteId = String(filterBySite || '')
                          .trim()
                          .toLowerCase();
                        const siteAllocation = material.siteAllocations.find((alloc) => {
                          const allocSiteId = String(alloc.siteId || '')
                            .trim()
                            .toLowerCase();
                          const allocSiteName = String(alloc.siteName || '')
                            .trim()
                            .toLowerCase();
                          return (
                            allocSiteId === normalizedFilterSiteId ||
                            allocSiteName === normalizedFilterSiteId
                          );
                        });
                        // Use site-specific OB if found, otherwise 0
                        availableQuantity = siteAllocation?.quantity ?? 0;
                      } else {
                        // No site filter or no allocations - use total OB
                        availableQuantity = material.openingBalance ?? material.quantity ?? 0;
                      }

                      // Get tax rate info from masters
                      const taxRateId = material.taxRateId;
                      const taxRateInfo = taxRateId
                        ? getActiveTaxRates().find((tr) => tr.code === taxRateId)
                        : null;
                      const taxRateDisplay = taxRateInfo
                        ? `${taxRateInfo.name} (${taxRateInfo.rate}%)`
                        : `${material.taxRate ?? 0}%`;

                      return (
                        <TableRow
                          key={material.id}
                          className="group cursor-pointer transition-all duration-200 hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 bg-primary/10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate">
                                  {material.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {material.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {getShortUnit(material.unit)}
                          </TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">
                            <span>
                              {availableQuantity.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              {getShortUnit(material.unit)}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-primary text-right whitespace-nowrap">
                            ₹{material.standardRate.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {material.hsn || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">{taxRateDisplay}</TableCell>
                          <TableCell>
                            <Badge
                              variant={material.isActive ? 'default' : 'destructive'}
                              className="text-xs flex items-center gap-1 w-fit whitespace-nowrap"
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${material.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                              />
                              {material.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(material.lastUpdated)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditMaterial(material);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                                      aria-label="Edit material"
                                    >
                                      <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit material</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleMasterMaterialStatus(material.id);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                                      aria-label={
                                        material.isActive
                                          ? 'Deactivate material'
                                          : 'Activate material'
                                      }
                                    >
                                      {material.isActive ? (
                                        <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{material.isActive ? 'Deactivate' : 'Activate'} material</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleDeleteMaterial(material.id);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                                      aria-label="Delete material"
                                    >
                                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete material</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalMaterials)} of{' '}
                    {totalMaterials} materials
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            disabled={isLoading}
                            className="min-w-[2.5rem]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Material filters"
        description="Refine the material master list with additional criteria."
        sections={[
          {
            id: 'unit',
            title: 'Unit of measure',
            description: 'Show only materials measured in the selected units.',
            content:
              unitOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No units available.</p>
              ) : (
                <div className="grid gap-2">
                  {unitOptions.map((unit) => {
                    const isChecked = draftAdvancedFilters.units.includes(unit);
                    return (
                      <Label key={unit} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextUnits =
                                checked === true
                                  ? [...prev.units, unit]
                                  : prev.units.filter((value) => value !== unit);
                              return {
                                ...prev,
                                units: nextUnits,
                              };
                            });
                          }}
                        />
                        <span>{unit}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'tax-rate',
            title: 'GST rate (%)',
            description: 'Filter materials by their applicable GST rate.',
            content:
              taxRateOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No GST rates available.</p>
              ) : (
                <div className="grid gap-2">
                  {taxRateOptions.map((rate) => {
                    const isChecked = draftAdvancedFilters.taxRates.includes(rate);
                    return (
                      <Label key={rate} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextRates =
                                checked === true
                                  ? [...prev.taxRates, rate]
                                  : prev.taxRates.filter((value) => value !== rate);
                              return {
                                ...prev,
                                taxRates: nextRates,
                              };
                            });
                          }}
                        />
                        <span>{rate}%</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'standard-rate',
            title: 'Standard rate (₹)',
            description: 'Limit materials to a price band.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="material-rate-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="material-rate-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.rateMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        rateMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="material-rate-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="material-rate-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.rateMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        rateMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'created-date',
            title: 'Created date',
            description: 'Only include materials added in this period.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="material-created-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="material-created-from"
                    type="date"
                    value={draftAdvancedFilters.createdFrom ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        createdFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="material-created-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="material-created-to"
                    type="date"
                    value={draftAdvancedFilters.createdTo ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        createdTo: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'updated-date',
            title: 'Last updated',
            description: 'Filter materials based on their most recent update.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="material-updated-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="material-updated-from"
                    type="date"
                    value={draftAdvancedFilters.updatedFrom ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        updatedFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="material-updated-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="material-updated-to"
                    type="date"
                    value={draftAdvancedFilters.updatedTo ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        updatedTo: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
        ]}
        onApply={() => {
          setAppliedAdvancedFilters(cloneMaterialAdvancedFilters(draftAdvancedFilters));
          setIsFilterSheetOpen(false);
        }}
        onReset={() => {
          const resetFilters = createDefaultMaterialAdvancedFilters();
          setDraftAdvancedFilters(resetFilters);
          setAppliedAdvancedFilters(resetFilters);
        }}
        isDirty={!isMaterialAdvancedFilterDefault(draftAdvancedFilters)}
      />
    </div>
  );
}
