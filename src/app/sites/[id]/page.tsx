'use client';

import { use } from 'react';

import { SiteDetailPage } from '@/components/sites/SiteDetailPage';

interface SitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SitePage({ params }: SitePageProps) {
  const resolvedParams = use(params);

  return <SiteDetailPage siteId={resolvedParams.id} />;
}
