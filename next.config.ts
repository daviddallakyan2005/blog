import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  agentRules: false,
  serverExternalPackages: ["@react-pdf/renderer"],
  async redirects() {
    return [
      { source: "/tags", destination: "/articles", permanent: true },
      { source: "/tags/:slug", destination: "/articles?tag=:slug", permanent: true },
      { source: "/search", destination: "/articles", permanent: true },
      { source: "/about", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
