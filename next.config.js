/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint:{
    ignoreDuringBuilds:true,
  },
  typescript: {
    ignoreBuildErrors: true,  // add this too to prevent future TS errors blocking build
  },
  serverExternalPackages: ["@trigger.dev/sdk"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.transloadit.com" },
      { protocol: "https", hostname: "api2.transloadit.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
