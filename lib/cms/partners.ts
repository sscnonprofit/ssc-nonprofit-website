export type Partner = { id: string; name: string; logo: string; href: string; alt: string; visible: boolean }
export type PartnerSection = { eyebrow: string; title: string; intro: string; enabled: boolean; partners: Partner[] }

const defaults = {
  eyebrow: "Partners",
  title: "Organizations we stand beside",
  intro: "A few of the local causes and nonprofit partners we support each year.",
  enabled: true,
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function safePartnerUrl(value: string, image = false): boolean {
  if (!value || value !== value.trim() || /[\s\\\u0000-\u001f]/.test(value)) return false
  if (image && value.startsWith("/images/") && !value.includes("..")) return true
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

export function getPartnerSection(content: unknown): PartnerSection {
  const outreach = object(object(content)["community-outreach"])
  const section = object(outreach.partnerSection)
  return {
    eyebrow: typeof section.eyebrow === "string" ? section.eyebrow : defaults.eyebrow,
    title: typeof section.title === "string" ? section.title : defaults.title,
    intro: typeof section.intro === "string" ? section.intro : defaults.intro,
    enabled: section.enabled !== false,
    partners: (Array.isArray(outreach.partners) ? outreach.partners : []).map((raw, index) => {
      const item = object(raw)
      return {
        id: typeof item.id === "string" ? item.id : `partner-${index}`,
        name: typeof item.name === "string" ? item.name : "",
        logo: typeof item.logo === "string" ? item.logo : "",
        href: typeof item.href === "string" ? item.href : "",
        alt: typeof item.alt === "string" ? item.alt : typeof item.name === "string" ? item.name : "",
        visible: item.visible !== false,
      }
    }),
  }
}

export function validatePartnerSection(input: unknown): PartnerSection {
  const section = object(input)
  const text = (value: unknown, label: string, max: number, required = false) => {
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) {
      throw new Error(`${label} ${required ? "is required and " : ""}must be no more than ${max} characters.`)
    }
    return value.trim()
  }
  if (typeof section.enabled !== "boolean") throw new Error("Choose whether to show the partner section.")
  if (!Array.isArray(section.partners) || section.partners.length > 100) throw new Error("You can add up to 100 partners.")
  const ids = new Set<string>()
  const partners = section.partners.map((raw, index) => {
    const item = object(raw)
    const label = `Partner ${index + 1}`
    const id = text(item.id, `${label} ID`, 80, true)
    if (ids.has(id)) throw new Error("Partner IDs must be unique.")
    ids.add(id)
    const name = text(item.name, `${label} name`, 160, true)
    const logo = text(item.logo, `${label} logo`, 2000, true)
    const href = text(item.href, `${label} website`, 2000)
    const alt = text(item.alt, `${label} alternative text`, 300) || name
    if (!safePartnerUrl(logo, true)) throw new Error(`${name}: use an uploaded image, /images/ path, or an HTTP(S) logo URL.`)
    if (href && !safePartnerUrl(href)) throw new Error(`${name}: website must start with https:// or http://.`)
    if (typeof item.visible !== "boolean") throw new Error(`${name}: choose whether the partner is visible.`)
    return { id, name, logo, href, alt, visible: item.visible }
  })
  return {
    eyebrow: text(section.eyebrow, "Eyebrow", 80),
    title: text(section.title, "Section heading", 180, true),
    intro: text(section.intro, "Introduction", 1000),
    enabled: section.enabled,
    partners,
  }
}

export function replacePartnerSection(content: unknown, section: PartnerSection): Record<string, unknown> {
  const root = object(content)
  const { partners, ...settings } = section
  return { ...root, "community-outreach": { ...object(root["community-outreach"]), partners, partnerSection: settings } }
}

export function partnerSectionsEqual(a: PartnerSection, b: PartnerSection) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function remainingPartnerDraft(content: unknown, draft: unknown, section: PartnerSection) {
  if (!draft) return null
  const updated = replacePartnerSection(draft, section)
  // Compare normalized objects; legacy partners lack the optional fields added by the editor.
  return JSON.stringify(updated) === JSON.stringify(replacePartnerSection(content, section)) ? null : updated
}
