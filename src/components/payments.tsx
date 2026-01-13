'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR from 'swr';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { usePayments, useVendors } from '@/lib/contexts';
import { fetcher, swrConfig } from '@/lib/swr';
import { formatDate } from '@/lib/utils';
import { formatDateOnly } from '@/lib/utils/date';
import type { Payment } from '@/types';

const paymentSchema = z
  .object({
    vendorId: z.string().optional(),
    clientName: z.string().optional(),
    amount: z.number().min(0, 'Amount must be non-negative.'),
    status: z.enum(['pending', 'completed', 'overdue']),
    date: z.date().optional().nullable(),
  })
  .refine((data) => data.vendorId || data.clientName, {
    message: 'Please select a vendor or enter a client name.',
    path: ['vendorId'],
  });

type PaymentFormData = z.infer<typeof paymentSchema>;

const STATUS_LABELS: Record<Payment['status'], string> = {
  pending: 'Pending',
  completed: 'Completed',
  overdue: 'Overdue',
};

function deriveStats(payments: Payment[]) {
  const total = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pending = payments.filter((payment) => payment.status === 'pending').length;
  const completed = payments.filter((payment) => payment.status === 'completed').length;
  const overdue = payments.filter((payment) => payment.status === 'overdue').length;

  return {
    total,
    pending,
    completed,
    overdue,
  };
}

export function PaymentsPage() {
  const { payments, isLoading, addPayment, updatePayment, deletePayment, refresh, pagination } =
    usePayments();
  const { vendors, isLoading: isLoadingVendors } = useVendors();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      vendorId: undefined,
      clientName: '',
      amount: undefined,
      status: 'pending',
      date: undefined,
    },
  });

  // Watch vendorId to fetch purchases
  const selectedVendorId = form.watch('vendorId');
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  // Fetch purchases for selected vendor
  const purchasesUrl = selectedVendorId
    ? `/api/purchases?vendorId=${selectedVendorId}&limit=100`
    : null;
  const { data: purchasesData, isLoading: isLoadingPurchases } = useSWR<{
    purchases?: Array<{
      id: string;
      vendor?: string;
      invoiceNumber?: string;
      purchaseDate?: string;
      totalAmount: number;
    }>;
  }>(purchasesUrl, fetcher, swrConfig);

  const vendorPurchases = useMemo(() => purchasesData?.purchases ?? [], [purchasesData]);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<Set<string>>(new Set());

  // Clear selected purchases when vendor changes
  useEffect(() => {
    setSelectedPurchaseIds(new Set());
  }, [selectedVendorId]);

  const selectedPurchases = useMemo(
    () => vendorPurchases.filter((p) => selectedPurchaseIds.has(p.id)),
    [vendorPurchases, selectedPurchaseIds],
  );

  const totalSelectedAmount = useMemo(
    () => selectedPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    [selectedPurchases],
  );

  const totalPurchaseAmount = useMemo(
    () => vendorPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    [vendorPurchases],
  );

  // Auto-fill amount when purchases are selected
  useEffect(() => {
    if (selectedPurchaseIds.size > 0 && totalSelectedAmount > 0) {
      form.setValue('amount', totalSelectedAmount);
    }
  }, [selectedPurchaseIds, totalSelectedAmount, form]);

  const togglePurchaseSelection = (purchaseId: string) => {
    setSelectedPurchaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(purchaseId)) {
        next.delete(purchaseId);
      } else {
        next.add(purchaseId);
      }
      return next;
    });
  };

  const selectAllPurchases = () => {
    setSelectedPurchaseIds(new Set(vendorPurchases.map((p) => p.id)));
  };

  const clearAllPurchases = () => {
    setSelectedPurchaseIds(new Set());
  };

  // Fetch payments with pagination
  useEffect(() => {
    const vendorId = vendorFilter !== 'all' ? vendorFilter : undefined;
    void refresh(page, limit, vendorId);
  }, [refresh, page, limit, vendorFilter]);

  // Refresh payments when page becomes visible (e.g., user switches tabs or creates expense elsewhere)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const vendorId = vendorFilter !== 'all' ? vendorFilter : undefined;
        void refresh(page, limit, vendorId);
      }
    };

    const handleFocus = () => {
      const vendorId = vendorFilter !== 'all' ? vendorFilter : undefined;
      void refresh(page, limit, vendorId);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refresh, page, limit, vendorFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, vendorFilter]);

  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({
        vendorId: undefined,
        clientName: '',
        amount: undefined,
        status: 'pending',
        date: undefined,
      });
      setEditingPayment(null);
      return;
    }

    if (editingPayment) {
      form.reset({
        vendorId: editingPayment.vendorId,
        clientName: editingPayment.clientName,
        amount: editingPayment.amount,
        status: editingPayment.status,
        date: undefined, // New payments won't have date, existing ones keep their data but form shows empty
      });
    }
  }, [editingPayment, form, isDialogOpen]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.siteName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [payments, searchQuery, statusFilter]);

  const stats = useMemo(() => deriveStats(payments), [payments]);

  const handleSubmit = async (data: PaymentFormData) => {
    try {
      const payload = {
        vendorId: data.vendorId,
        clientName: data.clientName,
        amount: data.amount,
        status: data.status,
        date: data.date ? formatDateOnly(data.date) : undefined,
      } satisfies Parameters<typeof addPayment>[0];

      if (editingPayment) {
        await updatePayment(editingPayment.id, payload);
        toast.success('Payment updated successfully');
      } else {
        await addPayment(payload);
        toast.success('Payment created successfully');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save payment', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save payment.');
    }
  };

  const handleDelete = async (payment: Payment) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete payment for ${payment.clientName}?`);
      if (!confirmed) {
        return;
      }
    }

    try {
      await deletePayment(payment.id);
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Failed to delete payment', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete payment.');
    }
  };

  const openForCreate = () => {
    setEditingPayment(null);
    setIsDialogOpen(true);
  };

  const openForEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsDialogOpen(true);
  };

  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Track client payments and outstanding amounts.</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search by client or site"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full md:w-72"
          />
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openForCreate} className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.overdue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-sm text-muted-foreground">
                {payments.length === 0
                  ? 'Add your first payment to start tracking revenue.'
                  : 'Try adjusting your filters or search.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground">
                        {payment.dueDate ? formatDate(payment.dueDate) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{payment.clientName}</div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'completed'
                              ? 'default'
                              : payment.status === 'overdue'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="capitalize"
                        >
                          {STATUS_LABELS[payment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.paidDate ? formatDate(payment.paidDate) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.siteName ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openForEdit(payment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(payment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} payments
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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
            <DialogDescription>
              {editingPayment
                ? 'Update the payment details and save your changes.'
                : 'Create a new payment entry for your client.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client (Vendor) *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear clientName when vendor is selected
                          form.setValue('clientName', '');
                        }}
                        disabled={isLoadingVendors}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingVendors
                                  ? 'Loading vendors…'
                                  : vendors.length === 0
                                    ? 'No vendors available'
                                    : 'Select vendor'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            field.onChange(nextValue === '' ? undefined : Number(nextValue));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Display purchases for selected vendor */}
              {selectedVendorId && (
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Purchases for {selectedVendor?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPurchases ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Loading purchases...
                        </span>
                      </div>
                    ) : vendorPurchases.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No purchases found for this vendor.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Select invoices to pay for (optional)
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={selectAllPurchases}
                              className="h-7 text-xs"
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearAllPurchases}
                              className="h-7 text-xs"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12 text-xs"></TableHead>
                                <TableHead className="text-xs">Invoice</TableHead>
                                <TableHead className="text-xs">Date</TableHead>
                                <TableHead className="text-xs text-right">Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vendorPurchases.map((purchase) => (
                                <TableRow
                                  key={purchase.id}
                                  className="cursor-pointer"
                                  onClick={() => togglePurchaseSelection(purchase.id)}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedPurchaseIds.has(purchase.id)}
                                      onCheckedChange={() => togglePurchaseSelection(purchase.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs font-medium">
                                    {purchase.invoiceNumber || '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {purchase.purchaseDate
                                      ? formatDate(purchase.purchaseDate)
                                      : '—'}
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-medium">
                                    ₹{purchase.totalAmount.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="space-y-1 border-t pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Purchase Amount:</span>
                            <span className="text-sm font-bold">
                              ₹{totalPurchaseAmount.toLocaleString()}
                            </span>
                          </div>
                          {selectedPurchaseIds.size > 0 && (
                            <div className="flex items-center justify-between text-primary">
                              <span className="text-sm font-medium">Selected Amount:</span>
                              <span className="text-sm font-bold">
                                ₹{totalSelectedAmount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingPayment ? 'Save Changes' : 'Create Payment'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
