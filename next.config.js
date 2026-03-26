/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { serverComponentsExternalPackages: ['@vercel/kv'] }
}
module.exports = nextConfig
headers: async () => [
     { source: '/(.*)', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] }
   ]