/**
 * Generates public/robots.txt with Sitemap lines for each domain in src/config/domain.js.
 * Add new domains only in KNOWN_DOMAINS; then run npm run build (prebuild runs this).
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { KNOWN_DOMAINS } from '../src/config/domain.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const lines = [
  '# Tiger899 - Myanmar Slot Games (multi-domain)',
  '# Domains listed in src/config/domain.js KNOWN_DOMAINS',
  '# Only standard directives (User-agent, Allow, Disallow, Sitemap). Do not add Content-Signal or other non-standard lines.',
  'User-agent: *',
  'Allow: /',
  '',
  ...KNOWN_DOMAINS.map((base) => `Sitemap: ${base}/sitemap.xml`),
  '',
];
writeFileSync(join(__dirname, '..', 'public', 'robots.txt'), lines.join('\n'), 'utf8');
console.log('Generated public/robots.txt with', KNOWN_DOMAINS.length, 'Sitemap(s)');
