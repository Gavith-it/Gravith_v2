'use client';

import dynamic from 'next/dynamic';

const VendorNewPageContent = dynamic(() => import('@/components/vendors/VendorNewPageContent'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center" aria-busy="true">
      Loading...
    </div>
  ),
});

export default function VendorNewPage() {
  return <VendorNewPageContent />;
}
