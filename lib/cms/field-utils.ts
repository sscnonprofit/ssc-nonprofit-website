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
const LONG_TEXT_KEY_PATTERN = /description|body|content|bio|summary|paragraph|caption|excerpt|message|quote/i
const IMAGE_VALUE_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i

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

  if (IMAGE_KEY_PATTERN.test(key) || IMAGE_VALUE_PATTERN.test(str) || str.startsWith("/images/") || str.startsWith("/generated/")) {
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
