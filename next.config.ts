import bundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env['ANALYZE'] === 'true' });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      // Old route redirects to new App Router paths
      {
        source: '/site-management',
        destination: '/sites',
        permanent: true,
      },
      {
        source: '/vehicle-management',
        destination: '/vehicles',
        permanent: true,
      },
      {
        source: '/vendor-management',
        destination: '/vendors',
        permanent: true,
      },
      {
        source: '/payment-tracking',
        destination: '/payments',
        permanent: true,
      },
      {
        source: '/project-scheduling',
        destination: '/scheduling',
        permanent: true,
      },
      {
        source: '/reports-dashboard',
        destination: '/reports',
        permanent: true,
      },
      {
        source: '/organization-management',
        destination: '/organization',
        permanent: true,
      },
      {
        source: '/user-settings',
        destination: '/settings',
        permanent: true,
      },
      {
        source: '/material-management',
        destination: '/materials',
        permanent: true,
      },
      {
        source: '/material-management/:path*',
        destination: '/materials/:path*',
        permanent: true,
      },
      // Archive redirects - overlapping pages cleanup
      {
        source: '/materials/modern',
        destination: '/materials',
        permanent: true,
      },
      {
        source: '/materials/new',
        destination: '/materials/master/new',
        permanent: true,
      },
      {
        source: '/scheduling/activity',
        destination: '/work-progress/activity',
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
