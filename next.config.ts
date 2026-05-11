import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://donggukcomai.shop/api/:path*',
      },
    ];
  },
};

export default nextConfig;
