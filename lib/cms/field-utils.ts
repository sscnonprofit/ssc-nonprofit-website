export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "array-primitive"
  | "array-object"
  | "object"

const IMAGE_KEY_PATTERN = /image|photo|avatar|icon|thumbnail|logo|picture|banner|hero.*src|headshot/i
const IMAGE_KEY_EXCLUDE_PATTERN = /alt$|alt[A-Z_-]|caption|credit|description|label|title|name/i
const LONG_TEXT_KEY_PATTERN = /description|body|content|bio|summary|paragraph|caption|excerpt|message|quote/i
const IMAGE_VALUE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i

/** True when the key's label or any nested text/number inside `value` contains the search query. */
export function valueMatchesQuery(key: string, value: unknown, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  if (key && humanizeKey(key).toLowerCase().includes(needle)) return true
  if (typeof value === "string" || typeof value === "number") return String(value).toLowerCase().includes(needle)
  if (Array.isArray(value)) return value.some((item) => valueMatchesQuery("", item, needle))
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([k, v]) => valueMatchesQuery(k, v, needle))
  }
  return false
}

/** Number of editable leaf values (text, numbers, toggles) inside a value. */
export function countFields(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countFields(item), 0)
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => sum + countFields(item), 0)
  }
  return 1
}

/** Number of text values that are still blank, so editors can see what is left to fill in. */
export function countEmptyFields(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((sum, item) => sum + countEmptyFields(item), 0)
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => sum + countEmptyFields(item), 0)
  }
  return typeof value === "string" && value.trim() === "" ? 1 : 0
}

/** Turns camelCase / snake_case / kebab-case keys into human-readable labels. */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
  return spaced
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function inferFieldKind(key: string, value: unknown): FieldKind {
  if (Array.isArray(value)) {
    if (value.length === 0) return "array-primitive"
    return typeof value[0] === "object" && value[0] !== null ? "array-object" : "array-primitive"
  }

  if (value !== null && typeof value === "object") return "object"

  if (typeof value === "boolean") return "boolean"
  if (typeof value === "number") return "number"

  const str = typeof value === "string" ? value : ""

  const looksLikeImageKey = IMAGE_KEY_PATTERN.test(key) && !IMAGE_KEY_EXCLUDE_PATTERN.test(key)
  const looksLikeImageValue = IMAGE_VALUE_PATTERN.test(str) || str.startsWith("/images/") || str.startsWith("/generated/")

  if (looksLikeImageKey || looksLikeImageValue) {
    return "image"
  }

  if (LONG_TEXT_KEY_PATTERN.test(key) || str.length > 90 || str.includes("\n")) {
    return "textarea"
  }

  return "text"
}

/** Produces a reasonable empty value for a new array item, cloning the shape of an existing item when possible. */
export function createEmptyArrayItem(existingItems: unknown[]): unknown {
  const sample = existingItems[0]
  if (sample && typeof sample === "object" && !Array.isArray(sample)) {
    return cloneWithEmptyValues(sample as Record<string, unknown>)
  }
  if (typeof sample === "number") return 0
  if (typeof sample === "boolean") return false
  return ""
}

function cloneWithEmptyValues(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      result[key] = []
    } else if (value && typeof value === "object") {
      result[key] = cloneWithEmptyValues(value as Record<string, unknown>)
    } else if (typeof value === "number") {
      result[key] = 0
    } else if (typeof value === "boolean") {
      result[key] = false
    } else {
      result[key] = ""
    }
  }
  return result
}

/** Finds the first image URL inside an object item so list rows can show a thumbnail. */
export function getItemImage(item: unknown): string | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null
  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    if (typeof value === "string" && value && inferFieldKind(key, value) === "image") return value
  }
  return null
}

/** Picks a secondary line (e.g. a role) that differs from the row's main summary. */
export function getItemSubtitle(item: unknown, summary: string): string | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null
  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    if (typeof value !== "string" || !value || value === summary) continue
    if (inferFieldKind(key, value) === "text") return value
  }
  return null
}

/** True when an item is flagged as hidden from the live site (visible: false / hidden: true). */
export function isItemHidden(item: unknown): boolean {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false
  const record = item as Record<string, unknown>
  return record.visible === false || record.hidden === true
}

/** Picks a short label to represent an object item in a collapsed/sortable list row. */
export function getItemSummary(item: unknown, fallback: string): string {
  if (item && typeof item === "object" && !Array.isArray(item)) {
    const record = item as Record<string, unknown>
    const titleKey = Object.keys(record).find((k) => /^(title|name|label|heading|question|role)$/i.test(k))
    if (titleKey && typeof record[titleKey] === "string" && record[titleKey]) {
      return record[titleKey] as string
    }
    const firstString = Object.values(record).find((v) => typeof v === "string" && v.length > 0)
    if (firstString) return firstString as string
  }
  if (typeof item === "string" && item) return item
  return fallback
}
