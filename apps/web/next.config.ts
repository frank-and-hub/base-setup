import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@monorepo/shared-types', '@monorepo/shared-utils', '@monorepo/validation', '@monorepo/config'],
};

export default nextConfig;

