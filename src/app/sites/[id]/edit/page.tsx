'use client';

import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

import SiteForm from '@/components/forms/SiteForm';
import { PageHeader } from '@/components/layout/PageHeader';

interface SiteEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SiteEditPage({ params }: SiteEditPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [siteData, setSiteData] = useState<{
    id: string;
    name: string;
    location: string;
    startDate: string;
    expectedEndDate: string;
    budget: number;
    spent: number;
    description: string;
    progress: number;
    status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch site data based on resolvedParams.id
    // This is a mock implementation - replace with actual API call
    const mockSiteData = {
      id: resolvedParams.id,
      name: 'Residential Complex A',
      location: 'Sector 15, Navi Mumbai',
      startDate: '2024-01-01',
      expectedEndDate: '2024-12-31',
      budget: 50000000,
      spent: 25000000,
      description: 'Premium residential complex with 200 units',
      progress: 50,
      status: 'Active' as const,
    };

    setSiteData(mockSiteData);
    setLoading(false);
  }, [resolvedParams.id]);

  const handleSubmit = (data: {
    name: string;
    location: string;
    startDate: string;
    expectedEndDate: string;
    budget: number;
    description: string;
    status: 'Active' | 'Stopped' | 'Completed' | 'Canceled';
  }) => {
    // Handle form submission logic here
    console.log('Updated site data:', data);
    // You can add API call to update the site
    router.push('/sites');
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
