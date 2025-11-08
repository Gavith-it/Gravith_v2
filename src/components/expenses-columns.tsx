'use client';

import {
  MoreHorizontal,
  Users,
  Package,
  Wrench,
  Truck,
  Zap,
  Building2,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import type { Expense } from '@/types';

// Utility function to get category icon
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'labour':
    case 'labor':
      return Users;
    case 'materials':
      return Package;
    case 'equipment':
      return Wrench;
    case 'transport':
    case 'transportation':
      return Truck;
    case 'utilities':
      return Zap;
    default:
      return Building2;
  }
};

interface ExpenseColumnHandlers {
  onView: (expense: Expense) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export const getExpenseColumns = ({ onView, onEdit, onDelete }: ExpenseColumnHandlers) => [
  {
    key: 'category',
    label: 'Category & Description',
    sortable: true,
    minWidth: 'min-w-[280px]',
    render: (expense: Expense) => {
      const CategoryIcon = getCategoryIcon(expense.category);
      return (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 bg-primary/10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary">
              <CategoryIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{expense.category}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{expense.description}</div>
          </div>
        </div>
      );
    },
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    minWidth: 'min-w-[120px]',
    align: 'right' as const,
    render: (expense: Expense) => (
      <div className="font-semibold text-primary whitespace-nowrap">
        ₹{expense.amount.toLocaleString()}
      </div>
    ),
  },
  {
    key: 'vendor',
    label: 'Vendor',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (expense: Expense) => <div className="text-sm truncate">{expense.vendor || 'N/A'}</div>,
  },
  {
    key: 'siteName',
    label: 'Site',
    sortable: true,
    minWidth: 'min-w-[160px]',
    render: (expense: Expense) => (
      <div className="text-sm truncate">{expense.siteName || 'N/A'}</div>
    ),
  },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (expense: Expense) => (
      <div className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(expense.date)}
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[110px]',
    render: (expense: Expense) => {
      const status = expense.status as 'paid' | 'pending' | 'overdue';
      const statusConfig = {
        paid: { variant: 'default' as const, dotColor: 'bg-green-500', label: 'Paid' },
        pending: { variant: 'secondary' as const, dotColor: 'bg-orange-500', label: 'Pending' },
        overdue: { variant: 'destructive' as const, dotColor: 'bg-red-500', label: 'Overdue' },
      };
      const config = statusConfig[status];

      return (
        <Badge
          variant={config.variant}
          className="text-xs flex items-center gap-1.5 w-fit whitespace-nowrap"
        >
          <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    minWidth: 'min-w-[100px]',
    align: 'right' as const,
    render: (expense: Expense) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(expense);
                }}
                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                aria-label="View expense details"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(expense);
                }}
                className="h-8 w-8 p-0 transition-all hover:bg-primary/10"
                aria-label="Edit expense"
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit expense</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 transition-all hover:bg-muted"
                    aria-label="More actions"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>More actions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(expense.id)}
              className="text-sm"
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Download receipt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(expense);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
