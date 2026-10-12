"use server"

import { and, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor, requirePermission } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { eventRsvps, events } from "@/lib/db/schema"
import { isCategory, isEventStatus, type EventStatus } from "@/lib/events/constants"
import { getEventById, listRsvps } from "@/lib/events/data"
import { expandOccurrences, fromLocalInput, isRecurrence } from "@/lib/events/occurrences"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

export type EventInput = {
  id?: number
  title: string
  slug: string
  summary: string
  description: string
  category: string
  location: string
  startAt: string
  endAt: string
  allDay: boolean
  image: string | null
  imageAlt: string
  ctaLabel: string
  ctaUrl: string
  featured: boolean
  status: string
  capacity: string
  rsvpEnabled: boolean
  recurrence: string
  recurrenceUntil: string
  cost: string
  accessibility: string
  contactName: string
  contactEmail: string
  contactPhone: string
  waitlistEnabled: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function revalidateEvents(slug?: string) {
  revalidatePath("/upcoming-events")
  revalidatePath("/admin/events")
  revalidatePath("/sitemap.xml")
  revalidatePath("/")
  if (slug) revalidatePath(`/upcoming-events/${slug}`)
}

function safeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed.slice(0, 500)
  }
  return null
}

async function uniqueSlug(base: string, ignoreId?: number) {
  let candidate = base
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const [existing] = await db.select({ id: events.id }).from(events).where(eq(events.slug, candidate)).limit(1)
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${base}-${attempt}`
  }
  return `${base}-${Date.now()}`
}

export async function saveEventAction(input: EventInput): Promise<Result<{ id: number; slug: string }>> {
  const user = await requireEditor()

  const title = input.title.trim().slice(0, 140)
  if (!title) return { ok: false, error: "Enter an event title." }

  // All-day events span whole days, so a same-day end would otherwise equal the start.
  const startInput = input.allDay && input.startAt ? `${input.startAt.slice(0, 10)}T00:00` : input.startAt
  const endInput = input.allDay && input.endAt ? `${input.endAt.slice(0, 10)}T23:59` : input.endAt
  const startAt = fromLocalInput(startInput)
  if (!startAt) return { ok: false, error: "Choose a start date and time." }
  const endAt = fromLocalInput(endInput)
  if (endAt && endAt <= startAt) return { ok: false, error: "The end time must be after the start time." }

  const contactEmail = input.contactEmail.trim().toLowerCase().slice(0, 200)
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) return { ok: false, error: "The contact email is not valid." }

  const recurrence = isRecurrence(input.recurrence) ? input.recurrence : "none"
  const recurrenceUntil = recurrence === "none" ? null : fromLocalInput(input.recurrenceUntil)
  if (recurrence !== "none" && recurrenceUntil && recurrenceUntil < startAt) {
    return { ok: false, error: "The repeat end date must be after the first date." }
  }

  const ctaUrl = safeUrl(input.ctaUrl)
  if (ctaUrl === null) return { ok: false, error: "The button link must start with /, https:// or mailto:." }
  const rawImage = input.image?.trim() ?? ""
  const checkedImage = rawImage ? safeUrl(rawImage) : ""
  if (checkedImage === null) return { ok: false, error: "The image link is not valid. Use an uploaded image or a link starting with / or https://." }
  const image = checkedImage || null

  const capacityNumber = input.capacity.trim() ? Math.floor(Number(input.capacity)) : null
  if (capacityNumber !== null && (!Number.isFinite(capacityNumber) || capacityNumber < 1 || capacityNumber > 5000)) {
    return { ok: false, error: "Capacity must be a number between 1 and 5000." }
  }

  const existing = input.id ? await getEventById(input.id) : null
  if (input.id && !existing) return { ok: false, error: "That event no longer exists." }

  let status: EventStatus = isEventStatus(input.status) ? input.status : "draft"
  if (user.role !== "admin") {
    // Only admins publish or cancel; editors keep the current status (or draft for new events).
    status = (existing?.status as EventStatus | undefined) ?? "draft"
  }

  const slug = await uniqueSlug(slugify(input.slug || title) || "event", existing?.id)
  const values = {
    slug,
    title,
    summary: input.summary.trim().slice(0, 300),
    description: input.description.trim().slice(0, 8000),
    category: isCategory(input.category) ? input.category : "community",
    location: input.location.trim().slice(0, 200),
    startAt,
    endAt: endAt ?? null,
    allDay: input.allDay,
    image,
    imageAlt: input.imageAlt.trim().slice(0, 200),
    ctaLabel: input.ctaLabel.trim().slice(0, 60),
    ctaUrl,
    featured: input.featured,
    status,
    capacity: capacityNumber,
    rsvpEnabled: input.rsvpEnabled,
    recurrence,
    recurrenceUntil,
    cost: input.cost.trim().slice(0, 80),
    accessibility: input.accessibility.trim().slice(0, 1000),
    contactName: input.contactName.trim().slice(0, 120),
    contactEmail,
    contactPhone: input.contactPhone.trim().slice(0, 40),
    waitlistEnabled: input.rsvpEnabled && input.waitlistEnabled,
    updatedBy: user.id,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(events).set(values).where(eq(events.id, existing.id))
    revalidateEvents(existing.slug)
    revalidateEvents(slug)
    return { ok: true, data: { id: existing.id, slug } }
  }

  const [created] = await db.insert(events).values({ ...values, exceptions: [] }).returning({ id: events.id })
  revalidateEvents(slug)
  return { ok: true, data: { id: created.id, slug } }
}

export async function duplicateEventAction(id: number): Promise<Result<{ id: number }>> {
  const user = await requireEditor()
  const source = await getEventById(id)
  if (!source) return { ok: false, error: "That event no longer exists." }
  const slug = await uniqueSlug(`${source.slug}-copy`)
  const [created] = await db
    .insert(events)
    .values({
      slug,
      title: `${source.title} (copy)`.slice(0, 140),
      summary: source.summary,
      description: source.description,
      category: source.category,
      location: source.location,
      startAt: source.startAt,
      endAt: source.endAt,
      allDay: source.allDay,
      image: source.image,
      imageAlt: source.imageAlt,
      ctaLabel: source.ctaLabel,
      ctaUrl: source.ctaUrl,
      featured: false,
      status: "draft",
      capacity: source.capacity,
      rsvpEnabled: source.rsvpEnabled,
      recurrence: source.recurrence,
      recurrenceUntil: source.recurrenceUntil,
      exceptions: [],
      cost: source.cost,
      accessibility: source.accessibility,
      contactName: source.contactName,
      contactEmail: source.contactEmail,
      contactPhone: source.contactPhone,
      waitlistEnabled: source.waitlistEnabled,
      updatedBy: user.id,
    })
    .returning({ id: events.id })
  revalidateEvents()
  return { ok: true, data: { id: created.id } }
}

export async function setEventStatusAction(id: number, status: string): Promise<Result> {
  const user = await requireAdmin()
  if (!isEventStatus(status)) return { ok: false, error: "Unknown status." }
  const event = await getEventById(id)
  if (!event) return { ok: false, error: "That event no longer exists." }
  await db.update(events).set({ status, updatedBy: user.id, updatedAt: new Date() }).where(eq(events.id, id))
  revalidateEvents(event.slug)
  return { ok: true }
}

export async function toggleFeaturedAction(id: number, featured: boolean): Promise<Result> {
  const user = await requireEditor()
  const event = await getEventById(id)
  if (!event) return { ok: false, error: "That event no longer exists." }
  await db.update(events).set({ featured, updatedBy: user.id, updatedAt: new Date() }).where(eq(events.id, id))
  revalidateEvents(event.slug)
  return { ok: true }
}

/** Cancels or restores a single date of a repeating event without touching the series. */
export async function setOccurrenceCancelledAction(id: number, occurrenceKey: string, cancelled: boolean): Promise<Result> {
  const user = await requireEditor()
  const event = await getEventById(id)
  if (!event) return { ok: false, error: "That event no longer exists." }
  const current = Array.isArray(event.exceptions) ? (event.exceptions as string[]) : []
  const next = cancelled ? Array.from(new Set([...current, occurrenceKey])) : current.filter((key) => key !== occurrenceKey)
  await db.update(events).set({ exceptions: next, updatedBy: user.id, updatedAt: new Date() }).where(eq(events.id, id))
  revalidateEvents(event.slug)
  return { ok: true }
}

export async function deleteEventAction(id: number): Promise<Result> {
  const event = await getEventById(id)
  if (!event) return { ok: false, error: "That event no longer exists." }
  // Editors may remove drafts; deleting anything that has been public needs an admin.
  if (event.status === "draft") await requireEditor()
  else await requireAdmin()
  await db.delete(eventRsvps).where(eq(eventRsvps.eventId, id))
  await db.delete(events).where(eq(events.id, id))
  revalidateEvents(event.slug)
  return { ok: true }
}

export type RsvpSummary = {
  id: number
  name: string
  email: string
  phone: string
  guests: number
  note: string
  occurrence: string
  status: string
  checkedIn: boolean
  createdAt: string
}

export type RsvpList = {
  rows: RsvpSummary[]
  capacity: number | null
  /** Upcoming and recent dates staff can register people for. */
  dates: { key: string; start: string }[]
}

function revalidateRsvps(slug?: string) {
  revalidatePath("/admin/events")
  revalidatePath("/upcoming-events")
  if (slug) revalidatePath(`/upcoming-events/${slug}`)
}

export async function listRsvpsAction(eventId: number): Promise<Result<RsvpList>> {
  await requirePermission("view_content")
  const event = await getEventById(eventId)
  if (!event) return { ok: false, error: "That event no longer exists." }
  const rows = await listRsvps(eventId)
  const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)
  return {
    ok: true,
    data: {
      capacity: event.capacity,
      dates: expandOccurrences(event, { from, to }, { limit: 24 }).map((o) => ({ key: o.key, start: o.start.toISOString() })),
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? "",
        guests: row.guests,
        note: row.note ?? "",
        occurrence: row.occurrence,
        status: row.status,
        checkedIn: row.checkedInAt !== null,
        createdAt: row.createdAt.toISOString(),
      })),
    },
  }
}

export async function deleteRsvpAction(rsvpId: number, eventId: number): Promise<Result> {
  await requireEditor()
  const event = await getEventById(eventId)
  await db.delete(eventRsvps).where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, eventId)))
  revalidateRsvps(event?.slug)
  return { ok: true }
}

export async function setRsvpCheckInAction(rsvpId: number, eventId: number, checkedIn: boolean): Promise<Result> {
  await requireEditor()
  await db
    .update(eventRsvps)
    .set({ checkedInAt: checkedIn ? new Date() : null })
    .where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, eventId)))
  revalidatePath("/admin/events")
  return { ok: true }
}

class RsvpRejected extends Error {}

async function confirmedGuests(tx: Pick<typeof db, "select">, eventId: number, occurrence: string) {
  const [row] = await tx
    .select({ guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.occurrence, occurrence), eq(eventRsvps.status, "confirmed")))
  return row?.guests ?? 0
}

/** Moves a waitlisted sign-up into a confirmed spot. Admins can go over capacity. */
export async function promoteRsvpAction(rsvpId: number, eventId: number, overCapacity = false): Promise<Result> {
  const user = await requireEditor()
  const event = await getEventById(eventId)
  if (!event) return { ok: false, error: "That event no longer exists." }
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${event.id})`)
      const [rsvp] = await tx
        .select()
        .from(eventRsvps)
        .where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, eventId)))
        .limit(1)
      if (!rsvp) throw new RsvpRejected("That sign-up no longer exists.")
      if (rsvp.status === "confirmed") return
      if (event.capacity && !(overCapacity && user.role === "admin")) {
        const left = event.capacity - (await confirmedGuests(tx, eventId, rsvp.occurrence))
        if (rsvp.guests > left) {
          throw new RsvpRejected(left <= 0 ? "That date is still full." : `Only ${left} ${left === 1 ? "spot is" : "spots are"} open.`)
        }
      }
      await tx.update(eventRsvps).set({ status: "confirmed" }).where(eq(eventRsvps.id, rsvpId))
    })
  } catch (error) {
    if (error instanceof RsvpRejected) return { ok: false, error: error.message }
    throw error
  }
  revalidateRsvps(event.slug)
  return { ok: true }
}

export type StaffRsvpInput = {
  occurrence: string
  name: string
  email: string
  phone: string
  guests: number
  note: string
  checkIn: boolean
}

/** Lets staff register someone who called in or walked up, even when public sign-up is closed. */
export async function addRsvpAction(eventId: number, input: StaffRsvpInput): Promise<Result<{ waitlisted: boolean }>> {
  await requireEditor()
  const event = await getEventById(eventId)
  if (!event) return { ok: false, error: "That event no longer exists." }

  const name = input.name.trim().slice(0, 120)
  const email = input.email.trim().toLowerCase().slice(0, 200)
  const phone = input.phone.trim().slice(0, 40)
  const guests = Number.isInteger(input.guests) ? input.guests : 1
  if (!name) return { ok: false, error: "Enter the guest's name." }
  if (!email && !phone) return { ok: false, error: "Add an email or phone number so you can reach them." }
  if (email && !EMAIL_PATTERN.test(email)) return { ok: false, error: "That email address is not valid." }
  if (guests < 1 || guests > 20) return { ok: false, error: "Guests must be between 1 and 20." }

  const start = new Date(input.occurrence)
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Choose a date." }
  const match = expandOccurrences(event, { from: new Date(start.getTime() - 1000), to: new Date(start.getTime() + 1000) }).find(
    (o) => o.key === start.toISOString(),
  )
  if (!match) return { ok: false, error: "That date is not part of this event." }

  try {
    const waitlisted = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${event.id})`)
      if (email) {
        const [existing] = await tx
          .select({ id: eventRsvps.id })
          .from(eventRsvps)
          .where(and(eq(eventRsvps.eventId, event.id), eq(eventRsvps.occurrence, match.key), eq(eventRsvps.email, email)))
          .limit(1)
        if (existing) throw new RsvpRejected("That email is already signed up for this date.")
      }
      let status: "confirmed" | "waitlist" = "confirmed"
      if (event.capacity && guests > event.capacity - (await confirmedGuests(tx, event.id, match.key))) {
        if (!event.waitlistEnabled) throw new RsvpRejected("That date is full. Turn on the waitlist or raise the capacity.")
        status = "waitlist"
      }
      await tx.insert(eventRsvps).values({
        eventId: event.id,
        occurrence: match.key,
        name,
        email,
        phone,
        guests,
        note: input.note.trim().slice(0, 500),
        status,
        checkedInAt: input.checkIn && status === "confirmed" ? new Date() : null,
      })
      return status === "waitlist"
    })
    revalidateRsvps(event.slug)
    return { ok: true, data: { waitlisted } }
  } catch (error) {
    if (error instanceof RsvpRejected) return { ok: false, error: error.message }
    throw error
  }
}
