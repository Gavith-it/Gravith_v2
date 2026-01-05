'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate } from 'swr';

import VendorNewForm, { type VendorFormData } from '@/components/forms/VendorForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatDateOnly } from '@/lib/utils/date';
import type { Vendor } from '@/types';

export default function VendorNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: VendorFormData) => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email || '',
          address: data.address,
          gstNumber: data.gstNumber || '',
          panNumber: data.panNumber || '',
          bankAccount: data.bankAccountNumber || '',
          ifscCode: data.ifscCode || '',
          paymentTerms: data.paymentTerms || '',
          notes: data.notes || '',
          status: 'active',
          totalPaid: 0,
          pendingAmount: 0,
          rating: 0,
          lastPayment: '',
          registrationDate: formatDateOnly(new Date()),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        vendor?: Vendor;
        error?: string;
      };

      if (!response.ok || !payload.vendor) {
        throw new Error(payload.error || 'Failed to create vendor');
      }

      // Invalidate vendors cache to refresh the list
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/vendors'), undefined, {
        revalidate: true,
      });

      toast.success('Vendor created successfully');
      router.push('/vendors');
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create vendor');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/vendors');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Vendor" description="Create a new vendor." />
      <div className="max-w-2xl mx-auto">
        <VendorNewForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
