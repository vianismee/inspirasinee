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
};

export default withPWA(nextConfig);
