import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/_/:path*',
        destination: 'http://127.0.0.1:8090/_/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8090/api/:path*',
      },
    ];
  },
};

export default nextConfig;
