'use client';

import { useRouter } from 'next/navigation';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function MaterialMasterNewPage() {
  const router = useRouter();

  const handleSubmit = (data: {
    name: string;
    category:
      | 'Cement'
      | 'Steel'
      | 'Concrete'
      | 'Bricks'
      | 'Sand'
      | 'Aggregate'
      | 'Timber'
      | 'Electrical'
      | 'Plumbing'
      | 'Paint'
      | 'Other';
    unit: string;
    standardRate: number;
    isActive: boolean;
    hsn: string;
    taxRate: number;
  }) => {
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
