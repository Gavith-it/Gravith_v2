'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate } from 'swr';

import VendorNewForm, { type VendorFormData } from '@/components/forms/VendorForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVendors } from '@/lib/contexts';
import { formatDateOnly } from '@/lib/utils/date';

export default function VendorNewPage() {
  const router = useRouter();
  const { addVendor, refresh } = useVendors();

  const handleSubmit = async (data: VendorFormData) => {
    try {
      // Use context's addVendor which automatically updates the context state
      await addVendor({
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
      });

      // Also invalidate SWR cache for any components using SWR directly
      await mutate((key) => typeof key === 'string' && key.startsWith('/api/vendors'), undefined, {
        revalidate: true,
      });

      // Refresh context to ensure all pages see the new vendor immediately
      await refresh();

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
