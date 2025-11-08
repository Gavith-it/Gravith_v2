'use client';

import { useEffect, useState } from 'react';

import { OrganizationPage } from '@/components/organization';
import { useAuth } from '@/lib/auth-context';
import type { Organization } from '@/types';

export default function OrganizationPageRoute() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    if (user?.organization) {
      setOrganization(user.organization);
    }
  }, [user]);

  if (!user || !organization) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading organization details...</div>
    );
  }

  return (
    <OrganizationPage
      currentUser={user}
      currentOrganization={organization}
      onUpdateOrganization={() => {}}
    />
  );
}
