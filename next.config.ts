import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const pbUrl = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';
    return [
      {
        source: '/_/:path*',
        destination: `${pbUrl}/_/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${pbUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
