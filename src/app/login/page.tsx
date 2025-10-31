'use client';

import { useRouter } from 'next/navigation';

import { Login } from '@/components/Login';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (userData: import('@/types').UserWithOrganization) => {
    login(userData);
    router.push('/dashboard');
  };

  const handleCreateOrganization = () => {
    // Redirect to organization setup
    router.push('/organization/setup');
  };

  return (
    <Login
      onLogin={handleLogin}
      onCreateOrganization={handleCreateOrganization}
      isLoading={false}
    />
  );
}
