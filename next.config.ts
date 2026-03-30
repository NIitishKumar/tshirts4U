import type { NextConfig } from "next";

const backendBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.BACKEND_URL?.replace(/\/$/, "") ||
  "";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  /** Browser calls same-origin `/api/*`; this forwards to your real API server (avoids CORS + fixes 404 when Next has no API routes). */
  async rewrites() {
    if (!backendBase) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
