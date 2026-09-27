import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "@supabase/supabase-js", "tesseract.js"],
  } as any,
};

export default nextConfig;
