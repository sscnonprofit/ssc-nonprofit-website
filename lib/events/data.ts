import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { eventRsvps, events, galleryAlbums, galleryPhotos } from "@/lib/db/schema"
import { expandOccurrences, nextOccurrence, toLocalInput } from "@/lib/events/occurrences"

export type EventRow = typeof events.$inferSelect
export type AlbumRow = typeof galleryAlbums.$inferSelect
export type PhotoRow = typeof galleryPhotos.$inferSelect
export type RsvpRow = typeof eventRsvps.$inferSelect

/** Event occurrence ready to hand to client components (dates as ISO strings). */
export type PublicOccurrence = {
  eventId: number
  slug: string
  title: string
  summary: string
  category: string
  location: string
  image: string | null
  imageAlt: string
  allDay: boolean
  featured: boolean
  recurring: boolean
  rsvpEnabled: boolean
  spotsLeft: number | null
  key: string
  start: string
  end: string | null
}

export type AdminEvent = {
  id: number
  slug: string
  title: string
  status: string
  category: string
  location: string
  featured: boolean
  recurrence: string
  rsvpEnabled: boolean
  capacity: number | null
  startAt: string
  endAt: string | null
  allDay: boolean
  image: string | null
  nextStart: string | null
  rsvpGuests: number
  rsvpCount: number
  updatedAt: string
}

async function guestTotals(eventIds: number[]) {
  const totals = new Map<number, { guests: number; count: number }>()
  if (eventIds.length === 0) return totals
  const rows = await db
    .select({
      eventId: eventRsvps.eventId,
      guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(eventRsvps)
    .where(inArray(eventRsvps.eventId, eventIds))
    .groupBy(eventRsvps.eventId)
  for (const row of rows) totals.set(row.eventId, { guests: row.guests, count: row.count })
  return totals
}

export async function listAdminEvents(): Promise<AdminEvent[]> {
  const rows = await db.select().from(events).orderBy(desc(events.startAt))
  const totals = await guestTotals(rows.map((row) => row.id))
  return rows.map((row) => {
    const next = nextOccurrence(row)
    const total = totals.get(row.id)
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      category: row.category,
      location: row.location,
      featured: row.featured,
      recurrence: row.recurrence,
      rsvpEnabled: row.rsvpEnabled,
      capacity: row.capacity,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt?.toISOString() ?? null,
      allDay: row.allDay,
      image: row.image,
      nextStart: next?.start.toISOString() ?? null,
      rsvpGuests: total?.guests ?? 0,
      rsvpCount: total?.count ?? 0,
      updatedAt: row.updatedAt.toISOString(),
    }
  })
}

export type AdminEventDetail = {
  form: {
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
  /** Upcoming dates of a repeating event, so single dates can be cancelled. */
  dates: { key: string; start: string; cancelled: boolean }[]
}

export async function listAdminEventDetails(): Promise<Record<number, AdminEventDetail>> {
  const rows = await db.select().from(events)
  const horizon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)
  const from = new Date(Date.now() - 1000 * 60 * 60 * 24)
  const result: Record<number, AdminEventDetail> = {}
  for (const row of rows) {
    result[row.id] = {
      form: {
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        description: row.description,
        category: row.category,
        location: row.location,
        startAt: toLocalInput(row.startAt),
        endAt: toLocalInput(row.endAt),
        allDay: row.allDay,
        image: row.image,
        imageAlt: row.imageAlt,
        ctaLabel: row.ctaLabel,
        ctaUrl: row.ctaUrl ?? "",
        featured: row.featured,
        status: row.status,
        capacity: row.capacity ? String(row.capacity) : "",
        rsvpEnabled: row.rsvpEnabled,
        recurrence: row.recurrence,
        recurrenceUntil: toLocalInput(row.recurrenceUntil),
      },
      dates:
        row.recurrence === "none"
          ? []
          : expandOccurrences(row, { from, to: horizon }, { includeCancelled: true, limit: 16 }).map((occurrence) => ({
              key: occurrence.key,
              start: occurrence.start.toISOString(),
              cancelled: occurrence.cancelled,
            })),
    }
  }
  return result
}

export async function getEventById(id: number) {
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  return row ?? null
}

export async function getEventBySlug(slug: string) {
  const [row] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
  return row ?? null
}

export async function listRsvps(eventId: number) {
  return db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId)).orderBy(desc(eventRsvps.createdAt))
}

export async function guestsForOccurrence(eventId: number, occurrence: string) {
  const [row] = await db
    .select({ guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int` })
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.occurrence, occurrence)))
  return row?.guests ?? 0
}

function toPublic(
  event: EventRow,
  occurrence: { key: string; start: Date; end: Date | null },
  booked: Map<string, number>,
): PublicOccurrence {
  const taken = booked.get(`${event.id}:${occurrence.key}`) ?? 0
  return {
    eventId: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    category: event.category,
    location: event.location,
    image: event.image,
    imageAlt: event.imageAlt || event.title,
    allDay: event.allDay,
    featured: event.featured,
    recurring: event.recurrence !== "none",
    rsvpEnabled: event.rsvpEnabled,
    spotsLeft: event.rsvpEnabled && event.capacity ? Math.max(event.capacity - taken, 0) : null,
    key: occurrence.key,
    start: occurrence.start.toISOString(),
    end: occurrence.end?.toISOString() ?? null,
  }
}

async function bookedMap(eventIds: number[]) {
  const map = new Map<string, number>()
  if (eventIds.length === 0) return map
  const rows = await db
    .select({
      eventId: eventRsvps.eventId,
      occurrence: eventRsvps.occurrence,
      guests: sql<number>`coalesce(sum(${eventRsvps.guests}), 0)::int`,
    })
    .from(eventRsvps)
    .where(inArray(eventRsvps.eventId, eventIds))
    .groupBy(eventRsvps.eventId, eventRsvps.occurrence)
  for (const row of rows) map.set(`${row.eventId}:${row.occurrence}`, row.guests)
  return map
}

/** Every published occurrence that starts inside the range, soonest first. */
export async function listPublicOccurrences(range: { from: Date; to: Date }, limit = 300) {
  const rows = await db.select().from(events).where(eq(events.status, "published"))
  const booked = await bookedMap(rows.map((row) => row.id))
  const all: PublicOccurrence[] = []
  for (const row of rows) {
    for (const occurrence of expandOccurrences(row, range)) all.push(toPublic(row, occurrence, booked))
  }
  all.sort((a, b) => a.start.localeCompare(b.start))
  return all.slice(0, limit)
}

export async function listUpcomingOccurrences(limit = 6) {
  const from = new Date(Date.now() - 1000 * 60 * 60 * 3)
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  return listPublicOccurrences({ from, to }, limit)
}

export async function listPublishedSlugs() {
  const rows = await db.select({ slug: events.slug, updatedAt: events.updatedAt }).from(events).where(eq(events.status, "published"))
  return rows
}

export function occurrencesForEvent(event: EventRow, booked: Map<string, number>, range: { from: Date; to: Date }) {
  return expandOccurrences(event, range, { limit: 24 }).map((occurrence) => toPublic(event, occurrence, booked))
}

export async function getPublicEvent(slug: string) {
  const event = await getEventBySlug(slug)
  if (!event || event.status === "draft") return null
  const booked = await bookedMap([event.id])
  const from = new Date(Date.now() - 1000 * 60 * 60 * 3)
  const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
  return { event, upcoming: occurrencesForEvent(event, booked, { from, to }) }
}

// --- Gallery ----------------------------------------------------------------

export type AdminAlbum = {
  id: number
  slug: string
  title: string
  description: string
  coverUrl: string | null
  status: string
  featured: boolean
  eventId: number | null
  sortOrder: number
  photoCount: number
  updatedAt: string
}

export async function listAdminAlbums(): Promise<AdminAlbum[]> {
  const albums = await db.select().from(galleryAlbums).orderBy(asc(galleryAlbums.sortOrder), desc(galleryAlbums.createdAt))
  const counts = await db
    .select({ albumId: galleryPhotos.albumId, count: sql<number>`count(*)::int` })
    .from(galleryPhotos)
    .groupBy(galleryPhotos.albumId)
  const countMap = new Map(counts.map((row) => [row.albumId, row.count]))
  return albums.map((album) => ({
    id: album.id,
    slug: album.slug,
    title: album.title,
    description: album.description,
    coverUrl: album.coverUrl,
    status: album.status,
    featured: album.featured,
    eventId: album.eventId,
    sortOrder: album.sortOrder,
    photoCount: countMap.get(album.id) ?? 0,
    updatedAt: album.updatedAt.toISOString(),
  }))
}

export async function getAlbumById(id: number) {
  const [row] = await db.select().from(galleryAlbums).where(eq(galleryAlbums.id, id)).limit(1)
  return row ?? null
}

export async function listAlbumPhotos(albumId: number) {
  return db.select().from(galleryPhotos).where(eq(galleryPhotos.albumId, albumId)).orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id))
}

export type PublicAlbum = AdminAlbum & { cover: string | null }

export async function listPublicAlbums(): Promise<PublicAlbum[]> {
  const albums = await db
    .select()
    .from(galleryAlbums)
    .where(eq(galleryAlbums.status, "published"))
    .orderBy(asc(galleryAlbums.sortOrder), desc(galleryAlbums.createdAt))
  const counts = await db
    .select({ albumId: galleryPhotos.albumId, count: sql<number>`count(*)::int` })
    .from(galleryPhotos)
    .groupBy(galleryPhotos.albumId)
  const firstPhotos = await db
    .select({ albumId: galleryPhotos.albumId, url: galleryPhotos.url, sortOrder: galleryPhotos.sortOrder, id: galleryPhotos.id })
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.id))
  const countMap = new Map(counts.map((row) => [row.albumId, row.count]))
  const firstMap = new Map<number, string>()
  for (const photo of firstPhotos) if (!firstMap.has(photo.albumId)) firstMap.set(photo.albumId, photo.url)
  return albums
    .filter((album) => (countMap.get(album.id) ?? 0) > 0)
    .map((album) => ({
      id: album.id,
      slug: album.slug,
      title: album.title,
      description: album.description,
      coverUrl: album.coverUrl,
      status: album.status,
      featured: album.featured,
      eventId: album.eventId,
      sortOrder: album.sortOrder,
      photoCount: countMap.get(album.id) ?? 0,
      updatedAt: album.updatedAt.toISOString(),
      cover: album.coverUrl ?? firstMap.get(album.id) ?? null,
    }))
}

export async function getPublicAlbum(slug: string) {
  const [album] = await db.select().from(galleryAlbums).where(eq(galleryAlbums.slug, slug)).limit(1)
  if (!album || album.status !== "published") return null
  const photos = await listAlbumPhotos(album.id)
  return { album, photos }
}
