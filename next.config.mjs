/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma"],
  
  // Force "/" to serve static landing.html from /public
  // This bypasses ALL Next.js layouts (including any cached app/layout.tsx with Shell)
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/landing.html",
        },
      ],
    };
  },
};
export default nextConfig;
