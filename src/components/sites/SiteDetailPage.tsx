'use client';

import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Target,
  Edit,
  Settings,
  CheckCircle2,
  Pause,
  XCircle,
  Plus,
  BarChart3,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { DataTable } from '@/components/common/DataTable';
import { FormDialog } from '@/components/common/FormDialog';
import { ExpenseForm, type ExpenseFormData } from '@/components/forms/ExpenseForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import {
  getSitePurchaseColumns,
  getSiteExpenseColumns,
  getSiteVehicleColumns,
  getSiteLabourColumns,
  getSiteWorkProgressColumns,
} from '@/components/sites/site-detail-columns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDialogState } from '@/lib/hooks/useDialogState';
import { useTableState } from '@/lib/hooks/useTableState';
import { formatDate, formatDateShort } from '@/lib/utils';
import type { Expense } from '@/types';


// Mock Data - In production, this would come from API
interface SiteDetails {
  id: string;
  name: string;
  location: string;
  startDate: string;
  expectedEndDate: string;
  status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  budget: number;
  spent: number;
  description: string;
  progress: number;
}

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

const mockSiteData: Record<string, SiteDetails> = {
  '1': {
    id: '1',
    name: 'Residential Complex A',
    location: 'Sector 15, Navi Mumbai',
    startDate: '2024-01-15',
    expectedEndDate: '2024-12-15',
    status: 'Active',
    budget: 50000000,
    spent: 32000000,
    description: 'Premium residential complex with 200 units',
    progress: 64,
  },
  '2': {
    id: '2',
    name: 'Commercial Plaza B',
    location: 'Business District, Pune',
    startDate: '2024-02-01',
    expectedEndDate: '2025-01-31',
    status: 'Active',
    budget: 75000000,
    spent: 41250000,
    description: 'Modern commercial complex with retail and office spaces',
    progress: 55,
  },
};

const mockPurchases: SitePurchase[] = [
  {
    id: '1',
    materialName: 'Cement (Grade 43)',
    quantity: 500,
    unit: 'bags',
    unitRate: 380,
    totalAmount: 190000,
    vendor: 'ABC Construction Materials',
    purchaseDate: '2024-01-20',
    invoiceNumber: 'INV-2024-001',
  },
  {
    id: '2',
    materialName: 'Steel TMT Bars',
    quantity: 5000,
    unit: 'kg',
    unitRate: 65,
    totalAmount: 325000,
    vendor: 'XYZ Steel Suppliers',
    purchaseDate: '2024-01-25',
    invoiceNumber: 'INV-2024-002',
  },
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'Labour',
    subcategory: 'Mason work',
    description: 'Mason work - Week 3',
    amount: 125000,
    date: '2024-01-28',
    vendor: 'Local Contractors',
    siteId: '1',
    siteName: 'Residential Complex A',
    receipt: 'RCT001',
    status: 'paid',
    approvedBy: 'Site Manager',
    organizationId: 'org-1',
    createdAt: '2024-01-28T10:00:00Z',
    updatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '2',
    category: 'Equipment',
    subcategory: 'Excavator rental',
    description: 'Excavator rental for foundation work',
    amount: 85000,
    date: '2024-01-30',
    vendor: 'Heavy Equipment Rentals',
    siteId: '1',
    siteName: 'Residential Complex A',
    receipt: 'RCT002',
    status: 'pending',
    approvedBy: 'Project Manager',
    organizationId: 'org-1',
    createdAt: '2024-01-30T10:00:00Z',
    updatedAt: '2024-01-30T10:00:00Z',
  },
];

const mockVehicles: SiteVehicle[] = [
  {
    id: '1',
    vehicleName: 'CAT 320D Excavator',
    vehicleType: 'Excavator',
    registrationNumber: 'MH-12-AB-1234',
    operator: 'Ravi Kumar',
    rentalCostPerDay: 8500,
    fuelCostPerDay: 2500,
    startDate: '2024-01-20',
    endDate: '2024-03-20',
    totalDays: 60,
    vendor: 'Heavy Equipment Rentals',
    status: 'active',
  },
  {
    id: '2',
    vehicleName: 'Ashok Leyland Truck',
    vehicleType: 'Truck',
    registrationNumber: 'MH-12-CD-5678',
    operator: 'Sunil Patil',
    rentalCostPerDay: 3500,
    fuelCostPerDay: 1800,
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    totalDays: 335,
    vendor: 'City Transport Services',
    status: 'active',
  },
];

const mockLabour: SiteLabour[] = [
  {
    id: '1',
    name: 'Ramesh Patil',
    age: 32,
    contactNo: '+91 98765 43210',
    dailyWage: 800,
    hourlyRate: 100,
    daysWorked: 25,
    hoursWorked: 200,
    skillCategory: 'Mason',
    joinDate: '2024-01-20',
    status: 'active',
  },
  {
    id: '2',
    name: 'Suresh Kumar',
    age: 28,
    contactNo: '+91 98765 43211',
    dailyWage: 600,
    hourlyRate: 75,
    daysWorked: 20,
    hoursWorked: 160,
    skillCategory: 'Helper',
    joinDate: '2024-01-22',
    status: 'active',
  },
];

const mockWorkProgress: SiteWorkProgress[] = [
  {
    id: '1',
    activityName: 'Foundation Excavation',
    category: 'Earthwork',
    description: 'Excavation for building foundation',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    status: 'completed',
    progress: 100,
    assignedTo: 'Team A',
  },
  {
    id: '2',
    activityName: 'Column Casting',
    category: 'Structural',
    description: 'Ground floor column casting',
    startDate: '2024-02-20',
    endDate: '2024-03-20',
    status: 'in-progress',
    progress: 65,
    assignedTo: 'Team B',
  },
];

interface SiteDetailPageProps {
  siteId: string;
}

export function SiteDetailPage({ siteId }: SiteDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const expenseDialog = useDialogState();
  const [isLoading, setIsLoading] = useState(false);

  // Get site data
  const site = mockSiteData[siteId];

  // Filter data by site
  const sitePurchases = mockPurchases;
  const siteExpenses = mockExpenses.filter((exp) => exp.siteId === siteId);
  const siteVehicles = mockVehicles;
  const siteLabour = mockLabour;
  const siteWorkProgress = mockWorkProgress;

  // Table states
  const purchaseTableState = useTableState({ initialItemsPerPage: 5 });
  const expenseTableState = useTableState({ initialItemsPerPage: 5 });
  const vehicleTableState = useTableState({ initialItemsPerPage: 5 });
  const labourTableState = useTableState({ initialItemsPerPage: 5 });
  const workProgressTableState = useTableState({ initialItemsPerPage: 5 });

  // Calculate statistics
  const totalPurchaseValue = sitePurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVehicleCost = siteVehicles.reduce(
    (sum, v) => sum + (v.rentalCostPerDay + v.fuelCostPerDay) * v.totalDays,
    0,
  );
  const totalLabourCost = siteLabour.reduce((sum, l) => sum + l.dailyWage * l.daysWorked, 0);

  if (!site) {
    return (
      <div className="p-6">
        <PageHeader title="Site Not Found" description="The requested site could not be found." />
        <Button onClick={() => router.push('/sites')} className="mt-4">
          Back to Sites
        </Button>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (site.status) {
      case 'Active':
        return {
          variant: 'default' as const,
          icon: CheckCircle2,
          color: 'text-green-600',
        };
      case 'Stopped':
        return {
          variant: 'secondary' as const,
          icon: Pause,
          color: 'text-yellow-600',
        };
      case 'Completed':
        return {
          variant: 'secondary' as const,
          icon: CheckCircle2,
          color: 'text-blue-600',
        };
      case 'Canceled':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-muted-foreground',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const handleExpenseSubmit = async (formData: ExpenseFormData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In production, add API call here to save expense for siteId
      expenseDialog.closeDialog();
    } catch (error) {
      console.error('Failed to add expense:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const daysRemaining = Math.ceil(
    (new Date(site.expectedEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 bg-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Building2 className="h-7 w-7" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{site.location}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant} className="px-3 py-1 text-sm font-medium">
            <StatusIcon className="h-3 w-3 mr-1" />
            {site.status}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/sites/${siteId}/edit`)}
                  className="gap-2"
                  aria-label="Edit site"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit site details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" aria-label="Site settings">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Site settings and configuration</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Site Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{(site.budget / 10000000).toFixed(1)}Cr
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Amount Spent</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(site.spent / 10000000).toFixed(1)}Cr
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-blue-600">{site.progress}%</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-bold text-orange-600">{daysRemaining}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Project Progress</span>
              <span className="text-sm font-bold text-foreground">{site.progress}%</span>
            </div>
            <Progress value={site.progress} className="h-3" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Started: {formatDateShort(site.startDate)}</span>
              <span>Target: {formatDateShort(site.expectedEndDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Purchases</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Vehicles</span>
          </TabsTrigger>
          <TabsTrigger value="labour" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Labour</span>
          </TabsTrigger>
          <TabsTrigger value="work-progress" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <SectionCard title="Project Description">
            <p className="text-sm leading-relaxed text-muted-foreground">{site.description}</p>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Location Details">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{site.location}</span>
              </div>
            </SectionCard>

            <SectionCard title="Project Timeline">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-medium">Start: {formatDate(site.startDate)}</div>
                    <div className="font-medium">End: {formatDate(site.expectedEndDate)}</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Budget Overview">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="font-semibold">₹{site.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Spent</span>
                  <span className="font-semibold text-green-600">
                    ₹{site.spent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-primary">
                    ₹{(site.budget - site.spent).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Utilization</span>
                    <span className="font-bold">
                      {((site.spent / site.budget) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cost Summary">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Purchases</span>
                  <span className="font-semibold">₹{totalPurchaseValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Direct Expenses</span>
                  <span className="font-semibold">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vehicle Costs</span>
                  <span className="font-semibold">₹{totalVehicleCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Labour Costs</span>
                  <span className="font-semibold">₹{totalLabourCost.toLocaleString()}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Material Purchases</h3>
              <p className="text-sm text-muted-foreground">
                Track all material purchases for this site
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Purchase
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                    <p className="text-xl font-bold">{sitePurchases.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{totalPurchaseValue.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹
                      {sitePurchases.length > 0
                        ? (totalPurchaseValue / sitePurchases.length).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : 0}
                    </p>
                  </div>
                </div>
              </div>

              <DataTable
                columns={getSitePurchaseColumns() as never}
                data={sitePurchases as never}
                onSort={purchaseTableState.setSortField}
                onPageChange={purchaseTableState.setCurrentPage}
                pageSize={purchaseTableState.itemsPerPage}
                currentPage={purchaseTableState.currentPage}
                sortField={purchaseTableState.sortField}
                sortDirection={purchaseTableState.sortDirection}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Site Expenses</h3>
              <p className="text-sm text-muted-foreground">
                Track all expenses incurred at this site
              </p>
            </div>
            <Button className="gap-2" onClick={() => expenseDialog.openDialog()}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold">₹{totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹
                      {siteExpenses
                        .filter((e) => e.status === 'paid')
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-orange-600">
                      ₹
                      {siteExpenses
                        .filter((e) => e.status === 'pending')
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <DataTable
                columns={getSiteExpenseColumns() as never}
                data={siteExpenses as never}
                onSort={expenseTableState.setSortField}
                onPageChange={expenseTableState.setCurrentPage}
                pageSize={expenseTableState.itemsPerPage}
                currentPage={expenseTableState.currentPage}
                sortField={expenseTableState.sortField}
                sortDirection={expenseTableState.sortDirection}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Site Vehicles & Equipment</h3>
              <p className="text-sm text-muted-foreground">
                Manage all vehicles and equipment at this site
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Truck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vehicles</p>
                    <p className="text-xl font-bold">{siteVehicles.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-green-600">
                      {siteVehicles.filter((v) => v.status === 'active').length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{totalVehicleCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <DataTable
                columns={getSiteVehicleColumns() as never}
                data={siteVehicles as never}
                onSort={vehicleTableState.setSortField}
                onPageChange={vehicleTableState.setCurrentPage}
                pageSize={vehicleTableState.itemsPerPage}
                currentPage={vehicleTableState.currentPage}
                sortField={vehicleTableState.sortField}
                sortDirection={vehicleTableState.sortDirection}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labour Tab */}
        <TabsContent value="labour" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Site Labour</h3>
              <p className="text-sm text-muted-foreground">
                Manage workforce and labor costs at this site
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Labour
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Workers</p>
                    <p className="text-xl font-bold">{siteLabour.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-green-600">
                      {siteLabour.filter((l) => l.status === 'active').length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{totalLabourCost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <DataTable
                columns={getSiteLabourColumns() as never}
                data={siteLabour as never}
                onSort={labourTableState.setSortField}
                onPageChange={labourTableState.setCurrentPage}
                pageSize={labourTableState.itemsPerPage}
                currentPage={labourTableState.currentPage}
                sortField={labourTableState.sortField}
                sortDirection={labourTableState.sortDirection}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Progress Tab */}
        <TabsContent value="work-progress" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Work Progress & Activities</h3>
              <p className="text-sm text-muted-foreground">
                Track all activities and their progress at this site
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Activities</p>
                    <p className="text-xl font-bold">{siteWorkProgress.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-xl font-bold text-green-600">
                      {siteWorkProgress.filter((w) => w.status === 'completed').length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-xl font-bold text-blue-600">
                      {siteWorkProgress.filter((w) => w.status === 'in-progress').length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Progress</p>
                    <p className="text-xl font-bold text-orange-600">
                      {siteWorkProgress.length > 0
                        ? (
                            siteWorkProgress.reduce((sum, w) => sum + w.progress, 0) /
                            siteWorkProgress.length
                          ).toFixed(0)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              <DataTable
                columns={getSiteWorkProgressColumns() as never}
                data={siteWorkProgress as never}
                onSort={workProgressTableState.setSortField}
                onPageChange={workProgressTableState.setCurrentPage}
                pageSize={workProgressTableState.itemsPerPage}
                currentPage={workProgressTableState.currentPage}
                sortField={workProgressTableState.sortField}
                sortDirection={workProgressTableState.sortDirection}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <FormDialog
        title="Add Site Expense"
        description={`Create a new expense entry for ${site.name}`}
        isOpen={expenseDialog.isDialogOpen}
        onOpenChange={(open) => (open ? expenseDialog.openDialog() : expenseDialog.closeDialog())}
        maxWidth="max-w-2xl"
      >
        <ExpenseForm
          onSubmit={handleExpenseSubmit}
          onCancel={expenseDialog.closeDialog}
          isLoading={isLoading}
          defaultValues={{ site: site.name }}
        />
      </FormDialog>
    </div>
  );
}
