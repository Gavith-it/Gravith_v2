'use client';

import { useRouter } from 'next/navigation';

import PaymentContractForm from '@/components/forms/PaymentContractForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function PaymentContractPage() {
  const router = useRouter();

  const handleSubmit = (data: {
    clientName: string;
    projectName: string;
    contractValue: string;
    dueDate: string;
    paymentTerms: string;
    invoiceNumber: string;
    notes: string;
  }) => {
    // Handle form submission logic here
    console.log('Payment contract data:', data);
    // You can add API call to save the payment contract
    router.push('/payments');
  };

  const handleCancel = () => {
    router.push('/payments');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Contract" description="Create or manage payment contracts." />
      <div className="max-w-2xl mx-auto">
        <PaymentContractForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
