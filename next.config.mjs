/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    /** Más anchos para que el hero (screenshots con texto) pida suficientes px en retina. */
    deviceSizes: [640, 750, 828, 960, 1080, 1200, 1280, 1440, 1536, 1920, 2048, 2560, 3840],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
