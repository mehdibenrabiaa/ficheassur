/** @type {import('next').NextConfig} */
const nextConfig = {
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
