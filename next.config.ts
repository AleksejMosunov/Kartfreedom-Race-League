import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry org/project (required for source maps upload — set via env or here)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps when DSN is configured
  silent: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Disable source map upload in local dev to speed up builds
  widenClientFileUpload: true,
  // Next.js 16+ Sentry options moved under webpack.*
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Auto-instrument route handlers
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: false,
  },
});
