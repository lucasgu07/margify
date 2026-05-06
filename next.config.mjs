/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Evita ENOSPC cuando el disco está justo: no persiste el pack cache de webpack en disco. */
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    /** Más anchos para que el hero (screenshots con texto) pida suficientes px en retina. */
    deviceSizes: [640, 750, 828, 960, 1080, 1200, 1280, 1440, 1536, 1920, 2048, 2560, 3840],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
