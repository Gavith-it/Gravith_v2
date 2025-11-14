'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import PaymentRecordForm, { type PaymentRecordFormData } from '@/components/forms/PaymentRecordForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePayments } from '@/lib/contexts';
import { formatDateOnly } from '@/lib/utils/date';
import { toast } from 'sonner';

export default function PaymentRecordPage() {
  const router = useRouter();
  const { payments, isLoading, updatePayment } = usePayments();

  const handleSubmit = useCallback(
    async (data: PaymentRecordFormData) => {
      try {
        await updatePayment(data.paymentId, {
          paidDate: data.paidDate ? formatDateOnly(data.paidDate) : undefined,
          status: data.status,
        });
        toast.success('Payment updated successfully');
        router.push('/payments');
      } catch (error) {
        console.error('Failed to update payment record', error);
        toast.error(error instanceof Error ? error.message : 'Failed to update payment.');
      }
    },
    [router, updatePayment],
  );

  const handleCancel = useCallback(() => {
    router.push('/payments');
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader title="Update Payment" description="Record received payments and update status." />
      <div className="mx-auto max-w-xl">
        <PaymentRecordForm payments={payments} onSubmit={handleSubmit} onCancel={handleCancel} />
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading payments…</p>}
      </div>
    </div>
  );
}
