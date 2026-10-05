import { and, asc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { galleryAlbums, galleryExhibitionAlbums, galleryExhibitions, galleryPhotos, gallerySubmissions } from "@/lib/db/schema"

export const EXHIBITION_STATUSES = ["draft", "open", "upcoming", "active", "closed", "archived"] as const
export type ExhibitionStatus = (typeof EXHIBITION_STATUSES)[number]

export async function listPublicExhibitions() {
  return db.select().from(galleryExhibitions).where(inArray(galleryExhibitions.status, ["open", "upcoming", "active", "closed"])).orderBy(asc(galleryExhibitions.startsAt))
}

export async function getPublicExhibition(slug: string) {
  const [exhibition] = await db.select().from(galleryExhibitions).where(and(eq(galleryExhibitions.slug, slug), inArray(galleryExhibitions.status, ["open", "upcoming", "active", "closed"]))).limit(1)
  if (!exhibition) return null
  const links = await db.select({ album: galleryAlbums }).from(galleryExhibitionAlbums).innerJoin(galleryAlbums, eq(galleryAlbums.id, galleryExhibitionAlbums.albumId)).where(eq(galleryExhibitionAlbums.exhibitionId, exhibition.id)).orderBy(asc(galleryExhibitionAlbums.sortOrder))
  const albums = await Promise.all(links.map(async ({ album }) => ({ ...album, photos: await db.select().from(galleryPhotos).where(eq(galleryPhotos.albumId, album.id)).orderBy(asc(galleryPhotos.sortOrder)) })))
  return { ...exhibition, albums }
}

export async function listAdminExhibitions() {
  return db.select().from(galleryExhibitions).orderBy(asc(galleryExhibitions.startsAt))
}

export async function getExhibitionById(id: number) {
  const [exhibition] = await db.select().from(galleryExhibitions).where(eq(galleryExhibitions.id, id)).limit(1)
  return exhibition ?? null
}

export async function listExhibitionSubmissions(exhibitionId: number) {
  return db.select().from(gallerySubmissions).where(eq(gallerySubmissions.exhibitionId, exhibitionId)).orderBy(asc(gallerySubmissions.createdAt))
}
