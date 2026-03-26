/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: { serverComponentsExternalPackages: ['@vercel/kv'] }
}