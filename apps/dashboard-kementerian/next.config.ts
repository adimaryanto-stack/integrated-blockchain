import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "@supabase/supabase-js", "exceljs"],
    turbopack: { root: path.resolve(__dirname) },
  } as any,
  async rewrites() {
    return [
      {
        source: '/rest/:path*',
        destination: 'http://localhost:2028/rest/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:2028/api/:path*',
      },
    ];
  },
};

export default nextConfig;
