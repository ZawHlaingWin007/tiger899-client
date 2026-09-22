/**
 * Dynamic domain config for Tiger899 – use with the current origin, or any future domain.
 *
 * - Runtime: canonical, OG, Twitter, hreflang and JSON-LD use current origin automatically.
 * - robots.txt: list all domains in KNOWN_DOMAINS and add a Sitemap line in public/robots.txt for each.
 * - sitemap.xml: generated at build with VITE_BASE_URL (e.g. VITE_BASE_URL=https://yu95.net npm run build).
 */

/** Full base URLs for sitemap/robots (no trailing slash). Add new domains here and in public/robots.txt. */
export const KNOWN_DOMAINS = [
  'https://tiger899.com',
  'https://tiger899.net',
  'https://tiger899.vip',
];

/** Paths included in sitemap (leading slash). */
export const SITEMAP_PATHS = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/slots', changefreq: 'daily', priority: '0.9' },
  { path: '/fish-shooting', changefreq: 'daily', priority: '0.9' },
  { path: '/buffalo', changefreq: 'daily', priority: '0.9' },
  { path: '/card-games', changefreq: 'weekly', priority: '0.9' },
  { path: '/live', changefreq: 'daily', priority: '0.8' },
  { path: '/lottery', changefreq: 'weekly', priority: '0.8' },
  { path: '/sports', changefreq: 'weekly', priority: '0.8' },
  { path: '/promotion', changefreq: 'weekly', priority: '0.8' },
  { path: '/download', changefreq: 'monthly', priority: '0.8' },
];

/**
 * Current site base URL (no trailing slash). Uses window.location.origin in browser.
 * For SSR/build use optional fallback.
 */
export function getBaseUrl(fallback = 'https://tiger899.com') {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return fallback;
}
