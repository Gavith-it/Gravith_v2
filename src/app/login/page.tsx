'use client';

import { useRouter } from 'next/navigation';

import { Login } from '@/components/Login';

export default function LoginPage() {
  const router = useRouter();

  const handleCreateOrganization = () => {
    router.push('/organization/setup');
  };

  return <Login onCreateOrganization={handleCreateOrganization} />;
}
