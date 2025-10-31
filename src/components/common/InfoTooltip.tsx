/**
 * InfoTooltip - Wrapper for displaying info tooltips with icon
 * Provides accessible information tooltips throughout the application
 */

import { Info } from 'lucide-react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface InfoTooltipProps {
  /** Accessibility label for the tooltip trigger */
  label: string;
  /** Content to display in the tooltip */
  children: React.ReactNode;
}

/**
 * InfoTooltip component with info icon trigger
 *
 * @example
 * ```tsx
 * <InfoTooltip label="Information about this feature">
 *   <p>This shows helpful information to the user</p>
 * </InfoTooltip>
 * ```
 */
export function InfoTooltip({ label, children }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info
            className="h-4 w-4 text-muted-foreground cursor-help hover:text-foreground transition-colors"
            aria-label={label}
          />
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">{children}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
