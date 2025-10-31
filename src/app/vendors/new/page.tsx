'use client';

import { useRouter } from 'next/navigation';

import VendorNewForm, { type VendorFormData } from '@/components/forms/VendorForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function VendorNewPage() {
  const router = useRouter();

  const handleSubmit = (data: VendorFormData) => {
    // Handle form submission logic here
    console.log('New vendor data:', data);
    // You can add API call to save the vendor
    router.push('/vendors');
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
