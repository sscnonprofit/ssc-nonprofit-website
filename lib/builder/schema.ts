import { isSafeHref } from "@/lib/cms/theme"

export type FieldType = "text" | "textarea" | "url" | "image" | "select"

export type ScalarField = {
  key: string
  label: string
  type: FieldType
  max?: number
  placeholder?: string
  options?: { value: string; label: string }[]
}

export type ListField = {
  key: string
  label: string
  type: "list"
  itemLabel: string
  max: number
  fields: ScalarField[]
}

export type Field = ScalarField | ListField

export type BlockCategory = "Hero" | "Content" | "Media" | "Social proof" | "Contact" | "Layout"

export type BlockDefinition = {
  type: string
  label: string
  description: string
  category: BlockCategory
  variants: { value: string; label: string }[]
  fields: Field[]
  defaults: Record<string, unknown>
  defaultStyle?: Partial<SectionStyle>
}

export const BACKGROUNDS = ["default", "muted", "card", "primary", "accent", "dark", "custom", "image"] as const
export const PADDINGS = ["none", "sm", "md", "lg", "xl"] as const
export const WIDTHS = ["narrow", "normal", "wide", "full"] as const
export const ANIMATIONS = ["none", "fade", "slide-up"] as const
export const TEXT_MODES = ["auto", "dark", "light"] as const

export type SectionStyle = {
  background: (typeof BACKGROUNDS)[number]
  bgColor: string
  bgImage: string
  overlay: number
  paddingY: (typeof PADDINGS)[number]
  width: (typeof WIDTHS)[number]
  align: "left" | "center"
  text: (typeof TEXT_MODES)[number]
  animation: (typeof ANIMATIONS)[number]
  divider: boolean
}

export type Visibility = { desktop: boolean; tablet: boolean; mobile: boolean }

export type Section = {
  id: string
  type: string
  variant: string
  label: string
  props: Record<string, unknown>
  style: SectionStyle
  visibility: Visibility
  anchor: string
}

export type PageSeo = {
  title: string
  description: string
  image: string
  noindex: boolean
}

export type BuilderDoc = {
  kind: "builder"
  title: string
  seo: PageSeo
  sections: Section[]
}

export const DEFAULT_STYLE: SectionStyle = {
  background: "default",
  bgColor: "#f4efe9",
  bgImage: "",
  overlay: 55,
  paddingY: "md",
  width: "normal",
  align: "left",
  text: "auto",
  animation: "none",
  divider: false,
}

export const DEFAULT_VISIBILITY: Visibility = { desktop: true, tablet: true, mobile: true }

export const MAX_SECTIONS = 60

export function isBuilderDoc(value: unknown): value is BuilderDoc {
  return Boolean(value && typeof value === "object" && (value as { kind?: unknown }).kind === "builder")
}

export function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function str(value: unknown, max = 600): string {
  return typeof value === "string" ? value.slice(0, max) : ""
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function safeUrl(value: unknown): string {
  const url = str(value, 2000).trim()
  if (!url) return ""
  return isSafeHref(url) ? url : ""
}

function safeImage(value: unknown): string {
  const url = str(value, 2000).trim()
  if (!url) return ""
  if (url.startsWith("/") && !url.startsWith("//")) return url
  return /^https:\/\//i.test(url) ? url : ""
}

function sanitizeScalar(field: ScalarField, value: unknown): string {
  switch (field.type) {
    case "url":
      return safeUrl(value)
    case "image":
      return safeImage(value)
    case "select": {
      const options = field.options?.map((o) => o.value) ?? []
      return oneOf(value, options, options[0] ?? "")
    }
    case "textarea":
      return str(value, field.max ?? 4000)
    default:
      return str(value, field.max ?? 300)
  }
}

export function sanitizeProps(def: BlockDefinition, input: unknown): Record<string, unknown> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const field of def.fields) {
    if (field.type === "list") {
      const items = Array.isArray(raw[field.key]) ? (raw[field.key] as unknown[]) : []
      out[field.key] = items.slice(0, field.max).map((item) => {
        const itemRaw = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
        const clean: Record<string, unknown> = {}
        for (const sub of field.fields) clean[sub.key] = sanitizeScalar(sub, itemRaw[sub.key])
        return clean
      })
    } else {
      out[field.key] = sanitizeScalar(field, raw[field.key])
    }
  }
  return out
}

export function sanitizeStyle(input: unknown, base: SectionStyle = DEFAULT_STYLE): SectionStyle {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>
  const overlay = Number(raw.overlay)
  return {
    background: oneOf(raw.background, BACKGROUNDS, base.background),
    bgColor: typeof raw.bgColor === "string" && /^#[0-9a-f]{6}$/i.test(raw.bgColor) ? raw.bgColor : base.bgColor,
    bgImage: safeImage(raw.bgImage ?? base.bgImage),
    overlay: Number.isFinite(overlay) ? Math.min(90, Math.max(0, Math.round(overlay))) : base.overlay,
    paddingY: oneOf(raw.paddingY, PADDINGS, base.paddingY),
    width: oneOf(raw.width, WIDTHS, base.width),
    align: oneOf(raw.align, ["left", "center"] as const, base.align),
    text: oneOf(raw.text, TEXT_MODES, base.text),
    animation: oneOf(raw.animation, ANIMATIONS, base.animation),
    divider: typeof raw.divider === "boolean" ? raw.divider : base.divider,
  }
}

export function sanitizeSection(input: unknown, registry: Record<string, BlockDefinition>): Section | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Record<string, unknown>
  const def = typeof raw.type === "string" ? registry[raw.type] : undefined
  if (!def) return null
  const vis = (raw.visibility && typeof raw.visibility === "object" ? raw.visibility : {}) as Record<string, unknown>
  const id = typeof raw.id === "string" && /^[a-z0-9-]{1,40}$/i.test(raw.id) ? raw.id : newId()
  const anchor = str(raw.anchor, 60)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
  return {
    id,
    type: def.type,
    variant: oneOf(
      raw.variant,
      def.variants.map((v) => v.value),
      def.variants[0].value,
    ),
    label: str(raw.label, 80),
    props: sanitizeProps(def, raw.props),
    style: sanitizeStyle(raw.style, { ...DEFAULT_STYLE, ...def.defaultStyle }),
    visibility: {
      desktop: vis.desktop !== false,
      tablet: vis.tablet !== false,
      mobile: vis.mobile !== false,
    },
    anchor,
  }
}

export function sanitizeBuilderDoc(input: unknown, registry: Record<string, BlockDefinition>): BuilderDoc {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>
  const seo = (raw.seo && typeof raw.seo === "object" ? raw.seo : {}) as Record<string, unknown>
  const sections = Array.isArray(raw.sections) ? raw.sections : []
  const seen = new Set<string>()
  const clean: Section[] = []
  for (const item of sections.slice(0, MAX_SECTIONS)) {
    const section = sanitizeSection(item, registry)
    if (!section) continue
    if (seen.has(section.id)) section.id = newId()
    seen.add(section.id)
    clean.push(section)
  }
  return {
    kind: "builder",
    title: str(raw.title, 120).trim() || "Untitled page",
    seo: {
      title: str(seo.title, 70),
      description: str(seo.description, 170),
      image: safeImage(seo.image),
      noindex: seo.noindex === true,
    },
    sections: clean,
  }
}

/** Slugs that are CMS documents or existing hard-coded routes. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "theme",
  "site",
  "home",
  "company",
  "challenge",
  "events",
  "gallery",
  "pillars",
  "services",
  "section-templates",
  "artists-gallery",
  "assisted-living",
  "community",
  "community-outreach",
  "contact",
  "donate",
  "employment",
  "environment",
  "our-company",
  "short-term-rehab",
  "skilled-nursing",
  "the-challenge",
  "upcoming-events",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
])

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "Enter a URL slug."
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Use lowercase letters, numbers, and single hyphens."
  if (slug.length > 60) return "Keep the slug under 60 characters."
  if (RESERVED_SLUGS.has(slug)) return "That URL is already used by the site."
  return null
}
