'use client';

import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Package,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  Pause,
  XCircle,
  Layers,
} from 'lucide-react';
import React from 'react';

import type { DataTableColumn } from '@/components/common/DataTable';
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
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';

// Purchase Columns
interface SitePurchase {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalAmount: number;
  vendor: string;
  purchaseDate: string;
  invoiceNumber: string;
}

export const getSitePurchaseColumns = (): DataTableColumn<SitePurchase>[] => [
  {
    key: 'materialName',
    label: 'Material',
    sortable: true,
    minWidth: 'min-w-[200px]',
    render: (purchase: SitePurchase) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 bg-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-sm">{purchase.materialName}</div>
          <div className="text-xs text-muted-foreground">INV: {purchase.invoiceNumber}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'quantity',
    label: 'Quantity',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (purchase: SitePurchase) => (
      <div className="text-sm">
        <span className="font-semibold">{purchase.quantity.toLocaleString()}</span>{' '}
        <span className="text-muted-foreground">{purchase.unit}</span>
      </div>
    ),
  },
  {
    key: 'unitRate',
    label: 'Unit Rate',
    sortable: true,
    align: 'right' as const,
    minWidth: 'min-w-[100px]',
    render: (purchase: SitePurchase) => (
      <div className="text-sm font-medium">₹{purchase.unitRate.toLocaleString()}</div>
    ),
  },
  {
    key: 'totalAmount',
    label: 'Total Amount',
    sortable: true,
    align: 'right' as const,
    minWidth: 'min-w-[120px]',
    render: (purchase: SitePurchase) => (
      <div className="font-semibold text-primary">₹{purchase.totalAmount.toLocaleString()}</div>
    ),
  },
  {
    key: 'vendor',
    label: 'Vendor',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (purchase: SitePurchase) => <div className="text-sm truncate">{purchase.vendor}</div>,
  },
  {
    key: 'purchaseDate',
    label: 'Purchase Date',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (purchase: SitePurchase) => (
      <div className="text-sm text-muted-foreground">{formatDate(purchase.purchaseDate)}</div>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    minWidth: 'min-w-[100px]',
    align: 'right' as const,
    render: (purchase: SitePurchase) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="h-8 w-8 p-0"
                aria-label="View purchase details"
              >
                <Eye className="h-3.5 w-3.5" />
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
                }}
                className="h-8 w-8 p-0"
                aria-label="Edit purchase"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit purchase</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>More actions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Copy ID</DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              Download invoice
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// Expense Columns (simplified for site-specific view)
interface SiteExpense {
  id: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  status: 'paid' | 'pending' | 'overdue';
  receipt?: string;
}

export const getSiteExpenseColumns = (): DataTableColumn<SiteExpense>[] => [
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    minWidth: 'min-w-[200px]',
    render: (expense: SiteExpense) => (
      <div className="min-w-0">
        <div className="font-semibold text-sm">{expense.category}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{expense.description}</div>
      </div>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    align: 'right' as const,
    minWidth: 'min-w-[120px]',
    render: (expense: SiteExpense) => (
      <div className="font-semibold text-primary">₹{expense.amount.toLocaleString()}</div>
    ),
  },
  {
    key: 'vendor',
    label: 'Vendor',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (expense: SiteExpense) => (
      <div className="text-sm truncate">{expense.vendor || 'N/A'}</div>
    ),
  },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (expense: SiteExpense) => (
      <div className="text-sm text-muted-foreground">{formatDate(expense.date)}</div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[110px]',
    render: (expense: SiteExpense) => {
      const statusConfig = {
        paid: { variant: 'default' as const, dotColor: 'bg-green-500', label: 'Paid' },
        pending: { variant: 'secondary' as const, dotColor: 'bg-orange-500', label: 'Pending' },
        overdue: { variant: 'destructive' as const, dotColor: 'bg-red-500', label: 'Overdue' },
      };
      const config = statusConfig[expense.status];

      return (
        <Badge variant={config.variant} className="text-xs flex items-center gap-1.5 w-fit">
          <div className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
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
    render: (expense: SiteExpense) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="View expense"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="Edit expense"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit expense</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Download receipt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// Vehicle Columns
interface SiteVehicle {
  id: string;
  vehicleName: string;
  vehicleType: string;
  registrationNumber: string;
  operator: string;
  rentalCostPerDay: number;
  fuelCostPerDay: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  vendor: string;
  status: 'active' | 'maintenance' | 'idle' | 'returned';
}

export const getSiteVehicleColumns = (): DataTableColumn<SiteVehicle>[] => [
  {
    key: 'vehicleName',
    label: 'Vehicle',
    sortable: true,
    minWidth: 'min-w-[220px]',
    render: (vehicle: SiteVehicle) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 bg-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Truck className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-sm">{vehicle.vehicleName}</div>
          <div className="text-xs text-muted-foreground">{vehicle.registrationNumber}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'vehicleType',
    label: 'Type',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (vehicle: SiteVehicle) => <div className="text-sm">{vehicle.vehicleType}</div>,
  },
  {
    key: 'operator',
    label: 'Operator',
    sortable: true,
    minWidth: 'min-w-[140px]',
    render: (vehicle: SiteVehicle) => <div className="text-sm">{vehicle.operator}</div>,
  },
  {
    key: 'rentalCostPerDay',
    label: 'Daily Cost',
    sortable: true,
    align: 'right' as const,
    minWidth: 'min-w-[120px]',
    render: (vehicle: SiteVehicle) => (
      <div className="text-sm font-medium">
        ₹{(vehicle.rentalCostPerDay + vehicle.fuelCostPerDay).toLocaleString()}
      </div>
    ),
  },
  {
    key: 'totalDays',
    label: 'Days Used',
    sortable: true,
    align: 'center' as const,
    minWidth: 'min-w-[100px]',
    render: (vehicle: SiteVehicle) => (
      <div className="text-sm font-medium">{vehicle.totalDays}</div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (vehicle: SiteVehicle) => {
      const statusConfig = {
        active: { variant: 'default' as const, icon: CheckCircle2, label: 'Active' },
        maintenance: { variant: 'secondary' as const, icon: Clock, label: 'Maintenance' },
        idle: { variant: 'secondary' as const, icon: Pause, label: 'Idle' },
        returned: { variant: 'secondary' as const, icon: XCircle, label: 'Returned' },
      };
      const config = statusConfig[vehicle.status];
      const StatusIcon = config.icon;

      return (
        <Badge variant={config.variant} className="text-xs flex items-center gap-1.5 w-fit">
          <StatusIcon className="h-3 w-3" />
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
    render: (vehicle: SiteVehicle) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="View vehicle"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="Edit vehicle"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit vehicle</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View usage log</DropdownMenuItem>
            <DropdownMenuItem>View maintenance log</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// Material Master Columns
interface SiteMaterialMaster {
  id: string;
  materialName: string;
  category: string;
  unit: string;
  siteStock: number;
  allocated: number;
  reserved: number;
  status: 'available' | 'low' | 'critical';
}

export const getSiteMaterialMasterColumns = (): DataTableColumn<SiteMaterialMaster>[] => [
  {
    key: 'materialName',
    label: 'Material',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (material: SiteMaterialMaster) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 bg-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-sm">{material.materialName}</div>
          <div className="text-xs text-muted-foreground">{material.category}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'siteStock',
    label: 'On Site',
    sortable: true,
    minWidth: 'min-w-[110px]',
    render: (material: SiteMaterialMaster) => (
      <div className="text-sm font-semibold">
        {material.siteStock.toLocaleString()} <span className="text-muted-foreground">{material.unit}</span>
      </div>
    ),
  },
  {
    key: 'allocated',
    label: 'Allocated',
    sortable: true,
    minWidth: 'min-w-[110px]',
    render: (material: SiteMaterialMaster) => (
      <div className="text-sm">
        {material.allocated.toLocaleString()} <span className="text-muted-foreground">{material.unit}</span>
      </div>
    ),
  },
  {
    key: 'reserved',
    label: 'Reserved',
    sortable: true,
    minWidth: 'min-w-[110px]',
    render: (material: SiteMaterialMaster) => (
      <div className="text-sm">
        {material.reserved.toLocaleString()} <span className="text-muted-foreground">{material.unit}</span>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (material: SiteMaterialMaster) => {
      const statusConfig = {
        available: { label: 'Available', variant: 'default' as const, dotColor: 'bg-green-500' },
        low: { label: 'Low Stock', variant: 'secondary' as const, dotColor: 'bg-yellow-500' },
        critical: { label: 'Critical', variant: 'destructive' as const, dotColor: 'bg-red-500' },
      };

      const config = statusConfig[material.status];
      return (
        <Badge variant={config.variant} className="text-xs flex items-center gap-1.5 w-fit">
          <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
          {config.label}
        </Badge>
      );
    },
  },
];

// Labour Columns
interface SiteLabour {
  id: string;
  name: string;
  age: number;
  contactNo: string;
  dailyWage: number;
  hourlyRate: number;
  daysWorked: number;
  hoursWorked: number;
  skillCategory: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export const getSiteLabourColumns = (): DataTableColumn<SiteLabour>[] => [
  {
    key: 'name',
    label: 'Worker',
    sortable: true,
    minWidth: 'min-w-[200px]',
    render: (labour: SiteLabour) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 bg-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-sm">{labour.name}</div>
          <div className="text-xs text-muted-foreground">{labour.skillCategory}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'contactNo',
    label: 'Contact',
    sortable: false,
    minWidth: 'min-w-[140px]',
    render: (labour: SiteLabour) => <div className="text-sm">{labour.contactNo}</div>,
  },
  {
    key: 'dailyWage',
    label: 'Daily Wage',
    sortable: true,
    align: 'right' as const,
    minWidth: 'min-w-[120px]',
    render: (labour: SiteLabour) => (
      <div className="text-sm font-medium">₹{labour.dailyWage.toLocaleString()}</div>
    ),
  },
  {
    key: 'daysWorked',
    label: 'Days Worked',
    sortable: true,
    align: 'center' as const,
    minWidth: 'min-w-[120px]',
    render: (labour: SiteLabour) => <div className="text-sm font-medium">{labour.daysWorked}</div>,
  },
  {
    key: 'totalCost',
    label: 'Total Cost',
    sortable: false,
    align: 'right' as const,
    minWidth: 'min-w-[120px]',
    render: (labour: SiteLabour) => (
      <div className="font-semibold text-primary">
        ₹{(labour.dailyWage * labour.daysWorked).toLocaleString()}
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[100px]',
    render: (labour: SiteLabour) => (
      <Badge
        variant={labour.status === 'active' ? 'default' : 'secondary'}
        className="text-xs w-fit"
      >
        {labour.status === 'active' ? (
          <>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    minWidth: 'min-w-[100px]',
    align: 'right' as const,
    render: (labour: SiteLabour) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="View worker"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="Edit worker"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit worker</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View attendance</DropdownMenuItem>
            <DropdownMenuItem>Payment history</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];

// Work Progress Columns
interface SiteWorkProgress {
  id: string;
  activityName: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
  progress: number;
  assignedTo: string;
}

export const getSiteWorkProgressColumns = (): DataTableColumn<SiteWorkProgress>[] => [
  {
    key: 'activityName',
    label: 'Activity',
    sortable: true,
    minWidth: 'min-w-[220px]',
    render: (activity: SiteWorkProgress) => (
      <div className="min-w-0">
        <div className="font-semibold text-sm">{activity.activityName}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">{activity.category}</div>
      </div>
    ),
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    minWidth: 'min-w-[200px]',
    render: (activity: SiteWorkProgress) => (
      <div className="text-sm text-muted-foreground line-clamp-2">{activity.description}</div>
    ),
  },
  {
    key: 'progress',
    label: 'Progress',
    sortable: true,
    minWidth: 'min-w-[180px]',
    render: (activity: SiteWorkProgress) => (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">{activity.progress}%</span>
        </div>
        <Progress value={activity.progress} className="h-2" />
      </div>
    ),
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    sortable: true,
    minWidth: 'min-w-[120px]',
    render: (activity: SiteWorkProgress) => (
      <div className="text-sm font-medium">{activity.assignedTo}</div>
    ),
  },
  {
    key: 'timeline',
    label: 'Timeline',
    sortable: false,
    minWidth: 'min-w-[160px]',
    render: (activity: SiteWorkProgress) => (
      <div className="text-xs text-muted-foreground">
        <div>{formatDate(activity.startDate)}</div>
        <div>to {formatDate(activity.endDate)}</div>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    minWidth: 'min-w-[130px]',
    render: (activity: SiteWorkProgress) => {
      const statusConfig = {
        'not-started': {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Not Started',
          color: 'text-gray-600',
        },
        'in-progress': {
          variant: 'default' as const,
          icon: Clock,
          label: 'In Progress',
          color: 'text-blue-600',
        },
        completed: {
          variant: 'default' as const,
          icon: CheckCircle2,
          label: 'Completed',
          color: 'text-green-600',
        },
        'on-hold': {
          variant: 'secondary' as const,
          icon: Pause,
          label: 'On Hold',
          color: 'text-orange-600',
        },
      };
      const config = statusConfig[activity.status];
      const StatusIcon = config.icon;

      return (
        <Badge variant={config.variant} className="text-xs flex items-center gap-1.5 w-fit">
          <StatusIcon className="h-3 w-3" />
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
    render: (activity: SiteWorkProgress) => (
      <div className="flex items-center gap-1 justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="View activity"
              >
                <Eye className="h-3.5 w-3.5" />
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
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0"
                aria-label="Edit activity"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit activity</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Update progress</DropdownMenuItem>
            <DropdownMenuItem>View history</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
