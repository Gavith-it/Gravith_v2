'use client';

import { useRouter } from 'next/navigation';

import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();

  const handleNavigate = (action: string) => {
    const routeMap: Record<string, string> = {
      expenses: '/expenses',
      'material-master': '/materials/master/new',
      materials: '/purchase',
      vehicles: '/vehicles/usage',
      sites: '/work-progress',
      'nav-sites': '/sites',
      'nav-vehicles': '/vehicles',
      'nav-materials': '/materials',
      'nav-expenses': '/expenses',
      'nav-vendors': '/vendors',
      'nav-progress': '/work-progress',
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
