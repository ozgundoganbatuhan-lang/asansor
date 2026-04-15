/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
};
export default nextConfig;
