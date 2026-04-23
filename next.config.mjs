/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
};
export default nextConfig;
