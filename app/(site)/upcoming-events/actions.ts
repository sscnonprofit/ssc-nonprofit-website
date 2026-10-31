"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { eventRsvps, events } from "@/lib/db/schema"
import { sendRsvpConfirmation } from "@/lib/email/events"
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

class RsvpRejected extends Error {}

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

  try {
    const waitlisted = await db.transaction(async (tx) => {
      // Serialize sign-ups per event so two people can't both claim the last spot.
      await tx.execute(sql`select pg_advisory_xact_lock(${event.id})`)

      const [existing] = await tx
        .select({ id: eventRsvps.id })
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.occurrence, match.key), eq(eventRsvps.email, email)))
        .limit(1)
      if (existing) throw new RsvpRejected("This email has already signed up for that date.")

      let status: "confirmed" | "waitlist" = "confirmed"
      if (event.capacity) {
        const [row] = await tx
          .select({ guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
          .from(eventRsvps)
          .where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.occurrence, match.key), eq(eventRsvps.status, "confirmed")))
        const left = event.capacity - (row?.guests ?? 0)
        if (guests > left) {
          if (!event.waitlistEnabled) {
            throw new RsvpRejected(
              left <= 0 ? "Sorry, this date is full." : `Only ${left} ${left === 1 ? "spot is" : "spots are"} left for this date.`,
            )
          }
          status = "waitlist"
        }
      }

      await tx.insert(eventRsvps).values({ eventId: event.id, occurrence: match.key, name, email, phone, guests, note, status })
      return status === "waitlist"
    })

    revalidatePath("/upcoming-events")
    revalidatePath(`/upcoming-events/${event.slug}`)
    revalidatePath("/admin/events")

    await sendRsvpConfirmation({ event, start: match.start, end: match.end, name, email, guests, waitlisted })
    return { ok: true, waitlisted }
  } catch (error) {
    if (error instanceof RsvpRejected) return { ok: false, error: error.message }
    throw error
  }
}
