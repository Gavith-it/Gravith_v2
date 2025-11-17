'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { MaterialMasterInput } from '@/types/materials';
import { getActiveUOMs, type UOMItem } from '@/components/shared/masterData';

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
  })
  .refine((data) => data.consumedQuantity <= data.quantity, {
    message: 'Consumed quantity cannot exceed available quantity.',
    path: ['consumedQuantity'],
  });

type MaterialMasterFormData = z.infer<typeof materialMasterFormSchema>;

export default function MaterialMasterForm({
  onSubmit,
  onCancel,
  defaultValues,
  isEdit = false,
}: MaterialMasterFormProps) {
  const formId = isEdit ? 'material-master-edit-form' : 'material-master-new-form';
  const [isClient, setIsClient] = React.useState(false);
  const [uomOptions] = React.useState<UOMItem[]>(getActiveUOMs());

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
    },
  });

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Update form values when defaultValues change in edit mode
  React.useEffect(() => {
    if (isEdit && defaultValues) {
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
      });
    }
  }, [defaultValues, isEdit, form]);

  async function handleFormSubmit(data: MaterialMasterFormData) {
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="border-t">
        <Field orientation="horizontal" className="justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={form.formState.isSubmitting}>
            {getSubmitButtonText()}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
