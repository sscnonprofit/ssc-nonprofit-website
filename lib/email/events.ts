import { and, eq, gt, isNull, lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { eventRsvps, events } from "@/lib/db/schema"

import { EMAIL_TIME_ZONE, siteUrl } from "./config"
import { buildEventIcs } from "./event-ics"
import { sendEmail } from "./send"
import { rsvpConfirmationEmail, rsvpReminderEmail } from "./templates"

type EventRow = typeof events.$inferSelect

export function formatWhen(start: Date, allDay: boolean) {
  return start.toLocaleString("en-US", {
    timeZone: EMAIL_TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(allDay ? {} : { hour: "numeric", minute: "2-digit" }),
  })
}

function icsFor(event: EventRow, start: Date, end: Date | null) {
  const url = `${siteUrl()}/upcoming-events/${event.slug}`
  return buildEventIcs({
    uid: `event-${event.id}-${start.getTime()}@${new URL(siteUrl()).hostname}`,
    title: event.title,
    description: [event.summary, url].filter(Boolean).join("\n\n"),
    location: event.location,
    url,
    start,
    end,
    allDay: event.allDay,
  })
}

function contactLine(event: EventRow) {
  return [event.contactName, event.contactPhone, event.contactEmail].filter(Boolean).join(" · ")
}

/** Sent right after someone RSVPs; confirmed guests get the event as an .ics attachment. */
export async function sendRsvpConfirmation(input: {
  event: EventRow
  start: Date
  end: Date | null
  name: string
  email: string
  guests: number
  waitlisted: boolean
}) {
  const { event } = input
  const mail = rsvpConfirmationEmail({
    name: input.name,
    title: event.title,
    when: formatWhen(input.start, event.allDay),
    location: event.location,
    guests: input.guests,
    eventUrl: `${siteUrl()}/upcoming-events/${event.slug}`,
    contact: contactLine(event),
    waitlisted: input.waitlisted,
  })
  return sendEmail({
    kind: input.waitlisted ? "rsvp-waitlist" : "rsvp-confirmation",
    to: input.email,
    ...mail,
    attachments: input.waitlisted ? undefined : [{ filename: `${event.slug}.ics`, content: icsFor(event, input.start, input.end), contentType: "text/calendar" }],
  })
}

/** Emails confirmed guests whose event starts within the next day and a half. */
export async function runReminderJob(now = new Date()) {
  const windowEnd = new Date(now.getTime() + 1000 * 60 * 60 * 36)
  const due = await db
    .select({ rsvp: eventRsvps, event: events })
    .from(eventRsvps)
    .innerJoin(events, eq(events.id, eventRsvps.eventId))
    .where(
      and(
        eq(eventRsvps.status, "confirmed"),
        isNull(eventRsvps.reminderSentAt),
        gt(eventRsvps.occurrence, now.toISOString()),
        lt(eventRsvps.occurrence, windowEnd.toISOString()),
        eq(events.status, "published"),
      ),
    )

  let sent = 0
  for (const { rsvp, event } of due) {
    const start = new Date(rsvp.occurrence)
    const mail = rsvpReminderEmail({
      name: rsvp.name,
      title: event.title,
      when: formatWhen(start, event.allDay),
      location: event.location,
      guests: rsvp.guests,
      eventUrl: `${siteUrl()}/upcoming-events/${event.slug}`,
    })
    const result = await sendEmail({
      kind: "rsvp-reminder",
      to: rsvp.email,
      ...mail,
      idempotencyKey: `rsvp-reminder-${rsvp.id}`,
      attachments: [{ filename: `${event.slug}.ics`, content: icsFor(event, start, event.endAt ? new Date(start.getTime() + (event.endAt.getTime() - event.startAt.getTime())) : null), contentType: "text/calendar" }],
    })
    if (result.ok) {
      sent += 1
      await db.update(eventRsvps).set({ reminderSentAt: new Date() }).where(eq(eventRsvps.id, rsvp.id))
    }
  }
  return { checked: due.length, sent }
}
