import {
  Building2,
  Truck,
  Package,
  Receipt,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  MapPin,
  ShoppingCart,
  Database,
  BarChart3,
  PieChart,
  type LucideIcon,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { mutate } from 'swr';

import { useDialogState } from '../lib/hooks/useDialogState';
import { fetcher, swrConfig } from '../lib/swr';
import {
  formatCurrency,
  formatDate,
  formatIndianCurrencyShort,
  formatPercentage,
} from '../lib/utils';
import { formatDateOnly } from '../lib/utils/date';

import { FormDialog, InfoTooltip, StatCard, StatusBadge } from './common';
import ActivityForm from './forms/ActivityForm';
import type { ExpenseFormData } from './forms/ExpenseForm';
import { ExpenseForm } from './forms/ExpenseForm';
import MaterialMasterForm from './forms/MaterialMasterForm';
import VehicleUsageForm from './forms/VehicleUsageForm';
import { SectionCard } from './layout/SectionCard';
import { PurchaseForm } from './shared/PurchaseForm';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

import { useVehicles } from '@/lib/contexts';
import type { DashboardData, DashboardRecentActivity } from '@/types/dashboard';
import type { Vehicle } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

interface ActivityFormData {
  siteId: string;
  name: string;
  description: string;
  startDate: string;
  duration: string;
  assignedTeam: string;
  priority: string;
  category: string;
  dependencies: string;
  resources: string;
  milestones: boolean;
}

const emptyDashboardData: DashboardData = {
  quickStats: {
    activeSites: 0,
    totalVehicles: 0,
    materialValue: 0,
    monthlyExpenses: 0,
    activeVendors: 0,
    completionRate: 0,
  },
  recentActivities: [],
  alerts: [],
  activeSites: [],
};

const quickActions = [
  {
    id: '1',
    title: 'Record Expense',
    description: 'Add new expense entry',
    icon: Receipt,
    color: 'bg-green-500',
    action: 'expenses',
  },
  {
    id: '2',
    title: 'Material Master',
    description: 'Manage material database',
    icon: Database,
    color: 'bg-indigo-500',
    action: 'material-master',
  },
  {
    id: '3',
    title: 'Add Material Purchase',
    description: 'Record material procurement',
    icon: ShoppingCart,
    color: 'bg-blue-500',
    action: 'materials',
  },
  {
    id: '4',
    title: 'Vehicle Check-in',
    description: 'Update vehicle status',
    icon: Truck,
    color: 'bg-orange-500',
    action: 'vehicles',
  },
  {
    id: '5',
    title: 'Work Progress',
    description: 'Log work progress and activities',
    icon: Building2,
    color: 'bg-purple-500',
    action: 'sites',
  },
];

type PresentedActivity = DashboardRecentActivity & {
  icon: LucideIcon;
  color: string;
};

function mapActivitiesWithPresentation(activities: DashboardRecentActivity[]): PresentedActivity[] {
  const iconMap: Record<DashboardRecentActivity['type'], { icon: LucideIcon; color: string }> = {
    purchase: { icon: ShoppingCart, color: 'text-blue-600' },
    expense: { icon: Receipt, color: 'text-green-600' },
    vehicle: { icon: Truck, color: 'text-orange-600' },
    site: { icon: Building2, color: 'text-purple-600' },
  };

  return activities.map((activity) => {
    const { icon, color } = iconMap[activity.type] ?? iconMap.expense;
    return {
      ...activity,
      icon,
      color,
    };
  });
}

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    data: dashboardData = emptyDashboardData,
    error: swrError,
    isLoading,
  } = useSWR<DashboardData>('/api/dashboard/overview', fetcher, swrConfig);

  // Use vehicles from context provider (already loaded) instead of duplicate API call
  const { vehicles: vehiclesFromContext, isLoading: isVehiclesLoading } = useVehicles();

  // Lazy load sites only when Vehicle Usage form dialog is opened
  const [shouldLoadSites, setShouldLoadSites] = React.useState(false);
  const { data: sitesData } = useSWR<{ sites: Array<{ id: string; name: string }> }>(
    shouldLoadSites ? '/api/sites' : null, // Only fetch when needed
    fetcher,
    swrConfig,
  );

  // Use vehicles from context, fallback to empty array
  const vehiclesData = React.useMemo(
    () => ({
      vehicles: vehiclesFromContext || [],
    }),
    [vehiclesFromContext],
  );

  // Convert SWR error to string for display
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : 'Unable to load dashboard data right now.'
    : null;

  const { quickStats, recentActivities, alerts, activeSites } = dashboardData;
  const presentedActivities = useMemo(
    () => mapActivitiesWithPresentation(recentActivities),
    [recentActivities],
  );

  const renderEmptyState = (message: string) => (
    <div className="flex items-center justify-center h-32 border rounded-lg bg-muted/40">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  // Dialog states for quick actions
  const expenseDialog = useDialogState();
  const materialMasterDialog = useDialogState();
  const purchaseDialog = useDialogState();
  const vehicleUsageDialog = useDialogState();
  const activityDialog = useDialogState();

  // Load sites when vehicle usage dialog opens (must be after dialog state declaration)
  React.useEffect(() => {
    if (vehicleUsageDialog.isDialogOpen && !shouldLoadSites) {
      setShouldLoadSites(true);
    }
  }, [vehicleUsageDialog.isDialogOpen, shouldLoadSites]);

  // Loading states for form submissions
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Map VehicleUsageForm workCategory to database enum
  const mapWorkCategoryToEnum = (
    category: string,
  ): 'construction' | 'transport' | 'delivery' | 'maintenance' | 'inspection' | 'other' => {
    const categoryMap: Record<
      string,
      'construction' | 'transport' | 'delivery' | 'maintenance' | 'inspection' | 'other'
    > = {
      Transportation: 'transport',
      'Material Hauling': 'transport',
      'Equipment Transport': 'transport',
      'Site Inspection': 'inspection',
      Other: 'other',
    };
    return categoryMap[category] || 'other';
  };

  // Handler functions for each dialog
  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    setIsSubmittingExpense(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: data.category,
          subcategory: data.subcategory,
          description: data.description,
          amount: data.amount,
          date: formatDateOnly(data.date),
          vendor: data.vendor,
          siteId: data.siteId,
          siteName: data.siteName,
          receipt: data.receipt || null,
          approvedBy: data.approvedBy || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        expense?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.expense) {
        throw new Error(payload.error || 'Failed to create expense');
      }

      // Close dialog immediately for better UX
      expenseDialog.closeDialog();
      toast.success('Expense added successfully!', {
        description: 'Your expense entry has been recorded via Quick Action.',
      });

      // Invalidate cache in background (non-blocking)
      mutate((key) => typeof key === 'string' && key.startsWith('/api/expenses'), undefined, {
        revalidate: true,
      }).catch(() => {});
      mutate('/api/dashboard/overview', undefined, { revalidate: true }).catch(() => {});
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create expense');
      throw error;
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleMaterialMasterSubmit = async (data: MaterialMasterInput) => {
    setIsSubmittingMaterial(true);
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          standardRate: data.standardRate,
          isActive: data.isActive ?? true,
          hsn: data.hsn || null,
          taxRateId: data.taxRateId || null,
          siteId: data.siteId ?? null,
          openingBalance: data.openingBalance ?? 0,
          siteAllocations: data.siteAllocations || [],
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        material?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.material) {
        throw new Error(payload.error || 'Failed to create material');
      }

      // Close dialog immediately for better UX
      materialMasterDialog.closeDialog();
      toast.success('Material Master added successfully!', {
        description: 'Your material has been added to the database via Quick Action.',
      });

      // Invalidate cache in background (non-blocking)
      mutate((key) => typeof key === 'string' && key.startsWith('/api/materials'), undefined, {
        revalidate: true,
      }).catch(() => {});
      mutate('/api/dashboard/overview', undefined, { revalidate: true }).catch(() => {});
    } catch (error) {
      console.error('Error creating material:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create material');
      throw error;
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  const handlePurchaseSubmit = async (_data: Record<string, unknown>) => {
    // PurchaseForm handles its own submission internally using contexts
    // The form will show its own success/error toasts with Quick Action message
    purchaseDialog.closeDialog();

    // Invalidate purchases and materials cache
    await mutate(
      (key) =>
        typeof key === 'string' &&
        (key.startsWith('/api/purchases') || key.startsWith('/api/materials')),
      undefined,
      { revalidate: true },
    );

    // Invalidate dashboard cache
    await mutate('/api/dashboard/overview', undefined, { revalidate: true });
  };

  const handleVehicleUsageSubmit = async (data: Record<string, unknown>) => {
    setIsSubmittingVehicle(true);
    try {
      // Find selected vehicle and site from the fetched data
      const selectedVehicle = vehiclesData?.vehicles?.find(
        (v: Vehicle) => v.id === data.vehicleId,
      ) as Vehicle | undefined;
      const selectedSite = sitesData?.sites?.find((s) => s.id === data.siteId);

      if (!selectedVehicle) {
        throw new Error('Vehicle not found');
      }
      if (!selectedSite) {
        throw new Error('Site not found');
      }

      const totalDistance = Math.max(
        0,
        (data.endOdometer as number) - (data.startOdometer as number),
      );

      // Map workCategory from form value to database enum
      const workCategory = data.workCategory
        ? mapWorkCategoryToEnum(data.workCategory as string)
        : 'other';

      // Use vehicle data from already fetched list (no extra API call needed)
      const originalVehicle = selectedVehicle;

      const response = await fetch('/api/vehicles/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: data.vehicleId,
          vehicleNumber: selectedVehicle.vehicleNumber,
          date: typeof data.date === 'string' ? data.date : formatDateOnly(data.date as Date),
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          startOdometer: data.startOdometer || 0,
          endOdometer: data.endOdometer || 0,
          totalDistance: totalDistance,
          workDescription: data.workDescription || null,
          workCategory: workCategory,
          siteId: data.siteId || null,
          siteName: selectedSite.name,
          operator: selectedVehicle.operator || '',
          fuelConsumed: typeof data.fuelConsumed === 'number' ? data.fuelConsumed : 0,
          isRental: selectedVehicle.isRental ?? false,
          rentalCost: originalVehicle?.totalRentalCost ?? null,
          vendor: originalVehicle?.vendor ?? null,
          status: 'In Progress' as const,
          notes: data.notes || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        record?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.record) {
        throw new Error(payload.error || 'Failed to create vehicle usage record');
      }

      // Close dialog immediately for better UX
      vehicleUsageDialog.closeDialog();
      toast.success('Vehicle Check-in recorded successfully!', {
        description: 'Vehicle usage has been logged via Quick Action.',
      });

      // Invalidate cache in background (non-blocking)
      mutate((key) => typeof key === 'string' && key.startsWith('/api/vehicles'), undefined, {
        revalidate: true,
      }).catch(() => {});
      mutate('/api/dashboard/overview', undefined, { revalidate: true }).catch(() => {});
    } catch (error) {
      console.error('Error creating vehicle usage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create vehicle usage');
      throw error;
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  const handleActivitySubmit = async (data: ActivityFormData) => {
    setIsSubmittingActivity(true);
    try {
      // Get site name from activeSites
      const site = activeSites.find((s) => s.id === data.siteId);
      const siteName = site?.name || data.siteId;

      if (!siteName || !data.name || !data.startDate) {
        throw new Error('Please fill in all required fields');
      }

      // Map priority to status
      const statusMap: Record<
        ActivityFormData['priority'],
        'in_progress' | 'completed' | 'on_hold'
      > = {
        Critical: 'in_progress',
        High: 'in_progress',
        Medium: 'in_progress',
        Low: 'in_progress',
      };

      // Use a default unit since category is not a valid unit
      // Common units: sqft, cft, kg, bags, pieces, etc.
      const unit = 'sqft'; // Default unit, can be made configurable later

      const response = await fetch('/api/work-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: data.siteId || null,
          siteName: siteName,
          workType: data.name,
          description: data.description || null,
          workDate: data.startDate,
          unit: unit,
          totalQuantity: parseFloat(data.duration) || 0,
          laborHours: null, // assignedTeam is a string, not hours - set to null
          progressPercentage:
            data.priority === 'Critical'
              ? 100
              : data.priority === 'High'
                ? 75
                : data.priority === 'Medium'
                  ? 50
                  : 25,
          status: statusMap[data.priority] || 'in_progress',
          notes: data.resources || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        entry?: unknown;
        error?: string;
      };

      if (!response.ok || !payload.entry) {
        throw new Error(payload.error || 'Failed to create work progress entry');
      }

      // Close dialog immediately for better UX
      activityDialog.closeDialog();
      toast.success('Work Progress added successfully!', {
        description: 'Work progress has been logged via Quick Action.',
      });

      // Invalidate cache in background (non-blocking)
      mutate((key) => typeof key === 'string' && key.startsWith('/api/work-progress'), undefined, {
        revalidate: true,
      }).catch(() => {});
      mutate('/api/dashboard/overview', undefined, { revalidate: true }).catch(() => {});
    } catch (error) {
      console.error('Error creating work progress entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create work progress entry');
      throw error;
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  // Overview tab content
  const OverviewContent = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          icon={Building2}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          title="Active Sites"
          value={quickStats.activeSites}
          subtitle="Currently operational"
          tooltipLabel="Information about active sites"
          tooltipContent={<p>Number of construction sites currently operational</p>}
          onClick={() => onNavigate?.('nav-sites')}
        />

        <StatCard
          icon={Truck}
          iconBgColor="bg-orange-50"
          iconColor="text-orange-600"
          title="Vehicles"
          value={quickStats.totalVehicles}
          subtitle="Fleet & equipment"
          tooltipLabel="Information about vehicles and equipment"
          tooltipContent={<p>Total vehicles and equipment across all sites</p>}
          onClick={() => onNavigate?.('nav-vehicles')}
        />

        <StatCard
          icon={Package}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          title="Material Value"
          value={`₹${formatIndianCurrencyShort(quickStats.materialValue, 2)}`}
          subtitle="Inventory value"
          tooltipLabel="Information about material value"
          tooltipContent={
            <>
              <p>Total value of materials in inventory</p>
              <p>Includes: cement, steel, aggregates, etc.</p>
            </>
          }
          onClick={() => onNavigate?.('nav-materials')}
        />

        <StatCard
          icon={Receipt}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
          title="Monthly Expenses"
          value={`₹${formatCurrency(quickStats.monthlyExpenses)}`}
          subtitle="This month"
          tooltipLabel="Information about monthly expenses"
          tooltipContent={
            <>
              <p>Total expenses for current month</p>
              <p>Includes: labour, materials, equipment, transport</p>
            </>
          }
          onClick={() => onNavigate?.('nav-expenses')}
        />

        <StatCard
          icon={Users}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
          title="Active Vendors"
          value={quickStats.activeVendors}
          subtitle="Engaged partners"
          tooltipLabel="Information about active vendors"
          tooltipContent={<p>Number of vendors currently engaged in projects</p>}
          onClick={() => onNavigate?.('nav-vendors')}
        />

        <StatCard
          icon={TrendingUp}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          title="Completion Rate"
          value={`${quickStats.completionRate}%`}
          subtitle="Overall progress"
          tooltipLabel="Information about completion rate"
          tooltipContent={
            <>
              <p>Average completion percentage across all sites</p>
              <p>Calculated from project milestones</p>
            </>
          }
          onClick={() => onNavigate?.('nav-progress')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sites and Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Sites */}
          <SectionCard
            title="Active Construction Sites"
            toolbar={
              <div className="flex items-center gap-2">
                <InfoTooltip label="Information about active construction sites">
                  <p>Overview of all ongoing construction projects</p>
                  <p>Progress shows completion percentage</p>
                  <p>Budget tracking shows spent vs allocated amounts</p>
                </InfoTooltip>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('sites')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              {activeSites.length === 0
                ? renderEmptyState('No sites yet. Add a site to see progress here.')
                : activeSites.map((site) => {
                    const safeProgress = Number.isFinite(site.progress) ? site.progress : 0;
                    const allocated = site.budget.allocated || 0;
                    const spent = site.budget.spent || 0;
                    const budgetUsed = allocated > 0 ? (spent / allocated) * 100 : 0;
                    const remainingBudget = Math.max(allocated - spent, 0);

                    return (
                      <div key={site.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{site.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {site.location || '—'}
                            </div>
                          </div>
                          <StatusBadge status={site.status} />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{safeProgress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(safeProgress, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Next Milestone</p>
                            <p className="font-medium">{site.nextMilestone || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">
                              {site.dueDate ? formatDate(site.dueDate) : 'Not scheduled'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm pt-2 border-t">
                          <div>
                            <span className="text-muted-foreground">Budget: </span>
                            <span className="font-medium">
                              ₹{formatPercentage(spent / 100000, 1)}L / ₹
                              {formatPercentage(allocated / 100000, 1)}L
                            </span>
                          </div>
                          <div className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`font-medium cursor-help ${budgetUsed > 90 ? 'text-red-600' : 'text-green-600'}`}
                                  >
                                    {formatPercentage(budgetUsed, 0)}% used
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Percentage of allocated budget spent</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Remaining budget:&nbsp;
                          <span className="font-medium text-foreground">
                            ₹{formatCurrency(remainingBudget)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </SectionCard>

          {/* Quick Actions */}
          <SectionCard
            title="Quick Actions"
            toolbar={
              <InfoTooltip label="Information about quick actions">
                <p>Frequently used actions for quick access</p>
              </InfoTooltip>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {quickActions.map((action) => {
                const dialogMap: Record<string, () => void> = {
                  expenses: expenseDialog.openDialog,
                  'material-master': materialMasterDialog.openDialog,
                  materials: purchaseDialog.openDialog,
                  vehicles: vehicleUsageDialog.openDialog,
                  sites: activityDialog.openDialog,
                };
                const openDialog = dialogMap[action.action];
                const handleAction = () => {
                  // Always open dialog instead of navigating
                  openDialog?.();
                };

                return (
                  <Card
                    key={action.id}
                    className="group cursor-pointer transition-all hover:shadow-md hover:scale-105 h-full"
                    onClick={handleAction}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAction();
                      }
                    }}
                    aria-label={`${action.title}: ${action.description}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                      <div
                        className={`p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform`}
                      >
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm leading-tight">{action.title}</h3>
                        <p
                          className="text-xs text-muted-foreground leading-tight overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {action.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column - Alerts and Recent Activities */}
        <div className="space-y-8">
          {/* Alerts */}
          <SectionCard
            title="Alerts & Notifications"
            toolbar={
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <InfoTooltip label="Information about alerts and notifications">
                  <p>System alerts requiring attention</p>
                  <p>• Low stock warnings</p>
                  <p>• Maintenance reminders</p>
                  <p>• Budget notifications</p>
                </InfoTooltip>
              </div>
            }
          >
            <div className="space-y-3">
              {alerts.length === 0
                ? renderEmptyState('No alerts at the moment.')
                : alerts.map((alert) => (
                    <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                          </div>
                          {alert.priority && (
                            <Badge
                              variant={
                                alert.priority === 'high'
                                  ? 'destructive'
                                  : alert.priority === 'medium'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="w-fit"
                            >
                              {alert.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
            </div>
          </SectionCard>

          {/* Recent Activities */}
          <SectionCard
            title="Recent Activities"
            toolbar={
              <div className="flex items-center gap-2">
                <InfoTooltip label="Information about recent activities">
                  <p>Latest system activities and transactions</p>
                  <p>Real-time updates from all sites</p>
                </InfoTooltip>
                <Button variant="outline" size="sm" onClick={() => onNavigate?.('reports')}>
                  View All
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              {presentedActivities.length === 0
                ? renderEmptyState('No recent activity yet.')
                : presentedActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="p-2 rounded-lg bg-muted">
                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {activity.timestamp ? formatDate(activity.timestamp) : '—'}
                          </p>
                          {activity.amount !== null && (
                            <p className="text-sm font-medium">
                              ₹{formatCurrency(activity.amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  // Analytics tab content
  const AnalyticsContent = () => (
    <div className="space-y-6">
      <SectionCard title="Performance Analytics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Budget Utilization</h3>
              <div className="space-y-3">
                {activeSites.length === 0
                  ? renderEmptyState('No budget data available.')
                  : activeSites.map((site) => {
                      const allocated = site.budget.allocated || 0;
                      const spent = site.budget.spent || 0;
                      const usedPercent = allocated > 0 ? (spent / allocated) * 100 : 0;

                      return (
                        <div key={site.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{site.name}</span>
                            <span>{formatPercentage(usedPercent, 1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(usedPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Progress Tracking</h3>
              <div className="space-y-3">
                {activeSites.length === 0
                  ? renderEmptyState('No progress data available.')
                  : activeSites.map((site) => (
                      <div key={site.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{site.name}</span>
                          <span>{formatPercentage(site.progress ?? 0, 1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${Math.min(site.progress ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </SectionCard>
    </div>
  );

  // Reports tab content
  const ReportsContent = () => (
    <div className="space-y-6">
      <SectionCard title="Quick Reports">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3"
            onClick={() => onNavigate?.('reports')}
          >
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="text-center">
              <div className="font-medium">Financial Reports</div>
              <div className="text-xs text-muted-foreground">
                Budget, expenses, and financial analytics
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3"
            onClick={() => onNavigate?.('reports')}
          >
            <PieChart className="h-8 w-8 text-green-600" />
            <div className="text-center">
              <div className="font-medium">Progress Reports</div>
              <div className="text-xs text-muted-foreground">
                Site progress and milestone tracking
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-center gap-3"
            onClick={() => onNavigate?.('reports')}
          >
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="text-center">
              <div className="font-medium">Analytics</div>
              <div className="text-xs text-muted-foreground">Performance metrics and insights</div>
            </div>
          </Button>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <h1 className="sr-only">Dashboard - Construction Management Overview</h1>
      {error && (
        <Alert variant="destructive" className="mx-6 mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading && (
        <Card className="mx-6 mt-4">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">Loading dashboard data…</p>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <TabsContent value="overview" className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <OverviewContent />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <AnalyticsContent />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <ReportsContent />
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Action Dialogs */}
      <FormDialog
        title="Add Expense"
        description="Create a new expense entry"
        isOpen={expenseDialog.isDialogOpen}
        onOpenChange={(open) => (open ? expenseDialog.openDialog() : expenseDialog.closeDialog())}
        maxWidth="max-w-2xl"
      >
        <ExpenseForm
          onSubmit={handleExpenseSubmit}
          onCancel={expenseDialog.closeDialog}
          isLoading={false}
        />
      </FormDialog>

      <FormDialog
        title="Add Material"
        description="Create a new material master entry"
        isOpen={materialMasterDialog.isDialogOpen}
        onOpenChange={(open) =>
          open ? materialMasterDialog.openDialog() : materialMasterDialog.closeDialog()
        }
        maxWidth="max-w-2xl"
      >
        <MaterialMasterForm
          onSubmit={handleMaterialMasterSubmit}
          onCancel={materialMasterDialog.closeDialog}
        />
      </FormDialog>

      <FormDialog
        title="Add Material Purchase"
        description="Record a new material purchase"
        isOpen={purchaseDialog.isDialogOpen}
        onOpenChange={(open) => (open ? purchaseDialog.openDialog() : purchaseDialog.closeDialog())}
        maxWidth="max-w-4xl"
      >
        <PurchaseForm onSubmit={handlePurchaseSubmit} onCancel={purchaseDialog.closeDialog} />
      </FormDialog>

      <FormDialog
        title="Vehicle Usage"
        description="Log running hours and utilization"
        isOpen={vehicleUsageDialog.isDialogOpen}
        onOpenChange={(open) =>
          open ? vehicleUsageDialog.openDialog() : vehicleUsageDialog.closeDialog()
        }
        maxWidth="max-w-2xl"
      >
        <VehicleUsageForm
          onSubmit={handleVehicleUsageSubmit}
          onCancel={vehicleUsageDialog.closeDialog}
          isSubmitting={isSubmittingVehicle}
          vehicles={
            vehiclesData?.vehicles
              ? vehiclesData.vehicles.map((v: Vehicle) => ({
                  id: v.id,
                  vehicleNumber: v.vehicleNumber,
                  type: v.type,
                  make: v.make || '',
                  model: v.model || '',
                  year: v.year || 0,
                  siteId: v.siteId || '',
                  siteName: v.siteName || '',
                  status:
                    v.status === 'available' || v.status === 'in_use'
                      ? 'Active'
                      : v.status === 'maintenance'
                        ? 'Maintenance'
                        : v.status === 'idle'
                          ? 'Idle'
                          : 'Returned',
                  operator: v.operator || '',
                  isRental: v.isRental || false,
                  fuelCapacity: v.fuelCapacity || 0,
                  currentFuelLevel: v.currentFuelLevel || 0,
                  mileage: v.mileage || 0,
                  lastMaintenanceDate: v.lastMaintenanceDate || '',
                  nextMaintenanceDate: v.nextMaintenanceDate || '',
                  insuranceExpiry: v.insuranceExpiry || '',
                  registrationExpiry: v.registrationExpiry || '',
                  createdAt: v.createdAt || '',
                  lastUpdated: v.updatedAt || '',
                }))
              : []
          }
          sites={sitesData?.sites || []}
        />
      </FormDialog>

      <FormDialog
        title="Work Progress"
        description="Log work progress and activities"
        isOpen={activityDialog.isDialogOpen}
        onOpenChange={(open) => (open ? activityDialog.openDialog() : activityDialog.closeDialog())}
        maxWidth="max-w-2xl"
      >
        <ActivityForm
          onSubmit={handleActivitySubmit}
          onCancel={activityDialog.closeDialog}
          sites={activeSites.map((site) => ({ id: site.id, name: site.name }))}
          isSubmitting={isSubmittingActivity}
        />
      </FormDialog>
    </div>
  );
}
