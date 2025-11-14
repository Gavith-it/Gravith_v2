'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
import { Textarea } from '@/components/ui/textarea';
import { useVendors } from '@/lib/contexts';

// Zod schema for expense validation
const expenseSchema = z.object({
  category: z.enum(['Labour', 'Materials', 'Equipment', 'Transport', 'Utilities', 'Other']),
  subcategory: z.string().min(1, 'Subcategory is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date(),
  vendor: z.string().min(1, 'Vendor is required'),
  siteId: z.string().min(1, 'Site is required'),
  siteName: z.string().min(1, 'Site name is required'),
  receipt: z.string().optional(),
  approvedBy: z.string().optional(),
  purchaseId: z.string().optional(),
  materialId: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  defaultValues?: Partial<ExpenseFormData>;
  isLoading?: boolean;
  lockedSite?: string;
  submitLabel?: string;
  loadingLabel?: string;
}

export function ExpenseForm({
  onSubmit,
  onCancel,
  defaultValues,
  isLoading = false,
  lockedSite,
  submitLabel = 'Add Expense',
  loadingLabel,
}: ExpenseFormProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Materials' as const,
      subcategory: '',
      description: '',
      amount: defaultValues?.amount ?? undefined,
      date: new Date(),
      vendor: '',
      siteId: '',
      siteName: lockedSite || '',
      receipt: '',
      approvedBy: '',
      ...defaultValues,
    },
  });

  const { vendors, isLoading: isVendorsLoading } = useVendors();
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Array<{ id: string; name: string }>;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load sites.');
        }

        const options = (payload.sites ?? []).map((site) => ({ id: site.id, name: site.name }));
        setSiteOptions(options);

        const currentSiteName = form.getValues('siteName');
        const currentSiteId = form.getValues('siteId');
        if (!currentSiteId && currentSiteName) {
          const match = options.find((site) => site.name === currentSiteName);
          if (match) {
            form.setValue('siteId', match.id, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error('Error loading sites for expense form', error);
        setSiteOptions([]);
      } finally {
        setIsLoadingSites(false);
      }
    };

    void loadSites();
  }, [form, lockedSite]);

  useEffect(() => {
    if (defaultValues?.siteId) {
      form.setValue('siteId', defaultValues.siteId, { shouldValidate: true });
    }
    if (defaultValues?.siteName) {
      form.setValue('siteName', defaultValues.siteName, { shouldValidate: true });
    }
  }, [defaultValues?.siteId, defaultValues?.siteName, form]);

  const vendorOptions = useMemo(() => {
    return vendors.filter((vendor) => vendor.status === 'active');
  }, [vendors]);

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategory *</FormLabel>
                <FormControl>
                  <Input placeholder="Cement, Steel, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Purchase of cement for foundation work"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                    placeholder="50000"
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
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onSelect={field.onChange}
                    placeholder="Select expense date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isVendorsLoading || vendorOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isVendorsLoading
                            ? 'Loading vendors…'
                            : vendorOptions.length === 0
                              ? 'No vendors available'
                              : 'Select vendor'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isVendorsLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Loading vendors…
                      </div>
                    ) : vendorOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No active vendors found. Add vendors first.
                      </div>
                    ) : (
                      vendorOptions.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    const selected = siteOptions.find((site) => site.id === value);
                    form.setValue('siteName', selected?.name ?? '', { shouldValidate: true });
                  }}
                  value={field.value}
                  disabled={!!lockedSite || isLoadingSites || siteOptions.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className={lockedSite ? 'bg-muted' : ''}>
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
                    {isLoadingSites ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Loading sites…</div>
                    ) : siteOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No active sites found. Add sites first.
                      </div>
                    ) : (
                      siteOptions.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <input type="hidden" {...form.register('siteName')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="receipt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt Number</FormLabel>
                <FormControl>
                  <Input placeholder="RCP-001234" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="approvedBy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Approved By *</FormLabel>
                <FormControl>
                  <Input placeholder="Project Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (loadingLabel ?? 'Saving...') : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
