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
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { useDialogState } from '../lib/hooks/useDialogState';
import { useTableState } from '../lib/hooks/useTableState';

import { DataTable } from './common/DataTable';
import { FormDialog } from './common/FormDialog';
import { PurchaseTabs } from './layout/PurchaseTabs';
import { PurchaseForm } from './shared/PurchaseForm';
import type { SharedMaterial } from './shared/materialsContext';
import { useMaterials } from './shared/materialsContext';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PurchasePageProps {
  filterBySite?: string;
}

export function PurchasePage({ filterBySite }: PurchasePageProps = {}) {
  const searchParams = useSearchParams();
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useMaterials();

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

  // Calculate summary statistics (filtered by site if applicable)
  const filteredMaterialsForStats = filterBySite
    ? materials.filter((m) => m.site === filterBySite)
    : materials;
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

  const sortedAndFilteredMaterials = materials
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
          new Date(material.purchaseDate || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) ||
        (statusFilter === 'pending' && !material.totalAmount);
      return matchesSite && matchesSearch && matchesCategory && matchesStatus;
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

  const handleFormSubmit = (materialData: Omit<SharedMaterial, 'id'>) => {
    if (dialog.editingItem) {
      updateMaterial(dialog.editingItem.id, materialData);
    } else {
      addMaterial(materialData);
    }
    dialog.closeDialog();
  };

  const handleFormCancel = () => {
    dialog.closeDialog();
  };

  const handleEdit = (material: SharedMaterial) => {
    dialog.openDialog(material);
  };

  const handleDelete = (materialId: string) => {
    deleteMaterial(materialId);
  };

  return (
    <div className="w-full min-w-0 bg-background">
      <PurchaseTabs />
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
                      <p className="text-2xl font-bold text-primary">{totalPurchases}</p>
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
                        ₹{totalValue.toLocaleString()}
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
                        ₹{Math.round(averageOrderValue).toLocaleString()}
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
                      <p className="text-sm font-medium text-muted-foreground">Total Quantity</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {totalQuantity.toFixed(1)}
                      </p>
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
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter purchases by category and status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormDialog
                    title="Add Material Purchase"
                    description="Record a new material purchase"
                    isOpen={dialog.isDialogOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        dialog.openDialog();
                      } else {
                        dialog.closeDialog();
                      }
                    }}
                    maxWidth="max-w-4xl"
                    trigger={
                      <Button
                        onClick={() => dialog.openDialog()}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Purchase</span>
                      </Button>
                    }
                  >
                    <PurchaseForm
                      selectedSite={filterBySite}
                      editingMaterial={dialog.editingItem}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </FormDialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {sortedAndFilteredMaterials.length} purchase
                {sortedAndFilteredMaterials.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Management Table */}
        {sortedAndFilteredMaterials.length === 0 ? (
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
                  { key: 'unitRate', label: 'Rate (₹)', sortable: true },
                  { key: 'totalAmount', label: 'Total Amount', sortable: true },
                  { key: 'purchaseDate', label: 'Purchase Date', sortable: true },
                  { key: 'actions', label: 'Actions', sortable: false },
                ]}
                data={sortedAndFilteredMaterials.map((material) => ({
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
                        {material.quantity?.toFixed(2)} {material.unit}
                      </div>
                      {material.filledWeight && (
                        <div className="text-sm text-muted-foreground">
                          Net: {material.netWeight?.toFixed(2)}kg
                        </div>
                      )}
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
                }))}
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
    </div>
  );
}
