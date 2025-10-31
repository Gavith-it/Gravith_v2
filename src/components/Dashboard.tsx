import {
  Building2,
  Truck,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowRight,
  MapPin,
  ShoppingCart,
  Info,
  Database,
  BarChart3,
  PieChart,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

import { useDialogState } from '../lib/hooks/useDialogState';
import { formatCurrency, formatDate, formatPercentage } from '../lib/utils';

import { FormDialog } from './common/FormDialog';
import ActivityForm from './forms/ActivityForm';
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

// Helper component for info tooltips
interface InfoTooltipProps {
  label: string;
  children: React.ReactNode;
}

function InfoTooltip({ label, children }: InfoTooltipProps) {
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

// Reusable StatCard component for quick stats
interface StatCardProps {
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  value: string | number;
  subtitle: string;
  tooltipLabel: string;
  tooltipContent: React.ReactNode;
}

function StatCard({
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  value,
  subtitle,
  tooltipLabel,
  tooltipContent,
}: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${iconBgColor}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
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

// Mock data for dashboard
const dashboardData = {
  quickStats: {
    activeSites: 3,
    totalVehicles: 12,
    materialValue: 18500000,
    monthlyExpenses: 3200000,
    activeVendors: 8,
    completionRate: 78,
  },
  recentActivities: [
    {
      id: '1',
      type: 'purchase',
      description: 'Cement delivery received at Residential Complex A',
      time: '2 hours ago',
      amount: 85000,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      id: '2',
      type: 'expense',
      description: 'Labour payment processed for Highway Bridge Project',
      time: '4 hours ago',
      amount: 125000,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      id: '3',
      type: 'vehicle',
      description: 'Vehicle KA-01-AB-1234 maintenance completed',
      time: '6 hours ago',
      amount: 15000,
      icon: Truck,
      color: 'text-orange-600',
    },
    {
      id: '4',
      type: 'site',
      description: 'New milestone achieved at Commercial Plaza B',
      time: '1 day ago',
      amount: null,
      icon: Target,
      color: 'text-purple-600',
    },
  ],
  alerts: [
    {
      id: '1',
      type: 'warning',
      title: 'Low Stock Alert',
      description: 'Cement running low at Residential Complex A - Only 45 bags remaining',
      priority: 'high',
      action: 'Order Now',
    },
    {
      id: '2',
      type: 'info',
      title: 'Vehicle Maintenance Due',
      description: '2 vehicles due for scheduled maintenance this week',
      priority: 'medium',
      action: 'Schedule',
    },
    {
      id: '3',
      type: 'success',
      title: 'Budget Performance',
      description: 'Highway Bridge Project is 12% under budget this month',
      priority: 'low',
      action: 'View Details',
    },
  ],
  activeSites: [
    {
      id: '1',
      name: 'Residential Complex A',
      location: 'Bangalore North',
      progress: 65,
      status: 'On Track',
      nextMilestone: 'Foundation Completion',
      dueDate: '2024-02-15',
      budget: {
        allocated: 5000000,
        spent: 3250000,
      },
    },
    {
      id: '2',
      name: 'Commercial Plaza B',
      location: 'Electronic City',
      progress: 45,
      status: 'Delayed',
      nextMilestone: 'Structural Work',
      dueDate: '2024-02-20',
      budget: {
        allocated: 8000000,
        spent: 4200000,
      },
    },
    {
      id: '3',
      name: 'Highway Bridge Project',
      location: 'NH-44 Stretch',
      progress: 80,
      status: 'Ahead',
      nextMilestone: 'Final Inspection',
      dueDate: '2024-02-10',
      budget: {
        allocated: 12000000,
        spent: 8800000,
      },
    },
  ],
  quickActions: [
    {
      id: '1',
      title: 'Record Expense',
      description: 'Add new expense entry',
      icon: DollarSign,
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
      title: 'Site Update',
      description: 'Log site progress',
      icon: Building2,
      color: 'bg-purple-500',
      action: 'sites',
    },
  ],
};

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { quickStats, recentActivities, alerts, activeSites, quickActions } = dashboardData;

  // Dialog states for quick actions
  const expenseDialog = useDialogState();
  const materialMasterDialog = useDialogState();
  const purchaseDialog = useDialogState();
  const vehicleUsageDialog = useDialogState();
  const activityDialog = useDialogState();

  // Handler functions for each dialog
  const handleExpenseSubmit = async (data: Record<string, unknown>) => {
    console.log('Expense submitted:', data);
    expenseDialog.closeDialog();
    // TODO: Call API to save expense
  };

  const handleMaterialMasterSubmit = async (data: Record<string, unknown>) => {
    console.log('Material master submitted:', data);
    materialMasterDialog.closeDialog();
    // TODO: Call API to save material master
  };

  const handlePurchaseSubmit = async (data: Record<string, unknown>) => {
    console.log('Purchase submitted:', data);
    purchaseDialog.closeDialog();
    // TODO: Call API to save purchase
  };

  const handleVehicleUsageSubmit = async (data: Record<string, unknown>) => {
    console.log('Vehicle usage submitted:', data);
    vehicleUsageDialog.closeDialog();
    // TODO: Call API to save vehicle usage
  };

  const handleActivitySubmit = async (data: Record<string, unknown>) => {
    console.log('Activity submitted:', data);
    activityDialog.closeDialog();
    // TODO: Call API to save activity
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'On Track':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            On Track
          </Badge>
        );
      case 'Delayed':
        return <Badge variant="destructive">Delayed</Badge>;
      case 'Ahead':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Ahead
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
        />

        <StatCard
          icon={Package}
          iconBgColor="bg-green-50"
          iconColor="text-green-600"
          title="Material Value"
          value={`₹${formatPercentage(quickStats.materialValue / 10000000, 1)}Cr`}
          subtitle="Inventory value"
          tooltipLabel="Information about material value"
          tooltipContent={
            <>
              <p>Total value of materials in inventory</p>
              <p>Includes: cement, steel, aggregates, etc.</p>
            </>
          }
        />

        <StatCard
          icon={DollarSign}
          iconBgColor="bg-red-50"
          iconColor="text-red-600"
          title="Monthly Expenses"
          value={`₹${formatPercentage(quickStats.monthlyExpenses / 100000, 1)}L`}
          subtitle="This month"
          tooltipLabel="Information about monthly expenses"
          tooltipContent={
            <>
              <p>Total expenses for current month</p>
              <p>Includes: labour, materials, equipment, transport</p>
            </>
          }
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
              {activeSites.map((site) => (
                <div key={site.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{site.name}</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {site.location}
                      </div>
                    </div>
                    {getStatusBadge(site.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{site.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${site.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Next Milestone</p>
                      <p className="font-medium">{site.nextMilestone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(site.dueDate)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t">
                    <div>
                      <span className="text-muted-foreground">Budget: </span>
                      <span className="font-medium">
                        ₹{formatPercentage(site.budget.spent / 100000, 1)}L / ₹
                        {formatPercentage(site.budget.allocated / 100000, 1)}L
                      </span>
                    </div>
                    <div className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`font-medium cursor-help ${site.budget.spent / site.budget.allocated > 0.9 ? 'text-red-600' : 'text-green-600'}`}
                            >
                              {formatPercentage(
                                (site.budget.spent / site.budget.allocated) * 100,
                                0,
                              )}
                              % used
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Percentage of allocated budget spent</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              ))}
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
                // Map action to dialog opener
                const dialogMap: Record<string, () => void> = {
                  expenses: expenseDialog.openDialog,
                  'material-master': materialMasterDialog.openDialog,
                  materials: purchaseDialog.openDialog,
                  vehicles: vehicleUsageDialog.openDialog,
                  sites: activityDialog.openDialog,
                };
                const onClick = dialogMap[action.action] || undefined;

                return (
                  <Card
                    key={action.id}
                    className="group cursor-pointer transition-all hover:shadow-md hover:scale-105 h-full"
                    onClick={onClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick?.();
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
              {alerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-sm">{alert.description}</p>
                      </div>
                      <Button size="sm" variant="outline" className="w-full">
                        {alert.action}
                      </Button>
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
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      {activity.amount && (
                        <p className="text-sm font-medium">₹{formatCurrency(activity.amount)}</p>
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
                {activeSites.map((site) => (
                  <div key={site.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{site.name}</span>
                      <span>
                        {formatPercentage((site.budget.spent / site.budget.allocated) * 100, 1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(site.budget.spent / site.budget.allocated) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Progress Tracking</h3>
              <div className="space-y-3">
                {activeSites.map((site) => (
                  <div key={site.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{site.name}</span>
                      <span>{site.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${site.progress}%` }}
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
          vehicles={[]}
          sites={[]}
        />
      </FormDialog>

      <FormDialog
        title="Add Activity"
        description="Schedule new construction activity"
        isOpen={activityDialog.isDialogOpen}
        onOpenChange={(open) => (open ? activityDialog.openDialog() : activityDialog.closeDialog())}
        maxWidth="max-w-2xl"
      >
        <ActivityForm
          onSubmit={handleActivitySubmit}
          onCancel={activityDialog.closeDialog}
          sites={activeSites.map((site) => ({ id: site.id, name: site.name }))}
        />
      </FormDialog>
    </div>
  );
}
