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

      // Invalidate and revalidate SWR cache to ensure new site appears immediately
      await mutate('/api/sites', undefined, { revalidate: true });

      toast.success('Site created successfully');
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
