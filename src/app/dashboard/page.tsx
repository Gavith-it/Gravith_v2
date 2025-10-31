'use client';

import { useRouter } from 'next/navigation';

import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();

  const handleNavigate = (action: string) => {
    // Map quick action IDs to their respective routes
    const routeMap: Record<string, string> = {
      expenses: '/expenses',
      'material-master': '/materials/master/new',
      materials: '/purchase',
      vehicles: '/vehicles/usage',
      sites: '/work-progress',
    };

    const route = routeMap[action] || '/';
    router.push(route);
  };

  return (
    <main id="main">
      <Dashboard onNavigate={handleNavigate} />
    </main>
  );
}
