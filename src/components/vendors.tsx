'use client';

import {
  Plus,
  Building,
  TrendingUp,
  Clock,
  Users,
  Search,
  Filter,
  Edit,
  CheckCircle2,
  Pause,
  Phone,
  Mail,
  MoreHorizontal,
  Trash2,
  Loader2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTableState } from '../lib/hooks/useTableState';

import VendorNewForm, { type VendorFormData } from './forms/VendorForm';
import type { Vendor } from './vendors-columns';
import { createVendorTableData } from './vendors-columns';

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useVendors } from '@/lib/contexts';
import { formatDateOnly } from '@/lib/utils/date';

type VendorAdvancedFilterState = {
  paymentTerms: string[];
  totalPaidMin: string;
  totalPaidMax: string;
  pendingMin: string;
  pendingMax: string;
};

const createDefaultVendorAdvancedFilters = (): VendorAdvancedFilterState => ({
  paymentTerms: [],
  totalPaidMin: '',
  totalPaidMax: '',
  pendingMin: '',
  pendingMax: '',
});

const cloneVendorAdvancedFilters = (
  filters: VendorAdvancedFilterState,
): VendorAdvancedFilterState => ({
  ...filters,
  paymentTerms: [...filters.paymentTerms],
});

const isVendorAdvancedFilterDefault = (filters: VendorAdvancedFilterState): boolean => {
  return (
    filters.paymentTerms.length === 0 &&
    filters.totalPaidMin === '' &&
    filters.totalPaidMax === '' &&
    filters.pendingMin === '' &&
    filters.pendingMax === ''
  );
};

const countVendorAdvancedFilters = (filters: VendorAdvancedFilterState): number => {
  let count = 0;
  count += filters.paymentTerms.length;
  if (filters.totalPaidMin !== '' || filters.totalPaidMax !== '') count += 1;
  if (filters.pendingMin !== '' || filters.pendingMax !== '') count += 1;
  return count;
};

const parseDateValue = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function VendorsPage() {
  const {
    vendors,
    isLoading,
    addVendor,
    updateVendor,
    deleteVendor,
    toggleVendorStatus,
    refresh,
    pagination,
  } = useVendors();
  const [selectedCategory, setSelectedCategory] = useState<string>('all-categories');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<VendorAdvancedFilterState>(
    () => createDefaultVendorAdvancedFilters(),
  );
  const [draftAdvancedFilters, setDraftAdvancedFilters] = useState<VendorAdvancedFilterState>(() =>
    createDefaultVendorAdvancedFilters(),
  );

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'name',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  const paymentTermOptions = useMemo(() => {
    const options = new Set<string>();
    vendors.forEach((vendor) => {
      const term = vendor.paymentTerms?.trim();
      if (term) {
        options.add(term);
      }
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [vendors]);

  const activeAdvancedFilterCount = useMemo(
    () => countVendorAdvancedFilters(appliedAdvancedFilters),
    [appliedAdvancedFilters],
  );
  const hasActiveAdvancedFilters = activeAdvancedFilterCount > 0;

  // Fetch vendors with pagination
  React.useEffect(() => {
    void refresh(page, limit);
  }, [refresh, page, limit]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [selectedCategory, statusFilter, searchQuery, appliedAdvancedFilters]);

  // Filter and sort vendors
  const sortedAndFilteredVendors = useMemo(() => {
    const totalPaidMin =
      appliedAdvancedFilters.totalPaidMin !== ''
        ? Number(appliedAdvancedFilters.totalPaidMin)
        : undefined;
    const totalPaidMax =
      appliedAdvancedFilters.totalPaidMax !== ''
        ? Number(appliedAdvancedFilters.totalPaidMax)
        : undefined;
    const pendingMin =
      appliedAdvancedFilters.pendingMin !== ''
        ? Number(appliedAdvancedFilters.pendingMin)
        : undefined;
    const pendingMax =
      appliedAdvancedFilters.pendingMax !== ''
        ? Number(appliedAdvancedFilters.pendingMax)
        : undefined;

    return vendors
      .filter((vendor) => {
        const matchesSearch =
          searchQuery === '' ||
          vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.phone?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === 'all-categories' || vendor.category === selectedCategory;
        const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
        const matchesPaymentTerms =
          appliedAdvancedFilters.paymentTerms.length === 0 ||
          (vendor.paymentTerms &&
            appliedAdvancedFilters.paymentTerms.includes(vendor.paymentTerms.trim()));
        const vendorTotalPaid = Number(vendor.totalPaid ?? 0);
        const vendorPending = Number(vendor.pendingAmount ?? 0);
        const matchesTotalPaidMin =
          totalPaidMin === undefined ||
          Number.isNaN(totalPaidMin) ||
          vendorTotalPaid >= totalPaidMin;
        const matchesTotalPaidMax =
          totalPaidMax === undefined ||
          Number.isNaN(totalPaidMax) ||
          vendorTotalPaid <= totalPaidMax;
        const matchesPendingMin =
          pendingMin === undefined || Number.isNaN(pendingMin) || vendorPending >= pendingMin;
        const matchesPendingMax =
          pendingMax === undefined || Number.isNaN(pendingMax) || vendorPending <= pendingMax;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesPaymentTerms &&
          matchesTotalPaidMin &&
          matchesTotalPaidMax &&
          matchesPendingMin &&
          matchesPendingMax
        );
      })
      .sort((a, b) => {
        const aValue = a[tableState.sortField as keyof Vendor];
        const bValue = b[tableState.sortField as keyof Vendor];

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
    vendors,
    searchQuery,
    selectedCategory,
    statusFilter,
    tableState.sortField,
    tableState.sortDirection,
    appliedAdvancedFilters,
  ]);

  // Analytics calculations
  const { totalVendors, totalPaid, totalPending } = useMemo(() => {
    if (vendors.length === 0) {
      return { totalVendors: 0, totalPaid: 0, totalPending: 0 };
    }

    const totals = vendors.reduce(
      (acc, vendor) => {
        acc.totalPaid += vendor.totalPaid || 0;
        acc.totalPending += vendor.pendingAmount || 0;
        return acc;
      },
      { totalPaid: 0, totalPending: 0 },
    );

    return {
      totalVendors: vendors.length,
      totalPaid: totals.totalPaid,
      totalPending: totals.totalPending,
    };
  }, [vendors]);

  const filteredCount = sortedAndFilteredVendors.length;
  const isFilteredEmpty = !isLoading && filteredCount === 0;

  // Helper functions
  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsVendorDialogOpen(true);
  };

  const handleAddNewVendor = () => {
    setEditingVendor(null);
    setIsVendorDialogOpen(true);
  };

  const handleVendorFormSubmit = useCallback(
    async (formData: VendorFormData) => {
      try {
        if (editingVendor) {
          await updateVendor(editingVendor.id, {
            name: formData.name,
            category: formData.category,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            email: formData.email || '',
            address: formData.address,
            gstNumber: formData.gstNumber || '',
            panNumber: formData.panNumber || '',
            bankAccount: formData.bankAccountNumber || '',
            ifscCode: formData.ifscCode || '',
            paymentTerms: formData.paymentTerms || '',
            notes: formData.notes || '',
          });
          toast.success('Vendor updated successfully');
        } else {
          await addVendor({
            name: formData.name,
            category: formData.category,
            contactPerson: formData.contactPerson,
            phone: formData.phone,
            email: formData.email || '',
            address: formData.address,
            gstNumber: formData.gstNumber || '',
            panNumber: formData.panNumber || '',
            bankAccount: formData.bankAccountNumber || '',
            ifscCode: formData.ifscCode || '',
            paymentTerms: formData.paymentTerms || '',
            notes: formData.notes || '',
            status: 'active',
            totalPaid: 0,
            pendingAmount: 0,
            registrationDate: formatDateOnly(new Date()),
          });
          toast.success('Vendor added successfully');
        }

        setEditingVendor(null);
        setIsVendorDialogOpen(false);
      } catch (error) {
        console.error('Error saving vendor', error);
        toast.error(error instanceof Error ? error.message : 'Failed to save vendor');
      }
    },
    [addVendor, editingVendor, updateVendor],
  );

  const handleVendorFormCancel = () => {
    setEditingVendor(null);
    setIsVendorDialogOpen(false);
  };

  const handleDeleteVendor = useCallback(
    async (vendor: Vendor) => {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to delete this vendor?');
        if (!confirmed) {
          return;
        }
      }

      try {
        await deleteVendor(vendor.id);
        if (editingVendor?.id === vendor.id) {
          setEditingVendor(null);
          setIsVendorDialogOpen(false);
        }
        toast.success('Vendor deleted successfully');
      } catch (error) {
        console.error('Error deleting vendor', error);
        toast.error(error instanceof Error ? error.message : 'Failed to delete vendor');
      }
    },
    [deleteVendor, editingVendor],
  );

  const handleToggleVendorStatus = useCallback(
    async (vendor: Vendor) => {
      const nextStatus = vendor.status === 'active' ? ('inactive' as const) : ('active' as const);
      try {
        await toggleVendorStatus(vendor.id, nextStatus);
        toast.success(
          nextStatus === 'active'
            ? 'Vendor activated successfully'
            : 'Vendor deactivated successfully',
        );
      } catch (error) {
        console.error('Error updating vendor status', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update vendor status');
      }
    },
    [toggleVendorStatus],
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Materials':
        return Building;
      case 'Equipment':
        return TrendingUp;
      case 'Labour':
        return Users;
      case 'Transport':
        return Clock;
      default:
        return Building;
    }
  };

  return (
    <div className="w-full bg-background">
      <div className="p-4 md:p-6 space-y-6 max-w-full">
        {/* Vendor Statistics */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Vendors</p>
                      <p className="text-2xl font-bold text-primary">{totalVendors}</p>
                    </div>
                    <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{(totalPaid / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-semibold text-green-600">₹</span>
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
                        ₹{(totalPending / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
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
                      placeholder="Search vendors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-categories">All Categories</SelectItem>
                      <SelectItem value="Materials">Materials</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Labour">Labour</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
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
                              cloneVendorAdvancedFilters(appliedAdvancedFilters),
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
                      const resetFilters = createDefaultVendorAdvancedFilters();
                      setAppliedAdvancedFilters(resetFilters);
                      setDraftAdvancedFilters(resetFilters);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear filters</span>
                  </Button>
                  <Dialog
                    open={isVendorDialogOpen}
                    onOpenChange={(open) => {
                      setIsVendorDialogOpen(open);
                      if (!open) {
                        setEditingVendor(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={handleAddNewVendor}
                        className="gap-2 transition-all hover:shadow-md whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Vendor</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="space-y-3 flex-shrink-0 px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-xl">
                          {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingVendor
                            ? 'Update vendor details and information'
                            : 'Create a new vendor entry in the system'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 min-h-0 overflow-y-auto px-6">
                        <VendorNewForm
                          onSubmit={handleVendorFormSubmit}
                          onCancel={handleVendorFormCancel}
                          initialData={
                            editingVendor
                              ? {
                                  category: editingVendor.category,
                                  name: editingVendor.name,
                                  contactPerson: editingVendor.contactPerson,
                                  phone: editingVendor.phone,
                                  email: editingVendor.email,
                                  address: editingVendor.address,
                                  gstNumber: editingVendor.gstNumber,
                                  panNumber: editingVendor.panNumber,
                                  bankName: '',
                                  bankBranch: '',
                                  accountName: '',
                                  bankAccountNumber: editingVendor.bankAccount,
                                  ifscCode: editingVendor.ifscCode,
                                  paymentTerms: editingVendor.paymentTerms,
                                  notes: editingVendor.notes,
                                }
                              : undefined
                          }
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium w-fit">
                {isLoading
                  ? 'Loading vendors…'
                  : `${filteredCount} vendor${filteredCount !== 1 ? 's' : ''} found`}
              </Badge>
              {hasActiveAdvancedFilters ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(() => {
                    const chips: string[] = [];
                    if (appliedAdvancedFilters.paymentTerms.length > 0) {
                      chips.push(`Terms: ${appliedAdvancedFilters.paymentTerms.join(', ')}`);
                    }
                    if (
                      appliedAdvancedFilters.totalPaidMin ||
                      appliedAdvancedFilters.totalPaidMax
                    ) {
                      chips.push(
                        `Paid: ₹${appliedAdvancedFilters.totalPaidMin || 'Any'} - ₹${appliedAdvancedFilters.totalPaidMax || 'Any'}`,
                      );
                    }
                    if (appliedAdvancedFilters.pendingMin || appliedAdvancedFilters.pendingMax) {
                      chips.push(
                        `Pending: ₹${appliedAdvancedFilters.pendingMin || 'Any'} - ₹${appliedAdvancedFilters.pendingMax || 'Any'}`,
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

        {/* Vendors Table */}
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </CardContent>
          </Card>
        ) : isFilteredEmpty ? (
          <Card className="w-full">
            <CardContent className="p-6 md:p-12">
              <div className="flex flex-col items-center justify-center">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Vendors Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {vendors.length === 0
                    ? 'Start by adding your first vendor to manage supplier relationships.'
                    : 'No vendors match your current search and filter criteria.'}
                </p>
                <Button
                  onClick={handleAddNewVendor}
                  className="gap-2 transition-all hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Add Vendor
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
                      <TableHead className="min-w-[250px]">Vendor</TableHead>
                      <TableHead className="min-w-[150px]">Contact</TableHead>
                      <TableHead className="min-w-[120px] text-right">Total Bill</TableHead>
                      <TableHead className="min-w-[120px] text-right">Total Paid</TableHead>
                      <TableHead className="min-w-[120px] text-right">Balance</TableHead>
                      <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredVendors.map((vendor) => {
                      const IconComponent = getCategoryIcon(vendor.category);

                      return (
                        <TableRow
                          key={vendor.id}
                          className="group cursor-pointer transition-all duration-200 hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  <IconComponent className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-sm truncate">{vendor.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {vendor.contactPerson}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{vendor.phone}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{vendor.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-right whitespace-nowrap">
                            ₹
                            {(
                              ((vendor.totalPaid || 0) + (vendor.pendingAmount || 0)) /
                              100000
                            ).toFixed(1)}
                            L
                          </TableCell>
                          <TableCell className="font-semibold text-green-600 text-right whitespace-nowrap">
                            ₹{((vendor.totalPaid || 0) / 100000).toFixed(1)}L
                          </TableCell>
                          <TableCell className="font-semibold text-orange-600 text-right whitespace-nowrap">
                            ₹{((vendor.pendingAmount || 0) / 100000).toFixed(1)}L
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditVendor(vendor);
                                      }}
                                      className="h-8 w-8"
                                      aria-label="Edit vendor"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit vendor</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleVendorStatus(vendor);
                                      }}
                                      className="h-8 w-8"
                                      aria-label={
                                        vendor.status === 'active'
                                          ? 'Deactivate vendor'
                                          : 'Activate vendor'
                                      }
                                    >
                                      {vendor.status === 'active' ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {vendor.status === 'active'
                                      ? 'Deactivate vendor'
                                      : 'Activate vendor'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteVendor(vendor);
                                      }}
                                      className="h-8 w-8 border-destructive text-destructive hover:bg-destructive/10"
                                      aria-label="Delete vendor"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete vendor</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} vendors
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.page === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
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
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.page >= pagination.totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Vendor filters"
        description="Refine the vendor list with advanced criteria."
        sections={[
          {
            id: 'payment-terms',
            title: 'Payment terms',
            description: 'Limit vendors to the selected payment terms.',
            content:
              paymentTermOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payment terms available.</p>
              ) : (
                <div className="grid gap-2">
                  {paymentTermOptions.map((term) => {
                    const isChecked = draftAdvancedFilters.paymentTerms.includes(term);
                    return (
                      <Label key={term} className="flex items-center gap-3 text-sm font-normal">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setDraftAdvancedFilters((prev) => {
                              const nextTerms =
                                checked === true
                                  ? [...prev.paymentTerms, term]
                                  : prev.paymentTerms.filter((value) => value !== term);
                              return {
                                ...prev,
                                paymentTerms: nextTerms,
                              };
                            });
                          }}
                        />
                        <span>{term}</span>
                      </Label>
                    );
                  })}
                </div>
              ),
          },
          {
            id: 'total-paid',
            title: 'Total paid (₹)',
            description: 'Filter by total paid amount.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-total-paid-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="vendor-total-paid-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.totalPaidMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        totalPaidMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-total-paid-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="vendor-total-paid-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.totalPaidMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        totalPaidMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
          {
            id: 'pending-amount',
            title: 'Pending amount (₹)',
            description: 'Filter vendors by outstanding balance.',
            content: (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-pending-min" className="text-sm font-medium">
                    Min
                  </Label>
                  <Input
                    id="vendor-pending-min"
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draftAdvancedFilters.pendingMin}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        pendingMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-pending-max" className="text-sm font-medium">
                    Max
                  </Label>
                  <Input
                    id="vendor-pending-max"
                    type="number"
                    inputMode="decimal"
                    placeholder="Any"
                    value={draftAdvancedFilters.pendingMax}
                    onChange={(event) =>
                      setDraftAdvancedFilters((prev) => ({
                        ...prev,
                        pendingMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ),
          },
        ]}
        onApply={() => {
          setAppliedAdvancedFilters(cloneVendorAdvancedFilters(draftAdvancedFilters));
          setIsFilterSheetOpen(false);
        }}
        onReset={() => {
          const resetFilters = createDefaultVendorAdvancedFilters();
          setDraftAdvancedFilters(resetFilters);
          setAppliedAdvancedFilters(resetFilters);
        }}
        isDirty={!isVendorAdvancedFilterDefault(draftAdvancedFilters)}
      />
    </div>
  );
}
