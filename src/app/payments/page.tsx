'use client';

import dynamic from 'next/dynamic';

const PaymentsPage = dynamic(
  () => import('@/components/payments').then((mod) => ({ default: mod.PaymentsPage })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center" aria-busy="true">
        Loading payments...
      </div>
    ),
  },
);

export default function PaymentsPageRoute() {
  return <PaymentsPage />;
}
