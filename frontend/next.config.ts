import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow thumbnail images from any HTTPS source (yt-dlp returns CDN URLs from
  // many different domains — wildcards on the protocol + hostname cover them).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Proxy /api/* → FastAPI backend so the browser never sees the backend port
  // and CORS is handled server-side by Next.js.
  async rewrites() {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
