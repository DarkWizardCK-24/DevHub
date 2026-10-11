import type { NextConfig } from "next";

/**
 * Security headers on every page. The API (FastAPI) sets its own.
 *  - X-Frame-Options / frame-ancestors: no one can embed DevHub in an iframe (clickjacking)
 *  - nosniff: browsers must respect declared content types
 *  - Referrer-Policy: don't leak full URLs (which can contain ids) to other sites
 *  - Permissions-Policy: DevHub never needs camera, mic or location
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
