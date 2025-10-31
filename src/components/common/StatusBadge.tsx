/**
 * StatusBadge - Standardized status badge component
 * Provides consistent status display with color coding and icons
 */

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';

/**
 * Common status types and their configurations
 */
export type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface StatusConfig {
  variant: StatusBadgeVariant;
  dotColor: string;
  label: string;
  icon?: LucideIcon;
}

/**
 * Status badge configurations for common status types
 */
const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // Generic statuses
  active: { variant: 'default', dotColor: 'bg-green-500', label: 'Active', icon: CheckCircle2 },
  inactive: { variant: 'secondary', dotColor: 'bg-gray-500', label: 'Inactive' },
  completed: {
    variant: 'default',
    dotColor: 'bg-green-500',
    label: 'Completed',
    icon: CheckCircle2,
  },
  pending: { variant: 'secondary', dotColor: 'bg-orange-500', label: 'Pending', icon: Clock },
  overdue: {
    variant: 'destructive',
    dotColor: 'bg-red-500',
    label: 'Overdue',
    icon: AlertTriangle,
  },

  // Financial statuses
  paid: { variant: 'default', dotColor: 'bg-green-500', label: 'Paid', icon: CheckCircle2 },
  unpaid: { variant: 'secondary', dotColor: 'bg-orange-500', label: 'Unpaid', icon: Clock },

  // Work statuses
  'in-progress': { variant: 'default', dotColor: 'bg-blue-500', label: 'In Progress', icon: Clock },
  'not-started': { variant: 'secondary', dotColor: 'bg-gray-500', label: 'Not Started' },
  delayed: {
    variant: 'destructive',
    dotColor: 'bg-red-500',
    label: 'Delayed',
    icon: AlertTriangle,
  },
  ahead: { variant: 'default', dotColor: 'bg-green-500', label: 'Ahead', icon: CheckCircle2 },
  'on-track': {
    variant: 'default',
    dotColor: 'bg-green-500',
    label: 'On Track',
    icon: CheckCircle2,
  },
  stopped: {
    variant: 'secondary',
    dotColor: 'bg-orange-500',
    label: 'Stopped',
    icon: AlertTriangle,
  },
  canceled: { variant: 'destructive', dotColor: 'bg-red-500', label: 'Canceled', icon: XCircle },

  // Equipment/Vehicle statuses
  maintenance: {
    variant: 'secondary',
    dotColor: 'bg-yellow-500',
    label: 'Maintenance',
    icon: AlertTriangle,
  },
  idle: { variant: 'secondary', dotColor: 'bg-gray-500', label: 'Idle' },
  returned: { variant: 'default', dotColor: 'bg-blue-500', label: 'Returned' },
  blocked: { variant: 'destructive', dotColor: 'bg-red-500', label: 'Blocked', icon: XCircle },

  // Site statuses
  available: { variant: 'default', dotColor: 'bg-green-500', label: 'Available' },
  'in-use': { variant: 'default', dotColor: 'bg-blue-500', label: 'In Use' },

  // Milestone statuses
  achieved: { variant: 'default', dotColor: 'bg-green-500', label: 'Achieved', icon: CheckCircle2 },

  // Critical/Priority
  critical: {
    variant: 'destructive',
    dotColor: 'bg-red-500',
    label: 'Critical',
    icon: AlertTriangle,
  },
  high: { variant: 'destructive', dotColor: 'bg-orange-500', label: 'High', icon: AlertTriangle },
  medium: { variant: 'secondary', dotColor: 'bg-blue-500', label: 'Medium' },
  low: { variant: 'secondary', dotColor: 'bg-gray-500', label: 'Low' },
};

export interface StatusBadgeProps {
  /** Status value to display */
  status: string;
  /** Optional custom config to override defaults */
  config?: StatusConfig;
  /** Optional className for additional styling */
  className?: string;
  /** Show icon alongside status */
  showIcon?: boolean;
  /** Additional CSS classes */
  variant?: StatusBadgeVariant;
}

/**
 * StatusBadge component for displaying status with color coding
 *
 * @example
 * ```tsx
 * <StatusBadge status="active" />
 * <StatusBadge status="pending" showIcon />
 * <StatusBadge
 *   status="custom-status"
 *   config={{ variant: 'default', dotColor: 'bg-purple-500', label: 'Custom' }}
 * />
 * ```
 */
export function StatusBadge({ status, config, className, showIcon = true }: StatusBadgeProps) {
  const statusConfig = config ||
    STATUS_CONFIGS[status.toLowerCase()] || {
      variant: 'secondary',
      dotColor: 'bg-gray-500',
      label: status,
    };

  const IconComponent = showIcon && statusConfig.icon ? statusConfig.icon : null;

  return (
    <Badge
      variant={statusConfig.variant}
      className={`text-xs flex items-center gap-1.5 w-fit whitespace-nowrap ${className || ''}`}
    >
      <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusConfig.dotColor}`} />
      {IconComponent && <IconComponent className="h-3 w-3" />}
      {statusConfig.label}
    </Badge>
  );
}

/**
 * Helper function to get status configuration
 */
export function getStatusConfig(status: string): StatusConfig | undefined {
  return STATUS_CONFIGS[status.toLowerCase()];
}
