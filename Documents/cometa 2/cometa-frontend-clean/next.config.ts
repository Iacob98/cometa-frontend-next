import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude Python/Streamlit directories from Next.js processing
  webpack: (config, { dev, isServer }) => {
    // Ignore non-Next.js directories
    config.watchOptions = {
      ignored: [
        '**/admin_app/**',
        '**/worker_app/**',
        '**/shared/**',
        '**/fastapi_services/**',
        '**/migrations/**',
        '**/tests/**',
        '**/uploads/**',
        '**/documents/**',
        '**/cleanup_analysis/**',
        '**/document_management_system/**',
        '**/*.py',
        '**/*.md',
        '**/*.sql',
        '**/*.log',
        '**/node_modules/**'
      ]
    };

    return config;
  },

  // Experimental features
  experimental: {
    // Add any experimental features here if needed
  },

  // Transpile packages if needed
  transpilePackages: [],

  // Image domains for external images
  images: {
    domains: [],
  },
};

export default nextConfig;
