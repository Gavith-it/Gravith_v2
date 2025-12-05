'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetcher, swrConfig } from '@/lib/swr';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

interface MaterialMasterEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function MaterialMasterEditPage({ params }: MaterialMasterEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);

  // Fetch material data using SWR
  const {
    data: materialResponse,
    isLoading: loading,
    error,
  } = useSWR<{ material: MaterialMaster }>(
    resolvedParams.id ? `/api/materials/${resolvedParams.id}` : null,
    fetcher,
    swrConfig,
  );

  // Convert material to form data format
  const materialData = materialResponse?.material
    ? (() => {
        const material = materialResponse.material;
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
        return {
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
        };
      })()
    : null;

  // Show error toast if fetch fails
  if (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load material');
  }

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

      // Optimistically update the cache - update the material immediately
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/materials'),
        async (
          currentData:
            | {
                materials: MaterialMaster[];
                pagination?: { page: number; limit: number; total: number; totalPages: number };
              }
            | { material: MaterialMaster }
            | undefined,
        ) => {
          if (!currentData) return undefined;
          // Handle list response (with materials array)
          if ('materials' in currentData) {
            return {
              ...currentData,
              materials: currentData.materials.map((m: MaterialMaster) =>
                m.id === resolvedParams.id ? payload.material! : m,
              ),
            };
          }
          // Handle single material response
          if ('material' in currentData && currentData.material.id === resolvedParams.id) {
            return {
              material: payload.material!,
            };
          }
          return currentData;
        },
        { revalidate: false },
      );

      toast.success('Material updated successfully');

      // Immediately revalidate to fetch fresh data from server (bypassing all caches)
      // This ensures production gets the latest data immediately
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/materials'),
        undefined,
        {
          revalidate: true,
          rollbackOnError: false,
        },
      );

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
