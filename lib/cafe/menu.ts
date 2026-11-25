// Café menu content. Stored as one JSON document in the `pages` table under the
// slug below, with the same draft/publish workflow as other CMS content.
// Shared by the admin editor (client), the server action and the public page.

export const CAFE_MENU_SLUG = "cafe-menu"
export const CAFE_MENU_PATH = "/cafe-menu"

export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Sugar-free",
  "Contains nuts",
] as const
export type DietaryTag = (typeof DIETARY_TAGS)[number]

export type CafeMenuItem = {
  id: string
  name: string
  description: string
  /** Dollar amount such as "4.50". Empty means no price is shown. */
  price: string
  /** Optional text beside the price, e.g. "per scoop" or "Large $3.50". */
  priceNote: string
  tags: DietaryTag[]
  /** Unavailable items stay on the menu, marked "Not available today". */
  available: boolean
  featured: boolean
  visible: boolean
}

export type CafeMenuSection = {
  id: string
  name: string
  description: string
  visible: boolean
  items: CafeMenuItem[]
}

export type CafeMenu = {
  enabled: boolean
  title: string
  intro: string
  hours: string
  location: string
  footnote: string
  heroImage: string
  sections: CafeMenuSection[]
}

export const DEFAULT_HERO_IMAGE = "/images/SSC_wide-angle-shot-of-new-building.jpg"

export const DEFAULT_CAFE_MENU: CafeMenu = {
  enabled: true,
  title: "Café Menu",
  intro: "Stop by our café for fresh coffee, light meals and treats. Residents, families and visitors are always welcome.",
  hours: "",
  location: "",
  footnote: "Prices and availability are subject to change.",
  heroImage: DEFAULT_HERO_IMAGE,
  sections: [],
}

export const LIMITS = { sections: 30, items: 80 } as const

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}
const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback)

export function newMenuItem(): CafeMenuItem {
  return { id: crypto.randomUUID(), name: "", description: "", price: "", priceNote: "", tags: [], available: true, featured: false, visible: true }
}
export function newMenuSection(): CafeMenuSection {
  return { id: crypto.randomUUID(), name: "", description: "", visible: true, items: [] }
}

/** Reads stored content leniently, filling in defaults; never throws. */
export function getCafeMenu(content: unknown): CafeMenu {
  const raw = object(content)
  return {
    enabled: raw.enabled !== false,
    title: str(raw.title, DEFAULT_CAFE_MENU.title),
    intro: str(raw.intro, DEFAULT_CAFE_MENU.intro),
    hours: str(raw.hours),
    location: str(raw.location),
    footnote: str(raw.footnote, DEFAULT_CAFE_MENU.footnote),
    heroImage: str(raw.heroImage, DEFAULT_HERO_IMAGE),
    sections: (Array.isArray(raw.sections) ? raw.sections : []).map((s, i) => {
      const section = object(s)
      return {
        id: str(section.id, `section-${i}`),
        name: str(section.name),
        description: str(section.description),
        visible: section.visible !== false,
        items: (Array.isArray(section.items) ? section.items : []).map((it, j) => {
          const item = object(it)
          return {
            id: str(item.id, `item-${i}-${j}`),
            name: str(item.name),
            description: str(item.description),
            price: str(item.price),
            priceNote: str(item.priceNote),
            tags: (Array.isArray(item.tags) ? item.tags : []).filter((t): t is DietaryTag => (DIETARY_TAGS as readonly unknown[]).includes(t)),
            available: item.available !== false,
            featured: item.featured === true,
            visible: item.visible !== false,
          }
        }),
      }
    }),
  }
}

export function safeImageUrl(value: string) {
  if (!value || value !== value.trim() || /[\s\\\u0000-\u001f]/.test(value)) return false
  if (value.startsWith("/images/") && !value.includes("..")) return true
  try {
    const url = new URL(value)
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

/** Accepts "4", "4.5", "$4.50"; returns a normalized "4.50" or "" when blank. */
export function normalizePrice(value: string): string | null {
  const v = value.trim().replace(/^\$/, "").trim()
  if (!v) return ""
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(v)) return null
  return Number(v).toFixed(2)
}

export function formatPrice(price: string) {
  return price ? `$${price}` : ""
}

function text(value: unknown, label: string, max: number, required = false) {
  if (typeof value !== "string" || value.length > max) throw new Error(`${label} must be no more than ${max} characters.`)
  const v = value.trim()
  if (required && !v) throw new Error(`${label} is required.`)
  return v
}

export function validateMenuItem(input: unknown, label = "Item"): CafeMenuItem {
  const item = object(input)
  const id = text(item.id, `${label} ID`, 80, true)
  const name = text(item.name, `${label} name`, 120, true)
  const price = normalizePrice(text(item.price, `${name} price`, 12))
  if (price === null) throw new Error(`${name}: enter the price as a dollar amount, like 4.50.`)
  const tags = Array.isArray(item.tags) ? item.tags : []
  if (tags.some((t) => !(DIETARY_TAGS as readonly unknown[]).includes(t))) throw new Error(`${name}: unknown dietary label.`)
  for (const key of ["available", "featured", "visible"] as const)
    if (typeof item[key] !== "boolean") throw new Error(`${name}: invalid ${key} setting.`)
  return {
    id,
    name,
    description: text(item.description, `${name} description`, 400),
    price,
    priceNote: text(item.priceNote, `${name} price note`, 60),
    tags: DIETARY_TAGS.filter((t) => tags.includes(t)),
    available: item.available as boolean,
    featured: item.featured as boolean,
    visible: item.visible as boolean,
  }
}

/** Strict validation for saving; throws an Error with a staff-readable message. */
export function validateCafeMenu(input: unknown): CafeMenu {
  const menu = object(input)
  if (typeof menu.enabled !== "boolean") throw new Error("Choose whether to show the café menu.")
  if (!Array.isArray(menu.sections) || menu.sections.length > LIMITS.sections)
    throw new Error(`The menu can have up to ${LIMITS.sections} sections.`)
  const heroImage = text(menu.heroImage, "Header image", 2000)
  if (heroImage && !safeImageUrl(heroImage)) throw new Error("Header image must be an uploaded image, an /images/ path or an https:// URL.")
  const ids = new Set<string>()
  const unique = (id: string) => {
    if (ids.has(id)) throw new Error("Menu IDs must be unique.")
    ids.add(id)
    return id
  }
  const sections = menu.sections.map((s, i) => {
    const section = object(s)
    const label = `Section ${i + 1}`
    const name = text(section.name, `${label} name`, 80, true)
    if (typeof section.visible !== "boolean") throw new Error(`${name}: invalid visibility setting.`)
    if (!Array.isArray(section.items) || section.items.length > LIMITS.items)
      throw new Error(`${name} can have up to ${LIMITS.items} items.`)
    return {
      id: unique(text(section.id, `${label} ID`, 80, true)),
      name,
      description: text(section.description, `${name} description`, 300),
      visible: section.visible,
      items: section.items.map((it, j) => {
        const item = validateMenuItem(it, `${name} item ${j + 1}`)
        unique(item.id)
        return item
      }),
    }
  })
  return {
    enabled: menu.enabled,
    title: text(menu.title, "Menu title", 120, true),
    intro: text(menu.intro, "Introduction", 600),
    hours: text(menu.hours, "Hours", 300),
    location: text(menu.location, "Location", 160),
    footnote: text(menu.footnote, "Footnote", 400),
    heroImage: heroImage || DEFAULT_HERO_IMAGE,
    sections,
  }
}

export function menusEqual(a: CafeMenu, b: CafeMenu) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/** What visitors see: visible sections with at least one visible item. */
export function publicSections(menu: CafeMenu) {
  return menu.sections
    .filter((s) => s.visible)
    .map((s) => ({ ...s, items: s.items.filter((i) => i.visible) }))
    .filter((s) => s.items.length > 0)
}
