import homeFallback from "@/content/home.json"
import pillarsFallback from "@/content/pillars.json"
import servicesFallback from "@/content/services.json"
import { isBuilderDoc, RESERVED_SLUGS, sanitizeBuilderDoc } from "@/lib/builder/schema"
import { createLeadershipContent, validateLeadershipContent } from "@/lib/cms/leadership"

export const seoChecks = [
  { key: "title", label: "Page titles", description: "A page-specific title between 1 and 70 characters, before the site-name suffix." },
  { key: "description", label: "Descriptions", description: "A page-specific search description between 1 and 170 characters." },
  { key: "unique", label: "Unique titles", description: "A nonempty title that is not repeated on another audited page." },
  { key: "visibility", label: "Visibility", description: "The published page does not request noindex. This does not confirm Google indexing." },
] as const

type CheckKey = typeof seoChecks[number]["key"]
type ContentRow = { slug: string; content: unknown; status: string }
type PageMetadata = { path: string; title: string; description: string; noindex: boolean; href: string; group: "cms" | "builder" }
export type SeoPageAudit = PageMetadata & { checks: Record<CheckKey, boolean>; issues: string[] }
export type SeoAudit = { pages: SeoPageAudit[]; excludedDrafts: number }

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function buildSeoAudit(rows: ContentRow[]): SeoAudit {
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  const content = (slug: string, fallback: unknown) => record(bySlug.get(slug)?.content ?? fallback)
  const home = record(content("home", homeFallback).seo)
  const services = content("services", servicesFallback)
  const pillars = content("pillars", pillarsFallback)
  let leadership = createLeadershipContent()
  const leadershipRow = bySlug.get("leadership")
  if (leadershipRow?.status === "published") {
    try {
      validateLeadershipContent(leadershipRow.content)
      leadership = leadershipRow.content
    } catch {
      // The public leadership route also falls back when saved content is invalid.
    }
  }

  const pages: PageMetadata[] = [
    { path: "/", title: text(home.title), description: text(home.description), noindex: false, href: "/admin/pages/home", group: "cms" },
    ...["assisted-living", "short-term-rehab", "skilled-nursing", "end-of-life"].map((slug) => {
      const seo = record(record(services[slug]).seo)
      return { path: `/${slug}`, title: text(seo.title), description: text(seo.description), noindex: false, href: "/admin/pages/services", group: "cms" as const }
    }),
    ...["community", "employment", "environment", "community-outreach"].map((slug) => {
      const pillar = record(pillars[slug])
      return { path: `/${slug}`, title: text(pillar.navLabel), description: text(pillar.metaDescription), noindex: false, href: "/admin/pages/pillars", group: "cms" as const }
    }),
    { path: "/leadership", title: text(leadership.seo.title), description: text(leadership.seo.description), noindex: leadership.seo.noindex, href: "/admin/pages/leadership", group: "cms" },
  ]

  let excludedDrafts = 0
  for (const row of rows) {
    if (!isBuilderDoc(row.content) || RESERVED_SLUGS.has(row.slug) || row.slug === "leadership" || row.slug === "calendars" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) continue
    if (row.status !== "published") {
      excludedDrafts += 1
      continue
    }
    const doc = sanitizeBuilderDoc(row.content, {})
    pages.push({ path: `/${row.slug}`, title: text(doc.seo.title || doc.title), description: text(doc.seo.description), noindex: doc.seo.noindex, href: `/admin/builder/${row.slug}`, group: "builder" })
  }

  const normalizeTitle = (title: string) => title.toLocaleLowerCase("en-US").replace(/\s+/g, " ")
  const titleCounts = new Map<string, number>()
  for (const page of pages) {
    const key = normalizeTitle(page.title)
    if (key) titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1)
  }

  return {
    excludedDrafts,
    pages: pages.map((page) => {
      const checks = {
        title: page.title.length > 0 && page.title.length <= 70,
        description: page.description.length > 0 && page.description.length <= 170,
        unique: Boolean(page.title) && titleCounts.get(normalizeTitle(page.title)) === 1,
        visibility: !page.noindex,
      }
      const issues: string[] = []
      if (!checks.title) issues.push(page.title ? "Title exceeds 70 characters" : "Missing page title")
      if (!checks.description) issues.push(page.description ? "Description exceeds 170 characters" : "Missing search description")
      if (page.title && !checks.unique) issues.push("Title matches another audited page")
      if (!checks.visibility) issues.push("Hidden from search (noindex)")
      return { ...page, checks, issues }
    }),
  }
}
