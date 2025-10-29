import type { NextConfig } from "next";
import path from "path";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// 2. Bungkus `nextConfig` Anda dengan `withPWA`
const nextConfig: NextConfig = {
  // Konfigurasi Next.js Anda yang lain bisa ditambahkan di sini jika ada

  // Workaround for exclamation mark in project path
  distDir: '.next',

  // Disable experimental features that might cause issues
  experimental: {
    // Keep minimal experimental features
    optimizeCss: false,
    optimizePackageImports: [],
  },

  // Skip generation of static pages for dynamic routes
  trailingSlash: false,
  skipTrailingSlashRedirect: true,

  // Simple webpack config to avoid path issues
  webpack: (config, { dev, isServer }) => {
    // Override webpack configuration to handle exclamation mark
    config.context = process.cwd().replace(/!/g, '');

    // Override cache directory
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.join(process.cwd(), '.next/cache/webpack'),
    };

    // Override output directory
    if (config.output) {
      config.output.path = config.output.path.replace(/!/g, '');
    }

    // Fix module rules that reference the context
    if (config.module && config.module.rules) {
      config.module.rules.forEach((rule: any) => {
        if (rule.issuer && rule.issuer.and && Array.isArray(rule.issuer.and)) {
          rule.issuer.and = rule.issuer.and.map((path: string) =>
            path.replace(/!/g, '')
          );
        }
        if (rule.issuer && typeof rule.issuer === 'string') {
          rule.issuer = rule.issuer.replace(/!/g, '');
        }
        if (rule.include && Array.isArray(rule.include)) {
          rule.include = rule.include.map((path: string) =>
            path.replace(/!/g, '')
          );
        }
      });
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Handle special characters in paths
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/**',
      '**/.next/**',
      '**/*.log',
    ],
  },

  };

export default withPWA(nextConfig);