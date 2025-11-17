'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import SiteForm from '@/components/forms/SiteForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';
import type { Site, SiteInput } from '@/types/sites';

interface SiteEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SiteEditPage({ params }: SiteEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [siteData, setSiteData] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sites/${resolvedParams.id}`, {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as {
          site?: Site;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load site');
        }

        if (payload.site) {
          setSiteData(payload.site);
        } else {
          throw new Error('Site not found');
        }
      } catch (error) {
        console.error('Error fetching site:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load site');
        setSiteData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchSiteData();
  }, [resolvedParams.id]);

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

      toast.success('Site updated successfully');
      router.push('/sites');
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
