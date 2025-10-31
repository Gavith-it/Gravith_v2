'use client';

import { useRouter } from 'next/navigation';

import SiteForm from '@/components/forms/SiteForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function SiteNewPage() {
  const router = useRouter();

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
    console.log('New site data:', data);
    // You can add API call to save the site
    router.push('/sites');
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
