import type { MetadataRoute } from "next"

const BASE_URL = "https://sscnonprofit.org"

const routes = [
  { path: "", priority: 1 },
  { path: "/assisted-living", priority: 0.9 },
  { path: "/short-term-rehab", priority: 0.9 },
  { path: "/skilled-nursing", priority: 0.9 },
  { path: "/our-company", priority: 0.8 },
  { path: "/the-challenge", priority: 0.8 },
  { path: "/contact", priority: 0.8 },
  { path: "/donate", priority: 0.8 },
  { path: "/community", priority: 0.7 },
  { path: "/employment", priority: 0.7 },
  { path: "/environment", priority: 0.7 },
  { path: "/community-outreach", priority: 0.7 },
  { path: "/upcoming-events", priority: 0.6 },
  { path: "/artists-gallery", priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return routes.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }))
}
