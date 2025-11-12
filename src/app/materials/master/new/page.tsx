'use client';

import { useRouter } from 'next/navigation';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';
import type { MaterialMasterInput } from '@/types/materials';

export default function MaterialMasterNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: MaterialMasterInput) => {
    // Handle form submission logic here
    console.log('New material master data:', data);
    // You can add API call to save the material master
    router.push('/materials');
  };

  const handleCancel = () => {
    router.push('/materials');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Material" description="Create a new material master." />
      <div className="max-w-2xl mx-auto">
        <MaterialMasterForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
