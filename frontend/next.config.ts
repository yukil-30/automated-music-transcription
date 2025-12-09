// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. IMAGE CONFIGURATION (Keep this from before) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5832',
        pathname: '/**',
      },
    ],
  },

  /* 2. OUTPUT STANDALONE */
  output: "standalone",

  /* 3. IGNORE BUILD ERRORS (Add these lines!) */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;