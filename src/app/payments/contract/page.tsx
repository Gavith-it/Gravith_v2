'use client';

import { useRouter } from 'next/navigation';

import PaymentContractForm from '@/components/forms/PaymentContractForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePayments } from '@/lib/contexts';
import { toast } from 'sonner';

export default function PaymentContractPage() {
  const router = useRouter();
  const { addPayment } = usePayments();

  const handleSubmit = async (data: {
    clientName: string;
    projectName: string;
    contractValue: string;
    dueDate: string;
    paymentTerms: string;
    invoiceNumber: string;
    notes: string;
  }) => {
    try {
      await addPayment({
        clientName: data.clientName,
        amount: Number(data.contractValue) || 0,
        status: 'pending',
        dueDate: data.dueDate || undefined,
      });
      toast.success('Payment contract created');
      router.push('/payments');
    } catch (error) {
      console.error('Failed to create payment contract', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment');
    }
  };

  const handleCancel = () => {
    router.push('/payments');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Contract" description="Create a new payment contract." />
      <div className="max-w-2xl mx-auto">
        <PaymentContractForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
