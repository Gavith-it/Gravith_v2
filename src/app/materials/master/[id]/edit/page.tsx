'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import type { MaterialMasterInput } from '@/types/materials';
import type { MaterialMaster } from '@/types/entities';

interface MaterialMasterEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MaterialMasterEditPage({ params }: MaterialMasterEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [materialData, setMaterialData] = useState<MaterialMasterInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterialData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/materials/${resolvedParams.id}`, {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as {
          material?: MaterialMaster;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load material');
        }

        if (payload.material) {
          const material = payload.material;
          // Convert taxRate to taxRateId if needed
          const getTaxRateIdFromRate = (rate: number): string => {
            const taxRateMap: Record<number, string> = {
              0: 'GST0',
              5: 'GST5',
              12: 'GST12',
              18: 'GST18',
              28: 'GST28',
            };
            return taxRateMap[rate] || 'GST18';
          };
          setMaterialData({
            name: material.name,
            category: material.category,
            unit: material.unit,
            siteId: material.siteId ?? undefined,
            standardRate: material.standardRate,
            isActive: material.isActive,
            hsn: material.hsn,
            taxRateId: material.taxRateId ?? getTaxRateIdFromRate(material.taxRate),
            openingBalance: material.openingBalance,
            siteAllocations: material.siteAllocations,
          });
        } else {
          throw new Error('Material not found');
        }
      } catch (error) {
        console.error('Error fetching material:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load material');
        setMaterialData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchMaterialData();
  }, [resolvedParams.id]);

  const handleSubmit = async (data: MaterialMasterInput) => {
    try {
      const response = await fetch(`/api/materials/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          unit: data.unit,
          standardRate: data.standardRate,
          isActive: data.isActive,
          hsn: data.hsn,
          taxRateId: data.taxRateId,
          siteId: data.siteId ?? null,
          openingBalance: data.openingBalance,
          siteAllocations: data.siteAllocations,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        material?: MaterialMaster;
        error?: string;
      };

      if (!response.ok || !payload.material) {
        throw new Error(payload.error || 'Failed to update material');
      }

      toast.success('Material updated successfully');
      router.push('/materials');
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update material');
      throw error; // Re-throw to let the form handle the error state
    }
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
