'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import type { FieldError as RHFFieldError } from 'react-hook-form';

import { cn } from './utils';

/**
 * Field
 * A flexible field component for building forms with proper accessibility.
 */
const fieldVariants = cva('grid gap-2', {
  variants: {
    orientation: {
      vertical: 'grid-flow-row',
      horizontal: 'grid-flow-col auto-cols-fr items-center gap-4',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
});

interface FieldProps extends React.ComponentProps<'div'>, VariantProps<typeof fieldVariants> {}

function Field({ className, orientation, ...props }: FieldProps) {
  return (
    <div data-slot="field" className={cn(fieldVariants({ orientation }), className)} {...props} />
  );
}

/**
 * FieldGroup
 * Groups multiple fields together.
 */
function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-group" className={cn('grid gap-4', className)} {...props} />;
}

/**
 * FieldSet
 * A semantic fieldset for grouping related fields.
 */
function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn('grid gap-4 rounded-lg border p-4', className)}
      {...props}
    />
  );
}

/**
 * FieldLegend
 * Legend for a fieldset.
 */
const fieldLegendVariants = cva('font-medium', {
  variants: {
    variant: {
      default: 'text-base',
      label: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface FieldLegendProps
  extends React.ComponentProps<'legend'>,
    VariantProps<typeof fieldLegendVariants> {}

function FieldLegend({ className, variant, ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      className={cn(fieldLegendVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * FieldLabel
 * Label for a field input.
 */
function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}

/**
 * FieldDescription
 * Helper text for a field.
 */
function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

/**
 * FieldError
 * Displays validation errors.
 */
interface FieldErrorProps extends React.ComponentProps<'p'> {
  errors?: (RHFFieldError | undefined)[];
}

function FieldError({ className, errors, children, ...props }: FieldErrorProps) {
  const errorMessages = errors?.filter(Boolean).map((error) => error?.message);
  const body = errorMessages && errorMessages.length > 0 ? errorMessages[0] : children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="field-error"
      className={cn('text-destructive text-sm font-medium', className)}
      role="alert"
      {...props}
    >
      {body}
    </p>
  );
}

/**
 * FieldContent
 * Container for field content (useful for complex layouts).
 */
function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-content" className={cn('grid gap-2', className)} {...props} />;
}

export {
  Field,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldContent,
  type FieldProps,
  type FieldLegendProps,
  type FieldErrorProps,
};
