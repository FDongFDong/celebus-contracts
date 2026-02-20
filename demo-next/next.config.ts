import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const configRootDir = dirname(fileURLToPath(import.meta.url));
const workspaceRootDir = dirname(configRootDir);

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'viem'],
  },
  turbopack: {
    root: workspaceRootDir,
  },
};

export default nextConfig;
