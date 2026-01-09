'use client';

import {
  Ruler,
  FolderTree,
  Percent,
  Receipt,
  Plus,
  Edit,
  Search,
  Filter,
  CheckCircle2,
  Pause,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

import { useTableState } from '../lib/hooks/useTableState';
import { fetcher, swrConfig } from '../lib/swr';
import { formatDate } from '../lib/utils';

import MaterialCategoryForm from './forms/MaterialCategoryForm';
import TaxRateForm from './forms/TaxRateForm';
import UOMForm from './forms/UOMForm';
import { TabNavigation, type TabItem } from './layout/TabNavigation';
import type {
  UOMItem,
  MaterialCategoryItem,
  TaxRateItem,
  ExpenseCategoryItem,
} from './shared/masterData';
import { mockUOMs, mockCategories, mockTaxRates, mockExpenseCategories } from './shared/masterData';

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
  // UOM State - Fetch from API
  const {
    data: uomsData,
    error: uomsError,
    isLoading: isUomsLoading,
  } = useSWR<{ uoms: UOMItem[] }>('/api/uoms', fetcher, swrConfig);
  const uomData = uomsData?.uoms ?? [];

  // Debug: Log API data
  useEffect(() => {
    console.log('UOMs API - isLoading:', isUomsLoading, 'error:', uomsError, 'data:', uomsData);
    if (uomsError) {
      console.error('UOMs API Error:', uomsError);
    }
    if (uomsData) {
      console.log('UOMs Data:', uomsData);
    }
  }, [uomsData, uomsError, isUomsLoading]);

  const [uomSearchQuery, setUomSearchQuery] = useState<string>('');
  const [uomStatusFilter, setUomStatusFilter] = useState<string>('all');
  const [isUomDialogOpen, setIsUomDialogOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<UOMItem | null>(null);

  // Category State - Fetch from API
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: isCategoriesLoading,
  } = useSWR<{ categories: MaterialCategoryItem[] }>(
    '/api/material-categories',
    fetcher,
    swrConfig,
  );
  const categoryData = categoriesData?.categories ?? [];

  // Debug: Log API data
  useEffect(() => {
    if (categoriesError) {
      console.error('Material Categories API Error:', categoriesError);
    }
    if (categoriesData) {
      console.log('Material Categories Data:', categoriesData);
    }
  }, [categoriesData, categoriesError]);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<string>('all');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategoryItem | null>(null);

  // Tax Rate State - Fetch from API
  const {
    data: taxRatesData,
    error: taxRatesError,
    isLoading: isTaxRatesLoading,
  } = useSWR<{ taxRates: TaxRateItem[] }>('/api/tax-rates', fetcher, swrConfig);
  const taxRateData = taxRatesData?.taxRates ?? [];

  // Debug: Log API data
  useEffect(() => {
    if (taxRatesError) {
      console.error('Tax Rates API Error:', taxRatesError);
    }
    if (taxRatesData) {
      console.log('Tax Rates Data:', taxRatesData);
    }
  }, [taxRatesData, taxRatesError]);
  const [taxRateSearchQuery, setTaxRateSearchQuery] = useState<string>('');
  const [taxRateStatusFilter, setTaxRateStatusFilter] = useState<string>('all');
  const [isTaxRateDialogOpen, setIsTaxRateDialogOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRateItem | null>(null);

  // Expense Category State - Fetch from API
  const {
    data: expenseCategoriesData,
    error: expenseCategoriesError,
    isLoading: isExpenseCategoriesLoading,
  } = useSWR<{ expenseCategories: ExpenseCategoryItem[] }>(
    '/api/expense-categories',
    fetcher,
    swrConfig,
  );
  const expenseCategoryData = expenseCategoriesData?.expenseCategories ?? [];

  // Debug: Log API data
  useEffect(() => {
    if (expenseCategoriesError) {
      console.error('Expense Categories API Error:', expenseCategoriesError);
    }
    if (expenseCategoriesData) {
      console.log('Expense Categories Data:', expenseCategoriesData);
    }
  }, [expenseCategoriesData, expenseCategoriesError]);
  const [expenseCategorySearchQuery, setExpenseCategorySearchQuery] = useState<string>('');
  const [expenseCategoryStatusFilter, setExpenseCategoryStatusFilter] = useState<string>('all');
  const [isExpenseCategoryDialogOpen, setIsExpenseCategoryDialogOpen] = useState(false);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState<ExpenseCategoryItem | null>(
    null,
  );

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

  const expenseCategoryTableState = useTableState({
    initialSortField: 'code',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  // UOM Functions
  const handleUomSubmit = async (formData: Omit<UOMItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingUom) {
        // Update existing UOM
        const response = await fetch(`/api/uoms/${editingUom.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update UOM' }));
          throw new Error(error.error || 'Failed to update UOM');
        }

        toast.success('UOM updated successfully!');
      } else {
        // Create new UOM
        const response = await fetch('/api/uoms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to create UOM' }));
          throw new Error(error.error || 'Failed to create UOM');
        }

        toast.success('UOM created successfully!');
      }

      // Refresh data
      await mutate('/api/uoms');
      setEditingUom(null);
      setIsUomDialogOpen(false);
    } catch (error) {
      console.error('Error saving UOM:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save UOM');
    }
  };

  const handleEditUom = (uom: UOMItem) => {
    setEditingUom(uom);
    setIsUomDialogOpen(true);
  };

  const toggleUomStatus = async (uomId: string) => {
    try {
      const uom = uomData.find((u) => u.id === uomId);
      if (!uom) return;

      const response = await fetch(`/api/uoms/${uomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !uom.isActive }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update UOM' }));
        throw new Error(error.error || 'Failed to update UOM');
      }

      toast.success(`UOM ${!uom.isActive ? 'activated' : 'deactivated'} successfully!`);
      // Refresh data
      await mutate('/api/uoms');
    } catch (error) {
      console.error('Error toggling UOM status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update UOM status');
    }
  };

  // Category Functions
  const handleCategorySubmit = async (
    formData: Omit<MaterialCategoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/material-categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update category' }));
          throw new Error(error.error || 'Failed to update category');
        }

        toast.success('Category updated successfully!');
      } else {
        // Create new category
        const response = await fetch('/api/material-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to create category' }));
          throw new Error(error.error || 'Failed to create category');
        }

        toast.success('Category created successfully!');
      }

      // Refresh data
      await mutate('/api/material-categories');
      setEditingCategory(null);
      setIsCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save category');
    }
  };

  const handleEditCategory = (category: MaterialCategoryItem) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const toggleCategoryStatus = async (categoryId: string) => {
    try {
      const category = categoryData.find((cat) => cat.id === categoryId);
      if (!category) return;

      const response = await fetch(`/api/material-categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update category' }));
        throw new Error(error.error || 'Failed to update category');
      }

      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully!`);
      // Refresh data
      await mutate('/api/material-categories');
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update category status');
    }
  };

  // Expense Category Functions
  const handleExpenseCategorySubmit = async (
    formData: Omit<ExpenseCategoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      if (editingExpenseCategory) {
        // Update existing expense category
        const response = await fetch(`/api/expense-categories/${editingExpenseCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: 'Failed to update expense category' }));
          throw new Error(error.error || 'Failed to update expense category');
        }

        toast.success('Expense category updated successfully!');
      } else {
        // Create new expense category
        const response = await fetch('/api/expense-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: 'Failed to create expense category' }));
          throw new Error(error.error || 'Failed to create expense category');
        }

        toast.success('Expense category created successfully!');
      }

      // Refresh data
      await mutate('/api/expense-categories');
      setEditingExpenseCategory(null);
      setIsExpenseCategoryDialogOpen(false);
    } catch (error) {
      console.error('Error saving expense category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save expense category');
    }
  };

  const handleEditExpenseCategory = (category: ExpenseCategoryItem) => {
    setEditingExpenseCategory(category);
    setIsExpenseCategoryDialogOpen(true);
  };

  const toggleExpenseCategoryStatus = async (categoryId: string) => {
    try {
      const category = expenseCategoryData.find((cat) => cat.id === categoryId);
      if (!category) return;

      const response = await fetch(`/api/expense-categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: 'Failed to update expense category' }));
        throw new Error(error.error || 'Failed to update expense category');
      }

      toast.success(
        `Expense category ${!category.isActive ? 'activated' : 'deactivated'} successfully!`,
      );
      // Refresh data
      await mutate('/api/expense-categories');
    } catch (error) {
      console.error('Error toggling expense category status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update expense category status',
      );
    }
  };

  // Tax Rate Functions
  const handleTaxRateSubmit = async (
    formData: Omit<TaxRateItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    try {
      if (editingTaxRate) {
        // Update existing tax rate
        const response = await fetch(`/api/tax-rates/${editingTaxRate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to update tax rate' }));
          throw new Error(error.error || 'Failed to update tax rate');
        }

        toast.success('Tax rate updated successfully!');
      } else {
        // Create new tax rate
        const response = await fetch('/api/tax-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to create tax rate' }));
          throw new Error(error.error || 'Failed to create tax rate');
        }

        toast.success('Tax rate created successfully!');
      }

      // Refresh data
      await mutate('/api/tax-rates');
      setEditingTaxRate(null);
      setIsTaxRateDialogOpen(false);
    } catch (error) {
      console.error('Error saving tax rate:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save tax rate');
    }
  };

  const handleEditTaxRate = (taxRate: TaxRateItem) => {
    setEditingTaxRate(taxRate);
    setIsTaxRateDialogOpen(true);
  };

  const toggleTaxRateStatus = async (taxRateId: string) => {
    try {
      const taxRate = taxRateData.find((tr) => tr.id === taxRateId);
      if (!taxRate) return;

      const response = await fetch(`/api/tax-rates/${taxRateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !taxRate.isActive }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update tax rate' }));
        throw new Error(error.error || 'Failed to update tax rate');
      }

      toast.success(`Tax rate ${!taxRate.isActive ? 'activated' : 'deactivated'} successfully!`);
      // Refresh data
      await mutate('/api/tax-rates');
    } catch (error) {
      console.error('Error toggling tax rate status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update tax rate status');
    }
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

  // Filter and sort Expense Categories
  const filteredExpenseCategories = expenseCategoryData
    .filter((category) => {
      const matchesSearch =
        expenseCategorySearchQuery === '' ||
        category.code.toLowerCase().includes(expenseCategorySearchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(expenseCategorySearchQuery.toLowerCase());
      const matchesStatus =
        expenseCategoryStatusFilter === 'all' ||
        (expenseCategoryStatusFilter === 'active' && category.isActive) ||
        (expenseCategoryStatusFilter === 'inactive' && !category.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[expenseCategoryTableState.sortField as keyof ExpenseCategoryItem];
      const bValue = b[expenseCategoryTableState.sortField as keyof ExpenseCategoryItem];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return expenseCategoryTableState.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const paginatedExpenseCategories = filteredExpenseCategories.slice(
    (expenseCategoryTableState.currentPage - 1) * expenseCategoryTableState.itemsPerPage,
    expenseCategoryTableState.currentPage * expenseCategoryTableState.itemsPerPage,
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

  // Expense Category Tab Content
  const expenseCategoryTabContent = (
    <div className="space-y-6">
      {/* Expense Category Statistics */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                    <p className="text-2xl font-bold text-primary">{expenseCategoryData.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-primary" />
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
                      {expenseCategoryData.filter((c) => c.isActive).length}
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
                      {expenseCategoryData.filter((c) => !c.isActive).length}
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

      {/* Expense Category Search and Filters */}
      <Card className="w-full overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0 w-full">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expense categories..."
                    value={expenseCategorySearchQuery}
                    onChange={(e) => setExpenseCategorySearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={expenseCategoryStatusFilter}
                    onValueChange={setExpenseCategoryStatusFilter}
                  >
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
              <Dialog
                open={isExpenseCategoryDialogOpen}
                onOpenChange={setIsExpenseCategoryDialogOpen}
              >
                <Button
                  onClick={() => {
                    setEditingExpenseCategory(null);
                    setIsExpenseCategoryDialogOpen(true);
                  }}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add New Expense Category
                </Button>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpenseCategory
                        ? 'Edit Expense Category'
                        : 'Add New Expense Category'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingExpenseCategory
                        ? 'Update the expense category details below'
                        : 'Create a new expense category'}
                    </DialogDescription>
                  </DialogHeader>
                  <MaterialCategoryForm
                    onSubmit={handleExpenseCategorySubmit}
                    onCancel={() => {
                      setEditingExpenseCategory(null);
                      setIsExpenseCategoryDialogOpen(false);
                    }}
                    defaultValues={editingExpenseCategory || undefined}
                    isEdit={!!editingExpenseCategory}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Category Table */}
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
                {paginatedExpenseCategories.map((category) => (
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
                                onClick={() => handleEditExpenseCategory(category)}
                                aria-label="Edit Expense Category"
                                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Expense Category</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpenseCategoryStatus(category.id)}
                                aria-label={
                                  category.isActive
                                    ? 'Deactivate Expense Category'
                                    : 'Activate Expense Category'
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
              Showing{' '}
              {(expenseCategoryTableState.currentPage - 1) *
                expenseCategoryTableState.itemsPerPage +
                1}{' '}
              to{' '}
              {Math.min(
                expenseCategoryTableState.currentPage * expenseCategoryTableState.itemsPerPage,
                filteredExpenseCategories.length,
              )}{' '}
              of {filteredExpenseCategories.length} expense categories
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  expenseCategoryTableState.setCurrentPage(
                    expenseCategoryTableState.currentPage - 1,
                  )
                }
                disabled={expenseCategoryTableState.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  expenseCategoryTableState.setCurrentPage(
                    expenseCategoryTableState.currentPage + 1,
                  )
                }
                disabled={
                  expenseCategoryTableState.currentPage >=
                  Math.ceil(
                    filteredExpenseCategories.length / expenseCategoryTableState.itemsPerPage,
                  )
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
      value: 'expense-category',
      label: 'Expense Category',
      icon: Receipt,
      content: expenseCategoryTabContent,
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
        <TabNavigation tabs={tabs} defaultValue="uom" tabsListClassName="grid w-full grid-cols-4" />
        <div className="p-4 md:p-6 space-y-6 max-w-full">
          {/* Tab contents are rendered by TabNavigation below the header card */}
        </div>
      </div>
    </div>
  );
}
