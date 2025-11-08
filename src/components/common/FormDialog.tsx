'use client';

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FormDialogProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  description?: string;
  maxWidth?: string;
  trigger?: React.ReactNode;
}

const makeResponsiveMaxWidth = (maxWidth?: string) => {
  if (!maxWidth) return undefined;

  return maxWidth
    .split(' ')
    .map((cls) => {
      const trimmed = cls.trim();
      if (!trimmed) return trimmed;

      if (trimmed.includes(':')) {
        return trimmed;
      }

      if (trimmed.startsWith('max-w')) {
        return `sm:${trimmed}`;
      }

      return trimmed;
    })
    .filter(Boolean)
    .join(' ');
};

export function FormDialog({
  title,
  isOpen,
  onOpenChange,
  children,
  description,
  maxWidth = 'max-w-3xl',
  trigger,
}: FormDialogProps) {
  const responsiveMaxWidth = makeResponsiveMaxWidth(maxWidth);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          'w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full',
          responsiveMaxWidth,
          'p-0 px-4 sm:px-6 py-4 sm:py-6 max-h-[82vh] overflow-hidden',
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? undefined : 'sr-only'}>
            {description ?? 'Provide the requested information and submit the form.'}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
