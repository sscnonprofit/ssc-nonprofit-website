export const EVENT_CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "wellness", label: "Health and wellness" },
  { value: "arts", label: "Arts and culture" },
  { value: "education", label: "Learning" },
  { value: "social", label: "Social gathering" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "holiday", label: "Holiday" },
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["value"]

export function categoryLabel(value: string) {
  return EVENT_CATEGORIES.find((category) => category.value === value)?.label ?? "Community"
}

export function isCategory(value: unknown): value is EventCategory {
  return EVENT_CATEGORIES.some((category) => category.value === value)
}

export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

export function isEventStatus(value: unknown): value is EventStatus {
  return typeof value === "string" && (EVENT_STATUSES as readonly string[]).includes(value)
}

export const ALBUM_STATUSES = ["draft", "published"] as const
export type AlbumStatus = (typeof ALBUM_STATUSES)[number]
