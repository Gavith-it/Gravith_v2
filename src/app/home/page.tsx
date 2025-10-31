'use client';

import { useRouter } from 'next/navigation';

import { SaaSHomepage } from '@/components/SaaSHomepage';

export default function HomePage() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleGetStarted = () => {
    router.push('/login');
  };

  return <SaaSHomepage onLogin={handleLogin} onGetStarted={handleGetStarted} />;
}
