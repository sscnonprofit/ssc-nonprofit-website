import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { galleryAlbums, galleryExhibitionAlbums, galleryExhibitions, galleryPhotos, gallerySubmissions } from "@/lib/db/schema"
import { toLocalInput } from "@/lib/events/occurrences"
import { PUBLIC_EXHIBITION_STATUSES, type AdminExhibition, type AlbumOption } from "@/lib/gallery/exhibition-constants"

export * from "@/lib/gallery/exhibition-constants"

export async function listPublicExhibitions() {
  return db.select().from(galleryExhibitions).where(inArray(galleryExhibitions.status, PUBLIC_EXHIBITION_STATUSES)).orderBy(asc(galleryExhibitions.startsAt))
}

export async function getPublicExhibition(slug: string) {
  const [exhibition] = await db.select().from(galleryExhibitions).where(and(eq(galleryExhibitions.slug, slug), inArray(galleryExhibitions.status, PUBLIC_EXHIBITION_STATUSES))).limit(1)
  if (!exhibition) return null
  const links = await db.select({ album: galleryAlbums }).from(galleryExhibitionAlbums).innerJoin(galleryAlbums, eq(galleryAlbums.id, galleryExhibitionAlbums.albumId)).where(eq(galleryExhibitionAlbums.exhibitionId, exhibition.id)).orderBy(asc(galleryExhibitionAlbums.sortOrder))
  const albums = await Promise.all(links.map(async ({ album }) => ({ ...album, photos: await db.select().from(galleryPhotos).where(eq(galleryPhotos.albumId, album.id)).orderBy(asc(galleryPhotos.sortOrder)) })))
  return { ...exhibition, albums }
}

export async function listAdminExhibitions(): Promise<AdminExhibition[]> {
  const [rows, submissions, links] = await Promise.all([
    db.select().from(galleryExhibitions).orderBy(desc(galleryExhibitions.updatedAt)),
    db.select({ exhibitionId: gallerySubmissions.exhibitionId, status: gallerySubmissions.status }).from(gallerySubmissions),
    db.select().from(galleryExhibitionAlbums).orderBy(asc(galleryExhibitionAlbums.sortOrder)),
  ])

  return rows.map((row) => {
    const own = submissions.filter((item) => item.exhibitionId === row.id)
    const albumIds = links.filter((link) => link.exhibitionId === row.id).map((link) => link.albumId)
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      coverUrl: row.coverUrl,
      venueName: row.venueName,
      status: row.status,
      featured: row.featured,
      submissionsEnabled: row.submissionsEnabled,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      submissionDeadline: row.submissionDeadline?.toISOString() ?? null,
      submissionCount: own.length,
      pendingCount: own.filter((item) => item.status === "submitted" || item.status === "under_review").length,
      acceptedCount: own.filter((item) => item.status === "accepted").length,
      albumCount: albumIds.length,
      form: {
        title: row.title,
        slug: row.slug,
        description: row.description,
        coverUrl: row.coverUrl ?? "",
        venueName: row.venueName,
        venueAddress: row.venueAddress,
        venuePhone: row.venuePhone,
        venueEmail: row.venueEmail,
        venueWebsite: row.venueWebsite,
        startsAt: toLocalInput(row.startsAt),
        endsAt: toLocalInput(row.endsAt),
        publicOpeningAt: toLocalInput(row.publicOpeningAt),
        submissionDeadline: toLocalInput(row.submissionDeadline),
        status: row.status,
        featured: row.featured,
        submissionsEnabled: row.submissionsEnabled,
        albumIds,
      },
    }
  })
}

export async function listAlbumOptions(): Promise<AlbumOption[]> {
  return db.select({ id: galleryAlbums.id, title: galleryAlbums.title, status: galleryAlbums.status }).from(galleryAlbums).orderBy(asc(galleryAlbums.sortOrder), asc(galleryAlbums.title))
}

export async function getExhibitionById(id: number) {
  const [exhibition] = await db.select().from(galleryExhibitions).where(eq(galleryExhibitions.id, id)).limit(1)
  return exhibition ?? null
}

export async function listExhibitionSubmissions(exhibitionId: number) {
  return db.select().from(gallerySubmissions).where(eq(gallerySubmissions.exhibitionId, exhibitionId)).orderBy(desc(gallerySubmissions.createdAt))
}
