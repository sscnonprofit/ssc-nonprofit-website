# Sheboygan Senior Community (SSC) — Marketing Site

A Next.js (App Router) marketing site for Sheboygan Senior Community, a nonprofit senior care provider. Rebuilt from the legacy `sscnonprofit.org` site with a refreshed design system, structured content, and modern SEO/accessibility baseline.

## Pages

| Route | Description |
| --- | --- |
| `/` | Home — hero, pillars overview, stats, testimonials, CTA |
| `/assisted-living`, `/short-term-rehab`, `/skilled-nursing` | Care & services pillar pages |
| `/our-company` | History, mission, leadership |
| `/the-challenge` | The case for nonprofit senior care |
| `/community`, `/environment`, `/community-outreach` | Additional pillar pages |
| `/contact` | Contact form (server action) + location/hours |
| `/donate` | Giving page with online giving link |
| `/upcoming-events` | Event highlights and calendar callout |
| `/artists-gallery` | Resident artists gallery + exhibition info |
| Careers | Links out to the external APS career portal (no in-app page) |

## Content

Page copy and structured content live in `content/*.json` (e.g. `site.json`, `pillars.json`, `events.json`, `gallery.json`) rather than being hardcoded in components. Update these files to change copy, links, or images without touching component code.

## Contact form

`components/contact-form.tsx` + `lib/actions.ts` implement a server-action form with validation. It currently returns a graceful "unconfigured" message if no email-sending integration (e.g. Resend) is connected — wire up a provider in `lib/actions.ts` to enable real delivery. Submitted values are preserved on error so users don't lose their input.

## SEO & security

- `app/sitemap.ts` / `app/robots.ts` generate the sitemap and robots rules.
- Organization structured data (JSON-LD) is emitted in `app/layout.tsx`.
- Baseline security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `Permissions-Policy`) are set in `next.config.mjs`.

## Development

```bash
pnpm dev      # start dev server
pnpm build    # production build
```
