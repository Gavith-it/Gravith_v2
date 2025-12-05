'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

import SiteForm from '@/components/forms/SiteForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetcher, swrConfig } from '@/lib/swr';
import type { Site, SiteInput } from '@/types/sites';

interface SiteEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SiteEditPage({ params }: SiteEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);

  // Fetch site data using SWR
  const {
    data: siteDataResponse,
    isLoading: loading,
    error,
  } = useSWR<{ site: Site }>(
    resolvedParams.id ? `/api/sites/${resolvedParams.id}` : null,
    fetcher,
    swrConfig,
  );

  const siteData = siteDataResponse?.site ?? null;

  // Show error toast if fetch fails
  if (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load site');
  }

  const handleSubmit = async (data: SiteInput) => {
    try {
      const response = await fetch(`/api/sites/${resolvedParams.id}`, {
        method: 'PATCH',
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
        throw new Error(payload.error || 'Failed to update site');
      }

      // Optimistically update the cache with the updated site
      await mutate(
        '/api/sites',
        async (currentData: { sites: Site[] } | undefined) => {
          if (!currentData) {
            // If no cache, fetch fresh data
            const freshResponse = await fetch('/api/sites', { cache: 'no-store' });
            const freshData = await freshResponse.json();
            return {
              sites: (freshData.sites || []).map((s: Site) =>
                s.id === resolvedParams.id ? payload.site! : s,
              ),
            };
          }
          // Update the site in the list
          return {
            sites: currentData.sites.map((s) => (s.id === resolvedParams.id ? payload.site! : s)),
          };
        },
        { revalidate: false },
      );

      toast.success('Site updated successfully');
      router.push('/sites');

      // Revalidate after navigation to ensure consistency
      setTimeout(() => {
        void mutate('/api/sites', undefined, { revalidate: true });
        void mutate(`/api/sites/${resolvedParams.id}`, undefined, { revalidate: true });
      }, 200);
    } catch (error) {
      console.error('Error updating site:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update site');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/sites');
  };

  if (loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!siteData) {
    return <div className="container mx-auto py-6">Site not found</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Site" description="Update site details." />
      <div className="max-w-2xl mx-auto">
        <SiteForm mode="edit" site={siteData} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
