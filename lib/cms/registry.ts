/**
 * Registry of every document the CMS can edit. Each entry maps a database
 * `pages.slug` to the live route it powers (or `null` for site-wide settings
 * that don't have a route of their own) and a human label for the admin UI.
 *
 * This is metadata only — the actual content lives in the `pages` table.
 */
export type CmsGroup = "page" | "settings"

export type CmsDoc = {
  slug: string
  label: string
  group: CmsGroup
  route: string | null
  description: string
}

export const cmsRegistry: CmsDoc[] = [
  { slug: "site-settings", label: "Site Settings", group: "settings", route: null, description: "Global nav, footer, contact details, and social links used across every page." },
  { slug: "home", label: "Home", group: "page", route: "/", description: "Homepage hero, stats, pillars, and services overview." },
  { slug: "our-company", label: "Our Company", group: "page", route: "/our-company", description: "Company story, history timeline, and leadership team." },
  { slug: "the-challenge", label: "The Challenge", group: "page", route: "/the-challenge", description: "The senior-care funding crisis, our response, and progress." },
  { slug: "upcoming-events", label: "Upcoming Events", group: "page", route: "/upcoming-events", description: "Featured event, community calendars, and event gallery." },
  { slug: "artists-gallery", label: "Artists Gallery", group: "page", route: "/artists-gallery", description: "Craft fair guidelines, drop-off dates, and gallery display info." },
  { slug: "community", label: "Pillar: Community", group: "page", route: "/community", description: "Community pillar page: volunteering and belonging." },
  { slug: "employment", label: "Pillar: Employment", group: "page", route: "/employment", description: "Employment pillar page: careers and staff culture." },
  { slug: "environment", label: "Pillar: Environment", group: "page", route: "/environment", description: "Environment pillar page: campus and sustainability." },
  { slug: "community-outreach", label: "Pillar: Community Outreach", group: "page", route: "/community-outreach", description: "Community outreach pillar page." },
  { slug: "assisted-living", label: "Service: Assisted Living", group: "page", route: "/assisted-living", description: "Assisted living service page." },
  { slug: "short-term-rehab", label: "Service: Short-Term Rehab", group: "page", route: "/short-term-rehab", description: "Short-term rehab service page." },
  { slug: "skilled-nursing", label: "Service: Skilled Nursing", group: "page", route: "/skilled-nursing", description: "Skilled nursing service page." },
]

export function getCmsDoc(slug: string): CmsDoc | undefined {
  return cmsRegistry.find((doc) => doc.slug === slug)
}
