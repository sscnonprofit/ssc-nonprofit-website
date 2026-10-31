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

## Deploying under a different Vercel or GitHub account

Copying or forking this repository transfers code, not environment variables, database tables, uploaded files, or integration permissions. In the **destination Vercel project's Settings > Environment Variables**, configure the relevant Production and Preview environments before redeploying:

- `DATABASE_URL`: connect the existing initialized website database if this deployment should share the same content and users. A newly provisioned empty database will not contain `job_postings`, gallery tables, or Better Auth's tables. For an independent copy, migrate the complete database schema and intended data first. Do not copy just one missing table; the app needs all tables in `lib/db/schema.ts`.
- `BETTER_AUTH_SECRET`: provide a private, securely generated random secret of at least 32 characters. Do not commit it to GitHub or use a placeholder. This project deliberately has no fallback secret. Use a separate secret for an independent deployment; changing a secret invalidates existing sessions.
- `BLOB_READ_WRITE_TOKEN`: connect the appropriate Blob store for uploads and protected file downloads. Uploaded files are not stored in GitHub. If switching stores, migrate the files and their references as well.
- `BETTER_AUTH_URL` (optional): set this to the destination's canonical HTTPS URL if using a custom domain. Do not carry over the previous deployment's URL. Otherwise the app uses Vercel's deployment URL variables automatically.

Vercel's default build command, `pnpm build`, runs a **read-only deployment preflight** before Next.js. It validates the required environment variables and checks every database table/column defined by the app. It never creates, overwrites, seeds, or deletes records. Missing setup is reported without printing credentials; fix it in the destination project and redeploy. Employment and exhibition listings load at request time instead of being frozen into the build.

Database schema/data migration must be completed against the intended destination database before building. A successful build does not transfer content, uploaded files, account ownership, custom domains, or third-party authorizations between accounts.

## Development

```bash
pnpm dev      # start dev server
pnpm build    # production build
```
