import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/webpack from bundling firebase-admin and its native deps
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "google-gax",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow Google OAuth popup to communicate with parent window
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
