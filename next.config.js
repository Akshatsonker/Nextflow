/** @type {import('next').NextConfig} */
const nextConfig = {
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
