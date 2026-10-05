"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { eventRsvps, events } from "@/lib/db/schema"
import { expandOccurrences } from "@/lib/events/occurrences"

export type RsvpResult = { ok: true; waitlisted?: boolean } | { ok: false; error: string }

export type RsvpInput = {
  eventId: number
  occurrence: string
  name: string
  email: string
  phone?: string
  guests: number
  note?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitRsvpAction(input: RsvpInput): Promise<RsvpResult> {
  const name = String(input.name ?? "").trim().slice(0, 120)
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200)
  const phone = String(input.phone ?? "").trim().slice(0, 40)
  const note = String(input.note ?? "").trim().slice(0, 500)
  const guests = Number.isInteger(input.guests) ? input.guests : 1

  if (!name) return { ok: false, error: "Please enter your name." }
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: "Please enter a valid email address." }
  if (guests < 1 || guests > 10) return { ok: false, error: "Guests must be between 1 and 10." }

  const [event] = await db.select().from(events).where(eq(events.id, Number(input.eventId))).limit(1)
  if (!event || event.status !== "published") return { ok: false, error: "This event is not open for RSVPs." }
  if (!event.rsvpEnabled) return { ok: false, error: "RSVPs are not enabled for this event." }

  const start = new Date(input.occurrence)
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Please choose a valid date." }
  const match = expandOccurrences(event, { from: new Date(start.getTime() - 1000), to: new Date(start.getTime() + 1000) }).find(
    (occurrence) => occurrence.key === start.toISOString(),
  )
  if (!match) return { ok: false, error: "That date is not available." }
  if (match.start.getTime() < Date.now() - 1000 * 60 * 60 * 3) return { ok: false, error: "That date has already passed." }

  const [existing] = await db
    .select({ id: eventRsvps.id })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.occurrence, match.key), eq(eventRsvps.email, email)))
    .limit(1)
  if (existing) return { ok: false, error: "This email has already RSVPed for that date." }

  if (event.capacity) {
    const [row] = await db
      .select({ guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.occurrence, match.key)))
    const taken = row?.guests ?? 0
    const left = event.capacity - taken
    if (left <= 0) return { ok: false, error: "Sorry, this date is full." }
    if (guests > left) return { ok: false, error: `Only ${left} ${left === 1 ? "spot is" : "spots are"} left for this date.` }
  }

  await db.insert(eventRsvps).values({ eventId: event.id, occurrence: match.key, name, email, phone, guests, note })

  revalidatePath("/upcoming-events")
  revalidatePath(`/upcoming-events/${event.slug}`)
  return { ok: true }
}
