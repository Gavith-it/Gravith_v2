'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Truck, Building2, ExternalLink, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
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

const lineItemSchema = z.object({
  vehicleNumber: z
    .string()
    .min(1, 'Vehicle number is required.')
    .regex(/^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/, 'Vehicle number must be in format: KA-01-AB-1234'),
  materialId: z.string().min(1, 'Please select a material.'),
  materialName: z.string().min(1, 'Material name is required.'),
  siteId: z.string().min(1, 'Please select a site.'),
  siteName: z.string().min(1, 'Site name is required.'),
  filledWeight: z.number().positive('Filled weight must be greater than zero.'),
  emptyWeight: z.number().min(0, 'Empty weight cannot be negative.'),
  quantity: z.number().positive('Quantity must be greater than zero.'),
});

const receiptFormSchema = z.object({
  date: z.date(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
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
  const [materialOptions, setMaterialOptions] = useState<MaterialMaster[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState<boolean>(true);
  const [lineItemOBs, setLineItemOBs] = useState<Record<number, number | null>>({});

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      date: parseDateOnly(editingReceipt?.date) || new Date(),
      vendorId: editingReceipt?.vendorId ?? undefined,
      vendorName: editingReceipt?.vendorName ?? undefined,
      lineItems: editingReceipt
        ? [
            {
              vehicleNumber: editingReceipt.vehicleNumber,
              materialId: editingReceipt.materialId,
              materialName: editingReceipt.materialName,
              siteId: editingReceipt.siteId ?? '',
              siteName: editingReceipt.siteName ?? '',
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
              siteId: '',
              siteName: '',
              filledWeight: undefined as any,
              emptyWeight: undefined as any,
              quantity: undefined as any,
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

  // Fetch current OB when material and site are selected for any line item
  const lineItems = form.watch('lineItems');
  useEffect(() => {
    const fetchOBs = async () => {
      const newOBs: Record<number, number | null> = {};
      
      for (let index = 0; index < lineItems.length; index++) {
        const item = lineItems[index];
        if (item.materialId && item.siteId) {
          try {
            const response = await fetch('/api/materials', { cache: 'no-store' });
            const payload = (await response.json().catch(() => ({}))) as {
              materials?: MaterialMaster[];
              error?: string;
            };

            if (response.ok && payload.materials) {
              const material = payload.materials.find((m) => m.id === item.materialId);
              if (item.siteId === 'unallocated') {
                newOBs[index] = material?.openingBalance ?? null;
              } else if (material?.siteAllocations) {
                const allocation = material.siteAllocations.find((a) => a.siteId === item.siteId);
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
  }, [lineItems]);

  // Set default material and site for new line items
  useEffect(() => {
    if (!isEditMode && materialOptions.length > 0 && sites.length > 0) {
      const lineItems = form.getValues('lineItems');
      lineItems.forEach((item, index) => {
        if (!item.materialId && materialOptions.length > 0) {
          const [first] = materialOptions;
          if (first) {
            form.setValue(`lineItems.${index}.materialId`, first.id, { shouldValidate: true });
            form.setValue(`lineItems.${index}.materialName`, first.name, { shouldValidate: true });
          }
        }
        if (!item.siteId && sites.length > 0) {
          const [first] = sites;
          if (first) {
            form.setValue(`lineItems.${index}.siteId`, first.id, { shouldValidate: true });
            form.setValue(`lineItems.${index}.siteName`, first.name, { shouldValidate: true });
          }
        }
      });
    }
  }, [form, isEditMode, materialOptions, sites]);

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
          // Edit mode: update single receipt (first line item only)
          const item = data.lineItems[0];
          const netWeight = item.filledWeight - item.emptyWeight;
          const receiptData: Omit<
            MaterialReceipt,
            'id' | 'createdAt' | 'updatedAt' | 'organizationId'
          > = {
            date: formatDateOnly(data.date),
            vehicleNumber: item.vehicleNumber,
            materialId: item.materialId,
            materialName: item.materialName,
            filledWeight: item.filledWeight,
            emptyWeight: item.emptyWeight,
            netWeight,
            quantity: item.quantity,
            vendorId: data.vendorId ?? null,
            vendorName: data.vendorName ?? null,
            linkedPurchaseId: editingReceipt.linkedPurchaseId ?? null,
            siteId: item.siteId,
            siteName: item.siteName,
          };
          await updateReceipt(editingReceipt.id, receiptData);
          toast.success('Material receipt updated successfully!');
          onSubmit?.(receiptData);
        } else {
          // Create mode: create multiple receipts
          const receiptsData = data.lineItems.map((item) => {
            const netWeight = item.filledWeight - item.emptyWeight;
            return {
              date: formatDateOnly(data.date),
              vehicleNumber: item.vehicleNumber,
              materialId: item.materialId,
              materialName: item.materialName,
              filledWeight: item.filledWeight,
              emptyWeight: item.emptyWeight,
              netWeight,
              quantity: item.quantity,
              vendorId: data.vendorId ?? null,
              vendorName: data.vendorName ?? null,
              linkedPurchaseId: null,
              siteId: item.siteId,
              siteName: item.siteName,
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

          onSubmit?.(receiptsData[0]);
        }
      } catch (error) {
        console.error('Failed to save material receipt', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to save material receipt right now.',
        );
      }
    },
    [addReceipt, addReceipts, editingReceipt, onSubmit, updateReceipt],
  );

  // Update material names when materials are selected in line items
  const lineItemsWatch = form.watch('lineItems');
  useEffect(() => {
    lineItemsWatch.forEach((item, index) => {
      if (item.materialId) {
        const material = materialOptions.find((option) => option.id === item.materialId);
        if (material && material.name !== item.materialName) {
          form.setValue(`lineItems.${index}.materialName`, material.name, { shouldValidate: true });
        }
      }
    });
  }, [form, materialOptions, lineItemsWatch]);

  // Auto-populate quantity field with net weight when filled and empty weights are entered
  useEffect(() => {
    lineItemsWatch.forEach((item, index) => {
      const filledWeight = item.filledWeight;
      const emptyWeight = item.emptyWeight;
      const currentQuantity = item.quantity;
      
      // Check if both weights are valid numbers
      if (
        typeof filledWeight === 'number' &&
        typeof emptyWeight === 'number' &&
        !isNaN(filledWeight) &&
        !isNaN(emptyWeight) &&
        filledWeight > 0 &&
        emptyWeight >= 0
      ) {
        const netWeight = filledWeight - emptyWeight;
        
        // Only update if net weight is positive and quantity is empty or different
        if (netWeight > 0) {
          // Update if quantity is undefined, null, or doesn't match net weight
          if (
            currentQuantity === undefined ||
            currentQuantity === null ||
            isNaN(currentQuantity) ||
            Math.abs(currentQuantity - netWeight) > 0.01 // Allow small floating point differences
          ) {
            form.setValue(`lineItems.${index}.quantity`, Number(netWeight.toFixed(2)), {
              shouldValidate: false,
              shouldDirty: true,
            });
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
      siteId: sites.length > 0 ? sites[0].id : '',
      siteName: sites.length > 0 ? sites[0].name : '',
      filledWeight: undefined as any,
      emptyWeight: undefined as any,
      quantity: undefined as any,
    });
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
            {/* Header Section: Date and Vendor */}
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

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Line Items</h3>
                {!isEditMode && (
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                )}
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
                                <Input
                                  {...field}
                                  placeholder="KA-01-AB-1234"
                                  autoComplete="off"
                                />
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
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                              </Field>
                            )}
                          />

                          {/* Site */}
                          <Controller
                            name={`lineItems.${index}.siteId`}
                            control={form.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Site <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                  value={field.value ?? ''}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === 'unallocated') {
                                      form.setValue(`lineItems.${index}.siteName`, 'Unallocated');
                                    } else {
                                      const site = sites.find((s) => s.id === value);
                                      form.setValue(`lineItems.${index}.siteName`, site?.name ?? '');
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
                                <input
                                  type="hidden"
                                  {...form.register(`lineItems.${index}.siteName`)}
                                />
                                {lineItemOBs[index] !== null && lineItemOBs[index] !== undefined && (
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
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>
                                    Filled Weight (kg) <span className="text-destructive">*</span>
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter filled weight"
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      const numValue = value === '' ? undefined : Number(value);
                                      field.onChange(numValue);
                                      
                                      // Auto-update quantity with net weight
                                      if (numValue !== undefined && typeof emptyWeight === 'number' && !isNaN(emptyWeight)) {
                                        const netWeight = numValue - emptyWeight;
                                        if (netWeight > 0) {
                                          form.setValue(`lineItems.${index}.quantity`, Number(netWeight.toFixed(2)), {
                                            shouldValidate: false,
                                          });
                                        }
                                      }
                                    }}
                                    value={field.value === 0 || field.value === undefined ? '' : field.value}
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
                                <Field data-invalid={fieldState.invalid}>
                                  <FieldLabel>
                                    Empty Weight (kg) <span className="text-destructive">*</span>
                                  </FieldLabel>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter empty weight"
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      const numValue = value === '' ? undefined : Number(value);
                                      field.onChange(numValue);
                                      
                                      // Auto-update quantity with net weight
                                      if (numValue !== undefined && typeof filledWeight === 'number' && !isNaN(filledWeight)) {
                                        const netWeight = filledWeight - numValue;
                                        if (netWeight > 0) {
                                          form.setValue(`lineItems.${index}.quantity`, Number(netWeight.toFixed(2)), {
                                            shouldValidate: false,
                                          });
                                        }
                                      }
                                    }}
                                    value={field.value === 0 || field.value === undefined ? '' : field.value}
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
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>
                                  Quantity ({materialUnit || 'UOM'}){' '}
                                  <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder={`Enter quantity in ${materialUnit || 'material unit'}`}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    field.onChange(value === '' ? undefined : Number(value));
                                  }}
                                  value={field.value === 0 || field.value === undefined ? '' : field.value}
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
                                {netWeight.toFixed(2)} kg
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {form.formState.errors.lineItems && (
                <FieldError errors={Array.isArray(form.formState.errors.lineItems) ? form.formState.errors.lineItems : [form.formState.errors.lineItems]} />
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
