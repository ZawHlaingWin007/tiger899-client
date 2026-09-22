# Fix "robots.txt is not valid" – Content-Signal unknown directive

Google reports: **Line 29 – Content-Signal: search=yes,ai-train=no – Unknown directive.**

The **project’s** `public/robots.txt` is valid and does **not** contain that line. So the **live** `https://tiger899.com/robots.txt` (the one with 29+ lines) is being changed by your **hosting, CDN, or server** after deploy.

## What to do

### 1. Confirm the live file

Open in a browser:

- **https://tiger899.com/robots.txt**
- **https://yu95.net/robots.txt**
- **https://yu95.vip/robots.txt**

If you see `Content-Signal: search=yes,ai-train=no` (or any line 29), the problem is on the server side.

### 2. Find where it’s added and remove it

Check the following and **remove or disable** anything that adds `Content-Signal` (or that appends extra lines to `robots.txt`):

| Where                        | What to do                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **cPanel / Plesk**           | File Manager or “Robots.txt” / “SEO” tool: edit the live `robots.txt` and delete the `Content-Signal` line.                                                                              |
| **Cloudflare**               | Page Rules, Transform Rules, or “Robots.txt” in Dashboard: remove any rule that adds or rewrites `robots.txt` with `Content-Signal`.                                                     |
| **Vercel**                   | Check Project Settings → Environment / Build: no plugin or config should append to `robots.txt`. Serve only the file from `public/robots.txt`.                                           |
| **Netlify**                  | Same: ensure `robots.txt` is the one from `public/` and no plugin adds `Content-Signal`.                                                                                                 |
| **Nginx / Apache**           | If you have a custom `location /robots.txt` or `Alias` that points to a different file, either serve the app’s `robots.txt` only or edit that file and remove the `Content-Signal` line. |
| **Any “SEO” or “AI” plugin** | Some plugins add `Content-Signal` for AI crawlers. Turn that off or remove the directive in the plugin settings.                                                                         |

### 3. Valid robots.txt (this project)

After deploy, the correct content at `/robots.txt` should be exactly what we generate (no extra lines):

```
# Tiger899- Myanmar Slot Games (multi-domain)
# Domains listed in src/config/domain.js KNOWN_DOMAINS
# Only standard directives (User-agent, Allow, Disallow, Sitemap). Do not add Content-Signal or other non-standard lines.
User-agent: *
Allow: /

Sitemap: https://tiger899.com/sitemap.xml
Sitemap: https://yu95.net/sitemap.xml
Sitemap: https://yu95.vip/sitemap.xml
```

Standard directives only: **User-agent**, **Allow**, **Disallow**, **Sitemap**. Anything else (e.g. `Content-Signal`) is non-standard and can cause “robots.txt is not valid”.

### 4. After fixing

1. Upload or deploy so the live `robots.txt` no longer contains `Content-Signal`.
2. Open `https://tiger899.com/robots.txt` again and confirm the invalid line is gone.
3. In Google Search Console, use “URL Inspection” for `https://tiger899.com/robots.txt` and “Test live URL” so Google picks up the fixed file.

The “robots.txt is not valid” warning will clear once Google recrawls the updated `robots.txt`.
