import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const EXPENSE_CATEGORIES = [
  'Labour',
  'Materials',
  'Equipment',
  'Transport',
  'Utilities',
  'Other',
] as const;
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function resolveContext(supabase: SupabaseServerClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated.' as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return { error: 'Unable to resolve organization.' as const };
  }

  return { organizationId: profile.organization_id as string, userId: user.id };
}

type SiteRow = {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  budget: number | string | null;
  spent: number | string | null;
  progress: number | string | null;
};

type ExpenseRow = {
  id: string;
  amount: number | string | null;
  category: ExpenseCategory;
  date: string;
  description: string | null;
  created_at: string | null;
};

type MaterialRow = {
  id: string;
  name: string;
  unit: string | null;
  quantity: number | string | null;
  consumed_quantity: number | string | null;
  updated_at: string | null;
};

type PurchaseRow = {
  id: string;
  material_name: string;
  total_amount: number | string | null;
  vendor_name: string | null;
  purchase_date: string | null;
  created_at: string | null;
};

type WorkProgressRow = {
  id: string;
  site_name: string | null;
  work_type: string | null;
  work_date: string | null;
  created_at: string | null;
};

function formatMonthLabel(date: Date) {
  return date.toLocaleString('en-IN', { month: 'short' });
}

function buildTimelineProgress(start?: string | null, end?: string | null) {
  if (!start || !end) {
    return 0;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const total = endDate.getTime() - startDate.getTime();
  if (total <= 0) {
    return 100;
  }
  const today = Date.now();
  if (today <= startDate.getTime()) {
    return 0;
  }
  if (today >= endDate.getTime()) {
    return 100;
  }
  return Math.min(100, Math.max(0, ((today - startDate.getTime()) / total) * 100));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const ctx = await resolveContext(supabase);

    if ('error' in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const { organizationId } = ctx;

    const [sitesRes, expensesRes, materialsRes, purchasesRes, workProgressRes] = await Promise.all([
      supabase
        .from('sites')
        .select('id, name, status, start_date, expected_end_date, budget, spent, progress')
        .eq('organization_id', organizationId),
      supabase
        .from('expenses')
        .select('id, amount, category, date, description, created_at')
        .eq('organization_id', organizationId)
        .order('date', { ascending: true }),
      supabase
        .from('material_masters')
        .select('id, name, unit, quantity, consumed_quantity, updated_at')
        .eq('organization_id', organizationId),
      supabase
        .from('material_purchases')
        .select('id, material_name, total_amount, vendor_name, purchase_date, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('work_progress_entries')
        .select('id, site_name, work_type, work_date, created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (
      sitesRes.error ||
      expensesRes.error ||
      materialsRes.error ||
      purchasesRes.error ||
      workProgressRes.error
    ) {
      console.error('Reports overview errors', {
        sitesError: sitesRes.error,
        expensesError: expensesRes.error,
        materialsError: materialsRes.error,
        purchasesError: purchasesRes.error,
        workProgressError: workProgressRes.error,
      });
      return NextResponse.json({ error: 'Failed to load reports overview.' }, { status: 500 });
    }

    const siteRows = (sitesRes.data ?? []) as SiteRow[];
    const expenseRows = (expensesRes.data ?? []) as ExpenseRow[];
    const materialRows = (materialsRes.data ?? []) as MaterialRow[];
    const purchaseRows = (purchasesRes.data ?? []) as PurchaseRow[];
    const workRows = (workProgressRes.data ?? []) as WorkProgressRow[];

    // Metrics
    const totalBudget = siteRows.reduce((sum, site) => sum + Number(site.budget ?? 0), 0);

    // Calculate totalSpent from actual expenses instead of sites.spent (which may not be updated)
    const totalSpent = expenseRows.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);

    // Calculate avgProgress from actual site progress values, or use timeline progress as fallback
    const progressValues = siteRows.map((site) => {
      const siteProgress = Number(site.progress ?? 0);
      // If progress is 0, try to calculate from timeline
      if (siteProgress === 0) {
        return buildTimelineProgress(site.start_date, site.expected_end_date);
      }
      return siteProgress;
    });

    const avgProgress =
      progressValues.length > 0
        ? Math.round(progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length)
        : 0;

    // Monthly expenses (last 6 months)
    const monthlyMap = new Map<
      string,
      {
        key: string;
        label: string;
        Labour: number;
        Materials: number;
        Equipment: number;
        Transport: number;
        Utilities: number;
        Other: number;
        Total: number;
      }
    >();

    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
      monthlyMap.set(key, {
        key,
        label: formatMonthLabel(monthDate),
        Labour: 0,
        Materials: 0,
        Equipment: 0,
        Transport: 0,
        Utilities: 0,
        Other: 0,
        Total: 0,
      });
    }

    const categoryTotals: Record<ExpenseCategory, number> = {
      Labour: 0,
      Materials: 0,
      Equipment: 0,
      Transport: 0,
      Utilities: 0,
      Other: 0,
    };

    expenseRows.forEach((expense) => {
      const date = new Date(expense.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        const amount = Number(expense.amount ?? 0);
        entry.Total += amount;
        const category = expense.category ?? 'Other';
        if (category in entry) {
          entry[category as ExpenseCategory] += amount;
        } else {
          entry.Other += amount;
        }
      }
      const amount = Number(expense.amount ?? 0);
      const category = expense.category ?? 'Other';
      categoryTotals[category] = (categoryTotals[category] ?? 0) + amount;
    });

    const monthlyExpenses = Array.from(monthlyMap.values());

    const expenseBreakdown = EXPENSE_CATEGORIES.map((category) => ({
      name: category,
      value: categoryTotals[category] ?? 0,
    })).filter((slice) => slice.value > 0);

    // Site performance
    const sitePerformance = siteRows.map((site) => ({
      id: site.id,
      name: site.name,
      status: site.status ?? 'Active',
      budget: Number(site.budget ?? 0),
      spent: Number(site.spent ?? 0),
      progress: Number(site.progress ?? 0),
      startDate: site.start_date ?? '',
      endDate: site.expected_end_date ?? '',
      timelineProgress: buildTimelineProgress(site.start_date, site.expected_end_date),
      milestoneProgress: Number(site.progress ?? 0),
      qualityScore: 90,
    }));

    // Low stock materials (heuristic: available <= max(5, consumed * 0.2))
    const lowStockMaterials = materialRows
      .map((material) => {
        const available = Number(material.quantity ?? 0);
        const consumed = Number(material.consumed_quantity ?? 0);
        const reorderLevel = Math.max(5, consumed * 0.2);
        return {
          id: material.id,
          name: material.name,
          unit: material.unit ?? '',
          available,
          reorderLevel,
          updatedAt: material.updated_at ?? undefined,
        };
      })
      .filter((material) => material.available <= material.reorderLevel)
      .sort((a, b) => a.available - b.available)
      .slice(0, 6);

    // Recent activity
    const recentActivity = [
      ...purchaseRows.map((purchase) => ({
        id: `purchase-${purchase.id}`,
        type: 'purchase' as const,
        title: `Purchase • ${purchase.material_name}`,
        description: `₹${Number(purchase.total_amount ?? 0).toLocaleString()} ${
          purchase.vendor_name ? `• ${purchase.vendor_name}` : ''
        }`,
        timestamp: purchase.created_at ?? purchase.purchase_date ?? new Date().toISOString(),
      })),
      ...expenseRows.slice(-5).map((expense) => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        title: `Expense • ${expense.category}`,
        description: `₹${Number(expense.amount ?? 0).toLocaleString()} ${
          expense.description ? `• ${expense.description}` : ''
        }`,
        timestamp: expense.created_at ?? expense.date,
      })),
      ...workRows.map((entry) => ({
        id: `work-${entry.id}`,
        type: 'work' as const,
        title: `Work Progress • ${entry.site_name ?? 'Site'}`,
        description: entry.work_type ?? 'Progress update logged',
        timestamp: entry.created_at ?? entry.work_date ?? new Date().toISOString(),
      })),
    ]
      .filter((item) => Boolean(item.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    const response = NextResponse.json({
      metrics: {
        totalSites: siteRows.length,
        activeSites: siteRows.filter((site) => (site.status ?? '').toLowerCase() === 'active')
          .length,
        totalBudget,
        totalSpent,
        avgProgress,
      },
      monthlyExpenses,
      expenseBreakdown,
      sitePerformance,
      lowStockMaterials,
      recentActivity,
    });

    // Add cache headers: cache for 60 seconds, revalidate in background
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Unexpected error generating reports overview', error);
    return NextResponse.json(
      { error: 'Unexpected error generating reports overview.' },
      { status: 500 },
    );
  }
}
