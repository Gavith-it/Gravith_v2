'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Truck, Building2, ExternalLink, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import * as z from 'zod';

import { fetcher, swrConfig } from '../../lib/swr';

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
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';
import type { MaterialMaster, MaterialReceipt } from '@/types/entities';
import type { Site } from '@/types/sites';

interface MaterialReceiptFormProps {
  editingReceipt?: MaterialReceipt | null;
  onSubmit?: (
    receiptData: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>,
  ) => void;
  onCancel?: () => void;
}

const lineItemSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required.'),
  materialId: z.string().min(1, 'Please select a material.'),
  materialName: z.string().min(1, 'Material name is required.'),
  filledWeight: z.number().positive('Filled weight must be greater than zero.'),
  emptyWeight: z.number().min(0, 'Empty weight cannot be negative.'),
  quantity: z.number().positive('Quantity must be greater than zero.'),
});

const receiptFormSchema = z.object({
  date: z.date(),
  receiptNumber: z.string().optional(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  siteId: z.string().min(1, 'Please select a site.'),
  siteName: z.string().min(1, 'Site name is required.'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;
type LineItemFormData = z.infer<typeof lineItemSchema>;

export function MaterialReceiptForm({
  editingReceipt,
  onSubmit,
  onCancel,
}: MaterialReceiptFormProps) {
  const { addReceipt, updateReceipt, addReceipts } = useMaterialReceipts();
  const { vendors, isLoading: isVendorsLoading } = useVendors();
  const isEditMode = Boolean(editingReceipt);
  const formId = isEditMode ? 'receipt-edit-form' : 'receipt-new-form';
  const [isClient, setIsClient] = useState(false);
  const [lineItemOBs, setLineItemOBs] = useState<Record<number, number | null>>({});
  // Track which fields are being actively cleared to prevent value restoration
  const clearingFieldsRef = React.useRef<Set<string>>(new Set());

  // Fetch materials and sites using SWR
  // Use limit=100 (max allowed by API) to get all materials in one request
  const {
    data: materialsData,
    isLoading: isLoadingMaterials,
    mutate: mutateMaterials,
  } = useSWR<{
    materials: MaterialMaster[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>('/api/materials?page=1&limit=100', fetcher, {
    ...swrConfig,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const { data: sitesData, isLoading: isLoadingSites } = useSWR<{ sites: Site[] }>(
    '/api/sites',
    fetcher,
    swrConfig,
  );

  const materialOptions = materialsData?.materials ?? [];
  const sites = sitesData?.sites ?? [];

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      date: parseDateOnly(editingReceipt?.date) || new Date(),
      receiptNumber: editingReceipt?.receiptNumber ?? undefined,
      vendorId: editingReceipt?.vendorId ?? undefined,
      vendorName: editingReceipt?.vendorName ?? undefined,
      siteId: editingReceipt?.siteId ?? '',
      siteName: editingReceipt?.siteName ?? '',
      lineItems: editingReceipt
        ? [
            {
              vehicleNumber: editingReceipt.vehicleNumber,
              materialId: editingReceipt.materialId,
              // materialName will be updated from material master in useEffect
              materialName: editingReceipt.materialName,
              filledWeight: editingReceipt.filledWeight,
              emptyWeight: editingReceipt.emptyWeight,
              quantity: editingReceipt.quantity,
            },
          ]
        : [
            {
              vehicleNumber: '',
              materialId: '',
              materialName: '',
              filledWeight: 0,
              emptyWeight: 0,
              quantity: 0,
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Refresh materials when form opens (when editingReceipt changes or form is first rendered)
  useEffect(() => {
    // Invalidate and revalidate materials cache to get latest materials
    void mutateMaterials(undefined, { revalidate: true });
  }, [mutateMaterials, editingReceipt?.id]); // Refresh when editingReceipt changes (dialog opens)

  // Show error toasts if fetch fails
  useEffect(() => {
    if (materialsData === undefined && !isLoadingMaterials) {
      toast.error('Unable to load materials. Add materials first.', {
        description: 'Please create materials in the Materials page before recording receipts.',
      });
    }
  }, [materialsData, isLoadingMaterials]);

  useEffect(() => {
    if (sitesData === undefined && !isLoadingSites) {
      toast.error('Unable to load sites. Add sites first.', {
        description: 'Please create sites in the Sites page before recording receipts.',
      });
    }
  }, [sitesData, isLoadingSites]);

  // Fetch current OB when material and site are selected
  const lineItems = form.watch('lineItems');
  const topLevelSiteId = form.watch('siteId');
  useEffect(() => {
    const fetchOBs = async () => {
      const newOBs: Record<number, number | null> = {};

      for (let index = 0; index < lineItems.length; index++) {
        const item = lineItems[index];
        const siteId = topLevelSiteId; // Use top-level site
        if (item.materialId && siteId) {
          try {
            // Use cached materials data from SWR
            if (materialsData?.materials) {
              const material = materialsData.materials.find((m) => m.id === item.materialId);
              if (siteId === 'unallocated') {
                newOBs[index] = material?.openingBalance ?? null;
              } else if (material?.siteAllocations) {
                const allocation = material.siteAllocations.find((a) => a.siteId === siteId);
                newOBs[index] = allocation?.quantity ?? null;
              } else {
                newOBs[index] = null;
              }
            }
          } catch (error) {
            console.error('Failed to fetch OB', error);
            newOBs[index] = null;
          }
        } else {
          newOBs[index] = null;
        }
      }

      setLineItemOBs(newOBs);
    };

    void fetchOBs();
  }, [lineItems, topLevelSiteId]);

  // Set default material for new line items
  useEffect(() => {
    if (!isEditMode && materialOptions.length > 0) {
      const lineItems = form.getValues('lineItems');

      lineItems.forEach((item, index) => {
        if (!item.materialId && materialOptions.length > 0) {
          const [first] = materialOptions;
          if (first) {
            form.setValue(`lineItems.${index}.materialId`, first.id, { shouldValidate: true });
            form.setValue(`lineItems.${index}.materialName`, first.name, { shouldValidate: true });
          }
        }
      });
    }
  }, [form, isEditMode, materialOptions]);

  const handleFormSubmit = React.useCallback(
    async (data: ReceiptFormData) => {
      // Validate all line items have valid net weights
      for (const item of data.lineItems) {
        const netWeight = item.filledWeight - item.emptyWeight;
        if (netWeight < 0) {
          toast.error(
            `Line item with vehicle ${item.vehicleNumber} has invalid weight values. Net weight cannot be negative.`,
          );
          return;
        }
      }

      try {
        if (editingReceipt) {
          // Edit mode: update first receipt, create new ones for additional line items
          const firstItem = data.lineItems[0];
          const netWeight = firstItem.filledWeight - firstItem.emptyWeight;
          // Get current material name from material master
          const firstMaterial = materialOptions.find((m) => m.id === firstItem.materialId);
          const currentFirstMaterialName = firstMaterial?.name || firstItem.materialName;

          const receiptData: Omit<
            MaterialReceipt,
            'id' | 'createdAt' | 'updatedAt' | 'organizationId'
          > = {
            date: formatDateOnly(data.date),
            receiptNumber: data.receiptNumber ?? null,
            vehicleNumber: firstItem.vehicleNumber,
            materialId: firstItem.materialId,
            materialName: currentFirstMaterialName, // Use current material master name
            filledWeight: firstItem.filledWeight,
            emptyWeight: firstItem.emptyWeight,
            netWeight,
            quantity: firstItem.quantity,
            vendorId: data.vendorId ?? null,
            vendorName: data.vendorName ?? null,
            linkedPurchaseId: editingReceipt.linkedPurchaseId ?? null,
            siteId: data.siteId,
            siteName: data.siteName,
          };
          await updateReceipt(editingReceipt.id, receiptData);

          // Create new receipts for additional line items
          if (data.lineItems.length > 1) {
            const additionalReceipts = data.lineItems.slice(1).map((item) => {
              const itemNetWeight = item.filledWeight - item.emptyWeight;
              // Get current material name from material master
              const material = materialOptions.find((m) => m.id === item.materialId);
              const currentMaterialName = material?.name || item.materialName;

              return {
                date: formatDateOnly(data.date),
                receiptNumber: data.receiptNumber ?? null,
                vehicleNumber: item.vehicleNumber,
                materialId: item.materialId,
                materialName: currentMaterialName, // Use current material master name
                filledWeight: item.filledWeight,
                emptyWeight: item.emptyWeight,
                netWeight: itemNetWeight,
                quantity: item.quantity,
                vendorId: data.vendorId ?? null,
                vendorName: data.vendorName ?? null,
                linkedPurchaseId: null,
                siteId: data.siteId,
                siteName: data.siteName,
              };
            });

            if (addReceipts) {
              await addReceipts(additionalReceipts);
            } else {
              for (const receiptData of additionalReceipts) {
                await addReceipt(receiptData);
              }
            }
          }

          // Invalidate materials cache to refresh inward quantities
          await mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/materials'),
            undefined,
            { revalidate: true },
          );

          toast.success('Material receipt(s) updated successfully!');
          onSubmit?.(receiptData);
        } else {
          // Create mode: create multiple receipts
          // Ensure we use the current material master name, not the form value
          const receiptsData = data.lineItems.map((item) => {
            const netWeight = item.filledWeight - item.emptyWeight;
            // Get current material name from material master
            const material = materialOptions.find((m) => m.id === item.materialId);
            const currentMaterialName = material?.name || item.materialName;

            return {
              date: formatDateOnly(data.date),
              receiptNumber: data.receiptNumber ?? null,
              vehicleNumber: item.vehicleNumber,
              materialId: item.materialId,
              materialName: currentMaterialName, // Use current material master name
              filledWeight: item.filledWeight,
              emptyWeight: item.emptyWeight,
              netWeight,
              quantity: item.quantity,
              vendorId: data.vendorId ?? null,
              vendorName: data.vendorName ?? null,
              linkedPurchaseId: null,
              siteId: data.siteId,
              siteName: data.siteName,
            };
          });

          if (addReceipts) {
            await addReceipts(receiptsData);
            toast.success(`${receiptsData.length} material receipt(s) recorded successfully!`);
          } else {
            // Fallback: create receipts one by one
            for (const receiptData of receiptsData) {
              await addReceipt(receiptData);
            }
            toast.success(`${receiptsData.length} material receipt(s) recorded successfully!`);
          }

          // Invalidate materials cache to refresh inward quantities
          await mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/materials'),
            undefined,
            { revalidate: true },
          );

          onSubmit?.(receiptsData[0]);
        }
      } catch (error) {
        console.error('Failed to save material receipt', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to save material receipt right now.',
        );
      }
    },
    [addReceipt, addReceipts, editingReceipt, materialOptions, onSubmit, updateReceipt, mutate],
  );

  // Update material names when materials are selected in line items
  // Only update when materialId changes, not on initial load in edit mode
  const lineItemsWatch = form.watch('lineItems');
  const previousMaterialIdsRef = React.useRef<Record<number, string>>({});

  useEffect(() => {
    lineItemsWatch.forEach((item, index) => {
      if (item.materialId) {
        const previousMaterialId = previousMaterialIdsRef.current[index];
        // Only update if materialId actually changed (not on initial load)
        if (previousMaterialId !== item.materialId) {
          const material = materialOptions.find((option) => option.id === item.materialId);
          if (material) {
            form.setValue(`lineItems.${index}.materialName`, material.name, {
              shouldValidate: true,
            });
          }
          previousMaterialIdsRef.current[index] = item.materialId;
        } else if (previousMaterialId === item.materialId) {
          // MaterialId hasn't changed, but verify the name is still correct
          const material = materialOptions.find((option) => option.id === item.materialId);
          if (material && material.name !== item.materialName) {
            // Only update if the material exists and name doesn't match
            form.setValue(`lineItems.${index}.materialName`, material.name, {
              shouldValidate: true,
            });
          }
        }
      } else {
        // Clear previous materialId if current is empty
        delete previousMaterialIdsRef.current[index];
      }
    });
  }, [form, materialOptions, lineItemsWatch]);

  // Initialize previousMaterialIdsRef when form loads in edit mode
  useEffect(() => {
    if (isEditMode && editingReceipt) {
      previousMaterialIdsRef.current[0] = editingReceipt.materialId;
    }
  }, [isEditMode, editingReceipt]);

  // Auto-populate quantity field with net weight when filled and empty weights are entered
  // Only auto-populate when both weights are valid and greater than 0
  // Skip auto-population if any weight is undefined or 0 (user is clearing the field)
  useEffect(() => {
    lineItemsWatch.forEach((item, index) => {
      const filledWeight = item.filledWeight;
      const emptyWeight = item.emptyWeight;
      const currentQuantity = item.quantity;

      // Only auto-populate if both weights are valid positive numbers (not undefined, not 0)
      // Skip if either weight is undefined, 0, or NaN (user is clearing the field)
      if (
        typeof filledWeight === 'number' &&
        typeof emptyWeight === 'number' &&
        !isNaN(filledWeight) &&
        !isNaN(emptyWeight) &&
        filledWeight > 0 &&
        emptyWeight >= 0 // emptyWeight can be 0, but we skip auto-population if it's 0
      ) {
        const netWeight = filledWeight - emptyWeight;

        // Only update if net weight is positive
        if (netWeight > 0) {
          // Don't auto-populate if quantity field is being actively cleared
          const isClearingQuantity = clearingFieldsRef.current.has(`quantity-${index}`);
          if (isClearingQuantity) {
            return;
          }

          // Only auto-update if quantity is undefined, null, or significantly different
          // Skip if quantity is 0 (user might be clearing it)
          // This prevents overwriting user input while still auto-populating empty fields
          if (
            currentQuantity === undefined ||
            currentQuantity === null ||
            isNaN(currentQuantity) ||
            (typeof currentQuantity === 'number' &&
              currentQuantity > 0 &&
              Math.abs(currentQuantity - netWeight) > 0.01) // Only update if significantly different
          ) {
            // Don't auto-populate if quantity is 0 (user is clearing)
            if (currentQuantity !== 0) {
              form.setValue(`lineItems.${index}.quantity`, Number(netWeight.toFixed(2)), {
                shouldValidate: false,
                shouldDirty: true,
              });
            }
          }
        }
      }
    });
  }, [form, lineItemsWatch]);

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

  const addLineItem = () => {
    append({
      vehicleNumber: '',
      materialId: materialOptions.length > 0 ? materialOptions[0].id : '',
      materialName: materialOptions.length > 0 ? materialOptions[0].name : '',
      filledWeight: 0,
      emptyWeight: 0,
      quantity: 0,
    });
    // Site will be synced automatically via useEffect
  };

  const isSubmitDisabled =
    form.formState.isSubmitting ||
    isLoadingMaterials ||
    isLoadingSites ||
    (materialOptions.length === 0 && !isEditMode) ||
    (sites.length === 0 && !isEditMode) ||
    fields.length === 0;

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
            {/* Header Section: Date, Vendor, and Site */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

              <Controller
                name="siteId"
                control={form.control}
                render={({ field, fieldState }) => {
                  const selectedSiteId = field.value;
                  const selectedMaterialId = form.watch('lineItems.0.materialId');
                  const currentOB = selectedSiteId && selectedMaterialId ? lineItemOBs[0] : null;

                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>
                        Site <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === 'unallocated') {
                            form.setValue('siteName', 'Unallocated');
                          } else {
                            const site = sites.find((s) => s.id === value);
                            form.setValue('siteName', site?.name ?? '');
                          }
                        }}
                        disabled={isLoadingSites}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unallocated">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>Unallocated</span>
                            </div>
                          </SelectItem>
                          {sites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>{site.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input type="hidden" {...form.register('siteName')} />
                      {currentOB !== null && currentOB !== undefined && (
                        <span className="text-xs text-muted-foreground mt-1 block">
                          Current OB: {currentOB.toLocaleString()}
                        </span>
                      )}
                      <FieldDescription>Select the site for all line items.</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  );
                }}
              />
            </div>

            {/* Receipt Number Field - Below Site */}
            <Controller
              name="receiptNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-receiptNumber`}>Receipt Number</FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-receiptNumber`}
                    placeholder="Enter receipt number (optional)"
                    value={field.value ?? ''}
                  />
                  <FieldDescription>Unique receipt number for tracking.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Line Items</h3>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const lineItem = form.watch(`lineItems.${index}`);
                  const netWeight =
                    typeof lineItem?.filledWeight === 'number' &&
                    typeof lineItem?.emptyWeight === 'number'
                      ? lineItem.filledWeight - lineItem.emptyWeight
                      : undefined;
                  const selectedMaterial = materialOptions.find(
                    (m) => m.id === lineItem?.materialId,
                  );
                  const materialUnit = selectedMaterial?.unit || '';

                  return (
                    <Card key={field.id} className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Line Item {index + 1}</h4>
                          {!isEditMode && fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {/* Vehicle Number */}
                          <Controller
                            name={`lineItems.${index}.vehicleNumber`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Vehicle Number <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input {...field} placeholder="KA-01-AB-1234" autoComplete="off" />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />

                          {/* Material */}
                          <Controller
                            name={`lineItems.${index}.materialId`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Material <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                  value={field.value ?? ''}
                                  onValueChange={field.onChange}
                                  disabled={isLoadingMaterials || materialOptions.length === 0}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materialOptions.map((material) => (
                                      <SelectItem key={material.id} value={material.id}>
                                        {material.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input
                                  type="hidden"
                                  {...form.register(`lineItems.${index}.materialName`)}
                                />
                                {lineItemOBs[index] !== null &&
                                  lineItemOBs[index] !== undefined && (
                                    <span className="text-xs text-muted-foreground mt-1 block">
                                      Current OB: {lineItemOBs[index]?.toLocaleString()}
                                    </span>
                                  )}
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />

                          {/* Filled Weight */}
                          <Controller
                            name={`lineItems.${index}.filledWeight`}
                            control={form.control}
                            render={({ field, fieldState }) => {
                              const emptyWeight = form.watch(`lineItems.${index}.emptyWeight`);
                              return (
                                <Field data-invalid={fieldState.invalid && fieldState.isTouched}>
                                  <FieldLabel>
                                    Filled Weight <span className="text-destructive">*</span>
                                  </FieldLabel>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter filled weight"
                                    onChange={(event) => {
                                      const rawValue = event.target.value;
                                      const fieldKey = `filledWeight-${index}`;
                                      // Allow empty string - this clears the input visually
                                      if (
                                        rawValue === '' ||
                                        rawValue === null ||
                                        rawValue === undefined
                                      ) {
                                        // Mark as clearing to prevent restoration
                                        clearingFieldsRef.current.add(fieldKey);
                                        // Use field.onChange directly to clear immediately
                                        field.onChange(0);
                                        // Also update form state to ensure it's cleared
                                        form.setValue(`lineItems.${index}.filledWeight`, 0, {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
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
                                        if (numValue > 0) {
                                          // Use field.onChange for immediate update
                                          field.onChange(numValue);

                                          // Auto-update quantity with net weight
                                          if (
                                            typeof emptyWeight === 'number' &&
                                            !isNaN(emptyWeight) &&
                                            emptyWeight >= 0
                                          ) {
                                            const netWeight = numValue - emptyWeight;
                                            if (netWeight > 0) {
                                              form.setValue(
                                                `lineItems.${index}.quantity`,
                                                Number(netWeight.toFixed(2)),
                                                {
                                                  shouldValidate: false,
                                                  shouldDirty: true,
                                                },
                                              );
                                            }
                                          }
                                        } else {
                                          // If 0 or negative, clear the field
                                          field.onChange(0);
                                          form.setValue(`lineItems.${index}.filledWeight`, 0, {
                                            shouldValidate: false,
                                            shouldDirty: true,
                                          });
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // On blur, validate if empty or invalid
                                      const value = e.target.value;
                                      if (value === '' || value === null || value === undefined) {
                                        field.onChange(0);
                                        form.setValue(`lineItems.${index}.filledWeight`, 0, {
                                          shouldValidate: true,
                                        });
                                      }
                                      field.onBlur();
                                    }}
                                    name={field.name}
                                    ref={field.ref}
                                    value={
                                      field.value === undefined ||
                                      field.value === null ||
                                      field.value === 0 ||
                                      (typeof field.value === 'number' && isNaN(field.value))
                                        ? ''
                                        : String(field.value)
                                    }
                                    style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                  />
                                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              );
                            }}
                          />

                          {/* Empty Weight */}
                          <Controller
                            name={`lineItems.${index}.emptyWeight`}
                            control={form.control}
                            render={({ field, fieldState }) => {
                              const filledWeight = form.watch(`lineItems.${index}.filledWeight`);
                              return (
                                <Field data-invalid={fieldState.invalid && fieldState.isTouched}>
                                  <FieldLabel>
                                    Empty Weight <span className="text-destructive">*</span>
                                  </FieldLabel>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter empty weight"
                                    onChange={(event) => {
                                      const rawValue = event.target.value;
                                      const fieldKey = `emptyWeight-${index}`;
                                      // Allow empty string - this clears the input visually
                                      if (
                                        rawValue === '' ||
                                        rawValue === null ||
                                        rawValue === undefined
                                      ) {
                                        // Mark as clearing to prevent restoration
                                        clearingFieldsRef.current.add(fieldKey);
                                        // Use field.onChange directly to clear immediately
                                        field.onChange(0);
                                        // Also update form state to ensure it's cleared
                                        form.setValue(`lineItems.${index}.emptyWeight`, 0, {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                        // Remove from clearing set after a short delay
                                        setTimeout(() => {
                                          clearingFieldsRef.current.delete(fieldKey);
                                        }, 100);
                                        return;
                                      }
                                      // Remove from clearing set when user starts typing
                                      clearingFieldsRef.current.delete(fieldKey);
                                      const numValue = parseFloat(rawValue);
                                      if (!isNaN(numValue) && numValue >= 0) {
                                        // Use field.onChange for immediate update
                                        field.onChange(numValue);

                                        // Auto-update quantity with net weight
                                        if (
                                          typeof filledWeight === 'number' &&
                                          !isNaN(filledWeight) &&
                                          filledWeight > 0
                                        ) {
                                          const netWeight = filledWeight - numValue;
                                          if (netWeight > 0) {
                                            form.setValue(
                                              `lineItems.${index}.quantity`,
                                              Number(netWeight.toFixed(2)),
                                              {
                                                shouldValidate: false,
                                                shouldDirty: true,
                                              },
                                            );
                                          }
                                        }
                                      } else if (numValue < 0) {
                                        // If negative, clear the field
                                        field.onChange(0);
                                        form.setValue(`lineItems.${index}.emptyWeight`, 0, {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                      }
                                    }}
                                    onBlur={(e) => {
                                      // On blur, validate if empty
                                      const value = e.target.value;
                                      if (value === '' || value === null || value === undefined) {
                                        field.onChange(0);
                                        form.setValue(`lineItems.${index}.emptyWeight`, 0, {
                                          shouldValidate: true,
                                        });
                                      }
                                      field.onBlur();
                                    }}
                                    name={field.name}
                                    ref={field.ref}
                                    value={
                                      field.value === undefined ||
                                      field.value === null ||
                                      (typeof field.value === 'number' && isNaN(field.value))
                                        ? ''
                                        : String(field.value)
                                    }
                                    style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                  />
                                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                              );
                            }}
                          />

                          {/* Quantity */}
                          <Controller
                            name={`lineItems.${index}.quantity`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid && fieldState.isTouched}>
                                <FieldLabel>
                                  Quantity <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder={`Enter quantity in ${materialUnit || 'material unit'}`}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;
                                    const fieldKey = `quantity-${index}`;
                                    // Allow empty string - this clears the input visually
                                    if (
                                      rawValue === '' ||
                                      rawValue === null ||
                                      rawValue === undefined
                                    ) {
                                      // Mark as clearing to prevent restoration
                                      clearingFieldsRef.current.add(fieldKey);
                                      // Use field.onChange directly to clear immediately
                                      field.onChange(0);
                                      // Also update form state to ensure it's cleared
                                      form.setValue(`lineItems.${index}.quantity`, 0, {
                                        shouldValidate: false,
                                        shouldDirty: true,
                                      });
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
                                      if (numValue > 0) {
                                        // Use field.onChange for immediate update
                                        field.onChange(numValue);
                                      } else {
                                        // If 0 or negative, clear the field
                                        field.onChange(0);
                                        form.setValue(`lineItems.${index}.quantity`, 0, {
                                          shouldValidate: false,
                                          shouldDirty: true,
                                        });
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // On blur, validate if empty or invalid
                                    const value = e.target.value;
                                    if (value === '' || value === null || value === undefined) {
                                      field.onChange(0);
                                      form.setValue(`lineItems.${index}.quantity`, 0, {
                                        shouldValidate: true,
                                      });
                                    }
                                    field.onBlur();
                                  }}
                                  name={field.name}
                                  ref={field.ref}
                                  value={
                                    field.value === undefined ||
                                    field.value === null ||
                                    field.value === 0 ||
                                    (typeof field.value === 'number' && isNaN(field.value))
                                      ? ''
                                      : String(field.value)
                                  }
                                  style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />
                        </div>

                        {/* Net Weight Display */}
                        {typeof netWeight === 'number' && netWeight >= 0 && (
                          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">
                                Net Weight (Material):
                              </span>
                              <span className="flex items-center gap-1 text-lg font-bold text-primary">
                                <Scale className="h-4 w-4" />
                                {netWeight.toFixed(2)}
                                {materialUnit ? ` ${materialUnit}` : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add Line Item Button - appears after each line item */}
                <div className="flex justify-center pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>
              </div>

              {form.formState.errors.lineItems && (
                <FieldError
                  errors={
                    Array.isArray(form.formState.errors.lineItems)
                      ? form.formState.errors.lineItems
                      : [form.formState.errors.lineItems]
                  }
                />
              )}
            </div>
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
