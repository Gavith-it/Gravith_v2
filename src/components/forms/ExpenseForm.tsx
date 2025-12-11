'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import { z } from 'zod';

import { fetcher, swrConfig } from '../../lib/swr';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
  // Track which fields are being actively cleared to prevent value restoration
  const clearingFieldsRef = React.useRef<Set<string>>(new Set());
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Materials' as const,
      subcategory: '',
      description: '',
      amount: defaultValues?.amount ?? undefined,
      date: new Date(),
      vendor: '',
      siteId: defaultValues?.siteId || '',
      siteName: defaultValues?.siteName || lockedSite || '',
      receipt: '',
      approvedBy: '',
      ...defaultValues,
    },
  });

  const { vendors, isLoading: isVendorsLoading } = useVendors();
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>(() => {
    // Initialize with default site if provided, so Select can show it immediately
    if (defaultValues?.siteId && defaultValues?.siteName) {
      return [{ id: defaultValues.siteId, name: defaultValues.siteName }];
    }
    return [];
  });
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites');
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Array<{ id: string; name: string }>;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load sites.');
        }

        let options = (payload.sites ?? []).map((site) => ({ id: site.id, name: site.name }));

        // Ensure default site is in the options list (in case it wasn't loaded or is filtered out)
        if (defaultValues?.siteId && defaultValues?.siteName) {
          const defaultSiteExists = options.some((s) => s.id === defaultValues.siteId);
          if (!defaultSiteExists) {
            // Add default site at the beginning of the list
            options = [{ id: defaultValues.siteId, name: defaultValues.siteName }, ...options];
          } else {
            // Update the name if it's different (in case site name changed)
            const existingIndex = options.findIndex((s) => s.id === defaultValues.siteId);
            if (existingIndex >= 0 && options[existingIndex].name !== defaultValues.siteName) {
              options[existingIndex].name = defaultValues.siteName;
            }
          }
        }

        setSiteOptions(options);

        // Set siteId if defaultValues were provided or if siteName is set
        const currentSiteName = form.getValues('siteName');
        const currentSiteId = form.getValues('siteId');

        // If we have a siteId from defaultValues, use it (now that options are loaded)
        if (defaultValues?.siteId) {
          const match = options.find((site) => site.id === defaultValues.siteId);
          if (match) {
            // Only set if not already set or if different
            if (currentSiteId !== match.id) {
              form.setValue('siteId', match.id, { shouldValidate: true });
            }
            if (form.getValues('siteName') !== match.name) {
              form.setValue('siteName', match.name, { shouldValidate: true });
            }
          }
        } else if (!currentSiteId && currentSiteName) {
          // Fallback: try to match by name (handles lockedSite case)
          const match = options.find((site) => site.name === currentSiteName);
          if (match) {
            form.setValue('siteId', match.id, { shouldValidate: true });
            form.setValue('siteName', match.name, { shouldValidate: true });
          }
        } else if (!currentSiteId && lockedSite) {
          // Handle lockedSite prop: try to find site by name
          const match = options.find((site) => site.name === lockedSite);
          if (match) {
            form.setValue('siteId', match.id, { shouldValidate: true });
            form.setValue('siteName', match.name, { shouldValidate: true });
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
  }, [form, lockedSite, defaultValues?.siteId, defaultValues?.siteName]);

  // Set siteId immediately when defaultValues are provided (before sites load)
  useEffect(() => {
    if (defaultValues?.siteId) {
      form.setValue('siteId', defaultValues.siteId, { shouldValidate: true });
    }
    if (defaultValues?.siteName) {
      form.setValue('siteName', defaultValues.siteName, { shouldValidate: true });
    }
  }, [defaultValues?.siteId, defaultValues?.siteName, form]);

  // Update siteId when sites finish loading to ensure it matches loaded options
  useEffect(() => {
    if (defaultValues?.siteId && !isLoadingSites && siteOptions.length > 0) {
      // Verify the siteId exists in the loaded options and update if needed
      const siteExists = siteOptions.some((site) => site.id === defaultValues.siteId);
      if (siteExists) {
        const currentSiteId = form.getValues('siteId');
        if (currentSiteId !== defaultValues.siteId) {
          form.setValue('siteId', defaultValues.siteId, { shouldValidate: true });
        }
        const match = siteOptions.find((site) => site.id === defaultValues.siteId);
        if (match && match.name !== form.getValues('siteName')) {
          form.setValue('siteName', match.name, { shouldValidate: true });
        }
      }
    }
  }, [defaultValues?.siteId, form, isLoadingSites, siteOptions]);

  const vendorOptions = useMemo(() => {
    return vendors.filter((vendor) => vendor.status === 'active');
  }, [vendors]);

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardContent className="pt-6">
        <Form {...form}>
          <form id="expense-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-destructive">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Subcategory <span className="text-destructive">*</span>
                      </FormLabel>
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
                    <FormLabel>
                      Description <span className="text-destructive">*</span>
                    </FormLabel>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount (₹) <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50000"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const rawValue = event.target.value;
                              const fieldKey = 'amount';
                              // Allow empty string - this clears the input visually
                              if (rawValue === '' || rawValue === null || rawValue === undefined) {
                                clearingFieldsRef.current.add(fieldKey);
                                field.onChange(null);
                                // Don't call form.setValue or form.resetField here - let onBlur handle restoration if needed
                                // Remove from clearing set after a short delay
                                setTimeout(() => {
                                  clearingFieldsRef.current.delete(fieldKey);
                                }, 100);
                                return;
                              }
                              // Remove from clearing set when user starts typing
                              clearingFieldsRef.current.delete(fieldKey);
                              const numValue = parseFloat(rawValue);
                              if (!isNaN(numValue)) {
                                field.onChange(numValue);
                              }
                            }}
                            onBlur={(e) => {
                              // On blur, only validate - don't restore values if field was intentionally cleared
                              const value = e.target.value;
                              const fieldKey = 'amount';
                              const isClearing = clearingFieldsRef.current.has(fieldKey);
                              const fieldValue = field.value;
                              // Only set to 0 if field is empty AND was never intentionally cleared (not null)
                              // If fieldValue is null, it means user intentionally cleared it - don't restore
                              if ((value === '' || value === null || value === undefined) && fieldValue !== null && !isClearing) {
                                field.onChange(0);
                                form.setValue('amount', 0, { shouldValidate: true });
                              }
                              field.onBlur();
                            }}
                            style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
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
                      <FormLabel>
                        Date <span className="text-destructive">*</span>
                      </FormLabel>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Vendor <span className="text-destructive">*</span>
                      </FormLabel>
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
                      <FormLabel>
                        Site <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = siteOptions.find((site) => site.id === value);
                          if (selected) {
                            form.setValue('siteName', selected.name, { shouldValidate: true });
                          }
                        }}
                        value={field.value || ''}
                        disabled={isLoadingSites}
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
                          {isLoadingSites ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Loading sites…
                            </div>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      <FormLabel>
                        Approved By <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Project Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex justify-end gap-2 w-full">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" disabled={isLoading}>
            {isLoading ? (loadingLabel ?? 'Saving...') : submitLabel}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
