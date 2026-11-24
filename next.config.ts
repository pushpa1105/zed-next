// Validate environment variables at build time: fail fast on bad config.
import "./src/config/env";

import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every route.
 * A strict nonce-based Content-Security-Policy is intentionally NOT set here,
 * because nonces force dynamic rendering. See docs/security.md for options.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // --- Rendering & performance ---
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,

  // --- DX & safety ---
  typedRoutes: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // --- Deployment ---
  // Opt-in: emits a minimal self-contained server to .next/standalone.
  // Set by the Dockerfile. Off by default so `next start` keeps working.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,

  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === "development" },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Allow-list remote image hosts explicitly, for example:
    // remotePatterns: [new URL("https://images.example.com/**")],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
