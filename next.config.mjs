/** @type {import('next').NextConfig} */
const nextConfig = {
  // Separate production audits from the active development build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Only check instant navigation where a segment exports `instant`. The
  // espace pro's pages are Client Components behind a login spinner: they
  // never render during the check and can't opt out themselves (`instant`
  // isn't allowed in client files), so automatic checks only flagged them.
  experimental: {
    instantInsights: { validationLevel: "manual-warning" },
  },
  // The espace pro is private: tell search engines not to index anything
  // under it (the layout's robots meta says the same, this also covers
  // non-HTML responses and pages that never finish rendering).
  async headers() {
    return [{ source: "/espace-pro/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
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
