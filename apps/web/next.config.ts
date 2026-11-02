import type { NextConfig } from 'next';

// Workspace packages such as @app-fit/shared are transpiled automatically.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
