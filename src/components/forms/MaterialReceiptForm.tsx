'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Scale, Truck } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { getActiveMaterials } from '../shared/materialMasterData';


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
import type { MaterialReceipt } from '@/types';

interface MaterialReceiptFormProps {
  editingReceipt?: MaterialReceipt | null;
  onSubmit?: (receiptData: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

// Form schema with Zod validation
const receiptFormSchema = z.object({
  date: z.date(),
  vehicleNumber: z
    .string()
    .min(1, 'Vehicle number is required.')
    .regex(/^[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}$/, 'Vehicle number must be in format: KA-01-AB-1234'),
  materialId: z.string().min(1, 'Please select a material.'),
  materialName: z.string().min(1, 'Material name is required.'),
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
  const { vendors } = useVendors();
  const isEditMode = !!editingReceipt;
  const formId = isEditMode ? 'receipt-edit-form' : 'receipt-new-form';
  const [isClient, setIsClient] = React.useState(false);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      date: editingReceipt?.date ? new Date(editingReceipt.date) : undefined,
      vehicleNumber: editingReceipt?.vehicleNumber || '',
      materialId: editingReceipt?.materialId || '',
      materialName: editingReceipt?.materialName || '',
      vendorId: editingReceipt?.vendorId || '',
      vendorName: editingReceipt?.vendorName || '',
      filledWeight: editingReceipt?.filledWeight || undefined,
      emptyWeight: editingReceipt?.emptyWeight || undefined,
    },
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  function handleFormSubmit(data: ReceiptFormData) {
    const netWeight = data.filledWeight - data.emptyWeight;

    const receiptData: Omit<MaterialReceipt, 'id' | 'createdAt' | 'updatedAt'> = {
      date: data.date.toISOString().split('T')[0],
      vehicleNumber: data.vehicleNumber,
      materialId: data.materialId,
      materialName: data.materialName,
      filledWeight: data.filledWeight,
      emptyWeight: data.emptyWeight,
      netWeight,
      vendorId: data.vendorId,
      vendorName: data.vendorName,
      linkedPurchaseId: editingReceipt?.linkedPurchaseId,
      organizationId: 'org-1', // TODO: Get from auth context
    };

    if (editingReceipt) {
      updateReceipt(editingReceipt.id, receiptData);
      toast.success('Material receipt updated successfully!', {
        description: `Receipt for ${data.materialName} has been updated.`,
      });
    } else {
      addReceipt(receiptData);
      toast.success('Material receipt recorded successfully!', {
        description: `Receipt for ${data.materialName} has been added.`,
      });
    }

    onSubmit?.(receiptData);
  }

  // Watch material selection to auto-fill material name
  const selectedMaterialId = form.watch('materialId');
  React.useEffect(() => {
    if (selectedMaterialId && !isEditMode) {
      const material = getActiveMaterials().find((m) => m.id === selectedMaterialId);
      if (material) {
        form.setValue('materialName', material.name);
      }
    }
  }, [selectedMaterialId, form, isEditMode]);

  // Watch vendor selection to auto-fill vendor name
  const selectedVendorId = form.watch('vendorId');
  React.useEffect(() => {
    if (selectedVendorId && !isEditMode) {
      const vendor = vendors.find((v) => v.id === selectedVendorId);
      if (vendor) {
        form.setValue('vendorName', vendor.name);
      }
    }
  }, [selectedVendorId, vendors, form, isEditMode]);

  const filledWeight = form.watch('filledWeight');
  const emptyWeight = form.watch('emptyWeight');
  const netWeight =
    filledWeight && emptyWeight !== undefined ? filledWeight - emptyWeight : undefined;

  const getSubmitButtonText = () =>
    form.formState.isSubmitting
      ? isEditMode
        ? 'Updating Receipt...'
        : 'Recording Receipt...'
      : isEditMode
        ? 'Update Receipt'
        : 'Record Receipt';

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
        <form id={formId} onSubmit={form.handleSubmit(handleFormSubmit)}>
          <FieldGroup>
            {/* Date and Vehicle Number Row */}
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
                    <FieldDescription>e.g., KA-01-AB-1234.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Material and Vendor Selection Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="materialId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-material`}>
                      Material <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${formId}-material`} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {getActiveMaterials().map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Choose the material received.</FieldDescription>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${formId}-vendor`} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select vendor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors
                          .filter((v) => v.status === 'active')
                          .map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Choose the vendor (optional).</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Weight Measurements Row */}
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
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                    />
                    <FieldDescription>Weight of vehicle with material.</FieldDescription>
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
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                    />
                    <FieldDescription>Weight of empty vehicle.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Net Weight Display */}
            {netWeight !== undefined && netWeight >= 0 && (
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={form.formState.isSubmitting}>
            <Truck className="h-4 w-4 mr-2" />
            {getSubmitButtonText()}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
