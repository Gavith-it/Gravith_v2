'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import PaymentRecordForm from '@/components/forms/PaymentRecordForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function PaymentRecordPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<
    Array<{
      id: string;
      clientName: string;
      projectName: string;
      contractValue: number;
      dueDate: string;
      status: string;
    }>
  >([]);

  useEffect(() => {
    // Fetch payments data
    // This is a mock implementation - replace with actual API call
    const mockPayments = [
      {
        id: '1',
        clientName: 'ABC Developers',
        projectName: 'Residential Complex A',
        contractValue: 50000000,
        dueDate: '2024-12-31',
        status: 'Pending',
      },
      {
        id: '2',
        clientName: 'XYZ Builders',
        projectName: 'Commercial Building B',
        contractValue: 75000000,
        dueDate: '2024-11-30',
        status: 'Pending',
      },
    ];

    setPayments(mockPayments);
  }, []);

  const handleSubmit = (data: {
    paymentId: string;
    amount: string;
    date: string;
    method: string;
    transactionId: string;
    receivedBy: string;
    notes: string;
  }) => {
    // Handle form submission logic here
    console.log('Payment record data:', data);
    // You can add API call to save the payment record
    router.push('/payments');
  };

  const handleCancel = () => {
    router.push('/payments');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payment Record" description="Record payments against contracts." />
      <div className="max-w-2xl mx-auto">
        <PaymentRecordForm payments={payments} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
