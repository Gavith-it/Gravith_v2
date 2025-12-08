'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { formatDateOnly, parseDateOnly } from '@/lib/utils/date';
import type { Site, SiteInput } from '@/types/sites';

interface SiteFormProps {
  mode: 'new' | 'edit';
  site?: Site;
  onSubmit: (siteData: SiteInput) => Promise<void>;
  onCancel: () => void;
}

// Form schema with Zod validation
const siteFormSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Site name must be at least 3 characters.')
      .max(100, 'Site name must be at most 100 characters.'),
    location: z
      .string()
      .min(3, 'Location must be at least 3 characters.')
      .max(200, 'Location must be at most 200 characters.'),
    startDate: z.date(),
    expectedEndDate: z.date(),
    budget: z
      .number()
      .positive('Budget must be greater than zero.')
      .min(1000, 'Budget must be at least ₹1,000.')
      .max(100000000000, 'Budget cannot exceed ₹100 billion.'),
    status: z.enum(['Active', 'Stopped', 'Completed', 'Canceled']),
    description: z.string().max(500, 'Description must be at most 500 characters.').optional(),
  })
  .refine((data) => data.expectedEndDate > data.startDate, {
    message: 'Expected end date must be after the start date.',
    path: ['expectedEndDate'],
  });

type SiteFormData = z.infer<typeof siteFormSchema>;

// Budget input component that handles string display and number conversion
interface BudgetInputFieldProps {
  field: {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    onBlur: () => void;
  };
  fieldState: {
    invalid: boolean;
  };
  formId: string;
}

function BudgetInputField({ field, fieldState, formId }: BudgetInputFieldProps) {
  // Keep value as string for input, convert to number on blur
  const [displayValue, setDisplayValue] = React.useState<string>(() => {
    return field.value?.toString() ?? '';
  });
  const isUserTypingRef = React.useRef<boolean>(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Only sync with field value when it's clearly an external change (form reset)
  // Not when user is typing - this prevents numbers from reappearing
  React.useEffect(() => {
    // Skip sync if user is currently typing
    if (isUserTypingRef.current) {
      return;
    }

    const fieldValueStr = field.value?.toString() ?? '';
    const currentDisplayStr = displayValue;

    // Only sync if field value is different from what we're displaying
    // This indicates an external change (form reset, initial load, etc.)
    if (fieldValueStr !== currentDisplayStr) {
      setDisplayValue(fieldValueStr);
    }
  }, [field.value, displayValue]);

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={`${formId}-budget`}>
        Total Budget (₹) <span className="text-destructive">*</span>
      </FieldLabel>
      <Input
        ref={inputRef}
        id={`${formId}-budget`}
        type="text"
        inputMode="numeric"
        aria-invalid={fieldState.invalid}
        placeholder="50000000"
        value={displayValue}
        onChange={(e) => {
          const value = e.target.value;
          // Allow empty string and valid numbers only (integers for budget)
          // Pattern: allows digits only, no decimals for budget
          if (value === '' || /^\d+$/.test(value)) {
            // Mark that user is typing
            isUserTypingRef.current = true;

            // Update display immediately - user has full control
            setDisplayValue(value);

            // Convert to number only if value is not empty
            if (value === '') {
              field.onChange(undefined);
            } else {
              const numValue = Number(value);
              // Only update if it's a valid number
              if (!isNaN(numValue) && numValue > 0) {
                field.onChange(numValue);
              }
            }

            // Reset typing flag after a short delay to allow sync on external changes
            setTimeout(() => {
              isUserTypingRef.current = false;
            }, 100);
          }
        }}
        onBlur={(e) => {
          // Mark that user is no longer typing
          isUserTypingRef.current = false;

          // On blur, ensure the value is properly formatted
          const value = e.target.value.trim();
          if (value === '') {
            setDisplayValue('');
            field.onChange(undefined);
          } else {
            const numValue = Number(value);
            if (!isNaN(numValue) && numValue > 0) {
              const formattedValue = numValue.toString();
              setDisplayValue(formattedValue);
              field.onChange(numValue);
            }
            // If invalid, keep what user typed - validation will show error
          }
          field.onBlur();
        }}
        style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
      />
      <FieldDescription>Total allocated budget for this project.</FieldDescription>
      {fieldState.invalid && (
        <FieldError>Please enter a valid budget amount (minimum ₹1,000).</FieldError>
      )}
    </Field>
  );
}

export default function SiteForm({ mode, site, onSubmit, onCancel }: SiteFormProps) {
  const isEditMode = mode === 'edit';
  const formId = isEditMode ? 'site-edit-form' : 'site-new-form';
  const [isClient, setIsClient] = React.useState(false);

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: site?.name || '',
      location: site?.location || '',
      status: site?.status || 'Active',
      description: site?.description || '',
      startDate: parseDateOnly(site?.startDate),
      expectedEndDate: parseDateOnly(site?.expectedEndDate),
      budget: undefined, // Start with undefined to avoid hydration mismatch
    },
  });

  React.useEffect(() => {
    setIsClient(true);
    // Set the budget value only on the client side
    if (site?.budget) {
      form.setValue('budget', site.budget);
    }
  }, [site, form]);

  // Update form values when site data changes in edit mode
  React.useEffect(() => {
    if (isEditMode && site) {
      form.reset({
        name: site.name,
        location: site.location,
        status: site.status,
        description: site.description,
        startDate: new Date(site.startDate),
        expectedEndDate: new Date(site.expectedEndDate),
        budget: site.budget,
      });
    }
  }, [site, isEditMode, form]);

  async function handleFormSubmit(data: SiteFormData) {
    const siteData: SiteInput = {
      name: data.name,
      location: data.location,
      startDate: formatDateOnly(data.startDate),
      expectedEndDate: formatDateOnly(data.expectedEndDate),
      status: data.status,
      budget: data.budget,
      description: data.description || '',
    };

    await onSubmit(siteData);
  }

  const getSubmitButtonText = () =>
    form.formState.isSubmitting
      ? isEditMode
        ? 'Updating Site...'
        : 'Adding Site...'
      : isEditMode
        ? 'Update Site'
        : 'Add Site';

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
            {/* Site Name and Location Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-name`}>
                      Site Name <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-name`}
                      aria-invalid={fieldState.invalid}
                      placeholder="Residential Complex A"
                      autoComplete="off"
                    />
                    <FieldDescription>Enter the name of the construction site.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-location`}>
                      Location <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-location`}
                      aria-invalid={fieldState.invalid}
                      placeholder="Sector 15, Navi Mumbai"
                      autoComplete="off"
                    />
                    <FieldDescription>Provide the complete address of the site.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Start Date and End Date Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-start-date`}>
                      Start Date <span className="text-destructive">*</span>
                    </FieldLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={(date) => field.onChange(date)}
                      placeholder="Select start date"
                      showClear={!isEditMode}
                      ariaLabel="Site start date"
                    />
                    <FieldDescription>When does construction begin?</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="expectedEndDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-end-date`}>
                      Expected End Date <span className="text-destructive">*</span>
                    </FieldLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={(date) => field.onChange(date)}
                      placeholder="Select expected end date"
                      minDate={form.watch('startDate')}
                      showClear={!isEditMode}
                      ariaLabel="Site expected end date"
                    />
                    <FieldDescription>Estimated project completion date.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Budget and Status Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Controller
                name="budget"
                control={form.control}
                render={({ field, fieldState }) => (
                  <BudgetInputField field={field} fieldState={fieldState} formId={formId} />
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-status`}>
                      Status <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id={`${formId}-status`} aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Stopped">Stopped</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Current status of the construction site.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {/* Description Field */}
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-description`}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={`${formId}-description`}
                    aria-invalid={fieldState.invalid}
                    placeholder="Premium residential complex with 200 units"
                    rows={3}
                  />
                  <FieldDescription>
                    Additional details about the project (optional, max 500 characters).
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
