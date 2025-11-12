'use client';

import {
  Plus,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Search,
  Filter,
  Receipt,
  Loader2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { getExpenseColumns } from './expenses-columns';

import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import type { ExpenseFormData } from '@/components/forms/ExpenseForm';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
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
import { useDialogState } from '@/lib/hooks/useDialogState';
import { useTableState } from '@/lib/hooks/useTableState';
import { formatDate } from '@/lib/utils';
import type { Expense } from '@/types';
import { toast } from 'sonner';
import { useExpenses } from '@/lib/contexts';

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
  } = useExpenses();
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dialogState = useDialogState<Expense>();
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

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

  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    setIsSaving(true);
    try {
      if (dialogState.editingItem) {
        const updated = await updateExpense(dialogState.editingItem.id, {
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          amount: formData.amount,
          date: formData.date.toISOString().split('T')[0],
          vendor: formData.vendor,
          siteId: formData.siteId,
          siteName: formData.siteName,
          receipt: formData.receipt,
          approvedBy: formData.approvedBy,
        });

        if (updated && viewingExpense?.id === updated.id) {
          setViewingExpense(updated);
        }

        toast.success('Expense updated successfully');
      } else {
        await addExpense({
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          amount: formData.amount,
          date: formData.date.toISOString().split('T')[0],
          vendor: formData.vendor,
          siteId: formData.siteId,
          siteName: formData.siteName,
          receipt: formData.receipt,
          approvedBy: formData.approvedBy,
          status: 'pending',
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

  const { total, paid, pending, overdue } = useMemo(() => calculateTotals(expensesForCalc), [expensesForCalc]);

  const categoryFilter = tableState.filter['category'];
  const statusFilter = tableState.filter['status'];

  const filteredExpenses = useMemo(() => {
    let data = filterExpenses(
      expenses,
      categoryFilter,
      statusFilter,
      searchTerm,
    );

    if (filterBySite) {
      data = data.filter((expense) => expense.siteName === filterBySite);
    }

    return data;
  }, [expenses, categoryFilter, statusFilter, searchTerm, filterBySite]);

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
                      <DollarSign className="h-6 w-6 text-primary" />
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
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter expenses by category and status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  onPageChange={tableState.setCurrentPage}
                  pageSize={tableState.itemsPerPage}
                  currentPage={tableState.currentPage}
                  totalPages={tableState.totalPages(filteredExpenses.length)}
                  sortField={tableState.sortField}
                  sortDirection={tableState.sortDirection}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Expense Dialog */}
        <FormDialog
          title={dialogState.isEditing ? 'Edit Expense' : 'Add New Expense'}
          description={
            dialogState.isEditing
              ? 'Update the expense details'
              : 'Create a new expense entry for your project'
          }
          isOpen={dialogState.isDialogOpen}
          onOpenChange={(open) =>
            open ? dialogState.openDialog(dialogState.editingItem) : dialogState.closeDialog()
          }
          maxWidth="max-w-2xl"
        >
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
                  }
                : undefined
            }
          />
        </FormDialog>

        <FormDialog
          title="Expense Details"
          description="Review the expense information"
          isOpen={Boolean(viewingExpense)}
          onOpenChange={(open) => (!open ? setViewingExpense(null) : null)}
          maxWidth="max-w-xl"
        >
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
        </FormDialog>
      </div>
    </div>
  );
}
