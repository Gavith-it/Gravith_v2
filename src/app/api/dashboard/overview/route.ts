import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

type QuickStats = {
  activeSites: number;
  totalVehicles: number;
  materialValue: number;
  monthlyExpenses: number;
  activeVendors: number;
  completionRate: number;
};

type RecentActivity = {
  id: string;
  type: 'expense' | 'purchase' | 'vehicle' | 'site';
  description: string;
  amount: number | null;
  timestamp: string;
};

type DashboardAlert = {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
};

type ActiveSite = {
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

type DashboardPayload = {
  quickStats: QuickStats;
  recentActivities: RecentActivity[];
  alerts: DashboardAlert[];
  activeSites: ActiveSite[];
};

const emptyDashboard: DashboardPayload = {
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

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Dashboard: failed to load user', authError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Dashboard: unable to resolve organization membership', profileError);
      return NextResponse.json(emptyDashboard);
    }

    const organizationId = profile.organization_id;

    const [
      { count: activeSitesCount },
      { data: siteRows },
      { count: vehicleCount },
      { data: materialPurchaseRows },
      { data: monthlyExpenseRows },
      { count: activeVendorCount },
      { data: activityRows },
    ] = await Promise.all([
      supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'Completed')
        .not('status', 'eq', 'Canceled'),
      supabase
        .from('sites')
        .select('id, name, location, status, progress, expected_end_date, budget, spent, updated_at')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'returned'),
      supabase
        .from('material_purchases')
        .select('total_amount, created_at, vendor_invoice_number')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('expenses')
        .select('amount, date, description, status')
        .eq('organization_id', organizationId)
        .gte('date', startOfCurrentMonth())
        .lte('date', endOfCurrentMonth()),
      supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active'),
      supabase
        .from('project_activities')
        .select('id, name, progress')
        .eq('organization_id', organizationId),
    ]);

    const materialValue = (materialPurchaseRows ?? []).reduce<number>(
      (sum, purchase) => sum + Number(purchase.total_amount ?? 0),
      0,
    );

    const monthlyExpenses = (monthlyExpenseRows ?? []).reduce<number>(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0,
    );

    const completionRate = calculateAverageProgress(activityRows ?? []);

    const activeSites = (siteRows ?? []).map<ActiveSite>((site) => ({
      id: site.id,
      name: site.name,
      location: site.location ?? '',
      progress: Number(site.progress ?? 0),
      status: site.status ?? 'Unknown',
      nextMilestone: null,
      dueDate: site.expected_end_date,
      budget: {
        allocated: Number(site.budget ?? 0),
        spent: Number(site.spent ?? 0),
      },
    }));

    const recentPurchaseActivities = (materialPurchaseRows ?? []).map<RecentActivity>((purchase) => ({
      id: `purchase-${purchase.vendor_invoice_number ?? ''}-${purchase.created_at}`,
      type: 'purchase',
      description: purchase.vendor_invoice_number
        ? `Purchase invoice ${purchase.vendor_invoice_number}`
        : 'Material purchase recorded',
      amount: Number(purchase.total_amount ?? 0),
      timestamp: purchase.created_at,
    }));

    const recentExpenseActivities = (monthlyExpenseRows ?? []).map<RecentActivity>((expense) => ({
      id: `expense-${expense.date}-${expense.description}`,
      type: 'expense',
      description: expense.description ?? 'Expense recorded',
      amount: Number(expense.amount ?? 0),
      timestamp: expense.date,
    }));

    const recentActivities = [...recentPurchaseActivities, ...recentExpenseActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    const payload: DashboardPayload = {
      quickStats: {
        activeSites: activeSitesCount ?? 0,
        totalVehicles: vehicleCount ?? 0,
        materialValue,
        monthlyExpenses,
        activeVendors: activeVendorCount ?? 0,
        completionRate,
      },
      recentActivities,
      alerts: [],
      activeSites,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Dashboard overview failed', error);
    return NextResponse.json(emptyDashboard);
  }
}

function startOfCurrentMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split('T')[0]!;
}

function endOfCurrentMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return date.toISOString().split('T')[0]!;
}

function calculateAverageProgress(
  activities: { progress?: number | null }[],
): number {
  if (!activities.length) {
    return 0;
  }

  const total = activities.reduce((sum, activity) => sum + Number(activity.progress ?? 0), 0);
  return Math.round(total / activities.length);
}

