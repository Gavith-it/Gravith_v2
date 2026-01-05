'use client';

import {
  Plus,
  Scale,
  TrendingUp,
  Package,
  Link as LinkIcon,
  Unlink,
  Edit,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { useDialogState } from '../lib/hooks/useDialogState';
import { useTableState } from '../lib/hooks/useTableState';

import { DataTable } from './common/DataTable';
import { MaterialReceiptForm } from './forms/MaterialReceiptForm';
import { PurchaseTabs } from './layout/PurchaseTabs';

import { FilterSheet } from '@/components/filters/FilterSheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMaterialReceipts, useMaterials } from '@/lib/contexts';
import { fetcher } from '@/lib/swr';
import type { MaterialReceipt } from '@/types';
import type { MaterialMaster } from '@/types/entities';

interface MaterialReceiptsPageProps {
  filterBySite?: string;
  showTabs?: boolean;
}

export function MaterialReceiptsPage({
  filterBySite,
  showTabs = true,
}: MaterialReceiptsPageProps = {}) {
  const router = useRouter();
  const {
    receipts,
    isLoading: isReceiptsLoading,
    refresh: refreshReceipts,
    deleteReceipt,
    linkReceiptToPurchase,
    unlinkReceipt,
  } = useMaterialReceipts();
  const { materials, isLoading: isMaterialsLoading, refresh: refreshMaterials } = useMaterials();

  // Fetch material masters to get current material names
  // Revalidate on focus and reconnect to ensure we have latest material names
  const { data: materialsData, mutate: mutateMaterials } = useSWR<{
    materials: MaterialMaster[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>('/api/materials?page=1&limit=100', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Create a map of materialId -> current material name
  const materialNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (materialsData?.materials) {
      materialsData.materials.forEach((material) => {
        if (material.id) {
          map.set(material.id, material.name);
        }
      });
    }
    return map;
  }, [materialsData]);

  // Helper function to get current material name
  const getCurrentMaterialName = (receipt: MaterialReceipt): string => {
    if (receipt.materialId && materialNameMap.has(receipt.materialId)) {
      return materialNameMap.get(receipt.materialId)!;
    }
    // Fallback to stored name if material master not found
    return receipt.materialName;
  };

  const scopedReceipts = useMemo(() => {
    if (!filterBySite) {
      return receipts;
    }
    const filterLower = filterBySite.toLowerCase();
    return receipts.filter(
      (receipt) =>
        receipt.siteId?.toLowerCase() === filterLower ||
        (receipt.siteName ?? '').toLowerCase() === filterLower,
    );
  }, [filterBySite, receipts]);

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'date',
    initialSortDirection: 'desc',
    initialItemsPerPage: 10,
  });

  const dialog = useDialogState<MaterialReceipt>();

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<MaterialReceipt | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  type ReceiptAdvancedFilterState = {
    sites: string[];
    vendors: string[];
    vehicles: string[];
    dateFrom?: string;
    dateTo?: string;
    netWeightMin: string;
    netWeightMax: string;
  };

  const createDefaultReceiptAdvancedFilters = (): ReceiptAdvancedFilterState => ({
    sites: [],
    vendors: [],
    vehicles: [],
    dateFrom: undefined,
    dateTo: undefined,
    netWeightMin: '',
    netWeightMax: '',
  });

  const cloneReceiptAdvancedFilters = (
    filters: ReceiptAdvancedFilterState,
  ): ReceiptAdvancedFilterState => ({
    ...filters,
    sites: [...filters.sites],
    vendors: [...filters.vendors],
    vehicles: [...filters.vehicles],
  });

  const isReceiptAdvancedFilterDefault = (filters: ReceiptAdvancedFilterState): boolean => {
    return (
      filters.sites.length === 0 &&
      filters.vendors.length === 0 &&
      filters.vehicles.length === 0 &&
      !filters.dateFrom &&
      !filters.dateTo &&
      filters.netWeightMin === '' &&
      filters.netWeightMax === ''
    );
  };

  const countReceiptAdvancedFilters = (filters: ReceiptAdvancedFilterState): number => {
    let count = 0;
    count += filters.sites.length;
    count += filters.vendors.length;
    count += filters.vehicles.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.netWeightMin !== '' || filters.netWeightMax !== '') count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<ReceiptAdvancedFilterState>(
    createDefaultReceiptAdvancedFilters(),
  );
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<ReceiptAdvancedFilterState>(
    createDefaultReceiptAdvancedFilters(),
  );

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedReceiptForLink, setSelectedReceiptForLink] = useState<MaterialReceipt | null>(
    null,
  );
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate summary statistics
  const { totalReceipts, totalNetWeight, linkedCount, openCount } = useMemo(() => {
    const receiptCount = scopedReceipts.length;
    const netWeightSum = scopedReceipts.reduce((sum, receipt) => sum + (receipt.netWeight ?? 0), 0);
    const linked = scopedReceipts.filter((r) => r.linkedPurchaseId).length;
    const open = receiptCount - linked;

    return {
      totalReceipts: receiptCount,
      totalNetWeight: netWeightSum,
      linkedCount: linked,
      openCount: open,
    };
  }, [scopedReceipts]);

  const siteOptions = useMemo(() => {
    const sites = new Set<string>();
    scopedReceipts.forEach((receipt) => {
      if (receipt.siteName) {
        sites.add(receipt.siteName);
      }
    });
    return Array.from(sites).sort((a, b) => a.localeCompare(b));
  }, [scopedReceipts]);

  const vendorOptions = useMemo(() => {
    const vendors = new Set<string>();
    scopedReceipts.forEach((receipt) => {
      if (receipt.vendorName) {
        vendors.add(receipt.vendorName);
      }
    });
    return Array.from(vendors).sort((a, b) => a.localeCompare(b));
  }, [scopedReceipts]);

  const vehicleOptions = useMemo(() => {
    const vehicles = new Set<string>();
    scopedReceipts.forEach((receipt) => {
      if (receipt.vehicleNumber) {
        vehicles.add(receipt.vehicleNumber);
      }
    });
    return Array.from(vehicles).sort((a, b) => a.localeCompare(b));
  }, [scopedReceipts]);

  const activeAdvancedFilterCount = useMemo(
    () => countReceiptAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters, countReceiptAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const sortedAndFilteredReceipts = scopedReceipts
    .filter((receipt) => {
      const matchesSearch =
        receipt.vehicleNumber.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        getCurrentMaterialName(receipt)
          .toLowerCase()
          .includes(tableState.searchTerm.toLowerCase()) ||
        receipt.vendorName?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'linked' && receipt.linkedPurchaseId) ||
        (statusFilter === 'open' && !receipt.linkedPurchaseId);
      const matchesSites =
        appliedAdvancedFilters.sites.length === 0 ||
        (receipt.siteName && appliedAdvancedFilters.sites.includes(receipt.siteName));
      const matchesVendors =
        appliedAdvancedFilters.vendors.length === 0 ||
        (receipt.vendorName && appliedAdvancedFilters.vendors.includes(receipt.vendorName));
      const matchesVehicles =
        appliedAdvancedFilters.vehicles.length === 0 ||
        appliedAdvancedFilters.vehicles.includes(receipt.vehicleNumber);
      const date = parseDateValue(receipt.date);
      const dateFrom = parseDateValue(appliedAdvancedFilters.dateFrom);
      const dateTo = parseDateValue(appliedAdvancedFilters.dateTo);
      const matchesDateFrom = !dateFrom || (date !== null && date >= dateFrom);
      const matchesDateTo = !dateTo || (date !== null && date <= dateTo);
      const netWeight = receipt.netWeight ?? 0;
      const minWeight =
        appliedAdvancedFilters.netWeightMin !== ''
          ? Number(appliedAdvancedFilters.netWeightMin)
          : undefined;
      const maxWeight =
        appliedAdvancedFilters.netWeightMax !== ''
          ? Number(appliedAdvancedFilters.netWeightMax)
          : undefined;
      const matchesMinWeight =
        minWeight === undefined || Number.isNaN(minWeight) || netWeight >= minWeight;
      const matchesMaxWeight =
        maxWeight === undefined || Number.isNaN(maxWeight) || netWeight <= maxWeight;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSites &&
        matchesVendors &&
        matchesVehicles &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesMinWeight &&
        matchesMaxWeight
      );
    })
    .sort((a, b) => {
      const aValue = a[tableState.sortField as keyof MaterialReceipt];
      const bValue = b[tableState.sortField as keyof MaterialReceipt];

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

  const handleFormSubmit = () => {
    dialog.closeDialog();
  };

  const handleFormCancel = () => {
    dialog.closeDialog();
  };

  const handleEdit = (receipt: MaterialReceipt) => {
    dialog.openDialog(receipt);
  };

  const handleDelete = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId);
    if (!receipt) return;

    // Check if receipt is linked
    if (receipt.linkedPurchaseId) {
      toast.error('Cannot delete a linked receipt', {
        description: 'Please unlink the receipt from the purchase bill first.',
      });
      return;
    }

    // Open confirmation dialog
    setReceiptToDelete(receipt);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!receiptToDelete) return;

    try {
      setProcessingId(receiptToDelete.id);
      await deleteReceipt(receiptToDelete.id);
      toast.success('Receipt deleted successfully');
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
    } catch (error) {
      console.error('Failed to delete receipt', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete receipt.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenLinkDialog = (receipt: MaterialReceipt) => {
    setSelectedReceiptForLink(receipt);
    setSelectedPurchaseId('');
    setLinkDialogOpen(true);
  };

  const handleLinkConfirm = async () => {
    if (!selectedReceiptForLink || !selectedPurchaseId) {
      toast.error('Please select a purchase bill');
      return;
    }

    setIsLinking(true);
    const success = await linkReceiptToPurchase(selectedReceiptForLink.id, selectedPurchaseId);
    if (success) {
      toast.success('Receipt linked successfully');
      setLinkDialogOpen(false);
      setSelectedReceiptForLink(null);
      setSelectedPurchaseId('');
    }
    setIsLinking(false);
  };

  const handleUnlink = async (receipt: MaterialReceipt) => {
    if (!receipt.linkedPurchaseId) return;
    try {
      setProcessingId(receipt.id);
      const success = await unlinkReceipt(receipt.id);
      if (success) {
        toast.success('Receipt unlinked successfully');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refreshReceipts(), refreshMaterials(), mutateMaterials()]);
      toast.success('Receipts refreshed');
    } catch (error) {
      console.error('Failed to refresh receipts', error);
      toast.error('Unable to refresh receipts right now.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get purchases that don't have a receipt linked
  // When linking a specific receipt, filter by materialId to match the receipt's material
  const availablePurchases = useMemo(() => {
    let filtered = materials.filter(
      (material) => !scopedReceipts.some((receipt) => receipt.linkedPurchaseId === material.id),
    );

    // If a receipt is selected for linking, filter purchases by materialId
    if (selectedReceiptForLink?.materialId) {
      filtered = filtered.filter(
        (material) => material.materialId === selectedReceiptForLink.materialId,
      );
    }

    return filtered;
  }, [materials, scopedReceipts, selectedReceiptForLink]);

  const renderTabs = showTabs ? (
    <PurchaseTabs
      activeTab="receipts"
      onTabChange={(value) => {
        if (value === 'bills') {
          router.prefetch('/purchase');
          router.push('/purchase');
        }
      }}
    />
  ) : null;

  if (isReceiptsLoading && scopedReceipts.length === 0) {
    return (
      <div className="w-full bg-background">
        {renderTabs}
        <div className="p-4 md:p-6 space-y-6">
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-32 w-full animate-pulse rounded bg-muted" />
                <div className="h-48 w-full animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background">
      {renderTabs}
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        {/* Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Receipts</p>
                      <p className="text-2xl font-bold text-primary">{totalReceipts}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Net Weight</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalNetWeight.toLocaleString()} kg
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Scale className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Linked</p>
                      <p className="text-2xl font-bold text-green-600">{linkedCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <LinkIcon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Open</p>
                      <p className="text-2xl font-bold text-orange-600">{openCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
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
                      placeholder="Search by vehicle or material..."
                      value={tableState.searchTerm}
                      onChange={(e) => tableState.setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="linked">Linked</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing || isReceiptsLoading}
                    className="gap-2 text-xs font-medium"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 transition-all hover:shadow-md"
                          onClick={() => {
                            setDraftAdvancedFilters(
                              cloneReceiptAdvancedFilters(appliedAdvancedFilters),
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
                      const resetFilters = createDefaultReceiptAdvancedFilters();
                      setAppliedAdvancedFilters(resetFilters);
                      setDraftAdvancedFilters(resetFilters);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear filters</span>
                  </Button>
                  <Dialog
                    open={dialog.isDialogOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        dialog.openDialog();
                      } else {
                        dialog.closeDialog();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => dialog.openDialog()}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Receipt</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl">
                          {dialog.editingItem ? 'Edit Material Receipt' : 'Add Material Receipt'}
                        </DialogTitle>
                        <DialogDescription>
                          {dialog.editingItem
                            ? 'Update material receipt details'
                            : 'Record a new material receipt'}
                        </DialogDescription>
                      </DialogHeader>
                      <MaterialReceiptForm
                        editingReceipt={dialog.editingItem}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {sortedAndFilteredReceipts.length} receipt
                {sortedAndFilteredReceipts.length !== 1 ? 's' : ''} found
              </Badge>
              {hasActiveAdvancedFilters ? (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const chips: string[] = [];
                    if (appliedAdvancedFilters.sites.length > 0) {
                      chips.push(`Sites: ${appliedAdvancedFilters.sites.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.vendors.length > 0) {
                      chips.push(`Vendors: ${appliedAdvancedFilters.vendors.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.vehicles.length > 0) {
                      chips.push(`Vehicles: ${appliedAdvancedFilters.vehicles.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.dateFrom || appliedAdvancedFilters.dateTo) {
                      chips.push(
                        `Date: ${appliedAdvancedFilters.dateFrom ?? 'Any'} → ${appliedAdvancedFilters.dateTo ?? 'Any'}`,
                      );
                    }
                    if (
                      appliedAdvancedFilters.netWeightMin ||
                      appliedAdvancedFilters.netWeightMax
                    ) {
                      chips.push(
                        `Net wt: ${appliedAdvancedFilters.netWeightMin || 'Any'}kg - ${appliedAdvancedFilters.netWeightMax || 'Any'}kg`,
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

        {/* Receipts Table */}
        {sortedAndFilteredReceipts.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Receipts Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {scopedReceipts.length === 0
                    ? 'Start by recording your first material receipt.'
                    : 'No receipts match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={() => dialog.openDialog()}
                  className="gap-2 transition-all hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={[
                  { key: 'date', label: 'Date', sortable: true },
                  { key: 'receiptNumber', label: 'Receipt Number', sortable: true },
                  { key: 'vehicle', label: 'Vehicle', sortable: true },
                  { key: 'material', label: 'Material', sortable: true },
                  { key: 'vendor', label: 'Vendor', sortable: true },
                  { key: 'weights', label: 'Weights (kg)', sortable: true },
                  { key: 'linkStatus', label: 'Link Status', sortable: false },
                  { key: 'actions', label: 'Actions', sortable: false },
                ]}
                data={sortedAndFilteredReceipts.map((receipt) => {
                  const linkedPurchase = receipt.linkedPurchaseId
                    ? materials.find((m) => m.id === receipt.linkedPurchaseId)
                    : null;

                  return {
                    date: (
                      <div className="font-medium">
                        {new Date(receipt.date).toLocaleDateString('en-IN')}
                      </div>
                    ),
                    receiptNumber: (
                      <div className="font-medium text-sm">
                        {receipt.receiptNumber || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </div>
                    ),
                    vehicle: (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Package className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{receipt.vehicleNumber}</div>
                          <div className="text-sm text-muted-foreground">{receipt.date}</div>
                        </div>
                      </div>
                    ),
                    material: (
                      <div className="font-medium text-sm">{getCurrentMaterialName(receipt)}</div>
                    ),
                    vendor: (
                      <div className="text-sm">
                        {receipt.vendorName ? (
                          <div className="font-medium">{receipt.vendorName}</div>
                        ) : (
                          <span className="text-muted-foreground italic">No vendor</span>
                        )}
                      </div>
                    ),
                    weights: (
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Filled:</span>
                          <span className="font-medium">{receipt.filledWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Empty:</span>
                          <span className="font-medium">{receipt.emptyWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Net:</span>
                          <span className="font-bold text-primary">
                            {receipt.netWeight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ),
                    linkStatus: receipt.linkedPurchaseId ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Linked to {linkedPurchase?.invoiceNumber || 'Purchase'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Unlink className="h-3 w-3 mr-1" />
                        Open
                      </Badge>
                    ),
                    actions: (
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(receipt);
                                }}
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit receipt</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {receipt.linkedPurchaseId ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleUnlink(receipt);
                                  }}
                                  disabled={processingId === receipt.id}
                                  className="h-8 w-8 p-0 transition-all hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                >
                                  <Unlink className="h-3 w-3 text-muted-foreground hover:text-orange-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Unlink from purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLinkDialog(receipt);
                                  }}
                                  className="h-8 w-8 p-0 transition-all hover:bg-green-100 dark:hover:bg-green-900/30"
                                >
                                  <LinkIcon className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Link to purchase</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(receipt.id);
                                }}
                                disabled={processingId === receipt.id}
                                className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete receipt</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ),
                  };
                })}
                onSort={tableState.setSortField}
                onPageChange={tableState.setCurrentPage}
                pageSize={tableState.itemsPerPage}
                currentPage={tableState.currentPage}
                totalPages={tableState.totalPages(sortedAndFilteredReceipts.length)}
                sortField={tableState.sortField}
                sortDirection={tableState.sortDirection}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Receipt filters"
        description="Refine the material receipts list with advanced criteria."
        sections={[
          {
            id: 'sites',
            title: 'Sites',
            description: 'Limit receipts to specific project sites.',
            content:
              siteOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No site options available.</p>
              ) : (
                <div className="grid gap-2">
                  {siteOptions.map((site) => {
                    const isChecked = draftAdvancedFilters.sites.includes(site);
                    return (
                      <Label key={site} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextSites =
                                checked === true
                                  ? [...prev.sites, site]
                                  : prev.sites.filter((value) => value !== site);
                              return {
                                ...prev,
                                sites: nextSites,
                              };
                            });
                          }}
                        />
                        <span>{site}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'vendors',
            title: 'Vendors',
            description: 'Show receipts received from specific vendors.',
            content:
              vendorOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vendor options available.</p>
              ) : (
                <div className="grid gap-2">
                  {vendorOptions.map((vendor) => {
                    const isChecked = draftAdvancedFilters.vendors.includes(vendor);
                    return (
                      <Label key={vendor} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextVendors =
                                checked === true
                                  ? [...prev.vendors, vendor]
                                  : prev.vendors.filter((value) => value !== vendor);
                              return {
                                ...prev,
                                vendors: nextVendors,
                              };
                            });
                          }}
                        />
                        <span>{vendor}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'vehicles',
            title: 'Vehicles',
            description: 'Filter by vehicle numbers delivering materials.',
            content:
              vehicleOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vehicle options available.</p>
              ) : (
                <div className="grid gap-2">
                  {vehicleOptions.map((vehicle) => {
                    const isChecked = draftAdvancedFilters.vehicles.includes(vehicle);
                    return (
                      <Label key={vehicle} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextVehicles =
                                checked === true
                                  ? [...prev.vehicles, vehicle]
                                  : prev.vehicles.filter((value) => value !== vehicle);
                              return {
                                ...prev,
                                vehicles: nextVehicles,
                              };
                            });
                          }}
                        />
                        <span>{vehicle}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'date',
            title: 'Receipt date',
            description: 'Filter receipts by the date they were recorded.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-date-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="receipt-date-from"
                    type="date"
                    value={draftAdvancedFilters.dateFrom ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        dateFrom: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-date-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="receipt-date-to"
                    type="date"
                    value={draftAdvancedFilters.dateTo ?? ''}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        dateTo: event.target.value || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'net-weight',
            title: 'Net weight (kg)',
            description: 'Filter receipts by their recorded net weight.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-weight-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="receipt-weight-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.netWeightMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        netWeightMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receipt-weight-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="receipt-weight-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.netWeightMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        netWeightMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
        ]}
        onApply={() => {
          setAppliedAdvancedFilters(cloneReceiptAdvancedFilters(draftAdvancedFilters));
          setIsFilterSheetOpen(false);
        }}
        onReset={() => {
          const resetFilters = createDefaultReceiptAdvancedFilters();
          setDraftAdvancedFilters(resetFilters);
          setAppliedAdvancedFilters(resetFilters);
        }}
        isDirty={!isReceiptAdvancedFilterDefault(draftAdvancedFilters)}
      />

      {/* Link to Purchase Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Receipt to Purchase Bill</DialogTitle>
            <DialogDescription>
              Select a purchase bill to link with receipt {selectedReceiptForLink?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedPurchaseId}
              onValueChange={setSelectedPurchaseId}
              disabled={availablePurchases.length === 0 || isMaterialsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isMaterialsLoading
                      ? 'Loading purchase bills...'
                      : availablePurchases.length === 0
                        ? 'No available purchases'
                        : 'Select purchase bill'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availablePurchases.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No available purchases
                  </SelectItem>
                ) : (
                  availablePurchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {purchase.invoiceNumber} - {purchase.materialName} ({purchase.vendor})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkConfirm}
              disabled={!selectedPurchaseId || selectedPurchaseId === '__none' || isLinking}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {isLinking ? 'Linking...' : 'Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material receipt?
              {receiptToDelete && (
                <>
                  <br />
                  <br />
                  <strong>Receipt Details:</strong>
                  <br />
                  Vehicle: {receiptToDelete.vehicleNumber}
                  <br />
                  Material: {receiptToDelete ? getCurrentMaterialName(receiptToDelete) : 'Unknown'}
                  <br />
                  Date: {receiptToDelete.date}
                  <br />
                  Net Weight: {receiptToDelete.netWeight.toFixed(2)} kg
                </>
              )}
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReceiptToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
