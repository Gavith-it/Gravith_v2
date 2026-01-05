'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

import MilestoneForm from '@/components/forms/MilestoneForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetcher, swrConfig } from '@/lib/swr';
import type { ProjectMilestone, Site } from '@/types';

export default function MilestonePage() {
  const router = useRouter();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // Fetch sites using SWR
  const { data: sitesData, isLoading } = useSWR<{ sites: Site[] }>(
    '/api/sites',
    fetcher,
    swrConfig,
  );

  const sites = useMemo(() => sitesData?.sites ?? [], [sitesData]);

  // Auto-select first site if available
  React.useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  const handleSubmit = async (data: { name: string; date: string; description: string }) => {
    try {
      if (!selectedSiteId) {
        throw new Error('Please select a site');
      }

      const response = await fetch('/api/scheduling/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: selectedSiteId,
          name: data.name,
          date: data.date,
          description: data.description || '',
          status: 'pending' as const,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        milestone?: ProjectMilestone;
        error?: string;
      };

      if (!response.ok || !payload.milestone) {
        throw new Error(payload.error || 'Failed to create milestone');
      }

      // Invalidate milestones cache to refresh the list
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/scheduling/milestones'),
        undefined,
        { revalidate: true },
      );

      toast.success('Milestone created successfully');
      router.push('/scheduling');
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create milestone');
      throw error; // Re-throw to let the form handle the error state
    }
  };

  const handleCancel = () => {
    router.push('/scheduling');
  };

  if (isLoading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (sites.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">No sites available. Please create a site first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones" description="Define and manage project milestones." />
      <div className="max-w-2xl mx-auto space-y-4">
        {sites.length > 1 && (
          <div className="space-y-2">
            <label htmlFor="site-select" className="text-sm font-medium">
              Site <span className="text-destructive">*</span>
            </label>
            <select
              id="site-select"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <MilestoneForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
