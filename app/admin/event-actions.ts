"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor, requirePermission } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { eventRsvps, events } from "@/lib/db/schema"
import { isCategory, isEventStatus, type EventStatus } from "@/lib/events/constants"
import { getEventById, listRsvps } from "@/lib/events/data"
import { fromLocalInput, isRecurrence } from "@/lib/events/occurrences"

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
}

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

  const startAt = fromLocalInput(input.startAt)
  if (!startAt) return { ok: false, error: "Choose a start date and time." }
  const endAt = fromLocalInput(input.endAt)
  if (endAt && endAt <= startAt) return { ok: false, error: "The end time must be after the start time." }

  const recurrence = isRecurrence(input.recurrence) ? input.recurrence : "none"
  const recurrenceUntil = recurrence === "none" ? null : fromLocalInput(input.recurrenceUntil)
  if (recurrence !== "none" && recurrenceUntil && recurrenceUntil < startAt) {
    return { ok: false, error: "The repeat end date must be after the first date." }
  }

  const ctaUrl = safeUrl(input.ctaUrl)
  if (ctaUrl === null) return { ok: false, error: "The button link must start with /, https:// or mailto:." }
  const image = input.image ? safeUrl(input.image) : null
  if (image === null) return { ok: false, error: "The image link is not valid." }

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
  createdAt: string
}

export async function listRsvpsAction(eventId: number): Promise<Result<RsvpSummary[]>> {
  await requirePermission("view_content")
  const rows = await listRsvps(eventId)
  return {
    ok: true,
    data: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? "",
      guests: row.guests,
      note: row.note ?? "",
      occurrence: row.occurrence,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

export async function deleteRsvpAction(rsvpId: number, eventId: number): Promise<Result> {
  await requireEditor()
  await db.delete(eventRsvps).where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, eventId)))
  revalidatePath("/admin/events")
  return { ok: true }
}
