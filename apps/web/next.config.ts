import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@camper/ui", "@camper/api-client", "@camper/shared-types"],
};

export default nextConfig;
