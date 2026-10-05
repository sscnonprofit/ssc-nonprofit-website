import { createSection } from "@/lib/builder/registry"
import { MAX_SECTIONS, type BuilderDoc, type Section } from "@/lib/builder/schema"

type Json = Record<string, unknown>

const TITLE_KEYS = ["title", "heading", "headline", "name", "label"]
const BODY_KEYS = ["body", "subtitle", "description", "intro", "lead", "text", "summary", "blurb"]
const IMAGE_KEY = /image|photo|src|logo|thumbnail|picture/i
const MAX_ITEMS = 12

const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0

function pick(node: Json, keys: string[]): string {
  for (const key of keys) if (isText(node[key])) return (node[key] as string).trim()
  return ""
}

function imageOf(node: Json): string {
  for (const [key, value] of Object.entries(node)) {
    if (IMAGE_KEY.test(key) && !/alt/i.test(key) && isText(value) && /^(\/|https?:\/\/)/.test(value)) return value
  }
  return ""
}

function altOf(node: Json): string {
  return pick(node, ["imageAlt", "alt", "caption"])
}

function paragraphsOf(node: Json): string {
  for (const value of Object.values(node)) {
    if (Array.isArray(value) && value.length > 0 && value.every(isText)) {
      const avg = value.reduce((n, s) => n + s.length, 0) / value.length
      if (avg > 80) return value.join("\n\n")
    }
  }
  return ""
}

function bulletsOf(node: Json): { text: string }[] {
  for (const value of Object.values(node)) {
    if (Array.isArray(value) && value.length > 0 && value.every(isText)) {
      const avg = value.reduce((n, s) => n + s.length, 0) / value.length
      if (avg <= 80) return value.slice(0, MAX_ITEMS).map((text) => ({ text }))
    }
  }
  return []
}

/** Builds a section from defaults with all demo text cleared, so only real page content shows. */
function section(type: string, props: Json): Section {
  const base = createSection(type)
  const cleared: Json = {}
  for (const [key, value] of Object.entries(base.props)) {
    cleared[key] = typeof value === "string" ? "" : Array.isArray(value) ? [] : value
  }
  return { ...base, props: { ...cleared, ...props } }
}

function sectionFromArray(items: unknown[], heading: { eyebrow: string; title: string; intro: string }): Section | null {
  const objects = items.filter(isObj).slice(0, MAX_ITEMS)
  if (objects.length === 0) return null
  const has = (key: string) => objects.filter((o) => isText(o[key])).length >= Math.ceil(objects.length / 2)

  if (has("quote")) {
    return section("testimonials", {
      eyebrow: heading.eyebrow,
      title: heading.title,
      items: objects.map((o) => ({ quote: pick(o, ["quote"]), name: pick(o, ["name", "author"]), role: pick(o, ["role", "title"]), image: imageOf(o) })),
    })
  }
  if (has("value") && has("label")) {
    return section("stats", {
      title: heading.title,
      items: objects.map((o) => ({ value: String(o.value ?? "").slice(0, 20), label: pick(o, ["label"]) })),
    })
  }
  if (has("name") && has("role")) {
    return section("team", {
      eyebrow: heading.eyebrow,
      title: heading.title,
      items: objects.map((o) => ({ image: imageOf(o), name: pick(o, ["name"]), role: pick(o, ["role"]), bio: pick(o, ["bio", ...BODY_KEYS]) })),
    })
  }
  const imageOnly = objects.every((o) => imageOf(o) && !pick(o, BODY_KEYS))
  if (imageOnly) {
    return section("gallery", {
      eyebrow: heading.eyebrow,
      title: heading.title,
      images: objects.map((o) => ({ image: imageOf(o), alt: altOf(o), caption: pick(o, ["caption", ...TITLE_KEYS]) })),
    })
  }
  if (objects.some((o) => pick(o, TITLE_KEYS))) {
    return section("features", {
      eyebrow: heading.eyebrow,
      title: heading.title,
      intro: heading.intro,
      items: objects.map((o) => ({
        image: imageOf(o),
        title: pick(o, TITLE_KEYS),
        body: pick(o, BODY_KEYS) || paragraphsOf(o),
        linkLabel: pick(o, ["linkLabel", "ctaLabel", "buttonLabel"]),
        href: pick(o, ["href", "url", "link"]),
      })),
    })
  }
  return null
}

function sectionsFromNode(node: Json, isFirst: boolean, depth: number): Section[] {
  const eyebrow = pick(node, ["eyebrow", "kicker", "tag"])
  const title = pick(node, TITLE_KEYS)
  const body = pick(node, BODY_KEYS) || paragraphsOf(node)
  const image = imageOf(node)
  const out: Section[] = []

  if (isFirst && title) {
    out.push(
      section("hero", {
        eyebrow,
        title,
        subtitle: body.slice(0, 500),
        primaryLabel: pick(node, ["ctaLabel", "primaryLabel", "buttonLabel"]),
        primaryHref: pick(node, ["ctaHref", "primaryHref", "href"]),
        image,
        imageAlt: altOf(node),
      }),
    )
  } else if (image && (title || body)) {
    out.push(section("imageText", { eyebrow, title, body, image, imageAlt: altOf(node), bullets: bulletsOf(node) }))
  } else if (title || body) {
    const bullets = bulletsOf(node).map((b) => `- ${b.text}`).join("\n")
    out.push(section("richText", { eyebrow, title, body: [body, bullets].filter(Boolean).join("\n\n") }))
  }

  const heading = { eyebrow: "", title: out.length ? "" : title, intro: out.length ? "" : body }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      const fromArray = sectionFromArray(value, heading)
      if (fromArray) out.push(fromArray)
    } else if (isObj(value) && depth < 2) {
      out.push(...sectionsFromNode(value, false, depth + 1))
    }
  }
  return out
}

export function templateToBuilderDoc(title: string, description: string, content: unknown): BuilderDoc {
  const sections: Section[] = []
  if (isObj(content)) {
    const entries = Object.values(content)
    entries.forEach((value, index) => {
      if (isObj(value)) sections.push(...sectionsFromNode(value, sections.length === 0 && index === 0, 0))
      else if (Array.isArray(value)) {
        const fromArray = sectionFromArray(value, { eyebrow: "", title: "", intro: "" })
        if (fromArray) sections.push(fromArray)
      }
    })
  }
  if (sections.length === 0) sections.push(section("hero", { title, subtitle: description }))

  return {
    kind: "builder",
    title,
    seo: { title, description: description.slice(0, 160), image: "", noindex: false },
    sections: sections.slice(0, MAX_SECTIONS),
  }
}
