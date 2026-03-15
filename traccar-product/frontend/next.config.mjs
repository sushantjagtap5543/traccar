/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable Turbopack for builds by not using the --turbo flag in package.json
};

export default nextConfig;
