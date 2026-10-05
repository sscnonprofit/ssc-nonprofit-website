import { getEventBySlug } from "@/lib/events/data"
import { expandOccurrences } from "@/lib/events/occurrences"

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "")
}

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const event = await getEventBySlug(slug)
  if (!event || event.status !== "published") return new Response("Not found", { status: 404 })

  const requested = new URL(request.url).searchParams.get("o")
  const from = new Date(Date.now() - 1000 * 60 * 60 * 3)
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  const upcoming = expandOccurrences(event, { from, to }, { limit: 1 })
  const requestedDate = requested ? new Date(requested) : null
  const chosen =
    requestedDate && !Number.isNaN(requestedDate.getTime())
      ? expandOccurrences(event, { from: new Date(requestedDate.getTime() - 1000), to: new Date(requestedDate.getTime() + 1000) }, { includeCancelled: false })[0]
      : upcoming[0]
  const occurrence = chosen ?? { start: event.startAt, end: event.endAt }

  const origin = new URL(request.url).origin
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}-${stamp(occurrence.start)}@${new URL(origin).hostname}`,
    `DTSTAMP:${stamp(new Date())}`,
  ]
  if (event.allDay) {
    const end = new Date((occurrence.end ?? occurrence.start).getTime() + 1000 * 60 * 60 * 24)
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(occurrence.start)}`, `DTEND;VALUE=DATE:${dateOnly(end)}`)
  } else {
    const end = occurrence.end ?? new Date(occurrence.start.getTime() + 1000 * 60 * 60)
    lines.push(`DTSTART:${stamp(occurrence.start)}`, `DTEND:${stamp(end)}`)
  }
  lines.push(`SUMMARY:${escapeText(event.title)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  const description = [event.summary, `${origin}/upcoming-events/${event.slug}`].filter(Boolean).join("\n\n")
  lines.push(`DESCRIPTION:${escapeText(description)}`, `URL:${origin}/upcoming-events/${event.slug}`, "END:VEVENT", "END:VCALENDAR")

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  })
}
