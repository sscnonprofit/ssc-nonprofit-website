function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

export type EventIcsInput = {
  uid: string
  title: string
  description: string
  location: string
  url: string
  start: Date
  end: Date | null
  allDay: boolean
}

/** A single-event .ics file suitable for an email attachment. */
export function buildEventIcs(input: EventIcsInput) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SSC//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
  ]
  if (input.allDay) {
    const end = new Date((input.end ?? input.start).getTime() + 1000 * 60 * 60 * 24)
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(input.start)}`, `DTEND;VALUE=DATE:${dateOnly(end)}`)
  } else {
    const end = input.end ?? new Date(input.start.getTime() + 1000 * 60 * 60)
    lines.push(`DTSTART:${stamp(input.start)}`, `DTEND:${stamp(end)}`)
  }
  lines.push(`SUMMARY:${escapeText(input.title)}`)
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`)
  lines.push(
    `DESCRIPTION:${escapeText(input.description)}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(input.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  )
  return lines.join("\r\n") + "\r\n"
}
