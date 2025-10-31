'use client';

import {
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Edit,
  Search,
  BarChart3,
  Filter,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
  Pause,
  XCircle,
  ShoppingCart,
  Target,
} from 'lucide-react';
import React, { useState } from 'react';

import { ExpensesPage } from './expenses';
import { PurchasePage } from './purchase';
import { SchedulingPage } from './scheduling';
import { WorkProgressPage } from './work-progress';

import SiteForm from '@/components/forms/SiteForm';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate, formatDateShort } from '@/lib/utils';

interface Site {
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

interface SiteExpense {
  id: string;
  siteId: string;
  category: 'Labour' | 'Materials' | 'Equipment' | 'Transport' | 'Utilities' | 'Other';
  description: string;
  amount: number;
  date: string;
  vendor: string;
  receipt: string;
}

interface SiteDocument {
  id: string;
  siteId: string;
  name: string;
  type: 'drawings' | 'plans' | 'permits' | 'contracts' | 'reports' | 'other';
  uploadDate: string;
  size: string;
  uploadedBy: string;
}

interface SiteLabour {
  id: string;
  siteId: string;
  name: string;
  age: number;
  contactNo: string;
  dailyWage: number;
  hourlyRate: number;
  daysWorked: number;
  hoursWorked: number;
  skillCategory:
    | 'Mason'
    | 'Helper'
    | 'Electrician'
    | 'Plumber'
    | 'Carpenter'
    | 'Operator'
    | 'Other';
  joinDate: string;
  status: 'active' | 'inactive';
}

interface SiteVehicle {
  id: string;
  siteId: string;
  vehicleName: string;
  vehicleType:
    | 'Excavator'
    | 'Crane'
    | 'Truck'
    | 'Mixer'
    | 'JCB'
    | 'Loader'
    | 'Compactor'
    | 'Generator'
    | 'Other';
  registrationNumber: string;
  operator: string;
  rentalCostPerDay: number;
  fuelCostPerDay: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalCost: number;
  vendor: string;
  status: 'active' | 'maintenance' | 'idle' | 'returned';
  fuelConsumed: number;
  lastMaintenanceDate: string;
}

const mockSites: Site[] = [
  {
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
  {
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
  {
    id: '3',
    name: 'Highway Bridge Project',
    location: 'Mumbai-Pune Highway',
    startDate: '2024-03-01',
    expectedEndDate: '2024-10-30',
    status: 'Completed',
    budget: 35000000,
    spent: 33600000,
    description: 'Four-lane highway bridge construction',
    progress: 96,
  },
];

const mockSiteExpenses: SiteExpense[] = [
  {
    id: '1',
    siteId: '1',
    category: 'Labour',
    description: 'Mason work - Week 3',
    amount: 125000,
    date: '2024-01-28',
    vendor: 'Local Contractors',
    receipt: 'RCT001',
  },
  {
    id: '2',
    siteId: '1',
    category: 'Equipment',
    description: 'Excavator rental',
    amount: 85000,
    date: '2024-01-30',
    vendor: 'Heavy Equipment Rentals',
    receipt: 'RCT002',
  },
  {
    id: '3',
    siteId: '2',
    category: 'Materials',
    description: 'Steel procurement',
    amount: 325000,
    date: '2024-02-10',
    vendor: 'Tata Steel',
    receipt: 'RCT003',
  },
];

const mockSiteDocuments: SiteDocument[] = [
  {
    id: '1',
    siteId: '1',
    name: 'Site Plan Drawing',
    type: 'drawings',
    uploadDate: '2024-01-15',
    size: '2.5 MB',
    uploadedBy: 'Rajesh Kumar',
  },
  {
    id: '2',
    siteId: '1',
    name: 'Foundation Plan',
    type: 'plans',
    uploadDate: '2024-01-18',
    size: '1.8 MB',
    uploadedBy: 'Rajesh Kumar',
  },
  {
    id: '3',
    siteId: '2',
    name: 'Building Permit',
    type: 'permits',
    uploadDate: '2024-01-30',
    size: '0.5 MB',
    uploadedBy: 'Priya Sharma',
  },
];

const mockSiteLabour: SiteLabour[] = [
  {
    id: '1',
    siteId: '1',
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
    siteId: '1',
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
  {
    id: '3',
    siteId: '2',
    name: 'Prakash Joshi',
    age: 35,
    contactNo: '+91 98765 43212',
    dailyWage: 1200,
    hourlyRate: 150,
    daysWorked: 18,
    hoursWorked: 144,
    skillCategory: 'Electrician',
    joinDate: '2024-02-05',
    status: 'active',
  },
];

const mockSiteVehicles: SiteVehicle[] = [
  {
    id: '1',
    siteId: '1',
    vehicleName: 'CAT 320D Excavator',
    vehicleType: 'Excavator',
    registrationNumber: 'MH-12-AB-1234',
    operator: 'Ravi Kumar',
    rentalCostPerDay: 8500,
    fuelCostPerDay: 2500,
    startDate: '2024-01-20',
    endDate: '2024-03-20',
    totalDays: 60,
    totalCost: 660000,
    vendor: 'Heavy Equipment Rentals',
    status: 'active',
    fuelConsumed: 150000,
    lastMaintenanceDate: '2024-02-15',
  },
  {
    id: '2',
    siteId: '1',
    vehicleName: 'Ashok Leyland Truck',
    vehicleType: 'Truck',
    registrationNumber: 'MH-12-CD-5678',
    operator: 'Sunil Patil',
    rentalCostPerDay: 3500,
    fuelCostPerDay: 1800,
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    totalDays: 335,
    totalCost: 1775500,
    vendor: 'City Transport Services',
    status: 'active',
    fuelConsumed: 603000,
    lastMaintenanceDate: '2024-02-01',
  },
  {
    id: '3',
    siteId: '2',
    vehicleName: 'Tower Crane TC-6013',
    vehicleType: 'Crane',
    registrationNumber: 'PU-15-EF-9012',
    operator: 'Mahesh Joshi',
    rentalCostPerDay: 12000,
    fuelCostPerDay: 3000,
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    totalDays: 334,
    totalCost: 5010000,
    vendor: 'Mega Cranes Ltd',
    status: 'active',
    fuelConsumed: 1002000,
    lastMaintenanceDate: '2024-02-20',
  },
  {
    id: '4',
    siteId: '1',
    vehicleName: 'DG Set 125 KVA',
    vehicleType: 'Generator',
    registrationNumber: 'N/A',
    operator: 'Site Electrician',
    rentalCostPerDay: 2200,
    fuelCostPerDay: 1500,
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    totalDays: 335,
    totalCost: 1239500,
    vendor: 'Power Solutions Inc',
    status: 'active',
    fuelConsumed: 502500,
    lastMaintenanceDate: '2024-02-10',
  },
];

interface SiteManagementProps {
  selectedSite?: string;
  onSiteSelect?: (siteId: string) => void;
}

export function SitesPage({ selectedSite: propSelectedSite, onSiteSelect }: SiteManagementProps) {
  const [sites, setSites] = useState<Site[]>(mockSites);
  const [selectedSite, setSelectedSite] = useState<string>(propSelectedSite || '1');

  // Update selectedSite when prop changes
  React.useEffect(() => {
    if (propSelectedSite) {
      setSelectedSite(propSelectedSite);
    }
  }, [propSelectedSite]);
  const [isSiteDialogOpen, setIsSiteDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filter sites based on status and search query
  const filteredSites = sites.filter((site) => {
    const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const currentSite = sites.find((site) => site.id === selectedSite);

  const handleSiteSubmit = (siteData: Omit<Site, 'id' | 'spent' | 'progress'>) => {
    if (editingSite) {
      // Update existing site
      const updatedSite: Site = {
        ...editingSite,
        ...siteData,
      };

      setSites((prev) => prev.map((site) => (site.id === editingSite.id ? updatedSite : site)));
    } else {
      // Create new site
      const newSite: Site = {
        ...siteData,
        id: (sites.length + 1).toString(),
        spent: 0,
        progress: 0,
      };

      setSites((prev) => [...prev, newSite]);
    }

    // Reset form and close dialog
    setEditingSite(null);
    setIsSiteDialogOpen(false);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setIsSiteDialogOpen(true);
  };

  const handleAddNewSite = () => {
    setEditingSite(null);
    setIsSiteDialogOpen(true);
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      {/* Top Section - Sites List */}
      <div className="h-2/5 min-h-[400px] flex flex-col border-b">
        {/* Search and Filter Controls */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-muted/30 to-background">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sites by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="Active">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="Stopped">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                      Stopped
                    </div>
                  </SelectItem>
                  <SelectItem value="Completed">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      Completed
                    </div>
                  </SelectItem>
                  <SelectItem value="Canceled">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                      Canceled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 transition-all hover:shadow-md"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filter</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filter sites by status and criteria</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Dialog
                  open={isSiteDialogOpen}
                  onOpenChange={(open) => {
                    setIsSiteDialogOpen(open);
                    if (!open) {
                      setEditingSite(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleAddNewSite}
                      className="gap-2 transition-all hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Site</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-xl">
                        {editingSite ? 'Edit Construction Site' : 'Add New Construction Site'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingSite
                          ? 'Update construction project site details'
                          : 'Create a new construction project site with all necessary information'}
                      </DialogDescription>
                    </DialogHeader>
                    <SiteForm
                      mode={editingSite ? 'edit' : 'new'}
                      site={editingSite || undefined}
                      onSubmit={handleSiteSubmit}
                      onCancel={() => setIsSiteDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                {filteredSites.length} site{filteredSites.length !== 1 ? 's' : ''} found
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Sites List */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredSites.map((site) => {
                const getStatusConfig = () => {
                  switch (site.status) {
                    case 'Active':
                      return {
                        color: 'bg-green-500',
                        bgLight: 'bg-green-50 dark:bg-green-950/30',
                        textColor: 'text-green-700 dark:text-green-400',
                        icon: CheckCircle2,
                      };
                    case 'Stopped':
                      return {
                        color: 'bg-yellow-500',
                        bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
                        textColor: 'text-yellow-700 dark:text-yellow-400',
                        icon: Pause,
                      };
                    case 'Completed':
                      return {
                        color: 'bg-blue-500',
                        bgLight: 'bg-blue-50 dark:bg-blue-950/30',
                        textColor: 'text-blue-700 dark:text-blue-400',
                        icon: CheckCircle2,
                      };
                    case 'Canceled':
                      return {
                        color: 'bg-red-500',
                        bgLight: 'bg-red-50 dark:bg-red-950/30',
                        textColor: 'text-red-700 dark:text-red-400',
                        icon: XCircle,
                      };
                    default:
                      return {
                        color: 'bg-muted-foreground',
                        bgLight: 'bg-muted/30',
                        textColor: 'text-muted-foreground',
                        icon: Clock,
                      };
                  }
                };

                const statusConfig = getStatusConfig();
                const StatusIcon = statusConfig.icon;
                const budgetUsagePercent = (site.spent / site.budget) * 100;
                const isOverBudget = budgetUsagePercent > 90;

                return (
                  <Card
                    key={site.id}
                    className={`group relative cursor-pointer transition-all duration-300 overflow-hidden ${
                      selectedSite === site.id
                        ? 'border-primary shadow-lg ring-2 ring-primary/30 scale-[1.02]'
                        : 'border-border hover:border-primary/40 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setSelectedSite(site.id);
                      onSiteSelect?.(site.id);
                    }}
                  >
                    <CardContent className="p-5">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0 pr-3">
                          <h4 className="font-semibold text-lg leading-tight mb-2 truncate group-hover:text-primary transition-colors">
                            {site.name}
                          </h4>
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{site.location}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge
                            className={`${statusConfig.bgLight} ${statusConfig.textColor} border-0 flex items-center gap-1.5 px-2.5 py-1`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            <span className="font-medium">{site.status}</span>
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleEditSite(site);
                                  }}
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary"
                                  aria-label="Edit site"
                                >
                                  <span>
                                    <Edit className="h-4 w-4" />
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit site details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            Project Progress
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {site.progress}%
                          </span>
                        </div>
                        <Progress value={site.progress} className="h-2.5" />
                      </div>

                      {/* Financial Overview */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-medium text-muted-foreground">Budget</p>
                          </div>
                          <p className="font-bold text-base text-primary">
                            ₹{(site.budget / 10000000).toFixed(1)}Cr
                          </p>
                        </div>
                        <div className="rounded-lg bg-green-500/5 p-3 border border-green-500/10">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                            <p className="text-xs font-medium text-muted-foreground">Spent</p>
                          </div>
                          <p className="font-bold text-base text-green-600">
                            ₹{(site.spent / 10000000).toFixed(1)}Cr
                          </p>
                        </div>
                      </div>

                      {/* Timeline & Budget Usage */}
                      <div className="space-y-2.5 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDateShort(site.startDate)} -{' '}
                              {formatDateShort(site.expectedEndDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Budget Utilization
                          </span>
                          <Badge
                            variant={isOverBudget ? 'destructive' : 'secondary'}
                            className="text-xs font-semibold"
                          >
                            {budgetUsagePercent.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/20 rounded-lg transition-colors pointer-events-none" />
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Section - Site Details */}
      <div className="flex-1 flex flex-col">
        <div className="h-full flex flex-col">
          {currentSite ? (
            <>
              {/* Site Header */}
              <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 bg-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="h-7 w-7" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{currentSite.name}</h1>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{currentSite.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          currentSite.status === 'Active'
                            ? 'default'
                            : currentSite.status === 'Completed'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="px-3 py-1 text-sm font-medium"
                      >
                        {currentSite.status === 'Active' && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {currentSite.status === 'Stopped' && <Pause className="h-3 w-3 mr-1" />}
                        {currentSite.status === 'Completed' && (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {currentSite.status === 'Canceled' && <XCircle className="h-3 w-3 mr-1" />}
                        {currentSite.status}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSite(currentSite)}
                              className="gap-2 transition-all hover:shadow-md"
                            >
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
                </CardContent>
              </Card>

              {/* Site Overview Stats */}
              <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-muted/30 to-background">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Budget
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              ₹{(currentSite.budget / 10000000).toFixed(1)}Cr
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
                            <p className="text-sm font-medium text-muted-foreground">
                              Amount Spent
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              ₹{(currentSite.spent / 10000000).toFixed(1)}Cr
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
                            <p className="text-2xl font-bold text-blue-600">
                              {currentSite.progress}%
                            </p>
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
                            <p className="text-sm font-medium text-muted-foreground">
                              Days Remaining
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {Math.ceil(
                                (new Date(currentSite.expectedEndDate).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}
                            </p>
                          </div>
                          <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Site Details Tabs */}
              <div className="flex-1 overflow-hidden min-w-0">
                <div className="h-full flex flex-col min-w-0">
                  <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20 min-w-0">
                    <CardContent className="px-2 sm:px-6 py-4 min-w-0">
                      <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full min-w-0"
                      >
                        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5 lg:gap-1 bg-muted/50">
                          <TabsTrigger
                            value="overview"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Building2 className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Overview</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="purchase"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Purchase</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="work-progress"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Target className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Work Progress</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="expenses"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Expenses</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="scheduling"
                            className="flex items-center justify-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all truncate min-w-0"
                          >
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline truncate">Scheduling</span>
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto min-w-0">
                          <div className="min-w-0">
                            <TabsContent value="overview" className="min-w-0">
                              <div className="p-6 space-y-6">
                                <div className="space-y-6">
                                  <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-4">
                                      <CardTitle className="flex items-center gap-3 text-lg">
                                        <Avatar className="h-8 w-8 bg-primary/10">
                                          <AvatarFallback className="bg-primary/10 text-primary">
                                            <FileText className="h-4 w-4" />
                                          </AvatarFallback>
                                        </Avatar>
                                        Project Description
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                        <CardContent className="p-4">
                                          <p className="text-sm leading-relaxed text-muted-foreground">
                                            {currentSite.description}
                                          </p>
                                        </CardContent>
                                      </Card>
                                    </CardContent>
                                  </Card>

                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                          <Avatar className="h-8 w-8 bg-blue-500/10">
                                            <AvatarFallback className="bg-blue-500/10 text-blue-600">
                                              <MapPin className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          Location Details
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                            <CardContent className="p-3">
                                              <div className="flex items-center gap-3">
                                                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <span className="text-sm font-medium">
                                                  {currentSite.location}
                                                </span>
                                              </div>
                                            </CardContent>
                                          </Card>
                                          <p className="text-xs text-muted-foreground">
                                            Construction site location and address details
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center gap-3 text-base">
                                          <Avatar className="h-8 w-8 bg-green-500/10">
                                            <AvatarFallback className="bg-green-500/10 text-green-600">
                                              <Calendar className="h-4 w-4" />
                                            </AvatarFallback>
                                          </Avatar>
                                          Project Timeline
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="space-y-3">
                                          <Card className="bg-white/50 dark:bg-slate-800/50 border-border/50">
                                            <CardContent className="p-3">
                                              <div className="flex items-center gap-3">
                                                <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <div className="text-sm space-y-1">
                                                  <div className="font-medium">
                                                    Start: {formatDate(currentSite.startDate)}
                                                  </div>
                                                  <div className="font-medium">
                                                    End: {formatDate(currentSite.expectedEndDate)}
                                                  </div>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                          <p className="text-xs text-muted-foreground">
                                            Project start and expected completion dates
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="purchase" className="mt-0 min-w-0">
                              <PurchasePage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="work-progress" className="mt-0 min-w-0">
                              <WorkProgressPage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="expenses" className="mt-0 min-w-0">
                              <ExpensesPage filterBySite={currentSite?.name} />
                            </TabsContent>

                            <TabsContent value="scheduling" className="mt-0 min-w-0">
                              <SchedulingPage filterBySite={currentSite?.name} />
                            </TabsContent>
                          </div>
                        </div>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-md transition-shadow">
                <CardContent className="p-12">
                  <div className="text-center">
                    <Avatar className="h-24 w-24 bg-primary/10 mx-auto mb-6">
                      <AvatarFallback className="bg-primary/10">
                        <Building2 className="h-12 w-12 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-semibold mb-3">Select a Site</h3>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                      Choose a construction site from the list above to view detailed information,
                      manage materials, and track expenses.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
