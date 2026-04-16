/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.DOCKER_BUILD === "1" && { output: "standalone" }),
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
