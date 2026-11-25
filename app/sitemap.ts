import type { MetadataRoute } from "next"

import { listPublicAlbums, listPublicOccurrences } from "@/lib/events/data"

const BASE_URL = "https://sscnonprofit.org"

const routes = [
  { path: "", priority: 1 },
  { path: "/assisted-living", priority: 0.9 },
  { path: "/short-term-rehab", priority: 0.9 },
  { path: "/accepted-insurance", priority: 0.8 },
  { path: "/skilled-nursing", priority: 0.9 },
  { path: "/end-of-life", priority: 0.9 },
  { path: "/our-company", priority: 0.8 },
  { path: "/the-challenge", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/donate", priority: 0.8 },
  { path: "/leave-a-legacy", priority: 0.7 },
  { path: "/community", priority: 0.7 },
  { path: "/employment", priority: 0.7 },
  { path: "/environment", priority: 0.7 },
  { path: "/community-outreach", priority: 0.7 },
  { path: "/upcoming-events", priority: 0.6 },
  { path: "/cafe-menu", priority: 0.6 },
  { path: "/artists-gallery", priority: 0.6 },
]

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()
  const entries: MetadataRoute.Sitemap = routes.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }))

  try {
    const [occurrences, albums] = await Promise.all([
      listPublicOccurrences({ from: new Date(), to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) }),
      listPublicAlbums(),
    ])
    const eventSlugs = [...new Set(occurrences.map((item) => item.slug))]
    for (const slug of eventSlugs) {
      entries.push({ url: `${BASE_URL}/upcoming-events/${slug}`, lastModified, changeFrequency: "weekly", priority: 0.5 })
    }
    for (const album of albums) {
      entries.push({
        url: `${BASE_URL}/artists-gallery/${album.slug}`,
        lastModified: new Date(album.updatedAt),
        changeFrequency: "monthly",
        priority: 0.4,
      })
    }
  } catch {
    // The static routes still render if the database is unreachable.
  }

  return entries
}
