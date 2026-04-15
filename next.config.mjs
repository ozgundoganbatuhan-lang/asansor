/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,
  // Only enable the standalone output when building inside a Docker container.
  ...(process.env.DOCKER_BUILD === "1" && { output: "standalone" }),
  // Mark external packages for server functions so Next.js bundles them correctly
  serverExternalPackages: ["@prisma/client", "prisma"],
};
export default nextConfig;
