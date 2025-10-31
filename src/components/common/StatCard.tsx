/**
 * StatCard - Reusable stat card component for displaying metrics
 * Used across Dashboard, Sites, Expenses, and other pages
 */

import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { InfoTooltip } from './InfoTooltip';

import { Card, CardContent } from '@/components/ui/card';


export interface StatCardProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Background color for icon container */
  iconBgColor: string;
  /** Color for icon */
  iconColor: string;
  /** Title/heading for the stat */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Subtitle or additional context */
  subtitle: string;
  /** Accessibility label for tooltip trigger */
  tooltipLabel: string;
  /** Content to show in tooltip */
  tooltipContent: React.ReactNode;
  /** Optional className for card wrapper */
  className?: string;
}

/**
 * StatCard component for displaying metrics with icon and tooltip
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={Building2}
 *   iconBgColor="bg-blue-50"
 *   iconColor="text-blue-600"
 *   title="Active Sites"
 *   value={3}
 *   subtitle="Currently operational"
 *   tooltipLabel="Information about active sites"
 *   tooltipContent={<p>Number of construction sites currently operational</p>}
 * />
 * ```
 */
export function StatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  value,
  subtitle,
  tooltipLabel,
  tooltipContent,
  className,
}: StatCardProps) {
  return (
    <Card
      className={`border-0 shadow-sm hover:shadow-md transition-shadow duration-200 ${className || ''}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${iconBgColor}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
              </div>
            </div>
            <InfoTooltip label={tooltipLabel}>{tooltipContent}</InfoTooltip>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
