import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enable React Strict Mode for better debugging
  reactStrictMode: true,

  // ✅ Optimize images and allow Imgur as a remote source
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iesv8fw9sjemyab3.public.blob.vercel-storage.com", // Direct image links
      },
      {
        protocol: "https",
        hostname: "iesv8fw9sjemyab3.public.blob.vercel-storage.com", // Optional: album or other Imgur assets
      },
    ],
  },

  // ✅ (Optional) Experimental features or settings
  experimental: {
    optimizeCss: true,
  },

  // ✅ (Optional) If you deploy to a custom base path
  // basePath: "",
  // assetPrefix: "",
};

export default nextConfig;
