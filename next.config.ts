import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Habilita forbidden()/unauthorized() para a área /redacao.
    authInterrupts: true,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.igdb.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
