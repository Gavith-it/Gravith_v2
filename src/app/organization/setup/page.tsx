'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { OrganizationSetup } from '@/components/OrganizationSetup';
import type { Organization, User } from '@/types/entities';

export default function OrganizationSetupPage() {
  const router = useRouter();

  const handleComplete = useCallback(
    async (_organization: Organization, adminUser: User) => {
      const invitee = adminUser.email;
      const message = invitee
        ? encodeURIComponent(`We sent an invitation to ${invitee}. Check your inbox to finish setting up your account.`)
        : encodeURIComponent('Invitation email sent. Please check your inbox to finish setup.');

      router.push(`/login?message=${message}`);
    },
    [router],
  );

  const handleBack = useCallback(() => {
    router.push('/login');
  }, [router]);

  return <OrganizationSetup onComplete={handleComplete} onBack={handleBack} />;
}
