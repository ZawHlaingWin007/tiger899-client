/**
 * Generates public/sitemap.xml with the correct base URL.
 * Base URL comes from env VITE_BASE_URL (so one build per domain has correct <loc>).
 * Run before build: npm run build (prebuild runs this), or:
 *   VITE_BASE_URL=https://yu95.net npm run build
 * Paths below should match src/config/domain.js SITEMAP_PATHS.
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = (process.env.VITE_BASE_URL || 'https://tiger899.com').replace(/\/$/, '');
const paths = [
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

const urls = paths
  .map(
    (p) => `  <url>
    <loc>${base}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outPath = join(__dirname, '..', 'public', 'sitemap.xml');
writeFileSync(outPath, xml, 'utf8');
console.log('Generated', outPath, 'with base', base);
