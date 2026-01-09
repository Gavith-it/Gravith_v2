'use client';

import {
  Plus,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Search,
  Filter,
  Receipt,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getExpenseColumns } from './expenses-columns';

import { DataTable } from '@/components/common/DataTable';
import { FilterSheet } from '@/components/filters/FilterSheet';
import type { ExpenseFormData } from '@/components/forms/ExpenseForm';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useExpenses } from '@/lib/contexts';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { useTableState } from '@/lib/hooks/useTableState';
import { formatDate } from '@/lib/utils';
import { formatDateOnly } from '@/lib/utils/date';
import type { Expense } from '@/types';

// Utility functions

const calculateTotals = (expenses: Expense[]) => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paid = expenses
    .filter((expense) => expense.status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const pending = expenses
    .filter((expense) => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const overdue = expenses
    .filter((expense) => expense.status === 'overdue')
    .reduce((sum, expense) => sum + expense.amount, 0);

  return { total, paid, pending, overdue };
};

const filterExpenses = (
  expenses: Expense[],
  categoryFilter: string,
  statusFilter: string,
  searchTerm: string,
) => {
  return expenses.filter((expense) => {
    const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || expense.status === statusFilter;

    // Search functionality - search across description, vendor, site name, and category
    const searchMatch =
      searchTerm === '' ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.subcategory?.toLowerCase().includes(searchTerm.toLowerCase());

    return categoryMatch && statusMatch && searchMatch;
  });
};

interface ExpensesPageProps {
  filterBySite?: string;
}

export function ExpensesPage({ filterBySite }: ExpensesPageProps = {}) {
  const searchParams = useSearchParams();
  const {
    expenses,
    isLoading: isExpensesLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh,
    pagination,
  } = useExpenses();
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dialogState = useDialogState<Expense>();
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);

  type ExpenseAdvancedFilterState = {
    vendors: string[];
    sites: string[];
    approvers: string[];
    dateFrom?: string;
    dateTo?: string;
    amountMin: string;
    amountMax: string;
    hasReceipt: 'all' | 'with' | 'without';
  };

  const createDefaultExpenseAdvancedFilters = (): ExpenseAdvancedFilterState => ({
    vendors: [],
    sites: [],
    approvers: [],
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: '',
    amountMax: '',
    hasReceipt: 'all',
  });

  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<ExpenseAdvancedFilterState>(
    createDefaultExpenseAdvancedFilters(),
  );
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<ExpenseAdvancedFilterState>(
    createDefaultExpenseAdvancedFilters(),
  );

  const cloneExpenseAdvancedFilters = (
    filters: ExpenseAdvancedFilterState,
  ): ExpenseAdvancedFilterState => ({
    ...filters,
    vendors: [...filters.vendors],
    sites: [...filters.sites],
    approvers: [...filters.approvers],
  });

  const countExpenseAdvancedFilters = (filters: ExpenseAdvancedFilterState): number => {
    let count = 0;
    count += filters.vendors.length;
    count += filters.sites.length;
    count += filters.approvers.length;
    if (filters.dateFrom || filters.dateTo) count += 1;
    if (filters.amountMin !== '' || filters.amountMax !== '') count += 1;
    if (filters.hasReceipt !== 'all') count += 1;
    return count;
  };

  const parseDateValue = (value?: string): Date | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const parseNumber = (value: string): number | undefined => {
    if (value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  // Use table state hook for filtering and pagination
  const tableState = useTableState({
    initialFilter: {
      category: 'all',
      status: 'all',
    },
  });

  // Auto-open dialog if openDialog URL parameter is present
  useEffect(() => {
    if (searchParams?.get('openDialog') === 'true') {
      dialogState.openDialog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch expenses with pagination - only when page changes
  useEffect(() => {
    // Only refresh if pagination state doesn't match current page/limit
    // This prevents duplicate calls when context already has the correct data
    const needsRefresh = !pagination || pagination.page !== page || pagination.limit !== limit;
    if (needsRefresh) {
      void refresh(page, limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]); // Only depend on page/limit, refresh is stable from context

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [tableState.filter.category, tableState.filter.status, searchTerm, appliedAdvancedFilters]);

  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    setIsSaving(true);
    try {
      if (dialogState.editingItem) {
        const updated = await updateExpense(dialogState.editingItem.id, {
          category: formData.category as Expense['category'],
          subcategory: formData.subcategory,
          description: formData.description || '',
          amount: formData.amount,
          date: formatDateOnly(formData.date),
          vendor: formData.vendor,
          siteId: formData.siteId,
          siteName: formData.siteName,
          receipt: formData.receipt,
          approvedBy: formData.approvedBy,
          status: formData.status || 'pending',
        });

        if (updated && viewingExpense?.id === updated.id) {
          setViewingExpense(updated);
        }

        toast.success('Expense updated successfully');
      } else {
        await addExpense({
          category: formData.category as Expense['category'],
          subcategory: formData.subcategory,
          description: formData.description || '',
          amount: formData.amount,
          date: formatDateOnly(formData.date),
          vendor: formData.vendor,
          siteId: formData.siteId,
          siteName: formData.siteName,
          receipt: formData.receipt,
          approvedBy: formData.approvedBy,
          status: formData.status || 'pending',
        });

        toast.success('Expense added successfully');
      }

      dialogState.closeDialog();
    } catch (error) {
      console.error('Failed to save expense', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleEditExpense = (expense: Expense) => {
    dialogState.openDialog(expense);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to delete this expense?');
      if (!confirmed) {
        return;
      }
    }

    try {
      await deleteExpense(expense.id);
      if (dialogState.editingItem?.id === expense.id) {
        dialogState.closeDialog();
      }
      if (viewingExpense?.id === expense.id) {
        setViewingExpense(null);
      }
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  };

  const expensesForCalc = useMemo(() => {
    const base = filterBySite ? expenses.filter((e) => e.siteName === filterBySite) : expenses;
    return base;
  }, [expenses, filterBySite]);

  const { total, paid, pending, overdue } = useMemo(
    () => calculateTotals(expensesForCalc),
    [expensesForCalc],
  );

  const categoryFilter = tableState.filter['category'];
  const statusFilter = tableState.filter['status'];

  const vendorOptions = useMemo(() => {
    const vendors = new Set<string>();
    expenses.forEach((expense) => {
      if (expense.vendor) {
        vendors.add(expense.vendor);
      }
    });
    return Array.from(vendors).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const siteOptions = useMemo(() => {
    const sites = new Set<string>();
    expenses.forEach((expense) => {
      if (expense.siteName) {
        sites.add(expense.siteName);
      }
    });
    return Array.from(sites).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const approverOptions = useMemo(() => {
    const approvers = new Set<string>();
    expenses.forEach((expense) => {
      if (expense.approvedBy) {
        approvers.add(expense.approvedBy);
      }
    });
    return Array.from(approvers).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let data = filterExpenses(expenses, categoryFilter, statusFilter, searchTerm);

    if (filterBySite) {
      data = data.filter((expense) => expense.siteName === filterBySite);
    }

    const dateFrom = parseDateValue(appliedAdvancedFilters.dateFrom);
    const dateTo = parseDateValue(appliedAdvancedFilters.dateTo);
    const amountMin = parseNumber(appliedAdvancedFilters.amountMin);
    const amountMax = parseNumber(appliedAdvancedFilters.amountMax);

    return data.filter((expense) => {
      const matchesVendors =
        appliedAdvancedFilters.vendors.length === 0 ||
        (expense.vendor && appliedAdvancedFilters.vendors.includes(expense.vendor));
      const matchesSites =
        filterBySite ||
        appliedAdvancedFilters.sites.length === 0 ||
        (expense.siteName && appliedAdvancedFilters.sites.includes(expense.siteName));
      const matchesApprovers =
        appliedAdvancedFilters.approvers.length === 0 ||
        (expense.approvedBy && appliedAdvancedFilters.approvers.includes(expense.approvedBy));
      const expenseDate = parseDateValue(expense.date);
      const matchesDateFrom = !dateFrom || (expenseDate !== null && expenseDate >= dateFrom);
      const matchesDateTo = !dateTo || (expenseDate !== null && expenseDate <= dateTo);
      const matchesAmountMin =
        amountMin === undefined || Number.isNaN(amountMin) || expense.amount >= amountMin;
      const matchesAmountMax =
        amountMax === undefined || Number.isNaN(amountMax) || expense.amount <= amountMax;
      const hasReceipt = Boolean(expense.receipt);
      const matchesReceipt =
        appliedAdvancedFilters.hasReceipt === 'all' ||
        (appliedAdvancedFilters.hasReceipt === 'with' && hasReceipt) ||
        (appliedAdvancedFilters.hasReceipt === 'without' && !hasReceipt);

      return (
        matchesVendors &&
        matchesSites &&
        matchesApprovers &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesAmountMin &&
        matchesAmountMax &&
        matchesReceipt
      );
    });
  }, [expenses, categoryFilter, statusFilter, searchTerm, filterBySite, appliedAdvancedFilters]);

  const activeAdvancedFilterCount = useMemo(
    () => countExpenseAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  const categories = useMemo(() => {
    return Array.from(new Set(expenses.map((expense) => expense.category)));
  }, [expenses]);

  return (
    <div className="w-full min-w-0 bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-full min-w-0">
        {/* Expense Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-primary">₹{total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{expenses.length} items</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-semibold text-primary">₹</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Paid</p>
                      <p className="text-2xl font-bold text-green-600">₹{paid.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {expenses.filter((e) => e.status === 'paid').length} items
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ₹{pending.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expenses.filter((e) => e.status === 'pending').length} items
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">₹{overdue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {expenses.filter((e) => e.status === 'overdue').length} items
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
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
                      placeholder="Search expenses by description, vendor, site, or category..."
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={tableState.filter['category']}
                    onValueChange={(value) => tableState.updateFilter('category', value)}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={tableState.filter['status']}
                    onValueChange={(value) => tableState.updateFilter('status', value)}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
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
                              cloneExpenseAdvancedFilters(appliedAdvancedFilters),
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
                      <TooltipContent>Open advanced filters</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-all hover:shadow-md"
                    disabled={!hasActiveAdvancedFilters}
                    onClick={() => {
                      const resetFilters = createDefaultExpenseAdvancedFilters();
                      setAppliedAdvancedFilters(resetFilters);
                      setDraftAdvancedFilters(resetFilters);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear filters</span>
                  </Button>
                  <Button
                    onClick={() => dialogState.openDialog()}
                    className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Expense</span>
                  </Button>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {isExpensesLoading
                  ? 'Loading expenses…'
                  : `${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''} found`}
              </Badge>
              {hasActiveAdvancedFilters ? (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const chips: string[] = [];
                    if (appliedAdvancedFilters.vendors.length > 0) {
                      chips.push(`Vendors: ${appliedAdvancedFilters.vendors.join(', ')}`);
                    }
                    if (!filterBySite && appliedAdvancedFilters.sites.length > 0) {
                      chips.push(`Sites: ${appliedAdvancedFilters.sites.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.approvers.length > 0) {
                      chips.push(`Approvers: ${appliedAdvancedFilters.approvers.join(', ')}`);
                    }
                    if (appliedAdvancedFilters.dateFrom || appliedAdvancedFilters.dateTo) {
                      chips.push(
                        `Date: ${appliedAdvancedFilters.dateFrom ?? 'Any'} → ${appliedAdvancedFilters.dateTo ?? 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.amountMin || appliedAdvancedFilters.amountMax) {
                      chips.push(
                        `Amount: ₹${appliedAdvancedFilters.amountMin || '0'} - ₹${appliedAdvancedFilters.amountMax || '∞'}`,
                      );
                    }
                    if (appliedAdvancedFilters.hasReceipt !== 'all') {
                      chips.push(
                        appliedAdvancedFilters.hasReceipt === 'with'
                          ? 'With receipt'
                          : 'Without receipt',
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

        {/* Main Content */}
        <div className="space-y-4">
          {isExpensesLoading ? (
            <Card className="w-full">
              <CardContent className="p-6 md:p-12 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </CardContent>
            </Card>
          ) : filteredExpenses.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-6 md:p-12">
                <div className="flex flex-col items-center justify-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Expenses Found</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {expenses.length === 0
                      ? 'Start by adding your first expense to track project costs.'
                      : 'No expenses match your current search and filter criteria.'}
                  </p>
                  <Button
                    onClick={() => dialogState.openDialog()}
                    className="gap-2 transition-all hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full overflow-hidden">
              <CardContent className="p-0">
                <DataTable<Expense>
                  columns={getExpenseColumns({
                    onView: handleViewExpense,
                    onEdit: handleEditExpense,
                    onDelete: handleDeleteExpense,
                  })}
                  data={filteredExpenses}
                  onSort={tableState.setSortField}
                  pageSize={filteredExpenses.length}
                  currentPage={1}
                  totalPages={1}
                  sortField={tableState.sortField}
                  sortDirection={tableState.sortDirection}
                />
                {/* Pagination Controls */}
                {pagination && (pagination.hasMore || pagination.page > 1) && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {pagination.page * pagination.limit} expenses
                      {/* If using count query, uncomment below: */}
                      {/* of {pagination.total} expenses */}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page === 1 || isExpensesLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      {/* Page number buttons - commented out with hasMore approach */}
                      {/* If using count query with totalPages, uncomment below: */}
                      {/* <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              disabled={isExpensesLoading}
                              className="min-w-[2.5rem]"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!pagination.hasMore || isExpensesLoading}
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

        {/* Add Expense Dialog */}
        <Dialog
          open={dialogState.isDialogOpen}
          onOpenChange={(open) =>
            open ? dialogState.openDialog(dialogState.editingItem) : dialogState.closeDialog()
          }
        >
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-xl">
                {dialogState.isEditing ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
              <DialogDescription>
                {dialogState.isEditing
                  ? 'Update the expense details'
                  : 'Create a new expense entry for your project'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
              <ExpenseForm
                onSubmit={handleExpenseSubmit}
                onCancel={dialogState.closeDialog}
                isLoading={isSaving}
                lockedSite={filterBySite}
                submitLabel={dialogState.isEditing ? 'Update Expense' : 'Add Expense'}
                loadingLabel={dialogState.isEditing ? 'Updating...' : 'Adding...'}
                defaultValues={
                  dialogState.editingItem
                    ? {
                        category: dialogState.editingItem.category as ExpenseFormData['category'],
                        subcategory: dialogState.editingItem.subcategory || '',
                        description: dialogState.editingItem.description,
                        amount: dialogState.editingItem.amount,
                        date: new Date(dialogState.editingItem.date),
                        vendor: dialogState.editingItem.vendor || '',
                        siteId: dialogState.editingItem.siteId || '',
                        siteName: dialogState.editingItem.siteName || '',
                        receipt: dialogState.editingItem.receipt || '',
                        approvedBy: dialogState.editingItem.approvedBy || '',
                        status:
                          (dialogState.editingItem.status as 'paid' | 'pending' | 'overdue') ||
                          'pending',
                      }
                    : undefined
                }
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(viewingExpense)}
          onOpenChange={(open) => (!open ? setViewingExpense(null) : null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
              <DialogDescription>Review the expense information</DialogDescription>
            </DialogHeader>
            {viewingExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{viewingExpense.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subcategory</p>
                    <p className="font-medium">{viewingExpense.subcategory || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">₹{viewingExpense.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(viewingExpense.date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor</p>
                    <p className="font-medium">{viewingExpense.vendor || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Site</p>
                    <p className="font-medium">{viewingExpense.siteName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Receipt</p>
                    <p className="font-medium">{viewingExpense.receipt || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approved By</p>
                    <p className="font-medium">{viewingExpense.approvedBy || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-sm leading-relaxed">
                    {viewingExpense.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setViewingExpense(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <FilterSheet
          open={isFilterSheetOpen}
          onOpenChange={setIsFilterSheetOpen}
          title="Expense filters"
          description="Refine expense records with additional criteria."
          sections={[
            {
              id: 'vendors',
              title: 'Vendors',
              description: 'Show expenses from selected vendors.',
              content:
                vendorOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No vendors recorded yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {vendorOptions.map((vendor) => {
                      const checked = draftAdvancedFilters.vendors.includes(vendor);
                      return (
                        <Label key={vendor} className="flex items-center gap-3 text-sm font-normal">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                              setDraftAdvancedFilters((prev) => {
                                const isChecked = checkedValue === true;
                                return {
                                  ...prev,
                                  vendors: isChecked
                                    ? [...prev.vendors, vendor]
                                    : prev.vendors.filter((item) => item !== vendor),
                                };
                              })
                            }
                          />
                          <span>{vendor}</span>
                        </Label>
                      );
                    })}
                  </div>
                ),
            },
            {
              id: 'sites',
              title: 'Sites',
              description: filterBySite
                ? `Expenses already scoped to ${filterBySite}.`
                : 'Filter expenses by project site.',
              content: filterBySite ? (
                <p className="text-sm text-muted-foreground">
                  The list is already filtered to {filterBySite}.
                </p>
              ) : siteOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sites recorded yet.</p>
              ) : (
                <div className="grid gap-2">
                  {siteOptions.map((site) => {
                    const checked = draftAdvancedFilters.sites.includes(site);
                    return (
                      <Label key={site} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                            setDraftAdvancedFilters((prev) => {
                              const isChecked = checkedValue === true;
                              return {
                                ...prev,
                                sites: isChecked
                                  ? [...prev.sites, site]
                                  : prev.sites.filter((item) => item !== site),
                              };
                            })
                          }
                        />
                        <span>{site}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
            },
            {
              id: 'approvers',
              title: 'Approvers',
              description: 'Limit to expenses approved by selected team members.',
              content:
                approverOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approvers recorded yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {approverOptions.map((approver) => {
                      const checked = draftAdvancedFilters.approvers.includes(approver);
                      return (
                        <Label
                          key={approver}
                          className="flex items-center gap-3 text-sm font-normal"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checkedValue: boolean | 'indeterminate') =>
                              setDraftAdvancedFilters((prev) => {
                                const isChecked = checkedValue === true;
                                return {
                                  ...prev,
                                  approvers: isChecked
                                    ? [...prev.approvers, approver]
                                    : prev.approvers.filter((item) => item !== approver),
                                };
                              })
                            }
                          />
                          <span>{approver}</span>
                        </Label>
                      );
                    })}
                  </div>
                ),
            },
            {
              id: 'date-range',
              title: 'Date range',
              description: 'Filter expenses by their recorded date.',
              content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="expenses-date-from" className="text-sm font-medium">
                      From
                    </Label>
                    <Input
                      id="expenses-date-from"
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
                    <Label htmlFor="expenses-date-to" className="text-sm font-medium">
                      To
                    </Label>
                    <Input
                      id="expenses-date-to"
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
              id: 'amount-range',
              title: 'Amount (₹)',
              description: 'Limit expenses to an amount range.',
              content: (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="expenses-amount-min" className="text-sm font-medium">
                      Min
                    </Label>
                    <Input
                      id="expenses-amount-min"
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
                    <Label htmlFor="expenses-amount-max" className="text-sm font-medium">
                      Max
                    </Label>
                    <Input
                      id="expenses-amount-max"
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
              id: 'receipt',
              title: 'Receipt status',
              description: 'Filter expenses that include receipts.',
              content: (
                <Select
                  value={draftAdvancedFilters.hasReceipt}
                  onValueChange={(value: ExpenseAdvancedFilterState['hasReceipt']) =>
                    setDraftAdvancedFilters((prev) => ({ ...prev, hasReceipt: value }))
                  }
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Receipt status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All expenses</SelectItem>
                    <SelectItem value="with">With receipt</SelectItem>
                    <SelectItem value="without">Without receipt</SelectItem>
                  </SelectContent>
                </Select>
              ),
            },
          ]}
          onApply={() => {
            setAppliedAdvancedFilters(cloneExpenseAdvancedFilters(draftAdvancedFilters));
            setIsFilterSheetOpen(false);
          }}
          onReset={() => {
            const resetFilters = createDefaultExpenseAdvancedFilters();
            setDraftAdvancedFilters(resetFilters);
            setAppliedAdvancedFilters(resetFilters);
          }}
          isDirty={countExpenseAdvancedFilters(draftAdvancedFilters) > 0}
        />
      </div>
    </div>
  );
}
