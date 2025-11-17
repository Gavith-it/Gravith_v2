'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { MaterialMasterInput } from '@/types/materials';
import { getActiveUOMs, type UOMItem } from '@/components/shared/masterData';
import type { Site } from '@/types/sites';

interface MaterialMasterFormProps {
  onSubmit: (data: MaterialMasterInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<MaterialMasterInput>;
  isEdit?: boolean;
}

// Form schema with Zod validation
const materialMasterFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Material name is required.')
      .min(3, 'Material name must be at least 3 characters.')
      .max(100, 'Material name must be at most 100 characters.'),
    category: z.enum([
      'Cement',
      'Steel',
      'Concrete',
      'Bricks',
      'Sand',
      'Aggregate',
      'Timber',
      'Electrical',
      'Plumbing',
      'Paint',
      'Other',
    ]),
    unit: z.string().min(1, 'Unit is required.'),
    quantity: z
      .number()
      .min(0, 'Quantity must be greater than or equal to zero.')
      .max(1000000000, 'Quantity is too large.'),
    consumedQuantity: z
      .number()
      .min(0, 'Consumed quantity must be greater than or equal to zero.')
      .max(1000000000, 'Consumed quantity is too large.'),
    standardRate: z
      .number()
      .min(0, 'Standard rate must be greater than or equal to zero.')
      .max(100000000, 'Standard rate is too large.'),
    hsn: z.string().max(50, 'HSN code must be at most 50 characters.').optional(),
    taxRate: z
      .number()
      .min(0, 'Tax rate must be greater than or equal to zero.')
      .max(100, 'Tax rate cannot exceed 100%.'),
    isActive: z.boolean(),
    hasOpeningBalance: z.boolean(),
  })
  .refine((data) => data.consumedQuantity <= data.quantity, {
    message: 'Consumed quantity cannot exceed available quantity.',
    path: ['consumedQuantity'],
  });

type MaterialMasterFormData = z.infer<typeof materialMasterFormSchema>;

type SiteAllocation = {
  siteId: string;
  siteName: string;
  quantity: number;
};

export default function MaterialMasterForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: MaterialMasterFormProps) {
  const formId = isEdit ? 'material-master-edit-form' : 'material-master-new-form';
  const [isClient, setIsClient] = React.useState(false);
  const [uomOptions] = React.useState<UOMItem[]>(getActiveUOMs());
  const [sites, setSites] = React.useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = React.useState(false);
  const [hasOpeningBalance, setHasOpeningBalance] = React.useState(
    Boolean(defaultValues?.siteAllocations && defaultValues.siteAllocations.length > 0),
  );
  const [siteAllocations, setSiteAllocations] = React.useState<SiteAllocation[]>(
    defaultValues?.siteAllocations || [],
  );

  const form = useForm<MaterialMasterFormData>({
    resolver: zodResolver(materialMasterFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      category: defaultValues?.category || 'Cement',
      unit: defaultValues?.unit || '',
      quantity: defaultValues?.quantity ?? 0,
      consumedQuantity: defaultValues?.consumedQuantity ?? 0,
      standardRate: defaultValues?.standardRate ?? 0,
      hsn: defaultValues?.hsn || '',
      taxRate: defaultValues?.taxRate ?? 18,
      isActive: defaultValues?.isActive ?? true,
      hasOpeningBalance: Boolean(
        defaultValues?.siteAllocations && defaultValues.siteAllocations.length > 0,
      ),
    },
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch sites on component mount
  React.useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites');
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Site[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load sites.');
        }

        setSites(payload.sites || []);
      } catch (error) {
        console.error('Failed to load sites', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load sites.');
      } finally {
        setIsLoadingSites(false);
      }
    };

    void fetchSites();
  }, []);

  // Update form values when defaultValues change in edit mode
  React.useEffect(() => {
    if (isEdit && defaultValues) {
      const hasOB = Boolean(
        defaultValues.siteAllocations && defaultValues.siteAllocations.length > 0,
      );
      setHasOpeningBalance(hasOB);
      setSiteAllocations(defaultValues.siteAllocations || []);
      form.reset({
        name: defaultValues.name || '',
        category: defaultValues.category || 'Cement',
        unit: defaultValues.unit || '',
        quantity: defaultValues.quantity ?? 0,
        consumedQuantity: defaultValues.consumedQuantity ?? 0,
        standardRate: defaultValues.standardRate ?? 0,
        hsn: defaultValues.hsn || '',
        taxRate: defaultValues.taxRate ?? 18,
        isActive: defaultValues.isActive ?? true,
        hasOpeningBalance: hasOB,
      });
    }
  }, [defaultValues, isEdit, form]);

  const handleAddSiteAllocation = () => {
    setSiteAllocations([
      ...siteAllocations,
      {
        siteId: '',
        siteName: '',
        quantity: 0,
      },
    ]);
  };

  const handleRemoveSiteAllocation = (index: number) => {
    setSiteAllocations(siteAllocations.filter((_, i) => i !== index));
  };

  const handleSiteAllocationChange = (
    index: number,
    field: 'siteId' | 'quantity',
    value: string | number,
  ) => {
    const updated = [...siteAllocations];
    if (field === 'siteId') {
      const selectedSite = sites.find((s) => s.id === value);
      updated[index] = {
        ...updated[index],
        siteId: value as string,
        siteName: selectedSite?.name || '',
      };
    } else {
      updated[index] = {
        ...updated[index],
        quantity: Number(value),
      };
    }
    setSiteAllocations(updated);
  };

  const getAvailableSites = (currentIndex: number) => {
    const usedSiteIds = siteAllocations
      .map((alloc, idx) => (idx !== currentIndex ? alloc.siteId : null))
      .filter((id): id is string => Boolean(id));
    return sites.filter((site) => !usedSiteIds.includes(site.id));
  };

  const totalAllocatedOB = siteAllocations.reduce((sum, alloc) => sum + (alloc.quantity || 0), 0);

  async function handleFormSubmit(data: MaterialMasterFormData) {
    // Validate site allocations if opening balance is enabled
    if (hasOpeningBalance) {
      if (siteAllocations.length === 0) {
        toast.error('Please add at least one site allocation for opening balance.');
        return;
      }

      for (const [index, allocation] of siteAllocations.entries()) {
        if (!allocation.siteId) {
          toast.error(`Please select a site for allocation ${index + 1}.`);
          return;
        }
        if (!allocation.quantity || allocation.quantity <= 0) {
          toast.error(`Please enter a valid quantity (> 0) for allocation ${index + 1}.`);
          return;
        }
      }
    }

    const materialData: MaterialMasterInput = {
      name: data.name,
      category: data.category,
      unit: data.unit,
      quantity: data.quantity,
      consumedQuantity: data.consumedQuantity,
      standardRate: data.standardRate,
      isActive: data.isActive,
      hsn: data.hsn || '',
      taxRate: data.taxRate,
    };

    if (hasOpeningBalance && siteAllocations.length > 0) {
      materialData.openingBalance = totalAllocatedOB;
      materialData.siteAllocations = siteAllocations.filter(
        (alloc) => alloc.siteId && alloc.quantity > 0,
      );
    }

    await onSubmit(materialData);
  }

  const getSubmitButtonText = () =>
    form.formState.isSubmitting
      ? isEdit
        ? 'Updating Material...'
        : 'Adding Material...'
      : isEdit
        ? 'Update Material'
        : 'Add Material';

  // Prevent hydration issues by only rendering after client-side mount
  if (!isClient) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FieldGroup>
            {/* Material Name and Category Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-name`}>
                      Material Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-name`}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter material name"
                      autoComplete="off"
                    />
                    <FieldDescription>Enter the name of the material.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-category`}>
                      Category <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${formId}-category`} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cement">Cement</SelectItem>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Concrete">Concrete</SelectItem>
                        <SelectItem value="Bricks">Bricks</SelectItem>
                        <SelectItem value="Sand">Sand</SelectItem>
                        <SelectItem value="Aggregate">Aggregate</SelectItem>
                        <SelectItem value="Timber">Timber</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                        <SelectItem value="Plumbing">Plumbing</SelectItem>
                        <SelectItem value="Paint">Paint</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Material category for organization and reporting.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Unit and Available Quantity Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="unit"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-unit`}>
                      Unit <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${formId}-unit`} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select unit from UOM master" />
                      </SelectTrigger>
                      <SelectContent>
                        {uomOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No active UOMs found. Add UOMs from Masters page.
                          </div>
                        ) : (
                          uomOptions.map((uom) => (
                            <SelectItem key={uom.id} value={uom.code}>
                              {uom.code} - {uom.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Select unit from UOM master for validation.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-quantity`}>
                      Available Quantity <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-quantity`}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Current available quantity of the material.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Consumed Quantity and Standard Rate Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="consumedQuantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-consumed-quantity`}>Consumed Quantity</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-consumed-quantity`}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Quantity already consumed from available stock.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="standardRate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-standard-rate`}>
                      Standard Rate (₹) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-standard-rate`}
                      type="number"
                      min="0"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="0"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Standard rate per unit for this material.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* HSN Code and Tax Rate Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="hsn"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-hsn`}>HSN Code</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-hsn`}
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter HSN code"
                      autoComplete="off"
                    />
                    <FieldDescription>Harmonized System of Nomenclature code for tax purposes.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="taxRate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-tax-rate`}>Tax Rate (%)</FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-tax-rate`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="18"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Tax rate percentage applicable to this material.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Active Toggle */}
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center space-x-2">
                    <Switch checked={field.value} onCheckedChange={field.onChange} id={`${formId}-active`} />
                    <FieldLabel htmlFor={`${formId}-active`} className="!mb-0 cursor-pointer">
                      Active
                    </FieldLabel>
                  </div>
                  <FieldDescription>Enable or disable this material in the system.</FieldDescription>
                </Field>
              )}
            />

            {/* Opening Balance Section */}
            <Separator className="my-4" />
            <div className="space-y-4 pb-6">
              <Controller
                name="hasOpeningBalance"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setHasOpeningBalance(checked);
                          if (!checked) {
                            setSiteAllocations([]);
                          } else if (siteAllocations.length === 0) {
                            handleAddSiteAllocation();
                          }
                        }}
                        id={`${formId}-has-opening-balance`}
                      />
                      <FieldLabel
                        htmlFor={`${formId}-has-opening-balance`}
                        className="!mb-0 cursor-pointer"
                      >
                        Add Opening Balance
                      </FieldLabel>
                    </div>
                    <FieldDescription>
                      Allocate opening balance quantity across one or multiple sites.
                    </FieldDescription>
                  </Field>
                )}
              />

              {hasOpeningBalance && (
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FieldLabel className="text-base font-medium">Site Allocations</FieldLabel>
                      <FieldDescription>
                        Add sites and allocate opening balance quantity to each site.
                      </FieldDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSiteAllocation}
                      disabled={isLoadingSites || sites.length === 0}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Site
                    </Button>
                  </div>

                  {isLoadingSites ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Loading sites...
                    </div>
                  ) : sites.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No sites available. Create a site first.
                    </div>
                  ) : siteAllocations.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Click "Add Site" to create an allocation.
                    </div>
                  ) : (
                    <div className="space-y-3">
                                    {siteAllocations.map((allocation, index) => {
                        const availableSites = getAvailableSites(index);
                        const currentSite = sites.find((s) => s.id === allocation.siteId);
                        // Filter out currentSite from availableSites to avoid duplicates
                        const sitesToShow = currentSite
                          ? availableSites.filter((site) => site.id !== currentSite.id)
                          : availableSites;

                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border bg-background p-3"
                          >
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor={`${formId}-site-allocation-${index}`} className="text-sm">
                                  Site {index + 1} <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={allocation.siteId}
                                  onValueChange={(value) =>
                                    handleSiteAllocationChange(index, 'siteId', value)
                                  }
                                >
                                  <SelectTrigger id={`${formId}-site-allocation-${index}`}>
                                    <SelectValue placeholder="Select a site" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {currentSite && (
                                      <SelectItem key={`current-${currentSite.id}`} value={currentSite.id}>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4" />
                                          <span>{currentSite.name}</span>
                                        </div>
                                      </SelectItem>
                                    )}
                                    {sitesToShow.map((site) => (
                                      <SelectItem key={`available-${site.id}`} value={site.id}>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-4 w-4" />
                                          <span>{site.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                    {sitesToShow.length === 0 && !currentSite && (
                                      <div className="px-3 py-2 text-sm text-muted-foreground">
                                        No more sites available
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`${formId}-ob-quantity-${index}`}
                                  className="text-sm"
                                >
                                  OB Quantity <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`${formId}-ob-quantity-${index}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0"
                                  value={allocation.quantity || ''}
                                  onChange={(e) =>
                                    handleSiteAllocationChange(
                                      index,
                                      'quantity',
                                      e.target.value === '' ? 0 : Number(e.target.value),
                                    )
                                  }
                                  style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSiteAllocation(index)}
                              className="mt-7 h-8 w-8 p-0 text-destructive hover:text-destructive"
                              aria-label="Remove allocation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {siteAllocations.length > 0 && (
                    <div className="rounded-lg bg-primary/5 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Opening Balance:</span>
                        <span className="text-base font-bold text-primary">
                          {totalAllocatedOB.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
        </FieldGroup>
      </form>
      <div className="flex items-center justify-end gap-3 pt-4 pb-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={form.formState.isSubmitting}>
          {getSubmitButtonText()}
        </Button>
      </div>
    </div>
  );
}
