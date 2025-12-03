'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, X } from 'lucide-react';
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
import { useMaterialReceipts, useMaterials, useVendors } from '@/lib/contexts';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';
import type { MaterialMaster } from '@/types/entities';

interface PurchaseFormProps {
  selectedSite?: string;
  editingMaterial?: SharedMaterial | null;
  onSubmit?: (materialData: Omit<SharedMaterial, 'id'>) => void;
  onCancel?: () => void;
}

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

// Material categories matching MaterialMaster type
const materialCategories = [
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
] as const;

type MaterialCategory = (typeof materialCategories)[number];

// Form schema with Zod validation
const purchaseFormSchema = z.object({
  materialId: z.string().optional(),
  vendor: z.string().min(1, 'Please select a vendor.'),
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  purchaseDate: z.date(),
  receiptNumber: z.string().optional(),
  linkedReceiptIds: z.array(z.string()).min(1, 'Please select at least one material receipt.'),
  receiptUnitRates: z
    .record(z.string(), z.number().positive('Unit rate must be greater than zero.'))
    .optional(),
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
  const { addMaterial, updateMaterial, materials } = useMaterials();
  const { receipts, linkReceiptToPurchase } = useMaterialReceipts();
  const { vendors, isLoading: isVendorsLoading } = useVendors();
  const isEditMode = !!editingMaterial;
  const formId = isEditMode ? 'purchase-edit-form' : 'purchase-new-form';
  const [isClient, setIsClient] = React.useState(false);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      materialId: editingMaterial?.materialId || undefined,
      vendor: editingMaterial?.vendor || '',
      invoiceNumber: editingMaterial?.invoiceNumber || '',
      purchaseDate: parseDateOnly(editingMaterial?.purchaseDate),
      receiptNumber: undefined,
      linkedReceiptIds: editingMaterial?.linkedReceiptId ? [editingMaterial.linkedReceiptId] : [],
      receiptUnitRates: {},
      filledWeight: editingMaterial?.filledWeight,
      emptyWeight: editingMaterial?.emptyWeight,
      netWeight: editingMaterial?.netWeight,
      weightUnit: editingMaterial?.weightUnit,
    },
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Material options loading removed - users now type material names freely

  // Get selected vendor
  const selectedVendor = form.watch('vendor');
  const linkedReceiptIds = form.watch('linkedReceiptIds') || [];

  // Get receipts filtered by selected vendor (include linked receipts in edit mode)
  const unlinkedReceipts = React.useMemo(() => {
    if (!selectedVendor) {
      return [];
    }
    return receipts.filter((receipt) => {
      // Match by vendor name or vendor ID
      const matchesVendor =
        receipt.vendorName === selectedVendor ||
        vendors.find((v) => v.name === selectedVendor)?.id === receipt.vendorId;
      // In edit mode, show linked receipts too; otherwise only show unlinked
      const isLinked = receipt.linkedPurchaseId && receipt.linkedPurchaseId !== editingMaterial?.id;
      const isCurrentlyLinked = linkedReceiptIds.includes(receipt.id);
      return matchesVendor && (!isLinked || isCurrentlyLinked);
    });
  }, [receipts, selectedVendor, vendors, editingMaterial?.id, linkedReceiptIds]);

  const vendorOptions = useMemo(() => vendors, [vendors]);

  // Get unique receipt numbers from receipts filtered by selected vendor
  const receiptNumberOptions = useMemo(() => {
    if (!selectedVendor) {
      return [];
    }

    // Filter receipts by selected vendor (same logic as unlinkedReceipts)
    const vendorReceipts = receipts.filter((receipt) => {
      const matchesVendor =
        receipt.vendorName === selectedVendor ||
        vendors.find((v) => v.name === selectedVendor)?.id === receipt.vendorId;
      return matchesVendor;
    });

    // Extract unique receipt numbers from vendor's receipts
    const receiptNumbers = vendorReceipts
      .map((r) => r.receiptNumber)
      .filter((rn): rn is string => Boolean(rn && rn.trim() !== ''));

    // Remove duplicates and sort
    return Array.from(new Set(receiptNumbers)).sort();
  }, [receipts, selectedVendor, vendors]);

  // Clear receipt number when vendor changes (if current receipt number doesn't belong to new vendor)
  React.useEffect(() => {
    const currentReceiptNumber = form.getValues('receiptNumber');
    if (currentReceiptNumber && selectedVendor) {
      // Check if current receipt number belongs to selected vendor
      const belongsToVendor = receipts.some((receipt) => {
        const matchesVendor =
          receipt.vendorName === selectedVendor ||
          vendors.find((v) => v.name === selectedVendor)?.id === receipt.vendorId;
        return matchesVendor && receipt.receiptNumber === currentReceiptNumber;
      });

      // If receipt number doesn't belong to new vendor, clear it
      if (!belongsToVendor) {
        form.setValue('receiptNumber', undefined);
      }
    } else if (!selectedVendor) {
      // Clear receipt number if no vendor is selected
      form.setValue('receiptNumber', undefined);
    }
  }, [selectedVendor, receipts, vendors, form]);

  const computeMasterTotalsFromSnapshot = React.useCallback(
    (materialId: string, snapshot: SharedMaterial[]) => {
      const related = snapshot.filter((item) => item.materialId === materialId);
      return related.reduce(
        (acc, item) => {
          const ordered = item.quantity ?? 0;
          const consumed =
            item.consumedQuantity ?? Math.max(0, ordered - (item.remainingQuantity ?? ordered));
          const remaining = item.remainingQuantity ?? Math.max(0, ordered - consumed);
          return {
            consumed: acc.consumed + consumed,
            remaining: acc.remaining + remaining,
          };
        },
        { consumed: 0, remaining: 0 },
      );
    },
    [],
  );

  const syncMaterialMaster = React.useCallback(
    async (materialId: string, snapshot: SharedMaterial[]) => {
      if (!materialId) return;
      const totals = computeMasterTotalsFromSnapshot(materialId, snapshot);
      try {
        await fetch(`/api/materials/${materialId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: Math.max(0, totals.remaining),
            consumedQuantity: Math.max(0, totals.consumed),
          }),
        });
      } catch (error) {
        console.error('Failed to sync material master totals', error);
      }
    },
    [computeMasterTotalsFromSnapshot],
  );

  // Format date helper - memoized to prevent recreating on every render
  const formatDate = React.useCallback((dateStr: string) => {
    const parsed = parseDateOnly(dateStr);
    if (!parsed) return dateStr;
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const handleFormSubmit = React.useCallback(
    async (data: PurchaseFormData) => {
      // Get material info from selected receipts
      const selectedReceiptIds = data.linkedReceiptIds || [];
      const selectedReceipts = receipts.filter((r) => selectedReceiptIds.includes(r.id));

      if (selectedReceiptIds.length === 0) {
        toast.error('Please select at least one material receipt.');
        return;
      }

      // Validate unit rates before processing
      const receiptUnitRates = data.receiptUnitRates || {};
      for (const receipt of selectedReceipts) {
        const unitRate = receiptUnitRates[receipt.id];
        if (!unitRate || unitRate <= 0) {
          toast.error(
            `Please enter a valid unit rate for receipt ${receipt.receiptNumber || receipt.vehicleNumber}`,
          );
          return;
        }
      }

      // Aggregate quantities and calculate total amount from receipts
      let totalQuantity = 0;
      let totalAmount = 0;

      for (const receipt of selectedReceipts) {
        const unitRate = receiptUnitRates[receipt.id] || 0;
        totalQuantity += receipt.quantity;
        totalAmount += receipt.quantity * unitRate;
      }

      // Use first receipt's material info as primary
      const firstReceipt = selectedReceipts[0];
      if (!firstReceipt) {
        toast.error('No receipts selected.');
        return;
      }

      // Determine site name: use selectedSite prop if available, otherwise use receipt's site name
      // If neither is available, show an error
      const siteName = selectedSite || firstReceipt.siteName;
      if (!siteName || siteName.trim() === '') {
        toast.error(
          'Site information is required. Please ensure the receipt has a site assigned or select a site.',
        );
        return;
      }

      const previousConsumed = editingMaterial?.consumedQuantity ?? 0;
      const quantityValue = totalQuantity;

      // Calculate average unit rate
      const averageUnitRate = totalQuantity > 0 ? totalAmount / totalQuantity : 0;
      if (averageUnitRate <= 0) {
        toast.error('Invalid unit rate. Please check the entered rates.');
        return;
      }

      const materialData: Omit<SharedMaterial, 'id'> = {
        materialId: firstReceipt.materialId,
        materialName: firstReceipt.materialName,
        site: siteName.trim(),
        quantity: totalQuantity,
        unit: 'kg', // Default unit from receipts
        unitRate: averageUnitRate,
        costPerUnit: averageUnitRate,
        totalAmount,
        vendor: data.vendor,
        invoiceNumber: data.invoiceNumber,
        purchaseDate: formatDateOnly(data.purchaseDate),
        receiptNumber: data.receiptNumber || undefined,
        addedBy: 'Current User',
        consumedQuantity: previousConsumed,
        remainingQuantity: editingMaterial?.remainingQuantity ?? quantityValue - previousConsumed,
        linkedReceiptId: selectedReceiptIds[0],
        category: 'Other', // Default category
        filledWeight: data.filledWeight ? Number(data.filledWeight) : undefined,
        emptyWeight: data.emptyWeight ? Number(data.emptyWeight) : undefined,
        netWeight: data.netWeight ? Number(data.netWeight) : undefined,
        weightUnit: data.weightUnit || undefined,
      };

      try {
        let purchaseId = editingMaterial?.id ?? '';
        let latestPurchase: SharedMaterial | null | undefined = undefined;
        if (editingMaterial) {
          const updated = await updateMaterial(editingMaterial.id, materialData);
          purchaseId = updated?.id ?? purchaseId;
          latestPurchase = updated ?? editingMaterial;
          toast.success('Purchase updated successfully!', {
            description: `${materialData.materialName} has been updated.`,
          });
        } else {
          const created = await addMaterial(materialData);
          purchaseId = created?.id ?? '';
          latestPurchase = created ?? null;
          toast.success('Purchase recorded successfully!', {
            description: `${materialData.materialName} has been added to inventory.`,
          });
        }

        if (latestPurchase?.materialId) {
          const baseSnapshot = editingMaterial
            ? materials.filter((item) => item.id !== editingMaterial.id)
            : materials.slice();
          const snapshot = latestPurchase ? [...baseSnapshot, latestPurchase] : baseSnapshot;
          await syncMaterialMaster(latestPurchase.materialId, snapshot);
        }

        if (data.linkedReceiptIds && data.linkedReceiptIds.length > 0 && purchaseId) {
          let linkedCount = 0;
          for (const receiptId of data.linkedReceiptIds) {
             
            const success = await linkReceiptToPurchase(receiptId, purchaseId);
            if (success) {
              linkedCount++;
            }
          }
          if (linkedCount > 0) {
            toast.success(`Linked ${linkedCount} receipt${linkedCount > 1 ? 's' : ''} to purchase`);
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
      materials,
      syncMaterialMaster,
      updateMaterial,
      onSubmit,
      receipts,
      selectedSite,
    ],
  );

  const receiptUnitRates = form.watch('receiptUnitRates') || {};

  // Calculate total amount from selected receipts
  const totalAmount = React.useMemo(() => {
    const selectedReceipts = receipts.filter((r) => linkedReceiptIds.includes(r.id));
    return selectedReceipts.reduce((sum, receipt) => {
      const rate = receiptUnitRates[receipt.id] || 0;
      return sum + receipt.quantity * rate;
    }, 0);
  }, [linkedReceiptIds, receiptUnitRates, receipts]);
  const isSubmitDisabled = form.formState.isSubmitting;

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
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form
          id={formId}
          onSubmit={form.handleSubmit(handleFormSubmit)}
          aria-labelledby="purchase-form-heading"
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
                    <SelectTrigger
                      id={`${formId}-vendor`}
                      aria-invalid={fieldState.invalid}
                      className="max-w-md"
                    >
                      <SelectValue
                        placeholder={
                          isVendorsLoading
                            ? 'Loading vendors…'
                            : vendorOptions.length === 0
                              ? 'No vendors available'
                              : 'Select vendor'
                        }
                      >
                        {field.value && field.value.length > 30
                          ? `${field.value.substring(0, 30)}...`
                          : field.value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {isVendorsLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Loading vendors…
                        </div>
                      ) : vendorOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No vendors found. Add vendors first.
                        </div>
                      ) : (
                        vendorOptions.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.name}
                            className="max-w-md truncate"
                          >
                            <span className="truncate block">{vendor.name}</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Select vendor to view their material receipts.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

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

            {/* Receipt Number Field */}
            <Controller
              name="receiptNumber"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-receipt-number`}>Receipt Number</FieldLabel>
                  <div className="flex gap-2">
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger
                        id={`${formId}-receipt-number`}
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                      >
                        <SelectValue placeholder="Select receipt number (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {!selectedVendor ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Please select a vendor first
                          </div>
                        ) : receiptNumberOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No receipt numbers available for {selectedVendor}
                          </div>
                        ) : (
                          receiptNumberOptions.map((receiptNum) => (
                            <SelectItem key={receiptNum} value={receiptNum}>
                              {receiptNum}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => field.onChange(undefined)}
                        aria-label="Clear receipt number"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear receipt number</span>
                      </Button>
                    )}
                  </div>
                  <FieldDescription>
                    {selectedVendor
                      ? `Select a receipt number from material receipts for ${selectedVendor} (optional). Click the × button to clear the selection.`
                      : 'Select a vendor first to see available receipt numbers (optional).'}
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Link Material Receipts (Optional) */}
            <Controller
              name="linkedReceiptIds"
              control={form.control}
              render={({ field, fieldState }) => {
                const selectedIds = field.value || [];

                return (
                  <FieldSet data-invalid={fieldState.invalid}>
                    <FieldLegend>
                      Link Material Receipts <span className="text-destructive">*</span>
                    </FieldLegend>
                    <FieldDescription className="mb-3">
                      Select one or more material receipts to link with this purchase. Click on rows
                      to select. Enter unit rate for each receipt.
                    </FieldDescription>

                    {!selectedVendor ? (
                      <div className="rounded-md border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          Please select a vendor first to view receipts
                        </p>
                      </div>
                    ) : unlinkedReceipts.length === 0 ? (
                      <div className="rounded-md border border-dashed p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No unlinked receipts available for this vendor
                        </p>
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
                                <TableHead className="text-right">Unit Rate (₹)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {unlinkedReceipts.map((receipt) => {
                                const isSelected = selectedIds.includes(receipt.id);
                                const receiptUnitRates = form.watch('receiptUnitRates') || {};
                                const currentRate = receiptUnitRates[receipt.id] || '';

                                const handleRowClick = () => {
                                  const currentIds = Array.isArray(field.value) ? field.value : [];

                                  if (currentIds.includes(receipt.id)) {
                                    field.onChange(currentIds.filter((id) => id !== receipt.id));
                                    // Remove unit rate when deselected
                                    const newRates = { ...receiptUnitRates };
                                    delete newRates[receipt.id];
                                    form.setValue('receiptUnitRates', newRates);
                                  } else {
                                    field.onChange([...currentIds, receipt.id]);
                                  }
                                };

                                const handleUnitRateChange = (
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                  e.stopPropagation();
                                  const value = e.target.value;
                                  const numValue = value === '' ? undefined : Number(value);
                                  const newRates: Record<string, number> = {
                                    ...receiptUnitRates,
                                  };
                                  if (numValue !== undefined) {
                                    newRates[receipt.id] = numValue;
                                  } else {
                                    delete newRates[receipt.id];
                                  }
                                  form.setValue('receiptUnitRates', newRates);
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
                                            // Remove unit rate when deselected
                                            const newRates = { ...receiptUnitRates };
                                            delete newRates[receipt.id];
                                            form.setValue('receiptUnitRates', newRates);
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
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Rate"
                                        value={
                                          currentRate === '' || currentRate === undefined
                                            ? ''
                                            : currentRate
                                        }
                                        onChange={handleUnitRateChange}
                                        className="w-24 text-right"
                                        disabled={!isSelected}
                                        style={{
                                          appearance: 'textfield',
                                          MozAppearance: 'textfield',
                                        }}
                                      />
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
                    ₹{totalAmount.toLocaleString()}
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
            <ShoppingCart className="h-4 w-4 mr-2" />
            {getSubmitButtonText()}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
