import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { formatDateOnly } from '@/lib/utils/date';

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
      { data: materialPurchaseTotals },
      { data: monthlyExpenseRows },
      { data: allExpenseRows },
      { count: activeVendorCount },
      { data: activityRows },
      { data: materialMastersRows },
      { data: vehicleRows },
    ] = await Promise.all([
      supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'Completed')
        .not('status', 'eq', 'Canceled'),
      supabase
        .from('sites')
        .select(
          'id, name, location, status, progress, expected_end_date, budget, spent, updated_at',
        )
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'Completed')
        .not('status', 'eq', 'Canceled')
        .order('updated_at', { ascending: false }),
      supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'returned'),
      supabase
        .from('material_purchases')
        .select('total_amount, created_at, vendor_invoice_number, description')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('material_purchases')
        .select('total_amount')
        .eq('organization_id', organizationId),
      supabase
        .from('expenses')
        .select('amount, date, description, status')
        .eq('organization_id', organizationId)
        .gte('date', startOfCurrentMonth())
        .lte('date', endOfCurrentMonth()),
      supabase
        .from('expenses')
        .select('amount, site_id, site_name')
        .eq('organization_id', organizationId),
      supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active'),
      supabase
        .from('project_activities')
        .select('id, name, progress')
        .eq('organization_id', organizationId),
      supabase
        .from('material_masters')
        .select('id, material_name, remaining_quantity, unit, site_id, site_name')
        .eq('organization_id', organizationId)
        .gt('remaining_quantity', 0),
      supabase
        .from('vehicles')
        .select('id, vehicle_number, last_maintenance_date, next_maintenance_date, status')
        .eq('organization_id', organizationId)
        .not('status', 'eq', 'returned'),
    ]);

    const materialValue = (materialPurchaseTotals ?? []).reduce<number>(
      (sum, purchase) => sum + Number(purchase.total_amount ?? 0),
      0,
    );

    const monthlyExpenses = (monthlyExpenseRows ?? []).reduce<number>(
      (sum, expense) => sum + Number(expense.amount ?? 0),
      0,
    );

    const completionRate = calculateAverageProgress(
      (activityRows ?? []).map((activity) => ({
        progress:
          typeof activity.progress === 'number'
            ? activity.progress
            : activity.progress !== null && activity.progress !== undefined
              ? Number(activity.progress)
              : null,
      })),
    );

    // Calculate spent per site from actual expenses
    const siteSpentMap = new Map<string, number>();
    (allExpenseRows ?? []).forEach((expense) => {
      const record = expense as Record<string, unknown>;
      const siteId = record.site_id;
      const siteName = record.site_name;
      const amount = Number(record.amount ?? 0);

      // Match by site_id if available, otherwise by site_name
      if (typeof siteId === 'string' && siteId) {
        const current = siteSpentMap.get(siteId) ?? 0;
        siteSpentMap.set(siteId, current + amount);
      } else if (typeof siteName === 'string' && siteName.trim()) {
        // Find site by name (case-insensitive, trimmed) and add to its spent
        const normalizedSiteName = siteName.trim().toLowerCase();
        const matchingSite = (siteRows ?? []).find((s) => {
          const sName = (s as Record<string, unknown>).name;
          return typeof sName === 'string' && sName.trim().toLowerCase() === normalizedSiteName;
        });
        if (matchingSite) {
          const siteIdFromMatch = (matchingSite as Record<string, unknown>).id;
          if (typeof siteIdFromMatch === 'string') {
            const current = siteSpentMap.get(siteIdFromMatch) ?? 0;
            siteSpentMap.set(siteIdFromMatch, current + amount);
          }
        }
      }
    });

    const activeSites = (siteRows ?? []).map<ActiveSite>((site) => {
      const record = site as Record<string, unknown>;
      const idValue = record.id;
      const nameValue = record.name;
      const locationValue = record.location;
      const progressValue = record.progress;
      const statusValue = record.status;
      const dueDateValue = record.expected_end_date;
      const budgetValue = record.budget;

      // Get spent from expenses map, fallback to sites.spent if no expenses found
      const siteId = typeof idValue === 'string' ? idValue : String(idValue ?? '');
      const calculatedSpent = siteSpentMap.get(siteId) ?? 0;
      const spentValue = calculatedSpent > 0 ? calculatedSpent : record.spent;

      return {
        id: siteId,
        name: typeof nameValue === 'string' ? nameValue : 'Unnamed site',
        location: typeof locationValue === 'string' ? locationValue : '',
        progress:
          typeof progressValue === 'number'
            ? progressValue
            : progressValue !== null && progressValue !== undefined
              ? Number(progressValue)
              : 0,
        status: typeof statusValue === 'string' ? statusValue : 'Unknown',
        nextMilestone: null,
        dueDate: typeof dueDateValue === 'string' ? dueDateValue : null,
        budget: {
          allocated:
            typeof budgetValue === 'number'
              ? budgetValue
              : budgetValue !== null && budgetValue !== undefined
                ? Number(budgetValue)
                : 0,
          spent:
            typeof spentValue === 'number'
              ? spentValue
              : spentValue !== null && spentValue !== undefined
                ? Number(spentValue)
                : calculatedSpent,
        },
      };
    });

    const recentPurchaseActivities = (materialPurchaseRows ?? []).map<RecentActivity>(
      (purchase) => {
        const record = purchase as Record<string, unknown>;
        const invoiceNumber = record.vendor_invoice_number;
        const createdAt = record.created_at;
        const description = record.description;

        return {
          id: `purchase-${typeof invoiceNumber === 'string' ? invoiceNumber : ''}-${String(createdAt ?? '')}`,
          type: 'purchase',
          description:
            typeof invoiceNumber === 'string' && invoiceNumber.length > 0
              ? `Purchase invoice ${invoiceNumber}`
              : typeof description === 'string' && description.length > 0
                ? description
                : 'Material purchase recorded',
          amount: Number(record.total_amount ?? 0),
          timestamp:
            typeof createdAt === 'string'
              ? createdAt
              : new Date(createdAt as string | number | Date).toISOString(),
        };
      },
    );

    const recentExpenseActivities = (monthlyExpenseRows ?? []).map<RecentActivity>((expense) => {
      const record = expense as Record<string, unknown>;
      const dateValue = record.date;
      const description = record.description;

      return {
        id: `expense-${String(dateValue ?? '')}-${typeof description === 'string' ? description : ''}`,
        type: 'expense',
        description:
          typeof description === 'string' && description.length > 0
            ? description
            : 'Expense recorded',
        amount: Number(record.amount ?? 0),
        timestamp:
          typeof dateValue === 'string'
            ? dateValue
            : new Date(dateValue as string | number | Date).toISOString(),
      };
    });

    const recentActivities = [...recentPurchaseActivities, ...recentExpenseActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    // Generate alerts
    const alerts: DashboardAlert[] = [];

    // 1. Low stock warnings (materials with remaining quantity < 10% of typical purchase)
    const lowStockMaterials = (materialMastersRows ?? []).filter((material) => {
      const record = material as Record<string, unknown>;
      const remainingQty = Number(record.remaining_quantity ?? 0);
      // Consider low stock if remaining quantity is less than 10 units (adjust threshold as needed)
      return remainingQty > 0 && remainingQty < 10;
    });

    if (lowStockMaterials.length > 0) {
      const materialNames = lowStockMaterials
        .slice(0, 3)
        .map((m) => {
          const record = m as Record<string, unknown>;
          return String(record.material_name ?? 'Unknown');
        })
        .join(', ');
      const count = lowStockMaterials.length;
      alerts.push({
        id: 'low-stock-warning',
        type: 'warning',
        title: 'Low Stock Alert',
        description:
          count === 1
            ? `${materialNames} is running low on stock.`
            : `${count} materials are running low on stock: ${materialNames}${count > 3 ? ' and more' : ''}.`,
        priority: 'high',
      });
    }

    // 2. Budget overrun warnings (sites with >90% budget used)
    const budgetAlerts = activeSites.filter((site) => {
      const budgetUsed =
        site.budget.allocated > 0 ? (site.budget.spent / site.budget.allocated) * 100 : 0;
      return budgetUsed >= 90 && budgetUsed < 100;
    });

    if (budgetAlerts.length > 0) {
      budgetAlerts.forEach((site) => {
        const budgetUsed =
          site.budget.allocated > 0 ? (site.budget.spent / site.budget.allocated) * 100 : 0;
        alerts.push({
          id: `budget-warning-${site.id}`,
          type: 'warning',
          title: 'Budget Warning',
          description: `${site.name} has used ${Math.round(budgetUsed)}% of allocated budget (₹${(site.budget.spent / 100000).toFixed(1)}L / ₹${(site.budget.allocated / 100000).toFixed(1)}L).`,
          priority: budgetUsed >= 95 ? 'high' : 'medium',
        });
      });
    }

    // 3. Budget exceeded alerts (sites with >100% budget used)
    const exceededBudgetSites = activeSites.filter((site) => {
      const budgetUsed =
        site.budget.allocated > 0 ? (site.budget.spent / site.budget.allocated) * 100 : 0;
      return budgetUsed >= 100;
    });

    if (exceededBudgetSites.length > 0) {
      exceededBudgetSites.forEach((site) => {
        const budgetUsed =
          site.budget.allocated > 0 ? (site.budget.spent / site.budget.allocated) * 100 : 0;
        alerts.push({
          id: `budget-exceeded-${site.id}`,
          type: 'warning',
          title: 'Budget Exceeded',
          description: `${site.name} has exceeded its budget by ${Math.round(budgetUsed - 100)}% (₹${(site.budget.spent / 100000).toFixed(1)}L / ₹${(site.budget.allocated / 100000).toFixed(1)}L).`,
          priority: 'high',
        });
      });
    }

    // 4. Vehicle maintenance reminders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const vehiclesNeedingService = (vehicleRows ?? []).filter((vehicle) => {
      const record = vehicle as Record<string, unknown>;
      const nextServiceDate = record.next_maintenance_date;

      if (!nextServiceDate) return false;

      const serviceDate = new Date(nextServiceDate as string);
      serviceDate.setHours(0, 0, 0, 0);

      // Alert if service is due within 7 days or overdue
      return serviceDate <= sevenDaysFromNow;
    });

    if (vehiclesNeedingService.length > 0) {
      const vehicleNumbers = vehiclesNeedingService
        .slice(0, 3)
        .map((v) => {
          const record = v as Record<string, unknown>;
          return String(record.vehicle_number ?? 'Unknown');
        })
        .join(', ');
      const count = vehiclesNeedingService.length;
      alerts.push({
        id: 'vehicle-maintenance-reminder',
        type: 'info',
        title: 'Vehicle Maintenance Due',
        description:
          count === 1
            ? `Vehicle ${vehicleNumbers} requires maintenance soon.`
            : `${count} vehicles require maintenance soon: ${vehicleNumbers}${count > 3 ? ' and more' : ''}.`,
        priority: 'medium',
      });
    }

    // Sort alerts by priority (high first, then medium, then low)
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

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
      alerts: alerts.slice(0, 10), // Limit to 10 most important alerts
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
  return formatDateOnly(date);
}

function endOfCurrentMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(23, 59, 59, 999);
  return formatDateOnly(date);
}

function calculateAverageProgress(activities: { progress?: number | null }[]): number {
  if (!activities.length) {
    return 0;
  }

  const total = activities.reduce((sum, activity) => sum + Number(activity.progress ?? 0), 0);
  return Math.round(total / activities.length);
}
