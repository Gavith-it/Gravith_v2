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
          'p-0',
        )}
      >
        <div className="flex max-h-[90vh] sm:max-h-[82vh] flex-col overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b bg-background">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className={description ? undefined : 'sr-only'}>
              {description ?? 'Provide the requested information and submit the form.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
