import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// 2. Bungkus `nextConfig` Anda dengan `withPWA`
const nextConfig: NextConfig = {
  // Konfigurasi Next.js Anda yang lain bisa ditambahkan di sini jika ada
  webpack: (config, { dev, isServer }) => {
    // Fix for exclamation mark in build path
    if (config.cache && config.cache.cacheDirectory) {
      config.cache.cacheDirectory = '.next/cache/webpack';
    }

    // Handle output path issues
    if (config.output && config.output.path) {
      // Remove exclamation marks from output paths
      config.output.path = config.output.path.replace(/!/g, '');
    }

    return config;
  },
  // Handle special characters in paths
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        '**/node_modules/**',
        '**/.next/cache/**',
      ],
    },
  },
  // Disable strict plugin for build
  swcMinify: true,
};

export default withPWA(nextConfig);