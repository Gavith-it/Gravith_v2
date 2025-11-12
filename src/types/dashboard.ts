export type DashboardQuickStats = {
  activeSites: number;
  totalVehicles: number;
  materialValue: number;
  monthlyExpenses: number;
  activeVendors: number;
  completionRate: number;
};

export type DashboardRecentActivityType = 'expense' | 'purchase' | 'vehicle' | 'site';

export type DashboardRecentActivity = {
  id: string;
  type: DashboardRecentActivityType;
  description: string;
  amount: number | null;
  timestamp: string;
};

export type DashboardAlertPriority = 'low' | 'medium' | 'high';

export type DashboardAlert = {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: DashboardAlertPriority;
  action?: string | null;
};

export type DashboardActiveSite = {
  id: string;
  name: string;
  location: string;
  progress: number;
  status: string;
  nextMilestone: string | null;
  dueDate: string | null;
  budget: {
    allocated: number;
    spent: number;
  };
};

export type DashboardData = {
  quickStats: DashboardQuickStats;
  recentActivities: DashboardRecentActivity[];
  alerts: DashboardAlert[];
  activeSites: DashboardActiveSite[];
};

