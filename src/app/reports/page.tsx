'use client';

import dynamic from 'next/dynamic';

const ReportsPage = dynamic(
  () => import('@/components/reports').then((mod) => ({ default: mod.ReportsPage })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center" aria-busy="true">
        Loading reports...
      </div>
    ),
  },
);

export default function ReportsPageRoute() {
  return <ReportsPage />;
}
