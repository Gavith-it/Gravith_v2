'use client';

import {
  Plus,
  Building,
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Search,
  Filter,
  Edit,
  CheckCircle2,
  Pause,
  Star,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import React, { useState } from 'react';

import { useTableState } from '../lib/hooks/useTableState';
import { formatDate } from '../lib/utils';

import VendorNewForm, { type VendorFormData } from './forms/VendorForm';
import type { Vendor } from './vendors-columns';
import { vendorColumns, createVendorTableData } from './vendors-columns';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Heavy Equipment Rentals',
    category: 'Equipment',
    contactPerson: 'Suresh Patil',
    phone: '+91 98765 43210',
    email: 'suresh@heavyequipment.com',
    address: 'Industrial Area, Navi Mumbai, MH 400710',
    gstNumber: '27ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    bankAccount: '1234567890',
    ifscCode: 'SBIN0001234',
    paymentTerms: '30 days',
    rating: 4.5,
    totalPaid: 2500000,
    pendingAmount: 125000,
    lastPayment: '2024-02-20',
    status: 'active',
    registrationDate: '2023-01-15',
    notes: 'Reliable equipment supplier with good maintenance record',
  },
  {
    id: '2',
    name: 'Tata Steel Limited',
    category: 'Materials',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98765 43211',
    email: 'rajesh@tatasteel.com',
    address: 'Steel Plant Road, Jamshedpur, JH 831001',
    gstNumber: '20AABCT1332L1ZA',
    panNumber: 'AABCT1332L',
    bankAccount: '9876543210',
    ifscCode: 'HDFC0001234',
    paymentTerms: '45 days',
    rating: 5.0,
    totalPaid: 4500000,
    pendingAmount: 325000,
    lastPayment: '2024-02-25',
    status: 'active',
    registrationDate: '2023-01-10',
    notes: 'Premium steel supplier with excellent quality standards',
  },
  {
    id: '3',
    name: 'Local Contractors Association',
    category: 'Labour',
    contactPerson: 'Amit Sharma',
    phone: '+91 98765 43212',
    email: 'amit@localcontractors.com',
    address: 'Contractor Colony, Pune, MH 411001',
    gstNumber: '27DEFGH5678K1Z9',
    panNumber: 'DEFGH5678K',
    bankAccount: '1357924680',
    ifscCode: 'ICIC0001234',
    paymentTerms: '15 days',
    rating: 4.2,
    totalPaid: 1200000,
    pendingAmount: 95000,
    lastPayment: '2024-02-22',
    status: 'active',
    registrationDate: '2023-02-01',
    notes: 'Skilled labour contractors with timely delivery',
  },
  {
    id: '4',
    name: 'City Transport Services',
    category: 'Transport',
    contactPerson: 'Prakash Joshi',
    phone: '+91 98765 43213',
    email: 'prakash@citytransport.com',
    address: 'Transport Nagar, Mumbai, MH 400001',
    gstNumber: '27IJKLM9012N1Z3',
    panNumber: 'IJKLM9012N',
    bankAccount: '2468135790',
    ifscCode: 'AXIS0001234',
    paymentTerms: '7 days',
    rating: 4.0,
    totalPaid: 350000,
    pendingAmount: 25000,
    lastPayment: '2024-02-28',
    status: 'active',
    registrationDate: '2023-03-15',
    notes: 'Reliable transport services for material delivery',
  },
];

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [selectedCategory, setSelectedCategory] = useState<string>('all-categories');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'name',
    initialSortDirection: 'asc',
    initialItemsPerPage: 10,
  });

  // Filter and sort vendors
  const sortedAndFilteredVendors = vendors
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
      return matchesSearch && matchesCategory && matchesStatus;
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

  // Analytics calculations
  const totalVendors = vendors.length;
  const totalPaid = vendors.reduce((sum, vendor) => sum + vendor.totalPaid, 0);
  const totalPending = vendors.reduce((sum, vendor) => sum + vendor.pendingAmount, 0);
  const averageRating = vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length;

  // Helper functions
  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsVendorDialogOpen(true);
  };

  const handleAddNewVendor = () => {
    setEditingVendor(null);
    setIsVendorDialogOpen(true);
  };

  const handleVendorFormSubmit = (formData: VendorFormData) => {
    if (editingVendor) {
      // Update existing vendor
      const updatedVendor: Vendor = {
        ...editingVendor,
        name: formData.name,
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
      };

      setVendors((prev) =>
        prev.map((vendor) => (vendor.id === editingVendor.id ? updatedVendor : vendor)),
      );
    } else {
      // Create new vendor
      const newVendor: Vendor = {
        id: (vendors.length + 1).toString(),
        name: formData.name,
        category: 'Materials', // Default category since it's removed from form
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || '',
        address: formData.address,
        gstNumber: formData.gstNumber || '',
        panNumber: formData.panNumber || '',
        bankAccount: formData.bankAccountNumber || '',
        ifscCode: formData.ifscCode || '',
        paymentTerms: formData.paymentTerms || '',
        rating: 0,
        totalPaid: 0,
        pendingAmount: 0,
        lastPayment: '',
        status: 'active',
        registrationDate: new Date().toISOString().split('T')[0],
        notes: formData.notes || '',
      };

      setVendors((prev) => [...prev, newVendor]);
    }

    setEditingVendor(null);
    setIsVendorDialogOpen(false);
  };

  const handleVendorFormCancel = () => {
    setEditingVendor(null);
    setIsVendorDialogOpen(false);
  };

  const toggleVendorStatus = (vendorId: string) => {
    const updatedVendors = vendors.map((vendor) =>
      vendor.id === vendorId
        ? {
            ...vendor,
            status: vendor.status === 'active' ? ('inactive' as const) : ('active' as const),
          }
        : vendor,
    );
    setVendors(updatedVendors);
  };

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
                      <DollarSign className="h-6 w-6 text-green-600" />
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
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {averageRating.toFixed(1)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Star className="h-6 w-6 text-purple-600" />
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
                        >
                          <Filter className="h-4 w-4" />
                          <span className="hidden sm:inline">Filter</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Filter vendors by category and status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader className="space-y-3 flex-shrink-0">
                        <DialogTitle className="text-xl">
                          {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingVendor
                            ? 'Update vendor details and information'
                            : 'Create a new vendor entry in the system'}
                        </DialogDescription>
                      </DialogHeader>
                      <Separator className="flex-shrink-0" />
                      <div className="flex-1 px-6">
                        <VendorNewForm
                          onSubmit={handleVendorFormSubmit}
                          onCancel={handleVendorFormCancel}
                          initialData={
                            editingVendor
                              ? {
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
                {sortedAndFilteredVendors.length} vendor
                {sortedAndFilteredVendors.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Table */}
        {sortedAndFilteredVendors.length === 0 ? (
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
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[150px]">Contact</TableHead>
                      <TableHead className="min-w-[120px] text-right">Total Paid</TableHead>
                      <TableHead className="min-w-[120px] text-right">Pending</TableHead>
                      <TableHead className="min-w-[100px]">Rating</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Last Payment</TableHead>
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
                            <Badge
                              variant="secondary"
                              className="capitalize text-xs whitespace-nowrap"
                            >
                              {vendor.category}
                            </Badge>
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
                          <TableCell className="font-semibold text-green-600 text-right whitespace-nowrap">
                            ₹{(vendor.totalPaid / 100000).toFixed(1)}L
                          </TableCell>
                          <TableCell className="font-semibold text-orange-600 text-right whitespace-nowrap">
                            ₹{(vendor.pendingAmount / 100000).toFixed(1)}L
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                              <span className="text-sm font-medium whitespace-nowrap">
                                {vendor.rating}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={vendor.status === 'active' ? 'default' : 'destructive'}
                              className="text-xs flex items-center gap-1 w-fit whitespace-nowrap"
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${vendor.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}
                              />
                              {vendor.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {vendor.lastPayment ? formatDate(vendor.lastPayment) : 'N/A'}
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
                                        handleEditVendor(vendor);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                                      aria-label="Edit vendor"
                                    >
                                      <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit vendor</p>
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
                                        toggleVendorStatus(vendor.id);
                                      }}
                                      className="h-8 w-8 p-0 transition-all hover:bg-destructive/10"
                                      aria-label={
                                        vendor.status === 'active'
                                          ? 'Deactivate vendor'
                                          : 'Activate vendor'
                                      }
                                    >
                                      {vendor.status === 'active' ? (
                                        <Pause className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                      ) : (
                                        <CheckCircle2 className="h-3 w-3 text-muted-foreground hover:text-green-600" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {vendor.status === 'active' ? 'Deactivate' : 'Activate'}{' '}
                                      vendor
                                    </p>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
