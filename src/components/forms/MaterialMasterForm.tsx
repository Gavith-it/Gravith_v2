'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Building2, ExternalLink, Loader2 } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR from 'swr';
import * as z from 'zod';

import { fetcher, swrConfig } from '../../lib/swr';

import {
  getActiveUOMs,
  type UOMItem,
  getActiveTaxRates,
  type TaxRateItem,
} from '@/components/shared/masterData';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { MaterialMasterInput } from '@/types/materials';
import type { Site } from '@/types/sites';

type MaterialMasterFormDefaultValues = Partial<MaterialMasterInput> & {
  taxRate?: number; // For backward compatibility
};

interface MaterialMasterFormProps {
  onSubmit: (data: MaterialMasterInput) => Promise<void>;
  onCancel: () => void;
  defaultValues?: MaterialMasterFormDefaultValues;
  isEdit?: boolean;
}

// Form schema with Zod validation
const materialMasterFormSchema = z.object({
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
  standardRate: z.coerce
    .number({
      message: 'Standard rate is required.',
    })
    .min(0, 'Standard rate must be greater than or equal to zero.')
    .max(100000000, 'Standard rate is too large.'),
  hsn: z.string().max(50, 'HSN code must be at most 50 characters.').optional(),
  taxRateId: z.string().min(1, 'Tax rate is required.'),
  isActive: z.boolean(),
  hasOpeningBalance: z.boolean(),
});
type MaterialMasterFormData = Omit<z.infer<typeof materialMasterFormSchema>, 'standardRate'> & {
  standardRate: number;
};

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [uomOptions] = React.useState<UOMItem[]>(getActiveUOMs());
  const [taxRateOptions] = React.useState<TaxRateItem[]>(getActiveTaxRates());

  // Fetch sites using SWR
  const { data: sitesData, isLoading: isLoadingSites } = useSWR<{ sites: Site[] }>(
    '/api/sites',
    fetcher,
    swrConfig,
  );

  const sites = React.useMemo(() => sitesData?.sites ?? [], [sitesData]);
  const [hasOpeningBalance, setHasOpeningBalance] = React.useState(
    Boolean(defaultValues?.siteAllocations && defaultValues.siteAllocations.length > 0),
  );
  const [siteAllocations, setSiteAllocations] = React.useState<SiteAllocation[]>(
    defaultValues?.siteAllocations || [],
  );
  const [isSiteDialogOpen, setIsSiteDialogOpen] = React.useState(false);

  // Helper function to convert tax rate number to tax rate ID
  const getTaxRateIdFromRate = React.useCallback(
    (rate: number): string => {
      const taxRate = taxRateOptions.find((tr) => tr.rate === rate);
      return taxRate?.code || 'GST18';
    },
    [taxRateOptions],
  );

  const form = useForm<MaterialMasterFormData>({
    resolver: zodResolver(materialMasterFormSchema) as unknown as Resolver<MaterialMasterFormData>,
    defaultValues: {
      name: defaultValues?.name || '',
      category: defaultValues?.category || 'Cement',
      unit: defaultValues?.unit || '',
      standardRate: defaultValues?.standardRate ?? undefined,
      hsn: defaultValues?.hsn || '',
      taxRateId: defaultValues
        ? defaultValues.taxRateId ||
          (defaultValues.taxRate && typeof defaultValues.taxRate === 'number'
            ? (() => {
                const taxRate = taxRateOptions.find((tr) => tr.rate === defaultValues.taxRate);
                return taxRate?.code || 'GST18';
              })()
            : 'GST18')
        : 'GST18',
      isActive: defaultValues?.isActive ?? true,
      hasOpeningBalance: Boolean(
        defaultValues?.siteAllocations && defaultValues.siteAllocations.length > 0,
      ),
    },
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Clear validation error when allocations become valid
  React.useEffect(() => {
    if (hasOpeningBalance && validationError) {
      const validAllocations = siteAllocations.filter(
        (alloc) => alloc.siteId && alloc.quantity > 0,
      );
      if (validAllocations.length > 0) {
        setValidationError(null);
      }
    }
  }, [siteAllocations, hasOpeningBalance, validationError]);

  // Update form values when defaultValues change in edit mode
  // IMPORTANT: Don't reset during submission to prevent toggle flickering
  React.useEffect(() => {
    // Skip reset if we're currently submitting - this prevents the toggle from flickering
    // back to the old value during the update process
    if (isSubmitting) {
      return;
    }

    if (isEdit && defaultValues) {
      const hasOB = Boolean(
        defaultValues.siteAllocations && defaultValues.siteAllocations.length > 0,
      );
      setHasOpeningBalance(hasOB);
      setSiteAllocations(defaultValues.siteAllocations || []);
      const taxRateId =
        defaultValues.taxRateId ||
        (defaultValues.taxRate && typeof defaultValues.taxRate === 'number'
          ? getTaxRateIdFromRate(defaultValues.taxRate)
          : 'GST18');
      form.reset({
        name: defaultValues.name || '',
        category: defaultValues.category || 'Cement',
        unit: defaultValues.unit || '',
        standardRate: defaultValues.standardRate ?? undefined,
        hsn: defaultValues.hsn || '',
        taxRateId: taxRateId,
        isActive: defaultValues.isActive ?? true,
        hasOpeningBalance: hasOB,
      });
    }
  }, [defaultValues, isEdit, form, getTaxRateIdFromRate, isSubmitting]);

  const handleAddSiteAllocation = () => {
    setSiteAllocations([
      ...siteAllocations,
      {
        siteId: '',
        siteName: '',
        quantity: 0,
      },
    ]);
    // Clear validation error when user adds an allocation
    setValidationError(null);
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
    // Set loading state immediately for instant visual feedback
    setIsSubmitting(true);

    try {
      // Filter out invalid allocations first (empty or incomplete)
      const validAllocations = siteAllocations.filter(
        (alloc) => alloc.siteId && alloc.quantity > 0,
      );

      // Validate site allocations if opening balance is enabled
      if (hasOpeningBalance) {
        // If toggle is ON, must have at least one valid allocation
        // User can delete some allocations and keep others - that's fine
        if (validAllocations.length === 0) {
          const errorMsg =
            'Please add at least one site allocation with valid quantity for opening balance, or turn off the opening balance toggle.';
          setValidationError(errorMsg);
          toast.error(errorMsg);
          setIsSubmitting(false);
          return;
        }

        // Clear validation error if we have valid allocations
        setValidationError(null);

        // Validate each remaining allocation (only check valid ones)
        for (const [index, allocation] of siteAllocations.entries()) {
          // Skip validation for empty/incomplete allocations (they'll be filtered out)
          if (!allocation.siteId && !allocation.quantity) {
            continue; // Empty allocation row, will be filtered out
          }

          // If allocation has some data but is incomplete, show error
          if (allocation.siteId && (!allocation.quantity || allocation.quantity <= 0)) {
            const errorMsg = `Please enter a valid quantity (> 0) for allocation ${index + 1}.`;
            setValidationError(errorMsg);
            toast.error(errorMsg);
            setIsSubmitting(false);
            return;
          }
          if (!allocation.siteId && allocation.quantity > 0) {
            const errorMsg = `Please select a site for allocation ${index + 1}.`;
            setValidationError(errorMsg);
            toast.error(errorMsg);
            setIsSubmitting(false);
            return;
          }
        }
      }

      const materialData: MaterialMasterInput = {
        name: data.name,
        category: data.category,
        unit: data.unit,
        standardRate: data.standardRate,
        isActive: data.isActive,
        hsn: data.hsn || '',
        taxRateId: data.taxRateId,
      };

      // Handle opening balance based on toggle state
      if (hasOpeningBalance) {
        // Toggle is ON - use valid allocations (user can delete some and keep others)
        if (validAllocations.length > 0) {
          // Recalculate total from valid allocations only
          const totalOB = validAllocations.reduce((sum, alloc) => sum + (alloc.quantity || 0), 0);
          materialData.openingBalance = totalOB;
          materialData.siteAllocations = validAllocations;
          // Clear validation error on successful validation
          setValidationError(null);
        } else {
          // This shouldn't happen due to validation above, but handle it anyway
          const errorMsg =
            'Please add at least one valid site allocation or turn off opening balance.';
          setValidationError(errorMsg);
          toast.error(errorMsg);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Toggle is OFF - explicitly clear opening balance and allocations
        materialData.openingBalance = null;
        materialData.siteAllocations = [];
        // Clear validation error when toggle is off
        setValidationError(null);
      }

      await onSubmit(materialData);
      // Clear validation error on successful submission
      setValidationError(null);
      // Reset submitting state after successful submission
      setIsSubmitting(false);
    } catch (error) {
      // Error is handled by parent component, but we need to ensure form state is correct
      console.error('Form submission error:', error);
      setIsSubmitting(false);
    }
  }

  const getSubmitButtonText = () => {
    const submitting = isSubmitting || form.formState.isSubmitting;
    return submitting
      ? isEdit
        ? 'Updating Material...'
        : 'Adding Material...'
      : isEdit
        ? 'Update Material'
        : 'Add Material';
  };

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
                  <FieldDescription>
                    Material category for organization and reporting.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* Unit and Standard Rate Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Unit */}
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

            {/* Standard Rate */}
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
                    placeholder="Enter rate"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                    value={field.value === undefined || field.value === null ? '' : field.value}
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
                  <FieldDescription>
                    Harmonized System of Nomenclature code for tax purposes.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="taxRateId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-tax-rate`}>
                    Tax Rate <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`${formId}-tax-rate`} aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select tax rate from masters" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRateOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No active tax rates found. Add tax rates from Masters page.
                        </div>
                      ) : (
                        taxRateOptions.map((taxRate) => (
                          <SelectItem key={taxRate.id} value={taxRate.code}>
                            {taxRate.name} ({taxRate.rate}%)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Select tax rate from masters for validation.</FieldDescription>
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
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id={`${formId}-active`}
                  />
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
            <div className="w-full">
              <Controller
                name="hasOpeningBalance"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-start gap-3 w-full">
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setHasOpeningBalance(checked);
                        // Clear validation error when toggle is changed
                        setValidationError(null);
                        if (!checked) {
                          setSiteAllocations([]);
                        } else if (siteAllocations.length === 0) {
                          handleAddSiteAllocation();
                        }
                      }}
                      id={`${formId}-has-opening-balance`}
                      className="flex-shrink-0 mt-0.5 border border-border data-[state=unchecked]:bg-muted data-[state=checked]:bg-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <FieldLabel
                        htmlFor={`${formId}-has-opening-balance`}
                        className="!mb-1 cursor-pointer text-base font-medium block"
                      >
                        Add Opening Balance
                      </FieldLabel>
                      <p className="text-sm text-muted-foreground">
                        Allocate opening balance quantity across one or multiple sites.
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

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
                  <div className="py-4 space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      No sites available. Create a site first.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('Please navigate to Sites page to create a new site.', {
                            description: 'You can return here after creating the site.',
                          });
                        }}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Create Site
                      </Button>
                    </div>
                  </div>
                ) : siteAllocations.length === 0 ? (
                  <div className="py-4 space-y-3">
                    <p className="text-center text-sm text-muted-foreground">
                      Click &quot;Add Site&quot; to create an allocation.
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast.info('Need to create a new site?', {
                            description: 'Navigate to Sites page to add a new site.',
                          });
                        }}
                        className="gap-2 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Create Site
                      </Button>
                    </div>
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
                              <Label
                                htmlFor={`${formId}-site-allocation-${index}`}
                                className="text-sm"
                              >
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
                                    <SelectItem
                                      key={`current-${currentSite.id}`}
                                      value={currentSite.id}
                                    >
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
                              <Label htmlFor={`${formId}-ob-quantity-${index}`} className="text-sm">
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
      <div className="space-y-3 pt-4 pb-2 border-t">
        {/* Validation Error Message */}
        {validationError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-medium flex items-center gap-2">
              <span className="text-destructive">⚠</span>
              {validationError}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || form.formState.isSubmitting}
            className="transition-all"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting || form.formState.isSubmitting}
            className="min-w-[140px] transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
          >
            {isSubmitting || form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {getSubmitButtonText()}
              </span>
            ) : (
              <span className="flex items-center justify-center">{getSubmitButtonText()}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
