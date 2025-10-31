'use client';

import { useRouter } from 'next/navigation';

import MilestoneForm from '@/components/forms/MilestoneForm';
import { PageHeader } from '@/components/layout/PageHeader';

export default function MilestonePage() {
  const router = useRouter();

  const handleSubmit = (data: { name: string; date: string; description: string }) => {
    // Handle form submission logic here
    console.log('Milestone data:', data);
    // You can add API call to save the milestone
    router.push('/scheduling');
  };

  const handleCancel = () => {
    router.push('/scheduling');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Milestones" description="Define and manage project milestones." />
      <div className="max-w-2xl mx-auto">
        <MilestoneForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
