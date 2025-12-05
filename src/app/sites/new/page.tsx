'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mutate } from 'swr';

import SiteForm from '@/components/forms/SiteForm';
import { PageHeader } from '@/components/layout/PageHeader';
import type { Site, SiteInput } from '@/types/sites';

export default function SiteNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: SiteInput) => {
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        site?: Site;
        error?: string;
      };

      if (!response.ok || !payload.site) {
        throw new Error(payload.error || 'Failed to create site');
      }

      // Optimistically update the cache - add the new site immediately
      // This ensures instant UI update before navigation
      await mutate(
        '/api/sites',
        async (currentData: { sites: Site[] } | undefined) => {
          if (!currentData) {
            // If no cache, fetch fresh data with cache bypass
            const freshResponse = await fetch('/api/sites', {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            });
            const freshData = await freshResponse.json();
            return {
              sites: [payload.site!, ...(freshData.sites || [])],
            };
          }
          // Add new site to the beginning of the list
          return {
            sites: [payload.site!, ...currentData.sites],
          };
        },
        { revalidate: false },
      );

      toast.success('Site created successfully');

      // Immediately revalidate to fetch fresh data from server (bypassing all caches)
      // This ensures production gets the latest data immediately
      await mutate('/api/sites', undefined, {
        revalidate: true,
        rollbackOnError: false,
      });

      router.push('/sites');
    } catch (error) {
      console.error('Error creating site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create site');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/sites');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add Site" description="Create a new construction site." />
      <div className="max-w-2xl mx-auto">
        <SiteForm mode="new" onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
