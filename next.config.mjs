/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  trailingSlash: true,
  generateBuildId: async () => {
    return 'ssh-manager-build'
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'bcrypt', 'ssh2', 'node-ssh'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg', 'bcrypt', 'ssh2', 'node-ssh', 'ws');
    }
    
    // Evitar problemas con xterm.js en el servidor
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'canvas': false,
        'jsdom': false,
      };
    }
    
    return config;
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

export default nextConfig
