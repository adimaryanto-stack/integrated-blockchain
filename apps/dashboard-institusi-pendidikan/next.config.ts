import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "@supabase/supabase-js"],
  } as any,
  turbopack: {
    // Set root ke direktori app ini agar Turbopack tidak salah deteksi
    // workspace root karena ada banyak lockfile di monorepo
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
