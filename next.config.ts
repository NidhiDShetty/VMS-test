/** @type {import('next').NextConfig} */
const nextConfig = {
basePath: "/vmsapp",
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ Ignores ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["randomuser.me", "i.pravatar.cc", "example.com"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
