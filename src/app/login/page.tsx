'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { Login } from '@/components/Login';

function LoginContent() {
  const router = useRouter();

  const handleCreateOrganization = () => {
    router.push('/organization/setup');
  };

  return <Login onCreateOrganization={handleCreateOrganization} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
