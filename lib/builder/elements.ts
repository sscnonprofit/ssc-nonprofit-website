import { isSafeHref } from "@/lib/cms/theme"
import type { ScalarField } from "@/lib/builder/schema"

export const ELEMENT_KINDS = ["heading", "text", "quote", "list", "image", "video", "iconBox", "button", "divider", "spacer"] as const
export const SPANS = ["full", "half", "third"] as const
export const ELEMENT_ALIGNS = ["inherit", "left", "center", "right"] as const
export const ELEMENT_SIZES = ["sm", "md", "lg", "xl"] as const
export const MAX_ELEMENTS = 40

export type ElementKind = (typeof ELEMENT_KINDS)[number]

/** A single building block inside a Custom section. Every kind shares one flat, serializable shape. */
export type CustomElement = {
  id: string
  kind: ElementKind
  span: (typeof SPANS)[number]
  align: (typeof ELEMENT_ALIGNS)[number]
  size: (typeof ELEMENT_SIZES)[number]
  variant: string
  text: string
  text2: string
  href: string
  image: string
  alt: string
  items: string
}

export type ElementGroup = "Text" | "Media" | "Actions" | "Layout"
export const ELEMENT_GROUPS: ElementGroup[] = ["Text", "Media", "Actions", "Layout"]

export type ElementDef = {
  kind: ElementKind
  label: string
  description: string
  group: ElementGroup
  fields: ScalarField[]
  sizes?: { value: CustomElement["size"]; label: string }[]
  alignable: boolean
  defaults: Partial<CustomElement>
}

export const ICON_OPTIONS = [
  { value: "heart", label: "Heart" },
  { value: "care", label: "Care" },
  { value: "shield", label: "Safety" },
  { value: "home", label: "Home" },
  { value: "meals", label: "Meals" },
  { value: "users", label: "People" },
  { value: "smile", label: "Smile" },
  { value: "calendar", label: "Calendar" },
  { value: "phone", label: "Phone" },
  { value: "sun", label: "Sun" },
  { value: "star", label: "Star" },
  { value: "sparkles", label: "Sparkles" },
]

const SIZES_TEXT: ElementDef["sizes"] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
]

const PLACEHOLDER_IMAGE = "/placeholder.svg?height=800&width=1200"

export const ELEMENT_DEFS: ElementDef[] = [
  {
    kind: "heading",
    label: "Heading",
    description: "A title or small label.",
    group: "Text",
    alignable: true,
    sizes: SIZES_TEXT,
    fields: [
      { key: "text", label: "Heading", type: "text", max: 200 },
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: [
          { value: "heading", label: "Heading" },
          { value: "eyebrow", label: "Small label" },
        ],
      },
    ],
    defaults: { text: "Add a heading", variant: "heading", size: "md" },
  },
  {
    kind: "text",
    label: "Text",
    description: "One or more paragraphs.",
    group: "Text",
    alignable: true,
    sizes: SIZES_TEXT,
    fields: [{ key: "text", label: "Text", type: "textarea", max: 3000 }],
    defaults: { text: "Write something warm and clear here. Leave a blank line to start a new paragraph.", size: "md" },
  },
  {
    kind: "quote",
    label: "Quote",
    description: "A highlighted quote with a name.",
    group: "Text",
    alignable: true,
    fields: [
      { key: "text", label: "Quote", type: "textarea", max: 800 },
      { key: "text2", label: "Name or source", type: "text", max: 80 },
    ],
    defaults: { text: "The staff treated us like family from the first day.", text2: "A resident's daughter" },
  },
  {
    kind: "list",
    label: "List",
    description: "Checkmarks, bullets, or numbers.",
    group: "Text",
    alignable: false,
    fields: [
      { key: "items", label: "List items (one per line)", type: "textarea", max: 1500 },
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: [
          { value: "check", label: "Checks" },
          { value: "bullet", label: "Bullets" },
          { value: "number", label: "Numbers" },
        ],
      },
    ],
    defaults: { items: "24/7 licensed nursing\nOn-site therapy gym\nChef-prepared meals", variant: "check" },
  },
  {
    kind: "image",
    label: "Image",
    description: "A photo with an optional caption.",
    group: "Media",
    alignable: true,
    sizes: [
      { value: "sm", label: "S" },
      { value: "md", label: "M" },
      { value: "lg", label: "L" },
      { value: "xl", label: "Full" },
    ],
    fields: [
      { key: "image", label: "Image", type: "image" },
      { key: "alt", label: "Image description", type: "text", max: 200 },
      { key: "text2", label: "Caption", type: "text", max: 160 },
      {
        key: "variant",
        label: "Shape",
        type: "select",
        options: [
          { value: "auto", label: "Original" },
          { value: "square", label: "Square" },
          { value: "landscape", label: "4:3" },
          { value: "wide", label: "Wide" },
        ],
      },
    ],
    defaults: { image: PLACEHOLDER_IMAGE, alt: "", variant: "landscape", size: "xl" },
  },
  {
    kind: "video",
    label: "Video",
    description: "YouTube or Vimeo.",
    group: "Media",
    alignable: false,
    fields: [
      { key: "href", label: "YouTube or Vimeo URL", type: "url", placeholder: "https://www.youtube.com/watch?v=..." },
      { key: "text2", label: "Caption", type: "text", max: 160 },
    ],
    defaults: {},
  },
  {
    kind: "iconBox",
    label: "Icon box",
    description: "An icon with a title and short text.",
    group: "Media",
    alignable: true,
    fields: [
      { key: "variant", label: "Icon", type: "select", options: ICON_OPTIONS },
      { key: "text", label: "Title", type: "text", max: 120 },
      { key: "text2", label: "Text", type: "textarea", max: 400 },
    ],
    defaults: { variant: "heart", text: "Compassionate care", text2: "A short line about why this matters." },
  },
  {
    kind: "button",
    label: "Button",
    description: "A link styled as a button.",
    group: "Actions",
    alignable: true,
    fields: [
      { key: "text", label: "Button label", type: "text", max: 60 },
      { key: "href", label: "Link", type: "url", placeholder: "/contact or https://" },
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: [
          { value: "primary", label: "Solid" },
          { value: "secondary", label: "Outline" },
          { value: "accent", label: "Accent" },
        ],
      },
    ],
    defaults: { text: "Schedule a visit", href: "/contact", variant: "primary" },
  },
  {
    kind: "divider",
    label: "Divider",
    description: "A line or the SSC brand stripe.",
    group: "Layout",
    alignable: false,
    fields: [
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: [
          { value: "line", label: "Line" },
          { value: "brand", label: "Brand stripe" },
        ],
      },
    ],
    defaults: { variant: "line" },
  },
  {
    kind: "spacer",
    label: "Spacer",
    description: "Extra empty space.",
    group: "Layout",
    alignable: false,
    sizes: [
      { value: "sm", label: "S" },
      { value: "md", label: "M" },
      { value: "lg", label: "L" },
      { value: "xl", label: "XL" },
    ],
    fields: [],
    defaults: { size: "md" },
  },
]

export const ELEMENT_MAP: Record<ElementKind, ElementDef> = Object.fromEntries(ELEMENT_DEFS.map((d) => [d.kind, d])) as Record<
  ElementKind,
  ElementDef
>

export function elementId() {
  return Math.random().toString(36).slice(2, 10)
}

export function createElement(kind: ElementKind, overrides?: Partial<CustomElement>): CustomElement {
  const def = ELEMENT_MAP[kind]
  return {
    id: elementId(),
    kind,
    span: kind === "iconBox" ? "third" : "full",
    align: "inherit",
    size: "md",
    variant: "",
    text: "",
    text2: "",
    href: "",
    image: "",
    alt: "",
    items: "",
    ...def.defaults,
    ...overrides,
  }
}

/** The starting layout for a brand-new Custom section. */
export function starterElements(): CustomElement[] {
  return [
    createElement("heading", { text: "Tell your story your way" }),
    createElement("text"),
    createElement("button"),
  ]
}

function str(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : ""
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function safeUrl(value: unknown) {
  const url = str(value, 2000).trim()
  return url && isSafeHref(url) ? url : ""
}

function safeImage(value: unknown) {
  const url = str(value, 2000).trim()
  if (!url) return ""
  if (url.startsWith("/") && !url.startsWith("//")) return url
  return /^https:\/\//i.test(url) ? url : ""
}

export function sanitizeElements(input: unknown): CustomElement[] {
  const list = Array.isArray(input) ? input.slice(0, MAX_ELEMENTS) : []
  const seen = new Set<string>()
  const out: CustomElement[] = []
  for (const item of list) {
    if (!item || typeof item !== "object") continue
    const raw = item as Record<string, unknown>
    if (!ELEMENT_KINDS.includes(raw.kind as ElementKind)) continue
    const def = ELEMENT_MAP[raw.kind as ElementKind]
    const base = createElement(def.kind)
    let id = typeof raw.id === "string" && /^[a-z0-9-]{1,40}$/i.test(raw.id) ? raw.id : elementId()
    if (seen.has(id)) id = elementId()
    seen.add(id)
    const variantOptions = def.fields.find((f) => f.key === "variant")?.options?.map((o) => o.value) ?? []
    out.push({
      id,
      kind: def.kind,
      span: oneOf(raw.span, SPANS, base.span),
      align: oneOf(raw.align, ELEMENT_ALIGNS, "inherit"),
      size: oneOf(raw.size, ELEMENT_SIZES, base.size),
      variant: variantOptions.length ? oneOf(raw.variant, variantOptions, variantOptions[0]) : "",
      text: str(raw.text, 3000),
      text2: str(raw.text2, 800),
      href: safeUrl(raw.href),
      image: safeImage(raw.image),
      alt: str(raw.alt, 200),
      items: str(raw.items, 1500),
    })
  }
  return out
}
