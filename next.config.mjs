/** @type {import('next').NextConfig} */
const nextConfig = {
  // Never let `next dev` and `next build` share webpack artifacts. Sharing
  // `.next` was the root cause of intermittent missing-chunk 500 errors when
  // more than one local process was running.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
    // Existing client pages read query params directly. Keep production
    // builds working until those pages are split into Suspense-wrapped shells.
    missingSuspenseWithCSRBailout: false,
  },
};
export default nextConfig;
