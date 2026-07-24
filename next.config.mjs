/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production Next.js server (PM2 + nginx reverse proxy). Standalone output
  // ships a minimal self-contained server for /opt/nuvio.
  output: "standalone",
};

export default nextConfig;
