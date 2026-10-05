export const EVENT_TIMEZONE = "America/Chicago"

export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
] as const

export type Recurrence = (typeof RECURRENCE_OPTIONS)[number]["value"]

export function isRecurrence(value: unknown): value is Recurrence {
  return RECURRENCE_OPTIONS.some((option) => option.value === value)
}

export type RecurringSource = {
  startAt: Date
  endAt: Date | null
  recurrence: string
  recurrenceUntil: Date | null
  exceptions: unknown
}

export type Occurrence = {
  /** Stable id for this date of the event: the start instant as an ISO string. */
  key: string
  start: Date
  end: Date | null
  cancelled: boolean
}

type LocalParts = { y: number; m: number; d: number; h: number; mi: number }

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function formatter(timeZone: string) {
  let cached = formatterCache.get(timeZone)
  if (!cached) {
    cached = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    formatterCache.set(timeZone, cached)
  }
  return cached
}

export function localParts(date: Date, timeZone = EVENT_TIMEZONE): LocalParts {
  const parts = formatter(timeZone).formatToParts(date)
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return { y: pick("year"), m: pick("month"), d: pick("day"), h: pick("hour") % 24, mi: pick("minute") }
}

function offsetAt(timestamp: number, timeZone: string) {
  const p = localParts(new Date(timestamp), timeZone)
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(timestamp / 60000) * 60000
}

/** Converts a wall-clock time in the event timezone to a real instant. */
export function zonedToDate(parts: LocalParts, timeZone = EVENT_TIMEZONE): Date {
  const guess = Date.UTC(parts.y, parts.m - 1, parts.d, parts.h, parts.mi)
  let result = guess - offsetAt(guess, timeZone)
  result = guess - offsetAt(result, timeZone)
  return new Date(result)
}

function stepLocal(parts: LocalParts, recurrence: string, index: number): LocalParts {
  const base = new Date(Date.UTC(parts.y, parts.m - 1, parts.d))
  switch (recurrence) {
    case "daily":
      base.setUTCDate(base.getUTCDate() + index)
      break
    case "weekly":
      base.setUTCDate(base.getUTCDate() + index * 7)
      break
    case "biweekly":
      base.setUTCDate(base.getUTCDate() + index * 14)
      break
    case "monthly": {
      const targetMonth = parts.m - 1 + index
      const year = parts.y + Math.floor(targetMonth / 12)
      const month = ((targetMonth % 12) + 12) % 12
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      return { y: year, m: month + 1, d: Math.min(parts.d, lastDay), h: parts.h, mi: parts.mi }
    }
    default:
      break
  }
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate(), h: parts.h, mi: parts.mi }
}

function exceptionSet(raw: unknown) {
  return new Set(Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [])
}

const MAX_ITERATIONS = 800

/** Lists occurrences that start inside [from, to]. Cancelled dates are flagged, not removed. */
export function expandOccurrences(
  event: RecurringSource,
  range: { from: Date; to: Date },
  options: { includeCancelled?: boolean; limit?: number } = {},
): Occurrence[] {
  const limit = options.limit ?? 200
  const cancelledKeys = exceptionSet(event.exceptions)
  const duration = event.endAt ? event.endAt.getTime() - event.startAt.getTime() : null
  const results: Occurrence[] = []

  const push = (start: Date) => {
    const key = start.toISOString()
    const cancelled = cancelledKeys.has(key)
    if (cancelled && !options.includeCancelled) return
    results.push({
      key,
      start,
      end: duration === null ? null : new Date(start.getTime() + duration),
      cancelled,
    })
  }

  if (event.recurrence === "none" || !isRecurrence(event.recurrence)) {
    if (event.startAt >= range.from && event.startAt <= range.to) push(event.startAt)
    return results
  }

  const origin = localParts(event.startAt)
  const until = event.recurrenceUntil ?? new Date(range.to.getTime())
  const hardStop = Math.min(until.getTime(), range.to.getTime())

  for (let index = 0; index < MAX_ITERATIONS && results.length < limit; index += 1) {
    const start = zonedToDate(stepLocal(origin, event.recurrence, index))
    if (start.getTime() > hardStop) break
    if (start >= range.from) push(start)
  }
  return results
}

/** The next upcoming occurrence at or after `from`, or null when the series is over. */
export function nextOccurrence(event: RecurringSource, from = new Date()): Occurrence | null {
  const horizon = new Date(from.getTime() + 1000 * 60 * 60 * 24 * 366 * 2)
  const [first] = expandOccurrences(event, { from, to: horizon }, { limit: 1 })
  return first ?? null
}

export function formatEventDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIMEZONE, ...options }).format(date)
}

export function formatDateRange(start: Date, end: Date | null, allDay: boolean) {
  const day = formatEventDate(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  if (allDay) return day
  const time = (value: Date) => formatEventDate(value, { hour: "numeric", minute: "2-digit" })
  if (!end) return `${day} at ${time(start)}`
  const sameDay = localParts(start).d === localParts(end).d && end.getTime() - start.getTime() < 1000 * 60 * 60 * 24
  return sameDay ? `${day}, ${time(start)} to ${time(end)}` : `${day}, ${time(start)} to ${formatEventDate(end, { month: "short", day: "numeric" })}, ${time(end)}`
}

/** Value for a datetime-local input, in the event timezone. */
export function toLocalInput(date: Date | null | undefined) {
  if (!date) return ""
  const p = localParts(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`
}

/** Parses a datetime-local string as a wall-clock time in the event timezone. */
export function fromLocalInput(value: string | null | undefined): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!match) return null
  const [, y, m, d, h, mi] = match.map(Number)
  const date = zonedToDate({ y, m, d, h, mi })
  return Number.isNaN(date.getTime()) ? null : date
}
