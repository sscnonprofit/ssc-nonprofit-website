import assert from "node:assert/strict"
import { test } from "node:test"
import home from "../../content/home.json"
import { buildSeoAudit, seoChecks } from "./seo"

function builder(title = "Community resources", description = "Helpful resources for families.", noindex = false) {
  return { kind: "builder", title, seo: { title: "", description, image: "", noindex }, sections: [] }
}

test("audits the same bundled metadata that public CMS pages use before editing", () => {
  const audit = buildSeoAudit([])
  assert.equal(audit.pages.length, 10)
  assert.equal(audit.pages.find((page) => page.path === "/")?.title, home.seo.title)
  assert.equal(new Set(audit.pages.map((page) => page.path)).size, 10)
  assert(audit.pages.every((page) => Object.keys(page.checks).length === seoChecks.length))
})

test("uses published CMS content, not a draft awaiting publication", () => {
  const audit = buildSeoAudit([{
    slug: "home", status: "published", content: { seo: { title: "Published homepage", description: "Published search description." } },
    ...{ draftContent: { seo: { title: "Unpublished homepage", description: "" } } },
  }])
  assert.equal(audit.pages[0].title, "Published homepage")
  assert.equal(audit.pages[0].checks.description, true)
})

test("excludes unpublished builder pages and preserves the public title fallback", () => {
  const audit = buildSeoAudit([
    { slug: "family-resources", status: "published", content: builder() },
    { slug: "new-page", status: "draft", content: builder("Draft") },
    { slug: "archived-page", status: "archived", content: builder("Archived") },
  ])
  const page = audit.pages.find((item) => item.path === "/family-resources")!
  assert.equal(audit.pages.length, 11)
  assert.equal(audit.excludedDrafts, 2)
  assert.equal(page.title, "Community resources")
  assert.equal(page.href, "/admin/builder/family-resources")
  assert.equal(page.checks.title, true)
  assert.deepEqual(page.issues, [])
})

test("flags missing metadata, duplicate titles, and noindex without mutating source data", () => {
  const source = [
    { slug: "resources-a", status: "published", content: builder("Shared    title", "", true) },
    { slug: "resources-b", status: "published", content: builder("SHARED TITLE") },
  ]
  const original = structuredClone(source)
  const pages = buildSeoAudit(source).pages.filter((page) => page.group === "builder")
  assert.equal(pages[0].checks.unique, false)
  assert.equal(pages[1].checks.unique, false)
  assert.equal(pages[0].checks.description, false)
  assert.equal(pages[0].checks.visibility, false)
  assert.equal(pages[0].issues.length, 3)
  assert.deepEqual(source, original)
})

test("detects duplicate titles across CMS and builder pages", () => {
  const pages = buildSeoAudit([{ slug: "meet-us", status: "published", content: builder("Leadership") }]).pages
  assert.equal(pages.find((page) => page.path === "/leadership")?.checks.unique, false)
  assert.equal(pages.find((page) => page.path === "/meet-us")?.checks.unique, false)
})

test("checks metadata lengths and safely handles malformed saved content", () => {
  const audit = buildSeoAudit([
    { slug: "home", status: "published", content: { seo: { title: "a".repeat(71), description: "b".repeat(171) } } },
    { slug: "services", status: "published", content: [] },
    { slug: "leadership", status: "published", content: { seo: null } },
  ])
  assert.equal(audit.pages[0].checks.title, false)
  assert.equal(audit.pages[0].checks.description, false)
  assert.equal(audit.pages.find((page) => page.path === "/assisted-living")?.checks.title, false)
  assert.equal(audit.pages.find((page) => page.path === "/leadership")?.title, "Leadership")
})

test("mirrors public builder metadata truncation and excludes reserved or invalid routes", () => {
  const doc = builder("Builder title", "x".repeat(180))
  doc.seo.title = "y".repeat(80)
  const pages = buildSeoAudit([
    { slug: "resources", status: "published", content: doc },
    { slug: "our-company", status: "published", content: doc },
    { slug: "calendars", status: "published", content: doc },
    { slug: "invalid/path", status: "published", content: doc },
  ]).pages.filter((page) => page.group === "builder")
  assert.equal(pages.length, 1)
  assert.equal(pages[0].title.length, 70)
  assert.equal(pages[0].description.length, 170)
  assert.equal(pages[0].checks.title, true)
  assert.equal(pages[0].checks.description, true)
})
