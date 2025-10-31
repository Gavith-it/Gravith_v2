'use client';

import {
  TrendingUp,
  DollarSign,
  Building2,
  Package,
  Truck,
  AlertTriangle,
  Activity,
  Calendar,
  Target,
  Info,
  BarChart3,
} from 'lucide-react';
import React, { useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';

import { useTableState } from '../lib/hooks/useTableState';
import { formatDate } from '../lib/utils';

import { DataTable } from './common/DataTable';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

// Mock data for demonstration
const monthlyExpenses = [
  { month: 'Jan', Labour: 120000, Materials: 180000, Vehicles: 95000, Other: 45000, Total: 440000 },
  {
    month: 'Feb',
    Labour: 135000,
    Materials: 200000,
    Vehicles: 110000,
    Other: 38000,
    Total: 483000,
  },
  {
    month: 'Mar',
    Labour: 145000,
    Materials: 170000,
    Vehicles: 125000,
    Other: 52000,
    Total: 492000,
  },
  {
    month: 'Apr',
    Labour: 125000,
    Materials: 220000,
    Vehicles: 105000,
    Other: 48000,
    Total: 498000,
  },
  {
    month: 'May',
    Labour: 155000,
    Materials: 190000,
    Vehicles: 140000,
    Other: 35000,
    Total: 520000,
  },
  {
    month: 'Jun',
    Labour: 165000,
    Materials: 210000,
    Vehicles: 130000,
    Other: 41000,
    Total: 546000,
  },
];

// Site performance data with comprehensive progress tracking
// Progress % is calculated based on multiple factors:
// 1. Budget utilization (40% weight) - Amount spent vs total budget
// 2. Timeline adherence (30% weight) - Actual vs planned schedule
// 3. Milestone completion (20% weight) - Major deliverables completed
// 4. Quality metrics (10% weight) - Inspections passed, rework needed
const sitePerformance = [
  {
    name: 'Residential Complex A',
    budget: 5000000,
    spent: 3200000,
    progress: 64,
    startDate: '2024-01-15',
    endDate: '2024-12-30',
    completionPercentage: 64,
    budgetProgress: 64, // 3.2Cr spent out of 5Cr = 64%
    timelineProgress: 70, // 70% of planned time elapsed
    milestoneProgress: 60, // 6 out of 10 major milestones completed
    qualityScore: 85, // 85% quality compliance
  },
  {
    name: 'Commercial Plaza B',
    budget: 7500000,
    spent: 4100000,
    progress: 55,
    startDate: '2024-02-01',
    endDate: '2025-06-15',
    completionPercentage: 55,
    budgetProgress: 55, // 4.1Cr spent out of 7.5Cr = 55%
    timelineProgress: 60, // 60% of planned time elapsed
    milestoneProgress: 50, // 5 out of 10 major milestones completed
    qualityScore: 90, // 90% quality compliance
  },
  {
    name: 'Highway Bridge Project',
    budget: 3500000,
    spent: 3350000,
    progress: 96,
    startDate: '2024-03-10',
    endDate: '2024-11-20',
    completionPercentage: 96,
    budgetProgress: 96, // 3.35Cr spent out of 3.5Cr = 96%
    timelineProgress: 95, // 95% of planned time elapsed
    milestoneProgress: 100, // All 8 major milestones completed
    qualityScore: 92, // 92% quality compliance
  },
];

const expenseBreakdown = [
  { name: 'Labour', value: 890000, color: '#0088FE' },
  { name: 'Materials', value: 1170000, color: '#00C49F' },
  { name: 'Vehicles', value: 705000, color: '#FFBB28' },
  { name: 'Other', value: 269000, color: '#FF8042' },
];

const lowStockMaterials = [
  { name: 'Cement (OPC 53)', current: 45, minimum: 50, unit: 'bags' },
  { name: 'Steel Bars (16mm)', current: 850, minimum: 1000, unit: 'kg' },
  { name: 'Aggregates', current: 12, minimum: 15, unit: 'tons' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Calculate weighted progress based on multiple factors
const calculateSiteProgress = (site: {
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  completionPercentage: number;
  budgetProgress?: number;
  timelineProgress?: number;
  milestoneProgress?: number;
  qualityScore?: number;
}) => {
  const budgetWeight = 0.4;
  const timelineWeight = 0.3;
  const milestoneWeight = 0.2;
  const qualityWeight = 0.1;

  // Calculate missing properties if not provided
  const budgetProgress = site.budgetProgress ?? (site.spent / site.budget) * 100;
  const timelineProgress = site.timelineProgress ?? site.completionPercentage;
  const milestoneProgress = site.milestoneProgress ?? site.completionPercentage;
  const qualityScore = site.qualityScore ?? 85; // Default quality score

  return Math.round(
    budgetProgress * budgetWeight +
      timelineProgress * timelineWeight +
      milestoneProgress * milestoneWeight +
      qualityScore * qualityWeight,
  );
};

export function ReportsPage() {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // Use shared state hooks
  const tableState = useTableState({
    initialSortField: 'calculatedProgress',
    initialSortDirection: 'desc',
    initialItemsPerPage: 10,
  });

  // Calculate real-time progress for each site
  const sitesWithCalculatedProgress = sitePerformance.map((site) => ({
    ...site,
    calculatedProgress: calculateSiteProgress(site),
  }));

  const totalBudget = sitePerformance.reduce((sum, site) => sum + site.budget, 0);
  const totalSpent = sitePerformance.reduce((sum, site) => sum + site.spent, 0);
  const avgProgress = Math.round(
    sitesWithCalculatedProgress.reduce((sum, site) => sum + site.calculatedProgress, 0) /
      sitesWithCalculatedProgress.length,
  );

  // Financial tab content
  const FinancialContent = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Active Sites</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Number of construction sites currently in operation
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-semibold">3</p>
                <p className="text-xs text-green-600">All operational</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>Combined allocated budget for all active projects</p>
                          <p>Cr = Crores (₹10,000,000)</p>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-semibold">₹{(totalBudget / 10000000).toFixed(1)}Cr</p>
                <p className="text-xs text-muted-foreground">Across all sites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>Total amount spent across all projects</p>
                          <p>Includes all categories: labour, materials, equipment</p>
                          <p>Cr = Crores (₹10,000,000)</p>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-semibold">₹{(totalSpent / 10000000).toFixed(1)}Cr</p>
                <p className="text-xs text-orange-600">
                  {((totalSpent / totalBudget) * 100).toFixed(1)}% used
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>Average completion across all sites</p>
                          <p>Weighted calculation based on:</p>
                          <p>• Budget utilization (40%)</p>
                          <p>• Timeline adherence (30%)</p>
                          <p>• Milestone completion (20%)</p>
                          <p>• Quality metrics (10%)</p>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-semibold">{avgProgress}%</p>
                <p className="text-xs text-purple-600">Overall completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>Materials with inventory below minimum threshold</p>
                          <p>Requires immediate procurement attention</p>
                          <p>Minimum levels set per material type</p>
                        </div>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-semibold">{lowStockMaterials.length}</p>
                <p className="text-xs text-red-600">Materials below min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Monthly Expense Trends
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>Monthly spending patterns across all categories</p>
                      <p>• X-Axis: Months (Jan-Jun)</p>
                      <p>• Y-Axis: Amount in ₹ (Rupees)</p>
                      <p>• Shows: Labour, Materials, Total trends</p>
                      <p>Stacked areas show category breakdown</p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => {
                    const formatted = `₹${Number(value).toLocaleString()}`;
                    const total =
                      monthlyExpenses.find(
                        (item) => item.month === (props as { label?: string }).label,
                      )?.Total || 0;
                    const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0';
                    return [`${formatted} (${percentage}%)`, name];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  }}
                  labelStyle={{
                    color: '#1e40af',
                    fontWeight: '700',
                    fontSize: '15px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
                    paddingBottom: '6px',
                  }}
                  itemStyle={{
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '4px 0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Total"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="Labour"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="Materials"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Expense Distribution
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p>Percentage breakdown of total expenses</p>
                      <p>Categories include:</p>
                      <p>• Labour: Worker wages and contractor payments</p>
                      <p>• Materials: Raw materials and supplies</p>
                      <p>• Vehicles: Equipment rental and fuel</p>
                      <p>• Other: Utilities, permits, miscellaneous</p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={activeSegment !== null ? 90 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveSegment(index)}
                  onMouseLeave={() => setActiveSegment(null)}
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke={activeSegment === index ? '#fff' : 'none'}
                      strokeWidth={activeSegment === index ? 3 : 0}
                      style={{
                        filter:
                          activeSegment === index
                            ? 'brightness(1.1) drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
                            : 'none',
                        transformOrigin: 'center',
                        transform: activeSegment === index ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease-in-out',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const total = expenseBreakdown.reduce((sum, item) => sum + item.value, 0);
                    const percentage = ((Number(value) / total) * 100).toFixed(1);
                    return [`₹${Number(value).toLocaleString()} (${percentage}%)`, name];
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  }}
                  labelStyle={{
                    color: '#1e40af',
                    fontWeight: '700',
                    fontSize: '15px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
                    paddingBottom: '6px',
                  }}
                  itemStyle={{
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    margin: '4px 0',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color, fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Progress tab content
  const ProgressContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Site Performance Overview
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Progress % Calculation:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Budget utilization (40%)</li>
                      <li>• Timeline adherence (30%)</li>
                      <li>• Milestone completion (20%)</li>
                      <li>• Quality metrics (10%)</li>
                    </ul>
                  </div>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'name', label: 'Site Name', sortable: true },
              { key: 'progress', label: 'Progress', sortable: true },
              { key: 'budget', label: 'Budget Status', sortable: true },
              { key: 'details', label: 'Details', sortable: false },
            ]}
            data={sitesWithCalculatedProgress.map((site) => ({
              name: <span className="font-medium">{site.name}</span>,
              progress: (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <span className="text-muted-foreground cursor-help hover:text-foreground transition-colors">
                            {site.calculatedProgress}% Complete
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-xs space-y-1">
                            <p className="font-medium">Progress Breakdown:</p>
                            <p>Budget: {site.budgetProgress}% (40% weight)</p>
                            <p>Timeline: {site.timelineProgress}% (30% weight)</p>
                            <p>Milestones: {site.milestoneProgress}% (20% weight)</p>
                            <p>Quality: {site.qualityScore}% (10% weight)</p>
                          </div>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <Progress value={site.calculatedProgress} className="h-2" />
                </div>
              ),
              budget: (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Spent: ₹{(site.spent / 100000).toFixed(1)}L</span>
                  <span>Budget: ₹{(site.budget / 100000).toFixed(1)}L</span>
                </div>
              ),
              details: (
                <div className="text-xs text-muted-foreground">
                  <div>Progress: {site.progress}%</div>
                  <div>Start: {formatDate(site.startDate)}</div>
                  <div>End: {formatDate(site.endDate)}</div>
                </div>
              ),
            }))}
            onSort={tableState.setSortField}
            onPageChange={tableState.setCurrentPage}
            pageSize={tableState.itemsPerPage}
            currentPage={tableState.currentPage}
            totalPages={tableState.totalPages(sitesWithCalculatedProgress.length)}
            sortField={tableState.sortField}
            sortDirection={tableState.sortDirection}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Analytics tab content
  const AnalyticsContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Material Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockMaterials.map((material, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium text-red-800">{material.name}</p>
                  <p className="text-sm text-red-600">
                    Current: {material.current} {material.unit}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="text-xs">
                    Low Stock
                  </Badge>
                  <p className="text-xs text-red-600 mt-1">
                    Min: {material.minimum} {material.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">New budget revision approved</p>
                <p className="text-xs text-muted-foreground">
                  Residential Complex A - ₹50Cr budget increased
                </p>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Package className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Material delivery completed</p>
                <p className="text-xs text-muted-foreground">
                  Steel bars (500kg) delivered to Commercial Plaza B
                </p>
              </div>
              <span className="text-xs text-muted-foreground">4 hours ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Truck className="h-4 w-4 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Vehicle maintenance scheduled</p>
                <p className="text-xs text-muted-foreground">
                  Excavator MH-12-AB-1234 due for service
                </p>
              </div>
              <span className="text-xs text-muted-foreground">6 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <Tabs defaultValue="financial" className="flex-1 flex flex-col overflow-hidden">
        {/* Navigation Tabs - Topmost */}
        <Card className="border-0 shadow-none rounded-none border-b bg-gradient-to-r from-background to-muted/20">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-auto grid-cols-3">
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="progress" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live Data
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        <TabsContent value="financial" className="flex-1 overflow-auto">
          <div className="p-6">
            <FinancialContent />
          </div>
        </TabsContent>

        <TabsContent value="progress" className="flex-1 overflow-auto">
          <div className="p-6">
            <ProgressContent />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-auto">
          <div className="p-6">
            <AnalyticsContent />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
