'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate } from 'swr';

import MaterialMasterForm from '@/components/forms/MaterialMasterForm';
import { PageHeader } from '@/components/layout/PageHeader';
import type { MaterialMaster } from '@/types/entities';
import type { MaterialMasterInput } from '@/types/materials';

export default function MaterialMasterNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: MaterialMasterInput) => {
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
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
        throw new Error(payload.error || 'Failed to create material');
      }

      // Optimistically update the cache - add the new material immediately
      // This ensures instant UI update before navigation
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
          if (!currentData) {
            // If no cache, fetch fresh data with cache bypass
            const freshResponse = await fetch('/api/materials?page=1&limit=50', {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            });
            const freshData = await freshResponse.json();
            return {
              materials: [payload.material!, ...(freshData.materials || [])],
              pagination: freshData.pagination || { page: 1, limit: 50, total: 1, totalPages: 1 },
            };
          }
          // Handle list response (with materials array)
          if ('materials' in currentData) {
            // Add new material to the beginning of the list
            return {
              ...currentData,
              materials: [payload.material!, ...currentData.materials],
              pagination: currentData.pagination
                ? {
                    ...currentData.pagination,
                    total: currentData.pagination.total + 1,
                  }
                : undefined,
            };
          }
          // Handle single material response - return as-is (new material won't be in single material cache)
          return currentData;
        },
        { revalidate: false },
      );

      toast.success('Material created successfully');

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
      console.error('Error creating material:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create material');
      throw error; // Re-throw to let the form handle the error state
    }
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
