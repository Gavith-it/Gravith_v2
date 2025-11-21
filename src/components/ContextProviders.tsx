'use client';

import type { ReactNode } from 'react';
import React, { Suspense } from 'react';

import {
  MaterialReceiptsProvider,
  MaterialsProvider,
  ExpensesProvider,
  PaymentsProvider,
  SchedulingProvider,
  VendorsProvider,
  WorkProgressProvider,
  VehicleRefuelingProvider,
  VehiclesProvider,
  VehicleUsageProvider,
} from '@/lib/contexts';

interface ContextProvidersProps {
  children: ReactNode;
  requiredContexts: string[];
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export function ContextProviders({ children, requiredContexts }: ContextProvidersProps) {
  // MaterialsProvider is needed by: materials, purchase, masters, dashboard, sites, work-progress (uses useMaterials)
  const needsMaterials =
    requiredContexts.includes('materials') ||
    requiredContexts.includes('purchase') ||
    requiredContexts.includes('masters') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('sites') ||
    requiredContexts.includes('work-progress') ||
    requiredContexts.includes('project-activity');

  // VendorsProvider is needed by: vendors, materials, purchase, expenses, payments, dashboard, vehicles (uses useVendors)
  const needsVendors =
    requiredContexts.includes('vendors') ||
    requiredContexts.includes('materials') ||
    requiredContexts.includes('purchase') ||
    requiredContexts.includes('expenses') ||
    requiredContexts.includes('payments') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('vehicles');

  // MaterialReceiptsProvider is needed by: materials, purchase, dashboard
  const needsMaterialReceipts =
    requiredContexts.includes('materials') ||
    requiredContexts.includes('purchase') ||
    requiredContexts.includes('dashboard');

  // ExpensesProvider is needed by: expenses, dashboard, reports
  const needsExpenses =
    requiredContexts.includes('expenses') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('reports');

  // PaymentsProvider is needed by: payments, dashboard, reports
  const needsPayments =
    requiredContexts.includes('payments') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('reports');

  // SchedulingProvider is needed by: scheduling, dashboard, work-progress
  const needsScheduling =
    requiredContexts.includes('scheduling') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('work-progress');

  // WorkProgressProvider is needed by: work-progress, project-activity, dashboard
  const needsWorkProgress =
    requiredContexts.includes('work-progress') ||
    requiredContexts.includes('project-activity') ||
    requiredContexts.includes('dashboard');

  // VehiclesProvider is needed by: vehicles, dashboard, work-progress
  const needsVehicles =
    requiredContexts.includes('vehicles') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('work-progress');

  // VehicleUsageProvider is needed by: vehicles, dashboard, work-progress
  const needsVehicleUsage =
    requiredContexts.includes('vehicles') ||
    requiredContexts.includes('dashboard') ||
    requiredContexts.includes('work-progress');

  // VehicleRefuelingProvider is needed by: vehicles, dashboard
  const needsVehicleRefueling =
    requiredContexts.includes('vehicles') ||
    requiredContexts.includes('dashboard');

  let providers = children;

  // Wrap with required providers in correct order
  if (needsVehicleRefueling) {
    providers = <VehicleRefuelingProvider>{providers}</VehicleRefuelingProvider>;
  }
  if (needsVehicleUsage) {
    providers = <VehicleUsageProvider>{providers}</VehicleUsageProvider>;
  }
  if (needsVehicles) {
    providers = <VehiclesProvider>{providers}</VehiclesProvider>;
  }
  if (needsWorkProgress) {
    providers = <WorkProgressProvider>{providers}</WorkProgressProvider>;
  }
  if (needsScheduling) {
    providers = <SchedulingProvider>{providers}</SchedulingProvider>;
  }
  if (needsPayments) {
    providers = <PaymentsProvider>{providers}</PaymentsProvider>;
  }
  if (needsExpenses) {
    providers = <ExpensesProvider>{providers}</ExpensesProvider>;
  }
  if (needsMaterialReceipts) {
    providers = <MaterialReceiptsProvider>{providers}</MaterialReceiptsProvider>;
  }
  if (needsVendors) {
    providers = <VendorsProvider>{providers}</VendorsProvider>;
  }
  if (needsMaterials) {
    providers = <MaterialsProvider>{providers}</MaterialsProvider>;
  }

  return <Suspense fallback={<LoadingFallback />}>{providers}</Suspense>;
}

