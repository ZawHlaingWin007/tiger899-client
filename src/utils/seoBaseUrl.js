/**
 * Updates all SEO-related base URLs in the document to the current origin.
 * Run once after app mount so canonical, OG, Twitter, hreflang and JSON-LD use the active domain.
 */
import { getBaseUrl } from '@/config/domain';

export function updateSeoBaseUrl() {
  const base = getBaseUrl();
  const baseSlash = base.replace(/\/$/, '') + '/';

  // Canonical
  let el = document.querySelector('link[rel="canonical"]');
  if (el) el.setAttribute('href', baseSlash);

  // Open Graph
  el = document.querySelector('meta[property="og:url"]');
  if (el) el.setAttribute('content', baseSlash);
  el = document.querySelector('meta[property="og:image"]');
  if (el) el.setAttribute('content', base + '/tiger899-logo.png');

  // Twitter
  el = document.querySelector('meta[name="twitter:url"]');
  if (el) el.setAttribute('content', baseSlash);
  el = document.querySelector('meta[name="twitter:image"]');
  if (el) el.setAttribute('content', base + '/tiger899-logo.png');

  // Hreflang
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => {
    link.setAttribute('href', baseSlash);
  });

  // JSON-LD WebSite url and potentialAction.target
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (jsonLdScript) {
    try {
      const data = JSON.parse(jsonLdScript.textContent);
      data.url = base;
      data.image = `${base}/tiger899-logo.png`;
      if (data.potentialAction && data.potentialAction.target) {
        data.potentialAction.target = `${base}/slots?q={search_term_string}`;
      }
      jsonLdScript.textContent = JSON.stringify(data);
    } catch (_) {
      // leave as-is if parse fails
    }
  }
}
