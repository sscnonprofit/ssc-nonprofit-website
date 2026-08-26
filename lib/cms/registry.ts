/**
 * Registry of every document the CMS can edit. Each entry maps a database
 * `pages.slug` to the content module it powers. Slugs mirror the original
 * `content/*.json` files one-to-one, since several routes (the four pillar
 * pages, the three service pages) are rendered from a single shared file
 * that also cross-links its sibling entries — splitting those into one row
 * per route would break that cross-linking. A doc may power one route,
 * several routes, or none (site-wide settings).
 *
 * This is metadata only — the actual content lives in the `pages` table.
 */
export type CmsGroup = "page" | "settings"

export type CmsDoc = {
  slug: string
  label: string
  group: CmsGroup
  routes: string[]
  description: string
}

export const cmsRegistry: CmsDoc[] = [
  { slug: "site", label: "Site Settings", group: "settings", routes: [], description: "Global nav, footer, contact details, and social links used across every page." },
  { slug: "home", label: "Home", group: "page", routes: ["/"], description: "Homepage hero, stats, pillars, and services overview." },
  { slug: "company", label: "Our Company", group: "page", routes: ["/our-company"], description: "Company story, history timeline, and leadership team." },
  { slug: "challenge", label: "The Challenge", group: "page", routes: ["/the-challenge"], description: "The senior-care funding crisis, our response, and progress." },
  { slug: "events", label: "Upcoming Events", group: "page", routes: ["/upcoming-events"], description: "Featured event, community calendars, and event gallery." },
  { slug: "gallery", label: "Artists Gallery", group: "page", routes: ["/artists-gallery"], description: "Craft fair guidelines, drop-off dates, and gallery display info." },
  { slug: "pillars", label: "Pillars", group: "page", routes: ["/community", "/employment", "/environment", "/community-outreach"], description: "Community, Employment, Environment, and Community Outreach pillar pages." },
  { slug: "services", label: "Services", group: "page", routes: ["/assisted-living", "/short-term-rehab", "/skilled-nursing"], description: "Assisted Living, Short-Term Rehab, and Skilled Nursing service pages." },
]

export function getCmsDoc(slug: string): CmsDoc | undefined {
  return cmsRegistry.find((doc) => doc.slug === slug)
}
