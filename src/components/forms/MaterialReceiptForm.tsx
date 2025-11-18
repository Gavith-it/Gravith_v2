'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Truck, Building2, ExternalLink } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMaterialReceipts, useVendors } from '@/lib/contexts';
import type { MaterialMaster, MaterialReceipt } from '@/types/entities';
import type { Site } from '@/types/sites';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';

interface MaterialReceiptFormProps {
  editingReceipt?: MaterialReceipt | null;
  onSubmit?: (
    receiptData: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
  ) => void;
  onCancel?: () => void;
}

const receiptFormSchema = z.object({
  date: z.date(),
  vehicleNumber: z
    .string()
    .min(1, 'Vehicle number is required.')
    .regex(/^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/, 'Vehicle number must be in format: KA-01-AB-1234'),
  materialId: z.string().min(1, 'Please select a material.'),
  materialName: z.string().min(1, 'Material name is required.'),
  siteId: z.string().min(1, 'Please select a site.'),
  siteName: z.string().min(1, 'Site name is required.'),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  filledWeight: z.number().positive('Filled weight must be greater than zero.'),
  emptyWeight: z.number().min(0, 'Empty weight cannot be negative.'),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;

export function MaterialReceiptForm({
  editingReceipt,
  onSubmit,
  onCancel,
}: MaterialReceiptFormProps) {
  const { addReceipt, updateReceipt } = useMaterialReceipts();
  const { vendors, isLoading: isVendorsLoading } = useVendors();
  const isEditMode = Boolean(editingReceipt);
  const formId = isEditMode ? 'receipt-edit-form' : 'receipt-new-form';
  const [isClient, setIsClient] = useState(false);
  const [materialOptions, setMaterialOptions] = useState<MaterialMaster[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);
  const [currentOB, setCurrentOB] = useState<number | null>(null);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      date: parseDateOnly(editingReceipt?.date),
      vehicleNumber: editingReceipt?.vehicleNumber ?? '',
      materialId: editingReceipt?.materialId ?? '',
      materialName: editingReceipt?.materialName ?? '',
      siteId: editingReceipt?.siteId ?? '',
      siteName: editingReceipt?.siteName ?? '',
      vendorId: editingReceipt?.vendorId ?? undefined,
      vendorName: editingReceipt?.vendorName ?? undefined,
      filledWeight: editingReceipt?.filledWeight ?? undefined,
      emptyWeight: editingReceipt?.emptyWeight ?? undefined,
    },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setIsLoadingMaterials(true);
        const response = await fetch('/api/materials', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          materials?: MaterialMaster[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load materials.');
        }

        setMaterialOptions(payload.materials ?? []);
      } catch (error) {
        console.error('Failed to load materials list', error);
        toast.error('Unable to load materials. Add materials first.', {
          description: 'Please create materials in the Materials page before recording receipts.',
        });
        setMaterialOptions([]);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    void loadMaterials();
  }, []);

  useEffect(() => {
    const loadSites = async () => {
      try {
        setIsLoadingSites(true);
        const response = await fetch('/api/sites', { cache: 'no-store' });
        const payload = (await response.json().catch(() => ({}))) as {
          sites?: Site[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load sites.');
        }

        setSites(payload.sites ?? []);
      } catch (error) {
        console.error('Failed to load sites list', error);
        toast.error('Unable to load sites. Add sites first.', {
          description: 'Please create sites in the Sites page before recording receipts.',
        });
        setSites([]);
      } finally {
        setIsLoadingSites(false);
      }
    };

    void loadSites();
  }, []);

  // Fetch current OB when material and site are selected
  useEffect(() => {
    const materialId = form.watch('materialId');
    const siteId = form.watch('siteId');

    if (materialId && siteId) {
      const fetchOB = async () => {
        try {
          const response = await fetch('/api/materials', { cache: 'no-store' });
          const payload = (await response.json().catch(() => ({}))) as {
            materials?: MaterialMaster[];
            error?: string;
          };

          if (response.ok && payload.materials) {
            const material = payload.materials.find((m) => m.id === materialId);
            if (material?.siteAllocations) {
              const allocation = material.siteAllocations.find((a) => a.siteId === siteId);
              setCurrentOB(allocation?.quantity ?? null);
            } else {
              setCurrentOB(null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch OB', error);
          setCurrentOB(null);
        }
      };

      void fetchOB();
    } else {
      setCurrentOB(null);
    }
  }, [form.watch('materialId'), form.watch('siteId')]);

  useEffect(() => {
    if (!materialOptions.length) {
      form.setValue('materialId', '');
      form.setValue('materialName', '');
      return;
    }

    const currentId = form.getValues('materialId');
    const currentMaterial = currentId
      ? materialOptions.find((material) => material.id === currentId)
      : undefined;

    if (currentMaterial) {
      form.setValue('materialName', currentMaterial.name, { shouldValidate: true });
      return;
    }

    if (!isEditMode) {
      const [first] = materialOptions;
      if (first) {
        form.setValue('materialId', first.id, { shouldValidate: true });
        form.setValue('materialName', first.name, { shouldValidate: true });
      }
    }
  }, [form, isEditMode, materialOptions]);

  // Set default site if available and not in edit mode
  useEffect(() => {
    if (!isEditMode && sites.length > 0 && !form.getValues('siteId')) {
      const [first] = sites;
      if (first) {
        form.setValue('siteId', first.id, { shouldValidate: true });
        form.setValue('siteName', first.name, { shouldValidate: true });
      }
    }
  }, [form, isEditMode, sites]);

  const handleFormSubmit = React.useCallback(
    async (data: ReceiptFormData) => {
      const netWeight = data.filledWeight - data.emptyWeight;

      if (netWeight < 0) {
        toast.error('Net weight cannot be negative. Please check the weight values.');
        return;
      }

      const receiptData: Omit<
        MaterialReceipt,
        'id' | 'createdAt' | 'updatedAt' | 'organizationId'
      > = {
        date: formatDateOnly(data.date),
        vehicleNumber: data.vehicleNumber,
        materialId: data.materialId,
        materialName: data.materialName,
        filledWeight: data.filledWeight,
        emptyWeight: data.emptyWeight,
        netWeight,
        vendorId: data.vendorId ?? null,
        vendorName: data.vendorName ?? null,
        linkedPurchaseId: editingReceipt?.linkedPurchaseId ?? null,
        siteId: data.siteId,
        siteName: data.siteName,
      };

      try {
        if (editingReceipt) {
          await updateReceipt(editingReceipt.id, receiptData);
          toast.success('Material receipt updated successfully!');
        } else {
          await addReceipt(receiptData);
          toast.success('Material receipt recorded successfully!');
        }

        onSubmit?.(receiptData);
      } catch (error) {
        console.error('Failed to save material receipt', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to save material receipt right now.',
        );
      }
    },
    [addReceipt, editingReceipt, onSubmit, updateReceipt],
  );

  const selectedMaterialId = form.watch('materialId');
  useEffect(() => {
    if (!selectedMaterialId) {
      form.setValue('materialName', '');
      return;
    }

    const material = materialOptions.find((option) => option.id === selectedMaterialId);
    if (material) {
      form.setValue('materialName', material.name, { shouldValidate: true });
    }
  }, [form, materialOptions, selectedMaterialId]);

  const selectedVendorId = form.watch('vendorId');
  useEffect(() => {
    if (!selectedVendorId) {
      form.setValue('vendorName', undefined);
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (vendor) {
      form.setValue('vendorName', vendor.name, { shouldValidate: true });
    }
  }, [form, selectedVendorId, vendors]);

  const filledWeight = form.watch('filledWeight');
  const emptyWeight = form.watch('emptyWeight');

  const netWeight = useMemo(() => {
    if (typeof filledWeight !== 'number' || typeof emptyWeight !== 'number') {
      return undefined;
    }
    return filledWeight - emptyWeight;
  }, [filledWeight, emptyWeight]);

  const isSubmitDisabled =
    form.formState.isSubmitting ||
    isLoadingMaterials ||
    isLoadingSites ||
    (materialOptions.length === 0 && !isEditMode) ||
    (sites.length === 0 && !isEditMode);

  const getSubmitButtonText = () =>
    form.formState.isSubmitting
      ? isEditMode
        ? 'Updating Receipt...'
        : 'Recording Receipt...'
      : isEditMode
        ? 'Update Receipt'
        : 'Record Receipt';

  if (!isClient) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 rounded bg-muted w-1/4" />
            <div className="h-4 rounded bg-muted w-1/2" />
            <div className="h-4 rounded bg-muted w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-date`}>
                      Date <span className="text-destructive">*</span>
                    </FieldLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={(date) => field.onChange(date)}
                      placeholder="Select receipt date"
                      showClear={!isEditMode}
                      ariaLabel="Receipt date"
                    />
                    <FieldDescription>Date of material receipt.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="vehicleNumber"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-vehicle-number`}>
                      Vehicle Number <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-vehicle-number`}
                      aria-invalid={fieldState.invalid}
                      placeholder="KA-01-AB-1234"
                      autoComplete="off"
                    />
                    <FieldDescription>Format: KA-01-AB-1234.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="materialId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-material`}>
                      Material <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={isLoadingMaterials || materialOptions.length === 0}
                    >
                      <SelectTrigger id={`${formId}-material`} aria-invalid={fieldState.invalid}>
                        <SelectValue
                          placeholder={
                            isLoadingMaterials
                              ? 'Loading materials...'
                              : materialOptions.length === 0
                                ? 'No materials available'
                                : 'Select material'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {materialOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No materials found. Add materials first.
                          </div>
                        ) : (
                          materialOptions.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      {materialOptions.length === 0 ? (
                        <span>
                          Add a material in Materials before recording receipts.{' '}
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-primary underline"
                            onClick={() => {
                              toast.info('Please navigate to Materials page to create a new material.', {
                                description: 'You can return here after creating the material.',
                              });
                            }}
                          >
                            <ExternalLink className="mr-1 h-3 w-3 inline" />
                            Create Material
                          </Button>
                        </span>
                      ) : (
                        'Choose the material received.'
                      )}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    <input type="hidden" {...form.register('materialName')} />
                  </Field>
                )}
              />

              <Controller
                name="siteId"
                control={form.control}
                render={({ field, fieldState }) => {
                  const selectedSite = sites.find((s) => s.id === field.value);
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`${formId}-site`}>
                        Site <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const site = sites.find((s) => s.id === value);
                          form.setValue('siteName', site?.name ?? '');
                        }}
                        disabled={isLoadingSites || sites.length === 0}
                      >
                        <SelectTrigger id={`${formId}-site`} aria-invalid={fieldState.invalid}>
                          <SelectValue
                            placeholder={
                              isLoadingSites
                                ? 'Loading sites...'
                                : sites.length === 0
                                  ? 'No sites available'
                                  : 'Select site'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No sites found. Add sites first.
                            </div>
                          ) : (
                            sites.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>{site.name}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        {sites.length === 0 ? (
                          <span>
                            Add a site in Sites before recording receipts.{' '}
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-primary underline"
                              onClick={() => {
                                toast.info('Please navigate to Sites page to create a new site.', {
                                  description: 'You can return here after creating the site.',
                                });
                              }}
                            >
                              <ExternalLink className="mr-1 h-3 w-3 inline" />
                              Create Site
                            </Button>
                          </span>
                        ) : (
                          'Choose the site where material is received.'
                        )}
                        {currentOB !== null && field.value && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Current OB: {currentOB.toLocaleString()}
                          </span>
                        )}
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      <input type="hidden" {...form.register('siteName')} />
                    </Field>
                  );
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="vendorId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-vendor`}>Vendor</FieldLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      disabled={isVendorsLoading || vendors.length === 0}
                    >
                      <SelectTrigger id={`${formId}-vendor`} aria-invalid={fieldState.invalid}>
                        <SelectValue
                          placeholder={
                            isVendorsLoading
                              ? 'Loading vendors…'
                              : vendors.length === 0
                                ? 'No vendors available'
                                : 'Select vendor (optional)'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {isVendorsLoading ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Loading vendors…
                          </div>
                        ) : vendors.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No active vendors found. Add vendors first.
                          </div>
                        ) : (
                          vendors
                            .filter((vendor) => vendor.status === 'active')
                            .map((vendor) => (
                              <SelectItem key={vendor.id} value={vendor.id}>
                                {vendor.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Choose the vendor (optional).</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="filledWeight"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-filled-weight`}>
                      Filled Weight (kg) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-filled-weight`}
                      type="number"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter filled weight"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Weight of the vehicle with material.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="emptyWeight"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-empty-weight`}>
                      Empty Weight (kg) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-empty-weight`}
                      type="number"
                      step="0.01"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter empty weight"
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Weight of the empty vehicle.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {typeof netWeight === 'number' && netWeight >= 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Net Weight (Material):
                  </span>
                  <span className="flex items-center gap-1 text-lg font-bold text-primary">
                    <Scale className="h-4 w-4" />
                    {netWeight.toFixed(2)} kg
                  </span>
                </div>
              </div>
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t">
        <Field orientation="horizontal" className="justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitDisabled}>
            <Truck className="h-4 w-4 mr-2" />
            {getSubmitButtonText()}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
