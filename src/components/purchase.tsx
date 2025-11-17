'use client';

import {
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Edit,
  Trash2,
  AlertCircle,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useDialogState } from '../lib/hooks/useDialogState';
import { useTableState } from '../lib/hooks/useTableState';

import { DataTable } from './common/DataTable';
import { MaterialReceiptsPage } from './material-receipts';
import { PurchaseTabs } from './layout/PurchaseTabs';
import { PurchaseForm } from './shared/PurchaseForm';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FilterSheet } from '@/components/filters/FilterSheet';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMaterials } from '@/lib/contexts';
import type { SharedMaterial } from '@/lib/contexts';
import { Progress } from '@/components/ui/progress';

interface PurchasePageProps {
  filterBySite?: string;
}

export function PurchasePage({ filterBySite }: PurchasePageProps = {}) {
  const searchParams = useSearchParams();
  const { materials, deleteMaterial, isLoading } = useMaterials();

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'materialName',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const dialog = useDialogState<SharedMaterial>();

  // Auto-open dialog if openDialog URL parameter is present
  useEffect(() => {
    if (searchParams?.get('openDialog') === 'true') {
      dialog.openDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  type PurchaseAdvancedFilterState = {
    sites: string[];
    vendors: string[];
    dateFrom?: string;
    dateTo?: string;
    amountMin: string;
    amountMax: string;
    invoiceStatus: 'all' | 'with' | 'without';
  };

  const createDefaultPurchaseAdvancedFilters = (): PurchaseAdvancedFilterState => ({
    sites: [],
    vendors: [],
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: '',
    amountMax: '',
    invoiceStatus: 'all',
  });

  const clonePurchaseAdvancedFilters = (
    filters: PurchaseAdvancedFilterState,
  ): PurchaseAdvancedFilterState => ({
    ...filters,
    sites: [...filters.sites],
    vendors: [...filters.vendors],
  });

  const isPurchaseAdvancedFilterDefault = (filters: PurchaseAdvancedFilterState): boolean => {
    return (
      filters.sites.length === 0 &&
      filters.vendors.length === 0 &&
      !filters.dateFrom &&
      !filters.dateTo &&
      filters.amountMin === '' &&
      filters.amountMax === '' &&
      filters.invoiceStatus === 'all'
    );
  };

  const countPurchaseAdvancedFilters = (filters: PurchaseAdvancedFilterState): number => {
    let count = 0;
    count += filters.sites.length;
    count += filters.vendors.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.amountMin !== '' || filters.amountMax !== '') count += 1;
    if (filters.invoiceStatus !== 'all') count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const [appliedAdvancedFilters, setAppliedAdvancedFilters] =
    useState<PurchaseAdvancedFilterState>(createDefaultPurchaseAdvancedFilters);
  const [draftAdvancedFilters, setDraftAdvancedFilters] =
    useState<PurchaseAdvancedFilterState>(createDefaultPurchaseAdvancedFilters);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    materials.forEach((material) => {
      if (material.category) {
        categories.add(material.category);
      }
    });
    return Array.from(categories).sort();
  }, [materials]);

  const siteOptions = useMemo(() => {
    const sites = new Set<string>();
    materials.forEach((material) => {
      if (material.site) {
        sites.add(material.site);
      }
    });
    return Array.from(sites).sort((a, b) => a.localeCompare(b));
  }, [materials]);

  const vendorOptions = useMemo(() => {
    const vendors = new Set<string>();
    materials.forEach((material) => {
      if (material.vendor) {
        vendors.add(material.vendor);
      }
    });
    return Array.from(vendors).sort((a, b) => a.localeCompare(b));
  }, [materials]);

  const activeAdvancedFilterCount = useMemo(
    () => countPurchaseAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const filteredMaterialsForStats = useMemo(() => {
    const scopedMaterials = filterBySite
      ? materials.filter((m) => m.site === filterBySite)
      : materials;
    return scopedMaterials;
  }, [materials, filterBySite]);

  const totalPurchases = filteredMaterialsForStats.length;
  const totalValue = filteredMaterialsForStats.reduce(
    (sum, material) => sum + (material.totalAmount || 0),
    0,
  );
  const averageOrderValue = totalPurchases > 0 ? totalValue / totalPurchases : 0;
  const totalQuantity = filteredMaterialsForStats.reduce(
    (sum, material) => sum + (material.quantity || 0),
    0,
  );
  const totalConsumedQuantity = filteredMaterialsForStats.reduce((sum, material) => {
    const ordered = material.quantity ?? 0;
    const remaining = material.remainingQuantity ?? ordered;
    const consumed =
      material.consumedQuantity ?? Math.max(0, ordered - remaining);
    return sum + consumed;
  }, 0);
  const totalRemainingQuantity = filteredMaterialsForStats.reduce((sum, material) => {
    const ordered = material.quantity ?? 0;
    if (typeof material.remainingQuantity === 'number') {
      return sum + material.remainingQuantity;
    }
    const consumed =
      material.consumedQuantity ?? Math.max(0, ordered - (material.remainingQuantity ?? ordered));
    return sum + Math.max(0, ordered - consumed);
  }, 0);

  const sortedAndFilteredMaterials = useMemo(() => {
    const minAmount =
      appliedAdvancedFilters.amountMin !== ''
        ? Number(appliedAdvancedFilters.amountMin)
        : undefined;
    const maxAmount =
      appliedAdvancedFilters.amountMax !== ''
        ? Number(appliedAdvancedFilters.amountMax)
        : undefined;
    const dateFrom = parseDateValue(appliedAdvancedFilters.dateFrom);
    const dateTo = parseDateValue(appliedAdvancedFilters.dateTo);

    return materials
      .filter((material) => {
        const matchesSite = !filterBySite || material.site === filterBySite;
        const matchesSearch =
          material.materialName?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
          material.vendor?.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
          material.site?.toLowerCase().includes(tableState.searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'recent' &&
            material.purchaseDate &&
            new Date(material.purchaseDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
          (statusFilter === 'pending' && (!material.totalAmount || material.totalAmount === 0));
        const matchesAdvancedSites =
          appliedAdvancedFilters.sites.length === 0 ||
          appliedAdvancedFilters.sites.includes(material.site);
        const matchesAdvancedVendors =
          appliedAdvancedFilters.vendors.length === 0 ||
          (material.vendor && appliedAdvancedFilters.vendors.includes(material.vendor));
        const purchaseDate = parseDateValue(material.purchaseDate);
        const matchesDateFrom =
          !dateFrom || (purchaseDate !== null && purchaseDate >= dateFrom);
        const matchesDateTo = !dateTo || (purchaseDate !== null && purchaseDate <= dateTo);
        const amount = material.totalAmount ?? 0;
        const matchesMinAmount =
          minAmount === undefined || Number.isNaN(minAmount) || amount >= minAmount;
        const matchesMaxAmount =
          maxAmount === undefined || Number.isNaN(maxAmount) || amount <= maxAmount;
        const hasInvoice = Boolean(material.invoiceNumber && material.invoiceNumber.trim() !== '');
        const matchesInvoice =
          appliedAdvancedFilters.invoiceStatus === 'all' ||
          (appliedAdvancedFilters.invoiceStatus === 'with' && hasInvoice) ||
          (appliedAdvancedFilters.invoiceStatus === 'without' && !hasInvoice);

        return (
          matchesSite &&
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesAdvancedSites &&
          matchesAdvancedVendors &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesMinAmount &&
          matchesMaxAmount &&
          matchesInvoice
        );
      })
      .sort((a, b) => {
        const aValue = a[tableState.sortField as keyof SharedMaterial];
        const bValue = b[tableState.sortField as keyof SharedMaterial];

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
  }, [materials, filterBySite, tableState, categoryFilter, statusFilter]);

  const handleFormSubmit = () => {
    dialog.closeDialog();
  };

  const handleFormCancel = () => {
    dialog.closeDialog();
  };

  const handleEdit = (material: SharedMaterial) => {
    dialog.openDialog(material);
  };

  const handleDelete = async (materialId: string) => {
    try {
      await deleteMaterial(materialId);
      toast.success('Purchase deleted successfully.');
    } catch (error) {
      console.error('Failed to delete purchase', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete purchase. Please try again.',
      );
    }
  };

const [activeInnerTab, setActiveInnerTab] = useState<'bills' | 'receipts'>(
  filterBySite ? 'bills' : 'bills',
);

if (activeInnerTab === 'receipts') {
  return (
    <div className="w-full min-w-0 bg-background">
      <PurchaseTabs activeTab={activeInnerTab} onTabChange={setActiveInnerTab} />
      <MaterialReceiptsPage filterBySite={filterBySite} showTabs={false} />
    </div>
  );
}

return (
  <div className="w-full min-w-0 bg-background">
    <PurchaseTabs activeTab={activeInnerTab} onTabChange={setActiveInnerTab} />
    <div className="p-4 md:p-6 space-y-6 max-w-full min-w-0">
        {/* Purchase Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                      <p className="text-2xl font-bold text-primary">
                        {isLoading ? '—' : totalPurchases}
                      </p>
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
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {isLoading ? '—' : `₹${totalValue.toLocaleString()}`}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {isLoading ? '—' : `₹${Math.round(averageOrderValue).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Inventory Remaining</p>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {isLoading
                            ? '—'
                            : totalRemainingQuantity.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Consumed:{' '}
                          {totalConsumedQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{' '}
                          / Total {totalQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-purple-600" />
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
                      placeholder="Search purchases..."
                      value={tableState.searchTerm}
                      onChange={(e) => tableState.setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
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
                            setDraftAdvancedFilters(clonePurchaseAdvancedFilters(appliedAdvancedFilters));
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
                        <p>Filter purchases by category and status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-all hover:shadow-md"
                    disabled={!hasActiveAdvancedFilters}
                    onClick={() => {
                      const resetFilters = createDefaultPurchaseAdvancedFilters();
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
                        <span className="hidden sm:inline">Add Purchase</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl">
                          {dialog.editingItem ? 'Edit Material Purchase' : 'Add Material Purchase'}
                        </DialogTitle>
                        <DialogDescription>
                          {dialog.editingItem
                            ? 'Update material purchase details'
                            : 'Record a new material purchase'}
                        </DialogDescription>
                      </DialogHeader>
                      <PurchaseForm
                        selectedSite={filterBySite}
                        editingMaterial={dialog.editingItem}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {sortedAndFilteredMaterials.length} purchase
                {sortedAndFilteredMaterials.length !== 1 ? 's' : ''} found
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
                    if (appliedAdvancedFilters.dateFrom || appliedAdvancedFilters.dateTo) {
                      chips.push(
                        `Date: ${appliedAdvancedFilters.dateFrom ?? 'Any'} → ${appliedAdvancedFilters.dateTo ?? 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.amountMin || appliedAdvancedFilters.amountMax) {
                      chips.push(
                        `Amount: ₹${appliedAdvancedFilters.amountMin || 'Any'} - ₹${appliedAdvancedFilters.amountMax || 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.invoiceStatus !== 'all') {
                      chips.push(
                        appliedAdvancedFilters.invoiceStatus === 'with'
                          ? 'With invoice'
                          : 'Without invoice',
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

        {/* Purchase Management Table */}
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Package className="h-12 w-12 animate-pulse" />
                <p className="text-sm">Loading purchases…</p>
              </div>
            </CardContent>
          </Card>
        ) : sortedAndFilteredMaterials.length === 0 ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Purchases Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {materials.length === 0
                    ? 'Start by recording your first material purchase to track inventory and costs.'
                    : 'No purchases match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={() => dialog.openDialog()}
                  className="gap-2 transition-all hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Purchase
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={[
                  { key: 'materialName', label: 'Material Name', sortable: true },
                  { key: 'vendor', label: 'Vendor', sortable: true },
                  { key: 'quantity', label: 'Quantity', sortable: true },
                  { key: 'usage', label: 'Usage', sortable: false },
                  { key: 'unitRate', label: 'Rate (₹)', sortable: true },
                  { key: 'totalAmount', label: 'Total Amount', sortable: true },
                  { key: 'purchaseDate', label: 'Purchase Date', sortable: true },
                  { key: 'actions', label: 'Actions', sortable: false },
                ]}
                data={sortedAndFilteredMaterials.map((material) => {
                  const totalOrdered = material.quantity ?? 0;
                  const consumedQuantity =
                    material.consumedQuantity ??
                    Math.max(
                      0,
                      totalOrdered - (material.remainingQuantity ?? totalOrdered),
                    );
                  const remainingQuantity =
                    material.remainingQuantity ?? Math.max(0, totalOrdered - consumedQuantity);
                  const usagePercent =
                    totalOrdered > 0
                      ? Math.min(100, (consumedQuantity / totalOrdered) * 100)
                      : 0;

                  return {
                  materialName: (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Package className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{material.materialName}</div>
                        <div className="text-sm text-muted-foreground">{material.site}</div>
                      </div>
                    </div>
                  ),
                  vendor: (
                    <div>
                      <div className="font-medium">{material.vendor}</div>
                      <div className="text-sm text-muted-foreground">{material.purchaseDate}</div>
                    </div>
                  ),
                  quantity: (
                    <div>
                      <div className="font-medium">
                        {totalOrdered.toFixed(2)} {material.unit}
                      </div>
                      {material.filledWeight && (
                        <div className="text-sm text-muted-foreground">
                          Net: {material.netWeight?.toFixed(2)}kg
                        </div>
                      )}
                    </div>
                  ),
                  usage: (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          Used:{' '}
                          {consumedQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span>
                          Left:{' '}
                          {remainingQuantity.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <Progress value={usagePercent} className="h-1.5" />
                      <div className="text-[11px] text-muted-foreground text-right">
                        {usagePercent.toFixed(1)}%
                      </div>
                    </div>
                  ),
                  unitRate: (
                    <span className="font-medium">₹{material.unitRate?.toLocaleString()}</span>
                  ),
                  totalAmount: (
                    <span className="font-medium text-green-600">
                      ₹{material.totalAmount?.toLocaleString()}
                    </span>
                  ),
                  purchaseDate: (
                    <span className="text-sm text-muted-foreground">{material.purchaseDate}</span>
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
                                handleEdit(material);
                              }}
                              className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                            >
                              <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit purchase</p>
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
                                handleDelete(material.id);
                              }}
                              className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete purchase</p>
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
                totalPages={tableState.totalPages(sortedAndFilteredMaterials.length)}
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
        title="Purchase filters"
        description="Refine the purchase list with advanced criteria."
        sections={[
          {
            id: 'sites',
            title: 'Sites',
            description: 'Limit purchases to the selected project sites.',
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
            description: 'Show purchases from specific vendors.',
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
            id: 'date',
            title: 'Purchase date',
            description: 'Filter purchases by their recorded date.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-date-from" className="text-sm font-medium">
                    From
                  </Label>
                  <Input
                    id="purchase-date-from"
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
                  <Label htmlFor="purchase-date-to" className="text-sm font-medium">
                    To
                  </Label>
                  <Input
                    id="purchase-date-to"
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
            id: 'amount',
            title: 'Amount (₹)',
            description: 'Limit purchases to a spend range.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-amount-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="purchase-amount-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.amountMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        amountMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="purchase-amount-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="purchase-amount-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.amountMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        amountMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'invoice',
            title: 'Invoice status',
            description: 'Filter by purchases with or without invoice details.',
            content: (
              <Select
                value={draftAdvancedFilters.invoiceStatus}
                onValueChange={(value: PurchaseAdvancedFilterState['invoiceStatus']) =>
                  setDraftAdvancedFilters((prev) => ({
                    ...prev,
                    invoiceStatus: value,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Invoice status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All purchases</SelectItem>
                  <SelectItem value="with">With invoice number</SelectItem>
                  <SelectItem value="without">Without invoice number</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onApply={() => {
          setAppliedAdvancedFilters(clonePurchaseAdvancedFilters(draftAdvancedFilters));
          setIsFilterSheetOpen(false);
        }}
        onReset={() => {
          const resetFilters = createDefaultPurchaseAdvancedFilters();
          setDraftAdvancedFilters(resetFilters);
          setAppliedAdvancedFilters(resetFilters);
        }}
        isDirty={!isPurchaseAdvancedFilterDefault(draftAdvancedFilters)}
      />
    </div>
  );
}
