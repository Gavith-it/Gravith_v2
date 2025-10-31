/**
 * EmptyState - Component for displaying empty states
 * Used when there's no data to display in tables, lists, or sections
 */

import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface EmptyStateProps {
  /** Icon to display in empty state */
  icon: LucideIcon;
  /** Heading text */
  heading: string;
  /** Description text */
  description: string;
  /** Action button configuration */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Optional additional content */
  children?: React.ReactNode;
  /** Optional className for card wrapper */
  className?: string;
}

/**
 * EmptyState component for displaying "no data" states
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Package}
 *   heading="No Materials Found"
 *   description="Start by adding your first material to manage inventory."
 *   action={{
 *     label: "Add Material",
 *     onClick: handleAdd,
 *     icon: Plus
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  heading,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Card className={`w-full ${className || ''}`}>
      <CardContent className="p-6 md:p-12">
        <div className="flex flex-col items-center justify-center">
          <Icon className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium mb-2">{heading}</h3>
          <p className="text-muted-foreground text-center mb-6">{description}</p>
          {action && (
            <Button onClick={action.onClick} className="gap-2 transition-all hover:shadow-md">
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
