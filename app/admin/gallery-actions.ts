"use server"

import { and, eq, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { galleryAlbums, galleryPhotos } from "@/lib/db/schema"
import { getAlbumById } from "@/lib/events/data"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

function revalidateGallery(slug?: string) {
  revalidatePath("/gallery")
  revalidatePath("/admin/gallery")
  revalidatePath("/sitemap.xml")
  if (slug) revalidatePath(`/gallery/${slug}`)
}

async function uniqueAlbumSlug(base: string, ignoreId?: number) {
  let candidate = base
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const [existing] = await db.select({ id: galleryAlbums.id }).from(galleryAlbums).where(eq(galleryAlbums.slug, candidate)).limit(1)
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${base}-${attempt}`
  }
  return `${base}-${Date.now()}`
}

function cleanUrl(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed) ? trimmed.slice(0, 800) : null
}

export async function createAlbumAction(input: { title: string; description?: string }): Promise<Result<{ id: number }>> {
  const user = await requireEditor()
  const title = input.title.trim().slice(0, 120)
  if (!title) return { ok: false, error: "Enter an album name." }
  const slug = await uniqueAlbumSlug(slugify(title) || "album")
  const [{ next }] = await db.select({ next: sql<number>`coalesce(max(${galleryAlbums.sortOrder}), 0) + 1` }).from(galleryAlbums)
  const [created] = await db
    .insert(galleryAlbums)
    .values({ slug, title, description: (input.description ?? "").trim().slice(0, 600), sortOrder: next, updatedBy: user.id })
    .returning({ id: galleryAlbums.id })
  revalidateGallery(slug)
  return { ok: true, data: { id: created.id } }
}

export type AlbumUpdate = {
  title: string
  slug: string
  description: string
  status: string
  featured: boolean
  eventId: number | null
}

export async function updateAlbumAction(id: number, input: AlbumUpdate): Promise<Result<{ slug: string }>> {
  const user = await requireEditor()
  const album = await getAlbumById(id)
  if (!album) return { ok: false, error: "That album no longer exists." }
  const title = input.title.trim().slice(0, 120)
  if (!title) return { ok: false, error: "Enter an album name." }

  // Editors can save drafts; only admins change what is public.
  const status = user.role === "admin" ? (input.status === "published" ? "published" : "draft") : album.status
  const slug = await uniqueAlbumSlug(slugify(input.slug || title) || "album", id)

  await db
    .update(galleryAlbums)
    .set({
      title,
      slug,
      description: input.description.trim().slice(0, 600),
      status,
      featured: input.featured,
      eventId: input.eventId,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(galleryAlbums.id, id))
  revalidateGallery(album.slug)
  revalidateGallery(slug)
  return { ok: true, data: { slug } }
}

export async function deleteAlbumAction(id: number): Promise<Result> {
  const album = await getAlbumById(id)
  if (!album) return { ok: false, error: "That album no longer exists." }
  if (album.status === "draft") await requireEditor()
  else await requireAdmin()
  await db.delete(galleryPhotos).where(eq(galleryPhotos.albumId, id))
  await db.delete(galleryAlbums).where(eq(galleryAlbums.id, id))
  revalidateGallery(album.slug)
  return { ok: true }
}

export async function reorderAlbumsAction(orderedIds: number[]): Promise<Result> {
  await requireEditor()
  await Promise.all(orderedIds.map((id, index) => db.update(galleryAlbums).set({ sortOrder: index }).where(eq(galleryAlbums.id, id))))
  revalidateGallery()
  return { ok: true }
}

export async function addPhotosAction(
  albumId: number,
  photos: { url: string; alt?: string; caption?: string }[],
): Promise<Result<{ added: number }>> {
  const user = await requireEditor()
  const album = await getAlbumById(albumId)
  if (!album) return { ok: false, error: "That album no longer exists." }
  const rows = photos
    .map((photo) => ({ url: cleanUrl(photo.url), alt: (photo.alt ?? "").trim().slice(0, 200), caption: (photo.caption ?? "").trim().slice(0, 300) }))
    .filter((photo): photo is { url: string; alt: string; caption: string } => Boolean(photo.url))
  if (rows.length === 0) return { ok: false, error: "No valid photos to add." }

  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${galleryPhotos.sortOrder}), -1) + 1` })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.albumId, albumId))
  await db.insert(galleryPhotos).values(rows.map((photo, index) => ({ albumId, ...photo, sortOrder: next + index })))
  await db.update(galleryAlbums).set({ updatedBy: user.id, updatedAt: new Date() }).where(eq(galleryAlbums.id, albumId))
  revalidateGallery(album.slug)
  return { ok: true, data: { added: rows.length } }
}

export async function updatePhotoAction(photoId: number, input: { alt: string; caption: string }): Promise<Result> {
  await requireEditor()
  const [photo] = await db.select().from(galleryPhotos).where(eq(galleryPhotos.id, photoId)).limit(1)
  if (!photo) return { ok: false, error: "That photo no longer exists." }
  await db
    .update(galleryPhotos)
    .set({ alt: input.alt.trim().slice(0, 200), caption: input.caption.trim().slice(0, 300) })
    .where(eq(galleryPhotos.id, photoId))
  const album = await getAlbumById(photo.albumId)
  revalidateGallery(album?.slug)
  return { ok: true }
}

export async function deletePhotosAction(albumId: number, photoIds: number[]): Promise<Result<{ removed: number }>> {
  await requireEditor()
  const album = await getAlbumById(albumId)
  if (!album) return { ok: false, error: "That album no longer exists." }
  if (photoIds.length === 0) return { ok: false, error: "Select at least one photo." }
  const removed = await db
    .delete(galleryPhotos)
    .where(and(eq(galleryPhotos.albumId, albumId), inArray(galleryPhotos.id, photoIds)))
    .returning({ id: galleryPhotos.id })
  const removedUrls = await db.select({ url: galleryPhotos.url }).from(galleryPhotos).where(eq(galleryPhotos.albumId, albumId))
  if (album.coverUrl && !removedUrls.some((photo) => photo.url === album.coverUrl)) {
    await db.update(galleryAlbums).set({ coverUrl: null }).where(eq(galleryAlbums.id, albumId))
  }
  revalidateGallery(album.slug)
  return { ok: true, data: { removed: removed.length } }
}

export async function reorderPhotosAction(albumId: number, orderedIds: number[]): Promise<Result> {
  await requireEditor()
  const album = await getAlbumById(albumId)
  if (!album) return { ok: false, error: "That album no longer exists." }
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(galleryPhotos).set({ sortOrder: index }).where(and(eq(galleryPhotos.id, id), eq(galleryPhotos.albumId, albumId))),
    ),
  )
  revalidateGallery(album.slug)
  return { ok: true }
}

export async function setAlbumCoverAction(albumId: number, url: string | null): Promise<Result> {
  await requireEditor()
  const album = await getAlbumById(albumId)
  if (!album) return { ok: false, error: "That album no longer exists." }
  const cover = url ? cleanUrl(url) : null
  await db.update(galleryAlbums).set({ coverUrl: cover, updatedAt: new Date() }).where(eq(galleryAlbums.id, albumId))
  revalidateGallery(album.slug)
  return { ok: true }
}
