'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
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
import { Textarea } from '@/components/ui/textarea';

interface Site {
  id: string;
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  budget: number;
  spent: number;
  description: string;
  progress: number;
}

interface SiteFormProps {
  mode: 'new' | 'edit';
  site?: Site;
  onSubmit: (siteData: Omit<Site, 'id' | 'spent' | 'progress'>) => void;
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
      startDate: site?.startDate ? new Date(site.startDate) : undefined,
      expectedEndDate: site?.expectedEndDate ? new Date(site.expectedEndDate) : undefined,
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

  function handleFormSubmit(data: SiteFormData) {
    // Transform the data to match the expected Site interface
    const siteData: Omit<Site, 'id' | 'spent' | 'progress'> = {
      name: data.name,
      location: data.location,
      startDate: data.startDate.toISOString().split('T')[0],
      expectedEndDate: data.expectedEndDate.toISOString().split('T')[0],
      status: data.status,
      budget: data.budget,
      description: data.description || '',
    };

    onSubmit(siteData);

    // Show appropriate success message
    if (isEditMode) {
      toast.success('Site updated successfully!', {
        description: `${data.name} has been updated.`,
      });
    } else {
      toast.success('Site created successfully!', {
        description: `${data.name} has been added to your sites.`,
      });
    }
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
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-budget`}>
                      Total Budget (₹) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id={`${formId}-budget`}
                      type="number"
                      aria-invalid={fieldState.invalid}
                      placeholder="50000000"
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      value={field.value ?? ''}
                      style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <FieldDescription>Total allocated budget for this project.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
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
