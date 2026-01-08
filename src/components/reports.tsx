'use client';

import {
  TrendingUp,
  Receipt,
  Building2,
  Package,
  AlertTriangle,
  Activity,
  Calendar,
  Target,
  Info,
  BarChart3,
  Loader2,
  FileText,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import useSWR from 'swr';

import { useTableState } from '../lib/hooks/useTableState';
import { fetcher, swrConfig } from '../lib/swr';
import { formatDate } from '../lib/utils';

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
} from './charts/LazyRecharts';
import { DataTable } from './common/DataTable';
import { ExpenseReport } from './expense-report';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

type MonthlyExpensePoint = {
  key: string;
  label: string;
  Labour: number;
  Materials: number;
  Equipment: number;
  Transport: number;
  Utilities: number;
  Other: number;
  Total: number;
};

type ExpenseBreakdownSlice = {
  name: string;
  value: number;
};

type SitePerformanceEntry = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
  timelineProgress: number;
  milestoneProgress: number;
  qualityScore: number;
};

type LowStockMaterial = {
  id: string;
  name: string;
  unit: string;
  available: number;
  reorderLevel: number;
  updatedAt?: string;
};

type RecentActivityItem = {
  id: string;
  type: 'purchase' | 'expense' | 'work';
  title: string;
  description?: string;
  timestamp: string;
};

type ReportsOverview = {
  metrics: {
    totalSites: number;
    activeSites: number;
    totalBudget: number;
    totalSpent: number;
    avgProgress: number;
  };
  monthlyExpenses: MonthlyExpensePoint[];
  expenseBreakdown: ExpenseBreakdownSlice[];
  sitePerformance: SitePerformanceEntry[];
  lowStockMaterials: LowStockMaterial[];
  recentActivity: RecentActivityItem[];
};

const PIE_COLOR_MAP: Record<string, string> = {
  Labour: '#0088FE',
  Materials: '#00C49F',
  Equipment: '#FFBB28',
  Transport: '#FF8042',
  Utilities: '#8884D8',
  Other: '#A855F7',
};

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AREA_CATEGORY_KEYS = ['Labour', 'Materials', 'Equipment', 'Transport'] as const;

const AREA_COLORS: Record<(typeof AREA_CATEGORY_KEYS)[number], string> = {
  Labour: '#82ca9d',
  Materials: '#ffc658',
  Equipment: '#8884d8',
  Transport: '#ff7300',
};

const RECENT_ACTIVITY_ICONS = {
  purchase: Package,
  expense: Receipt,
  work: Activity,
};

const RECENT_ACTIVITY_STYLES = {
  purchase: { background: 'bg-green-50 border border-green-200', icon: 'text-green-600' },
  expense: { background: 'bg-blue-50 border border-blue-200', icon: 'text-blue-600' },
  work: { background: 'bg-orange-50 border border-orange-200', icon: 'text-orange-600' },
};

const CRORE_DIVISOR = 10_000_000;

const formatCroreValue = (value: number) =>
  value > 0 ? `₹${(value / CRORE_DIVISOR).toFixed(1)}Cr` : '₹0';

const formatLakhValue = (value: number) => `₹${(value / 100000).toFixed(1)}L`;

// Calculate weighted progress based on multiple factors
const calculateSiteProgress = (site: SitePerformanceEntry) => {
  const budgetWeight = 0.4;
  const timelineWeight = 0.3;
  const milestoneWeight = 0.2;
  const qualityWeight = 0.1;

  // Calculate missing properties if not provided
  const budgetProgress = site.budget > 0 ? (site.spent / site.budget) * 100 : site.progress;
  const timelineProgress = site.timelineProgress ?? site.progress;
  const milestoneProgress = site.milestoneProgress ?? site.progress;
  const qualityScore = site.qualityScore ?? 85;

  return Math.round(
    budgetProgress * budgetWeight +
      timelineProgress * timelineWeight +
      milestoneProgress * milestoneWeight +
      qualityScore * qualityWeight,
  );
};

export function ReportsPage() {
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // Fetch reports overview using SWR
  const {
    data: overview,
    error: swrError,
    isLoading,
    mutate: mutateReports,
  } = useSWR<ReportsOverview>('/api/reports/overview', fetcher, swrConfig);

  // Convert SWR error to string for display
  const error = swrError
    ? swrError instanceof Error
      ? swrError.message
      : 'Failed to load reports overview.'
    : null;

  const metrics = overview?.metrics ?? {
    totalSites: 0,
    activeSites: 0,
    totalBudget: 0,
    totalSpent: 0,
    avgProgress: 0,
  };

  const monthlyExpenses = overview?.monthlyExpenses ?? [];
  const expenseBreakdown = overview?.expenseBreakdown ?? [];
  const sitePerformance = overview?.sitePerformance ?? [];
  const lowStockMaterials = overview?.lowStockMaterials ?? [];
  const recentActivity = overview?.recentActivity ?? [];

  const pieData = expenseBreakdown.map((slice, index) => ({
    ...slice,
    color: PIE_COLOR_MAP[slice.name] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const handleRefresh = () => mutateReports();

  // Shared table state (must be declared before conditional returns to keep hook order)
  const tableState = useTableState({
    initialSortField: 'calculatedProgress',
    initialSortDirection: 'desc',
    initialItemsPerPage: 10,
  });

  // Calculate real-time progress for each site
  const sitesWithCalculatedProgress = useMemo(
    () =>
      sitePerformance.map((site) => ({
        ...site,
        calculatedProgress: calculateSiteProgress(site),
      })),
    [sitePerformance],
  );

  if (!overview && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!overview && error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="space-y-2">
          <p className="text-xl font-semibold text-destructive">Unable to load reports</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const lowStockCount = lowStockMaterials.length;

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
                <p className="text-2xl font-semibold">{metrics.activeSites}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalSites > 0 ? `${metrics.totalSites} total sites` : 'No active sites'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-green-600">₹</span>
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
                <p className="text-2xl font-semibold">{formatCroreValue(metrics.totalBudget)}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalSites > 0
                    ? `Across ${metrics.totalSites} sites`
                    : 'Awaiting site data'}
                </p>
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
                <p className="text-2xl font-semibold">{formatCroreValue(metrics.totalSpent)}</p>
                <p className="text-xs text-orange-600">
                  {metrics.totalBudget > 0
                    ? `${((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(1)}% used`
                    : 'No budget recorded'}
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
                <p className="text-2xl font-semibold">{metrics.avgProgress}%</p>
                <p className="text-xs text-purple-600">
                  {metrics.totalSites > 0 ? 'Overall completion' : 'Awaiting progress updates'}
                </p>
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
                <p className="text-2xl font-semibold">{lowStockCount}</p>
                <p className="text-xs text-red-600">
                  {lowStockCount > 0 ? 'Materials below min' : 'All stock healthy'}
                </p>
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
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value, name, props) => {
                    const formatted = `₹${Number(value).toLocaleString()}`;
                    const label = (props as { payload?: MonthlyExpensePoint }).payload?.label ?? '';
                    const total = monthlyExpenses.find((item) => item.label === label)?.Total ?? 0;
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
                {AREA_CATEGORY_KEYS.map((key) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={AREA_COLORS[key]}
                    fill={AREA_COLORS[key]}
                    fillOpacity={0.4}
                    connectNulls
                  />
                ))}
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
                      <p>• Equipment: Rentals, maintenance, depreciation</p>
                      <p>• Transport: Fuel and logistics</p>
                      <p>• Utilities & Other: Overheads, permits, misc.</p>
                    </div>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={activeSegment !== null ? 90 : 80}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={entry.color}
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
                      const total = pieData.reduce((sum, item) => sum + item.value, 0);
                      const percentage =
                        total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0';
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
            )}
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
            data={sitesWithCalculatedProgress.map((site) => {
              const budgetPercent =
                site.budget > 0 ? ((site.spent / site.budget) * 100).toFixed(1) : '0';
              const timelinePercent = site.timelineProgress.toFixed(1);
              const milestonePercent = site.milestoneProgress.toFixed(1);
              const qualityPercent = (site.qualityScore ?? 85).toFixed(1);

              return {
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
                              <p>Budget: {budgetPercent}% (40% weight)</p>
                              <p>Timeline: {timelinePercent}% (30% weight)</p>
                              <p>Milestones: {milestonePercent}% (20% weight)</p>
                              <p>Quality: {qualityPercent}% (10% weight)</p>
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
                    <span>Spent: {formatLakhValue(site.spent)}</span>
                    <span>Budget: {formatLakhValue(site.budget)}</span>
                  </div>
                ),
                details: (
                  <div className="text-xs text-muted-foreground">
                    <div>Status: {site.status}</div>
                    <div>Reported Progress: {site.progress}%</div>
                    <div>Start: {site.startDate ? formatDate(site.startDate) : '—'}</div>
                    <div>End: {site.endDate ? formatDate(site.endDate) : '—'}</div>
                  </div>
                ),
              };
            })}
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
          {lowStockMaterials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All tracked materials are above their reorder levels.
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockMaterials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-red-800">{material.name}</p>
                    <p className="text-sm text-red-600">
                      Available: {material.available.toLocaleString()} {material.unit || 'units'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs">
                      Low Stock
                    </Badge>
                    <p className="text-xs text-red-600 mt-1">
                      Reorder at: {material.reorderLevel.toFixed(0)} {material.unit || 'units'}
                    </p>
                    {material.updatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(material.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => {
                const Icon = RECENT_ACTIVITY_ICONS[item.type];
                const styles = RECENT_ACTIVITY_STYLES[item.type];
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${styles.background}`}
                  >
                    <Icon className={`h-4 w-4 ${styles.icon}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.timestamp ? formatDate(item.timestamp) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
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
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList className="grid w-auto grid-cols-4">
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <span className="text-base font-semibold">₹</span>
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
                <TabsTrigger value="expense-report" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Expense Report
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-3">
                {error && (
                  <span className="hidden text-sm text-destructive sm:inline">{error}</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Refreshing
                    </>
                  ) : (
                    'Refresh'
                  )}
                </Button>
                <Badge variant="outline" className="flex items-center gap-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3" />
                      Live Data
                    </>
                  )}
                </Badge>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-destructive sm:hidden">{error}</p>}
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

        <TabsContent value="expense-report" className="flex-1 overflow-auto">
          <div className="p-6">
            <ExpenseReport />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
