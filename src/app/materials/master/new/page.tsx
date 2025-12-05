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

      // Invalidate SWR cache to ensure new material appears immediately
      // Invalidate both base endpoint and all paginated cache keys
      await mutate('/api/materials');
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/materials'),
        undefined,
        { revalidate: true },
      );

      toast.success('Material created successfully');
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
