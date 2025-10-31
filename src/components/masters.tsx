'use client';

import {
  Ruler,
  FolderTree,
  Percent,
  Plus,
  Edit,
  Search,
  Filter,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import React, { useState } from 'react';

import { useTableState } from '../lib/hooks/useTableState';
import { formatDate } from '../lib/utils';

import MaterialCategoryForm from './forms/MaterialCategoryForm';
import TaxRateForm from './forms/TaxRateForm';
import UOMForm from './forms/UOMForm';
import { TabNavigation, type TabItem } from './layout/TabNavigation';
import type { UOMItem, MaterialCategoryItem, TaxRateItem } from './shared/masterData';
import { mockUOMs, mockCategories, mockTaxRates } from './shared/masterData';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

export function MastersPage() {
  // UOM State
  const [uomData, setUomData] = useState<UOMItem[]>(mockUOMs);
  const [uomSearchQuery, setUomSearchQuery] = useState<string>('');
  const [uomStatusFilter, setUomStatusFilter] = useState<string>('all');
  const [isUomDialogOpen, setIsUomDialogOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<UOMItem | null>(null);

  // Category State
  const [categoryData, setCategoryData] = useState<MaterialCategoryItem[]>(mockCategories);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<string>('all');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategoryItem | null>(null);

  // Tax Rate State
  const [taxRateData, setTaxRateData] = useState<TaxRateItem[]>(mockTaxRates);
  const [taxRateSearchQuery, setTaxRateSearchQuery] = useState<string>('');
  const [taxRateStatusFilter, setTaxRateStatusFilter] = useState<string>('all');
  const [isTaxRateDialogOpen, setIsTaxRateDialogOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRateItem | null>(null);

  // Table states
  const uomTableState = useTableState({
    initialSortField: 'code',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const categoryTableState = useTableState({
    initialSortField: 'code',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const taxRateTableState = useTableState({
    initialSortField: 'code',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  // UOM Functions
  const handleUomSubmit = (formData: Omit<UOMItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingUom) {
      const updatedUom: UOMItem = {
        ...editingUom,
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      setUomData((prev) => prev.map((uom) => (uom.id === editingUom.id ? updatedUom : uom)));
    } else {
      const newUom: UOMItem = {
        ...formData,
        id: (uomData.length + 1).toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUomData((prev) => [...prev, newUom]);
    }
    setEditingUom(null);
    setIsUomDialogOpen(false);
  };

  const handleEditUom = (uom: UOMItem) => {
    setEditingUom(uom);
    setIsUomDialogOpen(true);
  };

  const toggleUomStatus = (uomId: string) => {
    setUomData((prev) =>
      prev.map((uom) =>
        uom.id === uomId
          ? { ...uom, isActive: !uom.isActive, updatedAt: new Date().toISOString() }
          : uom,
      ),
    );
  };

  // Category Functions
  const handleCategorySubmit = (
    formData: Omit<MaterialCategoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editingCategory) {
      const updatedCategory: MaterialCategoryItem = {
        ...editingCategory,
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      setCategoryData((prev) =>
        prev.map((cat) => (cat.id === editingCategory.id ? updatedCategory : cat)),
      );
    } else {
      const newCategory: MaterialCategoryItem = {
        ...formData,
        id: (categoryData.length + 1).toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCategoryData((prev) => [...prev, newCategory]);
    }
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = (category: MaterialCategoryItem) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const toggleCategoryStatus = (categoryId: string) => {
    setCategoryData((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, isActive: !cat.isActive, updatedAt: new Date().toISOString() }
          : cat,
      ),
    );
  };

  // Tax Rate Functions
  const handleTaxRateSubmit = (formData: Omit<TaxRateItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTaxRate) {
      const updatedTaxRate: TaxRateItem = {
        ...editingTaxRate,
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      setTaxRateData((prev) =>
        prev.map((taxRate) => (taxRate.id === editingTaxRate.id ? updatedTaxRate : taxRate)),
      );
    } else {
      const newTaxRate: TaxRateItem = {
        ...formData,
        id: (taxRateData.length + 1).toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTaxRateData((prev) => [...prev, newTaxRate]);
    }
    setEditingTaxRate(null);
    setIsTaxRateDialogOpen(false);
  };

  const handleEditTaxRate = (taxRate: TaxRateItem) => {
    setEditingTaxRate(taxRate);
    setIsTaxRateDialogOpen(true);
  };

  const toggleTaxRateStatus = (taxRateId: string) => {
    setTaxRateData((prev) =>
      prev.map((taxRate) =>
        taxRate.id === taxRateId
          ? { ...taxRate, isActive: !taxRate.isActive, updatedAt: new Date().toISOString() }
          : taxRate,
      ),
    );
  };

  // Filter and sort UOMs
  const filteredUoms = uomData
    .filter((uom) => {
      const matchesSearch =
        uomSearchQuery === '' ||
        uom.code.toLowerCase().includes(uomSearchQuery.toLowerCase()) ||
        uom.name.toLowerCase().includes(uomSearchQuery.toLowerCase());
      const matchesStatus =
        uomStatusFilter === 'all' ||
        (uomStatusFilter === 'active' && uom.isActive) ||
        (uomStatusFilter === 'inactive' && !uom.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[uomTableState.sortField as keyof UOMItem];
      const bValue = b[uomTableState.sortField as keyof UOMItem];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return uomTableState.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  // Filter and sort Categories
  const filteredCategories = categoryData
    .filter((category) => {
      const matchesSearch =
        categorySearchQuery === '' ||
        category.code.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
      const matchesStatus =
        categoryStatusFilter === 'all' ||
        (categoryStatusFilter === 'active' && category.isActive) ||
        (categoryStatusFilter === 'inactive' && !category.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[categoryTableState.sortField as keyof MaterialCategoryItem];
      const bValue = b[categoryTableState.sortField as keyof MaterialCategoryItem];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return categoryTableState.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  // Filter and sort Tax Rates
  const filteredTaxRates = taxRateData
    .filter((taxRate) => {
      const matchesSearch =
        taxRateSearchQuery === '' ||
        taxRate.code.toLowerCase().includes(taxRateSearchQuery.toLowerCase()) ||
        taxRate.name.toLowerCase().includes(taxRateSearchQuery.toLowerCase());
      const matchesStatus =
        taxRateStatusFilter === 'all' ||
        (taxRateStatusFilter === 'active' && taxRate.isActive) ||
        (taxRateStatusFilter === 'inactive' && !taxRate.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[taxRateTableState.sortField as keyof TaxRateItem];
      const bValue = b[taxRateTableState.sortField as keyof TaxRateItem];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return taxRateTableState.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return taxRateTableState.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  // Paginated data
  const paginatedUoms = filteredUoms.slice(
    (uomTableState.currentPage - 1) * uomTableState.itemsPerPage,
    uomTableState.currentPage * uomTableState.itemsPerPage,
  );

  const paginatedCategories = filteredCategories.slice(
    (categoryTableState.currentPage - 1) * categoryTableState.itemsPerPage,
    categoryTableState.currentPage * categoryTableState.itemsPerPage,
  );

  const paginatedTaxRates = filteredTaxRates.slice(
    (taxRateTableState.currentPage - 1) * taxRateTableState.itemsPerPage,
    taxRateTableState.currentPage * taxRateTableState.itemsPerPage,
  );

  // UOM Tab Content
  const uomTabContent = (
    <div className="space-y-6">
      {/* UOM Statistics */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total UOMs</p>
                    <p className="text-2xl font-bold text-primary">{uomData.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Ruler className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Active UOMs</p>
                    <p className="text-2xl font-bold text-green-600">
                      {uomData.filter((u) => u.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Inactive UOMs</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {uomData.filter((u) => !u.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Pause className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* UOM Search and Filters */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search UOMs..."
                    value={uomSearchQuery}
                    onChange={(e) => setUomSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={uomStatusFilter} onValueChange={setUomStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Dialog open={isUomDialogOpen} onOpenChange={setIsUomDialogOpen}>
                <Button
                  onClick={() => {
                    setEditingUom(null);
                    setIsUomDialogOpen(true);
                  }}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New UOM
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingUom ? 'Edit UOM' : 'Add New UOM'}</DialogTitle>
                    <DialogDescription>
                      {editingUom
                        ? 'Update the unit of measurement details below'
                        : 'Create a new unit of measurement for your materials'}
                    </DialogDescription>
                  </DialogHeader>
                  <UOMForm
                    onSubmit={handleUomSubmit}
                    onCancel={() => {
                      setEditingUom(null);
                      setIsUomDialogOpen(false);
                    }}
                    defaultValues={editingUom || undefined}
                    isEdit={!!editingUom}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UOM Table */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full min-w-0 max-w-full">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right min-w-[100px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUoms.map((uom) => (
                  <TableRow key={uom.id}>
                    <TableCell className="font-medium">{uom.code}</TableCell>
                    <TableCell>{uom.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{uom.description}</TableCell>
                    <TableCell>
                      <Badge variant={uom.isActive ? 'default' : 'secondary'}>
                        {uom.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(uom.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUom(uom)}
                                aria-label="Edit UOM"
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit UOM</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleUomStatus(uom.id)}
                                aria-label={uom.isActive ? 'Deactivate UOM' : 'Activate UOM'}
                                className={`h-8 w-8 p-0 transition-all ${uom.isActive ? 'hover:bg-destructive/10' : 'hover:bg-primary/10'}`}
                              >
                                {uom.isActive ? (
                                  <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{uom.isActive ? 'Deactivate' : 'Activate'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(uomTableState.currentPage - 1) * uomTableState.itemsPerPage + 1} to{' '}
              {Math.min(
                uomTableState.currentPage * uomTableState.itemsPerPage,
                filteredUoms.length,
              )}{' '}
              of {filteredUoms.length} UOMs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => uomTableState.setCurrentPage(uomTableState.currentPage - 1)}
                disabled={uomTableState.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => uomTableState.setCurrentPage(uomTableState.currentPage + 1)}
                disabled={
                  uomTableState.currentPage >=
                  Math.ceil(filteredUoms.length / uomTableState.itemsPerPage)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Category Tab Content
  const categoryTabContent = (
    <div className="space-y-6">
      {/* Category Statistics */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                    <p className="text-2xl font-bold text-primary">{categoryData.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <FolderTree className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Categories</p>
                    <p className="text-2xl font-bold text-green-600">
                      {categoryData.filter((c) => c.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Inactive Categories</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {categoryData.filter((c) => !c.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Pause className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Category Search and Filters */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={categoryStatusFilter} onValueChange={setCategoryStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <Button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryDialogOpen(true);
                  }}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New Category
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory
                        ? 'Update the material category details below'
                        : 'Create a new material category'}
                    </DialogDescription>
                  </DialogHeader>
                  <MaterialCategoryForm
                    onSubmit={handleCategorySubmit}
                    onCancel={() => {
                      setEditingCategory(null);
                      setIsCategoryDialogOpen(false);
                    }}
                    defaultValues={editingCategory || undefined}
                    isEdit={!!editingCategory}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Table */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full min-w-0 max-w-full">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right min-w-[100px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.code}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(category.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                                aria-label="Edit Category"
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Category</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCategoryStatus(category.id)}
                                aria-label={
                                  category.isActive ? 'Deactivate Category' : 'Activate Category'
                                }
                                className={`h-8 w-8 p-0 transition-all ${category.isActive ? 'hover:bg-destructive/10' : 'hover:bg-primary/10'}`}
                              >
                                {category.isActive ? (
                                  <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{category.isActive ? 'Deactivate' : 'Activate'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(categoryTableState.currentPage - 1) * categoryTableState.itemsPerPage + 1}{' '}
              to{' '}
              {Math.min(
                categoryTableState.currentPage * categoryTableState.itemsPerPage,
                filteredCategories.length,
              )}{' '}
              of {filteredCategories.length} categories
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  categoryTableState.setCurrentPage(categoryTableState.currentPage - 1)
                }
                disabled={categoryTableState.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  categoryTableState.setCurrentPage(categoryTableState.currentPage + 1)
                }
                disabled={
                  categoryTableState.currentPage >=
                  Math.ceil(filteredCategories.length / categoryTableState.itemsPerPage)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Tax Rate Tab Content
  const taxRateTabContent = (
    <div className="space-y-6">
      {/* Tax Rate Statistics */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Tax Rates</p>
                    <p className="text-2xl font-bold text-primary">{taxRateData.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Percent className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Active Tax Rates</p>
                    <p className="text-2xl font-bold text-green-600">
                      {taxRateData.filter((tr) => tr.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Inactive Tax Rates</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {taxRateData.filter((tr) => !tr.isActive).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Pause className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rate Search and Filters */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tax rates..."
                    value={taxRateSearchQuery}
                    onChange={(e) => setTaxRateSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={taxRateStatusFilter} onValueChange={setTaxRateStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Dialog open={isTaxRateDialogOpen} onOpenChange={setIsTaxRateDialogOpen}>
                <Button
                  onClick={() => {
                    setEditingTaxRate(null);
                    setIsTaxRateDialogOpen(true);
                  }}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New Tax Rate
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTaxRate ? 'Edit Tax Rate' : 'Add New Tax Rate'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTaxRate
                        ? 'Update the tax rate details below'
                        : 'Create a new tax rate for your transactions'}
                    </DialogDescription>
                  </DialogHeader>
                  <TaxRateForm
                    onSubmit={handleTaxRateSubmit}
                    onCancel={() => {
                      setEditingTaxRate(null);
                      setIsTaxRateDialogOpen(false);
                    }}
                    defaultValues={editingTaxRate || undefined}
                    isEdit={!!editingTaxRate}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rate Table */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full min-w-0 max-w-full">
            <Table className="w-full table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate (%)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right min-w-[100px] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTaxRates.map((taxRate) => (
                  <TableRow key={taxRate.id}>
                    <TableCell className="font-medium">{taxRate.code}</TableCell>
                    <TableCell>{taxRate.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {taxRate.rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{taxRate.description}</TableCell>
                    <TableCell>
                      <Badge variant={taxRate.isActive ? 'default' : 'secondary'}>
                        {taxRate.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(taxRate.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTaxRate(taxRate)}
                                aria-label="Edit Tax Rate"
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Tax Rate</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTaxRateStatus(taxRate.id)}
                                aria-label={
                                  taxRate.isActive ? 'Deactivate Tax Rate' : 'Activate Tax Rate'
                                }
                                className={`h-8 w-8 p-0 transition-all ${taxRate.isActive ? 'hover:bg-destructive/10' : 'hover:bg-primary/10'}`}
                              >
                                {taxRate.isActive ? (
                                  <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{taxRate.isActive ? 'Deactivate' : 'Activate'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(taxRateTableState.currentPage - 1) * taxRateTableState.itemsPerPage + 1} to{' '}
              {Math.min(
                taxRateTableState.currentPage * taxRateTableState.itemsPerPage,
                filteredTaxRates.length,
              )}{' '}
              of {filteredTaxRates.length} tax rates
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => taxRateTableState.setCurrentPage(taxRateTableState.currentPage - 1)}
                disabled={taxRateTableState.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => taxRateTableState.setCurrentPage(taxRateTableState.currentPage + 1)}
                disabled={
                  taxRateTableState.currentPage >=
                  Math.ceil(filteredTaxRates.length / taxRateTableState.itemsPerPage)
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs: TabItem[] = [
    {
      value: 'uom',
      label: 'UOM',
      icon: Ruler,
      content: uomTabContent,
    },
    {
      value: 'category',
      label: 'Material Category',
      icon: FolderTree,
      content: categoryTabContent,
    },

    {
      value: 'tax-rates',
      label: 'Tax Rates',
      icon: Percent,
      content: taxRateTabContent,
    },
  ];

  return (
    <div className="w-full bg-background">
      <div className="p-0 space-y-6 max-w-full">
        <TabNavigation tabs={tabs} defaultValue="uom" tabsListClassName="grid w-full grid-cols-3" />
        <div className="p-4 md:p-6 space-y-6 max-w-full">
          {/* Tab contents are rendered by TabNavigation below the header card */}
        </div>
      </div>
    </div>
  );
}
