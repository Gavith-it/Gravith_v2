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
  // Optimize bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separate vendor chunks
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            radix: {
              name: 'radix-ui',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
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
  experimental: {
    typedRoutes: false,
  },
};

export default withBundleAnalyzer(nextConfig);
