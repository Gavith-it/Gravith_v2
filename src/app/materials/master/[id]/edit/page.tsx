'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';

interface MaterialMasterEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MaterialMasterEditPage({ params }: MaterialMasterEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [materialData, setMaterialData] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch material data based on resolvedParams.id
    // This is a mock implementation - replace with actual API call
    const mockMaterialData = {
      name: 'Portland Cement',
      category: 'Cement' as const,
      unit: 'bags',
      standardRate: 350,
      isActive: true,
      hsn: '25232910',
      taxRate: 18,
    };

    setMaterialData(mockMaterialData);
    setLoading(false);
  }, [resolvedParams.id]);

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
    console.log('Updated material master data:', data);
    // You can add API call to update the material master
    router.push('/materials');
  };

  const handleCancel = () => {
    router.push('/materials');
  };

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!materialData) {
    return <div className="container mx-auto py-6">Material not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Material" description="Update material master details." />
      <div className="max-w-2xl mx-auto">
        <MaterialMasterForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          defaultValues={materialData}
          isEdit={true}
        />
      </div>
    </div>
  );
}
