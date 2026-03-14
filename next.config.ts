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
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  // Auto-instrument route handlers
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: false,
});
