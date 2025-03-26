/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['vercel.blob.storage'], // สำหรับ Vercel Blob Storage ในโหมด production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.storage',
      },
    ],
  },
};

export default nextConfig;
