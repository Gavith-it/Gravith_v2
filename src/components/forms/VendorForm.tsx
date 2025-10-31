'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

// Validation schema with Indian-specific patterns
const vendorFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Vendor name must be at least 2 characters.')
    .max(100, 'Vendor name must be at most 100 characters.'),
  contactPerson: z
    .string()
    .min(2, 'Contact person name must be at least 2 characters.')
    .max(100, 'Contact person name must be at most 100 characters.'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits.')
    .regex(/^[\d\s\+\-\(\)]+$/, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email address.').optional().or(z.literal('')),
  address: z
    .string()
    .min(10, 'Address must be at least 10 characters.')
    .max(500, 'Address must be at most 500 characters.'),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Enter a valid GST number (e.g., 27ABCDE1234F1Z5).',
    )
    .optional()
    .or(z.literal('')),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Enter a valid PAN number (e.g., ABCDE1234F).')
    .optional()
    .or(z.literal('')),
  bankName: z
    .string()
    .max(100, 'Bank name must be at most 100 characters.')
    .optional()
    .or(z.literal('')),
  bankBranch: z
    .string()
    .max(100, 'Bank branch must be at most 100 characters.')
    .optional()
    .or(z.literal('')),
  accountName: z
    .string()
    .max(100, 'Account name must be at most 100 characters.')
    .optional()
    .or(z.literal('')),
  bankAccountNumber: z
    .string()
    .regex(/^[0-9]{9,18}$/, 'Bank account number must be 9-18 digits.')
    .optional()
    .or(z.literal('')),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter a valid IFSC code (e.g., SBIN0001234).')
    .optional()
    .or(z.literal('')),
  paymentTerms: z
    .string()
    .max(200, 'Payment terms must be at most 200 characters.')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters.')
    .optional()
    .or(z.literal('')),
});

export type VendorFormData = z.infer<typeof vendorFormSchema>;

interface VendorNewFormProps {
  onSubmit: (data: VendorFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VendorFormData>;
}

export default function VendorNewForm({ onSubmit, onCancel, initialData }: VendorNewFormProps) {
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      contactPerson: initialData?.contactPerson || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      gstNumber: initialData?.gstNumber || '',
      panNumber: initialData?.panNumber || '',
      bankName: initialData?.bankName || '',
      bankBranch: initialData?.bankBranch || '',
      accountName: initialData?.accountName || '',
      bankAccountNumber: initialData?.bankAccountNumber || '',
      ifscCode: initialData?.ifscCode || '',
      paymentTerms: initialData?.paymentTerms || '',
      notes: initialData?.notes || '',
    },
  });

  // Reset form when initialData changes (switching between add/edit modes)
  useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      contactPerson: initialData?.contactPerson || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      gstNumber: initialData?.gstNumber || '',
      panNumber: initialData?.panNumber || '',
      bankName: initialData?.bankName || '',
      bankBranch: initialData?.bankBranch || '',
      accountName: initialData?.accountName || '',
      bankAccountNumber: initialData?.bankAccountNumber || '',
      ifscCode: initialData?.ifscCode || '',
      paymentTerms: initialData?.paymentTerms || '',
      notes: initialData?.notes || '',
    });
  }, [initialData, form]);

  const handleFormSubmit = (data: VendorFormData) => {
    onSubmit(data);
  };

  return (
    <form
      id="vendor-form"
      onSubmit={form.handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-6"
    >
      {/* Scrollable form fields container */}
      <ScrollArea className="h-[500px] -mx-6 px-6">
        <div className="pr-4">
          <FieldGroup className="space-y-6 py-1">
            {/* Basic Information */}
            <FieldSet>
              <FieldLegend>Basic Information</FieldLegend>
              <FieldGroup className="space-y-4">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-name">
                        Vendor Name <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        {...field}
                        id="vendor-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="ABC Construction Materials"
                        autoComplete="organization"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Controller
                    name="contactPerson"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-contact-person">
                          Contact Person <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="vendor-contact-person"
                          aria-invalid={fieldState.invalid}
                          placeholder="John Doe"
                          autoComplete="name"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-phone">
                          Phone <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          {...field}
                          id="vendor-phone"
                          type="tel"
                          aria-invalid={fieldState.invalid}
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="vendor-email"
                        type="email"
                        aria-invalid={fieldState.invalid}
                        placeholder="contact@abcconstruction.com"
                        autoComplete="email"
                      />
                      <FieldDescription>
                        Optional: Vendor&apos;s primary email address.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-address">
                        Address <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Textarea
                        {...field}
                        id="vendor-address"
                        aria-invalid={fieldState.invalid}
                        placeholder="123 Industrial Area, Mumbai, Maharashtra 400001"
                        rows={3}
                        className="resize-none"
                        autoComplete="street-address"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            {/* Tax Information */}
            <FieldSet>
              <FieldLegend>Tax Information</FieldLegend>
              <FieldGroup className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Controller
                    name="gstNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-gst">GST Number</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-gst"
                          aria-invalid={fieldState.invalid}
                          placeholder="27ABCDE1234F1Z5"
                          className="uppercase"
                        />
                        <FieldDescription>15-character GST identification number.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="panNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-pan">PAN Number</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-pan"
                          aria-invalid={fieldState.invalid}
                          placeholder="ABCDE1234F"
                          className="uppercase"
                        />
                        <FieldDescription>10-character PAN number.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            {/* Bank Details */}
            <FieldSet>
              <FieldLegend>Bank Details</FieldLegend>
              <FieldGroup className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Controller
                    name="bankName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-bank-name">Bank Name</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-bank-name"
                          aria-invalid={fieldState.invalid}
                          placeholder="State Bank of India"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="bankBranch"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-bank-branch">Bank Branch</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-bank-branch"
                          aria-invalid={fieldState.invalid}
                          placeholder="Mumbai Main Branch"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name="accountName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-account-name">Account Name</FieldLabel>
                      <Input
                        {...field}
                        id="vendor-account-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="ABC Construction Materials Pvt Ltd"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <Controller
                    name="bankAccountNumber"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-account-number">Bank Account Number</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-account-number"
                          type="text"
                          inputMode="numeric"
                          aria-invalid={fieldState.invalid}
                          placeholder="1234567890123456"
                        />
                        <FieldDescription>9-18 digit account number.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="ifscCode"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="vendor-ifsc">IFSC Code</FieldLabel>
                        <Input
                          {...field}
                          id="vendor-ifsc"
                          aria-invalid={fieldState.invalid}
                          placeholder="SBIN0001234"
                          className="uppercase"
                        />
                        <FieldDescription>11-character IFSC code.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </FieldSet>

            {/* Additional Information */}
            <FieldSet>
              <FieldLegend>Additional Information</FieldLegend>
              <FieldGroup className="space-y-4">
                <Controller
                  name="paymentTerms"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-payment-terms">Payment Terms</FieldLabel>
                      <Input
                        {...field}
                        id="vendor-payment-terms"
                        aria-invalid={fieldState.invalid}
                        placeholder="Net 30 days"
                      />
                      <FieldDescription>e.g., Net 30 days, Due on receipt, etc.</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="vendor-notes">Notes</FieldLabel>
                      <Textarea
                        {...field}
                        id="vendor-notes"
                        aria-invalid={fieldState.invalid}
                        placeholder="Additional notes about the vendor..."
                        rows={4}
                        className="resize-none"
                      />
                      <FieldDescription>
                        Any additional information or special instructions.
                      </FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </div>
      </ScrollArea>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={form.formState.isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" form="vendor-form" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : initialData ? 'Update Vendor' : 'Add Vendor'}
        </Button>
      </div>
    </form>
  );
}
