'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign, ShoppingCart } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
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
import type { SharedMaterial } from '@/lib/contexts';
import { useMaterialReceipts, useMaterials } from '@/lib/contexts';
import type { MaterialMaster } from '@/types/entities';

interface PurchaseFormProps {
  selectedSite?: string;
  editingMaterial?: SharedMaterial | null;
  onSubmit?: (materialData: Omit<SharedMaterial, 'id'>) => void;
  onCancel?: () => void;
}

// Available sites
const sites = [
  'Rajiv Nagar Residential Complex',
  'Green Valley Commercial Center',
  'Sunshine Apartments Phase II',
  'Metro Heights Tower A',
  'Oakwood Villas',
];

// Available vendors
const availableVendors = [
  {
    name: 'UltraTech Cement Ltd',
    contactPerson: 'Rajesh Kumar',
    category: 'Cement & Binding Materials',
  },
  {
    name: 'JSW Steel',
    contactPerson: 'Anita Sharma',
    category: 'Steel & Metal Works',
  },
  {
    name: 'ACC Concrete',
    contactPerson: 'Mohan Das',
    category: 'Concrete & Ready Mix',
  },
];

// Available units
const units = [
  { value: 'bags', label: 'Bags' },
  { value: 'nos', label: 'Numbers' },
  { value: 'cum', label: 'Cubic Meter' },
  { value: 'sqm', label: 'Square Meter' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'tons', label: 'Tons' },
  { value: 'liter', label: 'Liters' },
  { value: 'meter', label: 'Meters' },
  { value: 'cft', label: 'Cubic Feet' },
];

// Form schema with Zod validation
const purchaseFormSchema = z.object({
  materialId: z.string().optional(),
  vendor: z.string().min(1, 'Please select a vendor.'),
  site: z.string().min(1, 'Please select a site.'),
  materialName: z.string().min(1, 'Please select a material.'),
  quantity: z.number().positive('Quantity must be greater than zero.'),
  unit: z.string().min(1, 'Please select a unit.'),
  unitRate: z.number().positive('Unit rate must be greater than zero.'),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  purchaseDate: z.date(),
  linkedReceiptIds: z.array(z.string()).optional(),
  filledWeight: z.number().optional(),
  emptyWeight: z.number().optional(),
  netWeight: z.number().optional(),
  weightUnit: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export function PurchaseForm({
  selectedSite,
  editingMaterial,
  onSubmit,
  onCancel,
}: PurchaseFormProps) {
  const { addMaterial, updateMaterial } = useMaterials();
  const { receipts, linkReceiptToPurchase } = useMaterialReceipts();
  const isEditMode = !!editingMaterial;
  const formId = isEditMode ? 'purchase-edit-form' : 'purchase-new-form';
  const [isClient, setIsClient] = React.useState(false);
  const [materialOptions, setMaterialOptions] = useState<MaterialMaster[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      materialId: editingMaterial?.materialId || undefined,
      vendor: editingMaterial?.vendor || '',
      site: selectedSite || editingMaterial?.site || '',
      materialName: editingMaterial?.materialName || '',
      quantity: editingMaterial?.quantity || undefined,
      unit: editingMaterial?.unit || '',
      unitRate: editingMaterial?.unitRate || undefined,
      invoiceNumber: editingMaterial?.invoiceNumber || '',
      purchaseDate: editingMaterial?.purchaseDate
        ? new Date(editingMaterial.purchaseDate)
        : undefined,
      linkedReceiptIds: editingMaterial?.linkedReceiptId ? [editingMaterial.linkedReceiptId] : [],
      filledWeight: editingMaterial?.filledWeight,
      emptyWeight: editingMaterial?.emptyWeight,
      netWeight: editingMaterial?.netWeight,
      weightUnit: editingMaterial?.weightUnit,
    },
  });

  React.useEffect(() => {
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
        console.error('Failed to load materials', error);
        toast.error('Failed to load materials list.');
        setMaterialOptions([]);
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    void loadMaterials();
  }, []);

  useEffect(() => {
    if (!materialOptions.length) {
      form.setValue('materialId', undefined);
      form.setValue('materialName', '');
      return;
    }

    const currentId = form.getValues('materialId');
    const currentMaterial = currentId
      ? materialOptions.find((material) => material.id === currentId)
      : undefined;

    if (currentMaterial) {
      form.setValue('materialName', currentMaterial.name, { shouldValidate: true });
      if (!editingMaterial) {
        form.setValue('unit', currentMaterial.unit, { shouldValidate: true });
      }
      return;
    }

    if (!editingMaterial) {
      const [first] = materialOptions;
      form.setValue('materialId', first.id, { shouldValidate: true });
      form.setValue('materialName', first.name, { shouldValidate: true });
      form.setValue('unit', first.unit, { shouldValidate: true });
    }
  }, [editingMaterial, form, materialOptions]);

  // Get unlinked receipts directly from receipts array
  const unlinkedReceipts = React.useMemo(() => {
    return receipts.filter((receipt) => !receipt.linkedPurchaseId);
  }, [receipts]);

  // Format date helper - memoized to prevent recreating on every render
  const formatDate = React.useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const handleFormSubmit = React.useCallback(
    async (data: PurchaseFormData) => {
      const totalAmount = data.quantity * data.unitRate;
      const selectedMaterial = materialOptions.find((material) => material.id === data.materialId);

      const materialData: Omit<SharedMaterial, 'id'> = {
        materialId: data.materialId,
        materialName: selectedMaterial?.name ?? data.materialName,
        site: data.site,
        quantity: data.quantity,
        unit: data.unit,
        unitRate: data.unitRate,
        costPerUnit: data.unitRate,
        totalAmount,
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        purchaseDate: data.purchaseDate.toISOString().split('T')[0],
        addedBy: 'Current User',
        consumedQuantity: editingMaterial?.consumedQuantity ?? 0,
        remainingQuantity: editingMaterial?.remainingQuantity ?? data.quantity,
        linkedReceiptId: data.linkedReceiptIds?.[0],
        category: selectedMaterial?.category,
        filledWeight: data.filledWeight ? Number(data.filledWeight) : undefined,
        emptyWeight: data.emptyWeight ? Number(data.emptyWeight) : undefined,
        netWeight: data.netWeight ? Number(data.netWeight) : undefined,
        weightUnit: data.weightUnit || undefined,
      };

      try {
        let purchaseId = editingMaterial?.id ?? '';
        if (editingMaterial) {
          const updated = await updateMaterial(editingMaterial.id, materialData);
          purchaseId = updated?.id ?? purchaseId;
          toast.success('Purchase updated successfully!', {
            description: `${materialData.materialName} has been updated.`,
          });
        } else {
          const created = await addMaterial(materialData);
          purchaseId = created?.id ?? '';
          toast.success('Purchase recorded successfully!', {
            description: `${materialData.materialName} has been added to inventory.`,
          });
        }

        if (data.linkedReceiptIds && data.linkedReceiptIds.length > 0 && purchaseId) {
          let linkedCount = 0;
          for (const receiptId of data.linkedReceiptIds) {
            // eslint-disable-next-line no-await-in-loop
            const success = await linkReceiptToPurchase(receiptId, purchaseId);
            if (success) {
              linkedCount++;
            }
          }
          if (linkedCount > 0) {
            toast.success(
              `Linked ${linkedCount} receipt${linkedCount > 1 ? 's' : ''} to purchase`,
            );
          }
        }

        onSubmit?.(materialData);
      } catch (error) {
        console.error('Failed to save purchase', error);
        toast.error(
          error instanceof Error ? error.message : 'Unable to save purchase. Please try again.',
        );
      }
    },
    [
      addMaterial,
      editingMaterial,
      linkReceiptToPurchase,
      materialOptions,
      updateMaterial,
      onSubmit,
    ],
  );

  const quantity = form.watch('quantity');
  const unitRate = form.watch('unitRate');
  const totalAmount = quantity && unitRate ? quantity * unitRate : 0;
  const isSubmitDisabled =
    form.formState.isSubmitting ||
    isLoadingMaterials ||
    (materialOptions.length === 0 && !editingMaterial);

  const getSubmitButtonText = () =>
    form.formState.isSubmitting
      ? isEditMode
        ? 'Updating Purchase...'
        : 'Recording Purchase...'
      : isEditMode
        ? 'Update Purchase'
        : 'Record Purchase';

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
    <form
      id={formId}
      onSubmit={form.handleSubmit(handleFormSubmit)}
      aria-labelledby="purchase-form-heading"
      className="w-full"
    >
      <FieldGroup>
        {/* Vendor Row */}
        <Controller
          name="vendor"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-vendor`}>
                Vendor <span className="text-destructive">*</span>
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`${formId}-vendor`} aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {availableVendors.map((vendor) => (
                    <SelectItem key={vendor.name} value={vendor.name}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>Supplier of the material.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Site and Material Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="site"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-site`}>
                  Site <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!selectedSite}
                >
                  <SelectTrigger
                    id={`${formId}-site`}
                    aria-invalid={fieldState.invalid}
                    className={selectedSite ? 'bg-muted' : ''}
                  >
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site} value={site}>
                        {site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Delivery destination for this material.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

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
                  onValueChange={(value) => {
                    field.onChange(value);
                    const material = materialOptions.find((option) => option.id === value);
                    if (material) {
                      form.setValue('materialName', material.name, { shouldValidate: true });
                      form.setValue('unit', material.unit, { shouldValidate: true });
                    } else {
                      form.setValue('materialName', '', { shouldValidate: true });
                    }
                  }}
                  disabled={isLoadingMaterials || materialOptions.length === 0}
                >
                  <SelectTrigger id={`${formId}-material`} aria-invalid={fieldState.invalid}>
                    <SelectValue
                      placeholder={
                        isLoadingMaterials
                          ? 'Loading materials…'
                          : materialOptions.length === 0
                            ? 'No materials available'
                            : 'Select material'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {materialOptions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No active materials found. Add materials first.
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
                  {materialOptions.length === 0
                    ? 'Add a material in Materials before recording purchases.'
                    : 'Choose the material being purchased.'}
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                {form.formState.errors.materialName && (
                  <FieldError errors={[form.formState.errors.materialName]} />
                )}
              </Field>
            )}
          />
          {/* Hidden field to satisfy validation for materialName */}
          <input type="hidden" {...form.register('materialName')} />
        </div>

        {/* Quantity, Unit, and Unit Rate Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Controller
            name="quantity"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-quantity`}>
                  Quantity <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-quantity`}
                  type="number"
                  step="0.01"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter quantity"
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                  value={field.value ?? ''}
                />
                <FieldDescription>Total quantity purchased.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

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
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>Unit of measurement.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="unitRate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-unit-rate`}>
                  Unit Rate (₹) <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-unit-rate`}
                  type="number"
                  step="0.01"
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter rate"
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? undefined : Number(value));
                  }}
                  value={field.value ?? ''}
                />
                <FieldDescription>Price per unit.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Invoice and Purchase Date Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="invoiceNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-invoice`}>
                  Invoice Number <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-invoice`}
                  aria-invalid={fieldState.invalid}
                  placeholder="Enter invoice number"
                  autoComplete="off"
                />
                <FieldDescription>Vendor invoice reference number.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="purchaseDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-purchase-date`}>
                  Purchase Date <span className="text-destructive">*</span>
                </FieldLabel>
                <DatePicker
                  date={field.value}
                  onSelect={(date) => field.onChange(date)}
                  placeholder="Select purchase date"
                  showClear={!isEditMode}
                  ariaLabel="Purchase date"
                />
                <FieldDescription>Date of material purchase.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* Link Material Receipts (Optional) */}
        <Controller
          name="linkedReceiptIds"
          control={form.control}
          render={({ field, fieldState }) => {
            const selectedIds = field.value || [];

            return (
              <FieldSet data-invalid={fieldState.invalid}>
                <FieldLegend>Link Material Receipts (Optional)</FieldLegend>
                <FieldDescription className="mb-3">
                  Select one or more material receipts to link with this purchase. Click on rows to
                  select.
                </FieldDescription>

                {unlinkedReceipts.length === 0 ? (
                  <div className="rounded-md border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">No unlinked receipts available</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <span className="sr-only">Select</span>
                            </TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Vehicle Number</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Net Weight (kg)</TableHead>
                            <TableHead className="text-right">Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unlinkedReceipts.map((receipt) => {
                            const isSelected = selectedIds.includes(receipt.id);

                            const handleRowClick = () => {
                              const currentIds = Array.isArray(field.value) ? field.value : [];

                              if (currentIds.includes(receipt.id)) {
                                field.onChange(currentIds.filter((id) => id !== receipt.id));
                              } else {
                                field.onChange([...currentIds, receipt.id]);
                              }
                            };

                            return (
                              <TableRow
                                key={receipt.id}
                                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                                onClick={handleRowClick}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleRowClick();
                                  }
                                }}
                                aria-label={`${isSelected ? 'Deselect' : 'Select'} receipt ${receipt.vehicleNumber}`}
                              >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const currentIds = Array.isArray(field.value)
                                        ? field.value
                                        : [];

                                      if (checked) {
                                        field.onChange([...currentIds, receipt.id]);
                                      } else {
                                        field.onChange(
                                          currentIds.filter((id) => id !== receipt.id),
                                        );
                                      }
                                    }}
                                    aria-label={`Select receipt ${receipt.vehicleNumber}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  {formatDate(receipt.date)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono">
                                    {receipt.vehicleNumber}
                                  </Badge>
                                </TableCell>
                                <TableCell>{receipt.materialName}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {receipt.netWeight.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {formatDate(receipt.createdAt)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {selectedIds.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1">
                          {selectedIds.length} receipt(s) selected
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange([])}
                          className="h-7 text-xs"
                        >
                          Clear selection
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldSet>
            );
          }}
        />

        {/* Total Amount Display */}
        {totalAmount > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Amount:</span>
              <span className="flex items-center gap-1 text-lg font-bold text-primary">
                <DollarSign className="h-4 w-4" />₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </FieldGroup>
      <div className="flex justify-end gap-2 border-t pt-6 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          aria-label="Cancel and close form"
          disabled={form.formState.isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={isSubmitDisabled}
          aria-label={getSubmitButtonText()}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {getSubmitButtonText()}
        </Button>
      </div>
    </form>
  );
}
