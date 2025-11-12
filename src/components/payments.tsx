'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { usePayments } from '@/lib/contexts';
import { formatDate } from '@/lib/utils';
import type { Payment } from '@/types';
import { toast } from 'sonner';

const paymentSchema = z.object({
  clientName: z.string().min(1, 'Client name is required.'),
  amount: z.number().min(0, 'Amount must be non-negative.'),
  status: z.enum(['pending', 'completed', 'overdue']),
  dueDate: z.date().optional().nullable(),
  paidDate: z.date().optional().nullable(),
  siteId: z.string().optional(),
  siteName: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

type SiteOption = { id: string; name: string };

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
  const { payments, isLoading, addPayment, updatePayment, deletePayment } = usePayments();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientName: '',
      amount: 0,
      status: 'pending',
      dueDate: undefined,
      paidDate: undefined,
      siteId: undefined,
      siteName: '',
    },
  });

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Array<{ id: string; name: string }>;
        };

        if (response.ok) {
          setSiteOptions(payload.sites ?? []);
        } else {
          setSiteOptions([]);
        }
      } catch (error) {
        console.error('Failed to load sites for payments form', error);
        setSiteOptions([]);
      } finally {
        setIsLoadingSites(false);
      }
    };

    void loadSites();
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      form.reset({
        clientName: '',
        amount: 0,
        status: 'pending',
        dueDate: undefined,
        paidDate: undefined,
        siteId: undefined,
        siteName: '',
      });
      setEditingPayment(null);
      return;
    }

    if (editingPayment) {
      form.reset({
        clientName: editingPayment.clientName,
        amount: editingPayment.amount,
        status: editingPayment.status,
        dueDate: editingPayment.dueDate ? new Date(editingPayment.dueDate) : undefined,
        paidDate: editingPayment.paidDate ? new Date(editingPayment.paidDate) : undefined,
        siteId: editingPayment.siteId,
        siteName: editingPayment.siteName,
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
        clientName: data.clientName,
        amount: data.amount,
        status: data.status,
        dueDate: data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined,
        paidDate: data.paidDate ? data.paidDate.toISOString().split('T')[0] : undefined,
        siteId: data.siteId && data.siteId.length > 0 ? data.siteId : null,
        siteName: data.siteName && data.siteName.length > 0 ? data.siteName : null,
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

  const onSiteChange = (siteId: string | undefined) => {
    const site = siteOptions.find((option) => option.id === siteId);
    form.setValue('siteId', siteId);
    form.setValue('siteName', site?.name ?? '');
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
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.clientName}</div>
                      {payment.siteName && (
                        <div className="text-xs text-muted-foreground">{payment.siteName}</div>
                      )}
                    </TableCell>
                    <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{STATUS_LABELS[payment.status]}</TableCell>
                    <TableCell>{payment.dueDate ? formatDate(payment.dueDate) : '—'}</TableCell>
                    <TableCell>{payment.paidDate ? formatDate(payment.paidDate) : '—'}</TableCell>
                    <TableCell>{payment.siteName ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openForEdit(payment)}>
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
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client *</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Constructions" {...field} />
                      </FormControl>
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
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="paidDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Date</FormLabel>
                      <FormControl>
                        <DatePicker date={field.value ?? undefined} onSelect={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          onSiteChange(value);
                        }}
                        disabled={isLoadingSites || siteOptions.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingSites
                                  ? 'Loading sites…'
                                  : siteOptions.length === 0
                                    ? 'No sites available'
                                    : 'Select site'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteOptions.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
