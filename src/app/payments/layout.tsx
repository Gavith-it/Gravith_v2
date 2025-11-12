'use client';

import type { ReactNode } from 'react';

import { PaymentsProvider } from '@/lib/contexts/payments-context';

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return <PaymentsProvider>{children}</PaymentsProvider>;
}
