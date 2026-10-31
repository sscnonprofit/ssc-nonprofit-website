import { and, eq, isNotNull, isNull } from "drizzle-orm"

import { createIcs } from "@/lib/calendars/ics"
import { daysInMonth, facilityToday, monthLabel, timeLabel } from "@/lib/calendars/model"
import { publicDocument, readStore } from "@/lib/calendars/service"
import { db } from "@/lib/db"
import { calendarSubscriptions } from "@/lib/db/schema"

import { siteUrl } from "./config"
import { sendEmail } from "./send"
import { calendarDigestEmail, type DigestGroup } from "./templates"

export type Subscription = typeof calendarSubscriptions.$inferSelect
export type Frequency = "weekly" | "monthly"

const DAY = 1000 * 60 * 60 * 24

function addDays(date: string, amount: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + amount * DAY).toISOString().slice(0, 10)
}

function shortDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
}

export function unsubscribeUrl(token: string) {
  return `${siteUrl()}/api/email/unsubscribe?token=${token}`
}

export function manageUrl(token: string) {
  return `${siteUrl()}/email-preferences?token=${token}`
}

function periodFor(frequency: Frequency, today: string) {
  if (frequency === "monthly") {
    const month = today.slice(0, 7)
    const days = daysInMonth(month)
    return { start: today, end: days[days.length - 1], label: `${monthLabel(month)} activities` }
  }
  const end = addDays(today, 6)
  return { start: today, end, label: `This week: ${shortDate(today)} – ${shortDate(end)}` }
}

/** Builds the digest email and its filtered .ics file for one subscriber. */
export async function buildDigest(subscription: Subscription, today = facilityToday()) {
  const store = await readStore()
  const doc = publicDocument(store.document)
  const calendar = doc.calendars.find((item) => item.id === subscription.calendarId)
  if (!calendar) return null

  const categories = Array.isArray(subscription.categories) ? (subscription.categories as string[]) : []
  const period = periodFor(subscription.frequency as Frequency, today)
  const matching = doc.events
    .filter(
      (event) =>
        event.title &&
        !event.cancelled &&
        event.calendarIds.includes(calendar.id) &&
        event.date >= period.start &&
        event.date <= period.end &&
        (!categories.length || categories.includes(event.category)),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || (a.allDay ? "" : a.time).localeCompare(b.allDay ? "" : b.time))

  const groups: DigestGroup[] = []
  for (const event of matching) {
    const label = new Date(`${event.date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    let group = groups.find((item) => item.dateLabel === label)
    if (!group) {
      group = { dateLabel: label, items: [] }
      groups.push(group)
    }
    group.items.push({
      time: event.allDay ? "All day" : timeLabel(event.time),
      title: event.title,
      location: doc.locations.find((location) => location.id === event.locationId)?.name ?? "",
      category: event.category,
    })
  }

  const mail = calendarDigestEmail({
    calendarName: calendar.name,
    periodLabel: period.label,
    groups,
    manageUrl: manageUrl(subscription.token),
    unsubscribeUrl: unsubscribeUrl(subscription.token),
  })
  const ics = createIcs({ ...doc, events: matching }, calendar, store.version, store.updatedAt)
  return { mail, ics, count: matching.length, today }
}

export async function sendDigest(subscription: Subscription, today = facilityToday()) {
  const digest = await buildDigest(subscription, today)
  if (!digest) return false
  const result = await sendEmail({
    kind: "calendar-digest",
    to: subscription.email,
    ...digest.mail,
    idempotencyKey: `digest-${subscription.id}-${today}`,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl(subscription.token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    attachments: digest.count ? [{ filename: "ssc-activities.ics", content: digest.ics, contentType: "text/calendar" }] : undefined,
  })
  if (result.ok) {
    await db.update(calendarSubscriptions).set({ lastSentAt: new Date() }).where(eq(calendarSubscriptions.id, subscription.id))
  }
  return result.ok
}

function isDue(subscription: Subscription, today: string) {
  const last = subscription.lastSentAt?.getTime() ?? 0
  const age = Date.now() - last
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay()
  if (subscription.frequency === "monthly") return today.endsWith("-01") && age > 20 * DAY
  return weekday === 1 && age > 5 * DAY
}

/** Weekly digests go out Mondays and monthly digests on the 1st (facility time). */
export async function runDigestJob(today = facilityToday()) {
  const active = await db
    .select()
    .from(calendarSubscriptions)
    .where(and(isNotNull(calendarSubscriptions.confirmedAt), isNull(calendarSubscriptions.unsubscribedAt)))

  let sent = 0
  const due = active.filter((subscription) => isDue(subscription, today))
  for (const subscription of due) {
    if (await sendDigest(subscription, today)) sent += 1
  }
  return { subscribers: active.length, due: due.length, sent }
}
