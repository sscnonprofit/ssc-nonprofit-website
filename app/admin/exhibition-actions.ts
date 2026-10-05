"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { galleryExhibitionAlbums, galleryExhibitions, gallerySubmissions } from "@/lib/db/schema"

function clean(value: string, max = 2000) { return value.trim().slice(0, max) }
function date(value: string) { return value ? new Date(value) : null }

export async function createExhibitionAction(input: { title: string }) {
  const user = await requireEditor()
  const title = clean(input.title, 160)
  if (!title) return { ok: false, error: "Enter an exhibition title." }
  const slug = `${slugify(title) || "exhibition"}-${Date.now().toString(36)}`
  const [created] = await db.insert(galleryExhibitions).values({ title, slug, createdBy: user.id }).returning({ id: galleryExhibitions.id })
  revalidatePath("/admin/exhibitions")
  return { ok: true, id: created.id }
}

export async function updateExhibitionAction(id: number, input: { title: string; slug: string; description: string; coverUrl: string; venueName: string; venueAddress: string; venuePhone: string; venueEmail: string; venueWebsite: string; startsAt: string; endsAt: string; publicOpeningAt: string; submissionDeadline: string; status: string; featured: boolean; submissionsEnabled: boolean }) {
  const user = await requireEditor()
  const title = clean(input.title, 160)
  if (!title) return { ok: false, error: "Enter an exhibition title." }
  const status = user.role === "admin" ? input.status : "draft"
  await db.update(galleryExhibitions).set({ title, slug: clean(input.slug, 180) || slugify(title), description: clean(input.description), coverUrl: clean(input.coverUrl, 800) || null, venueName: clean(input.venueName, 160), venueAddress: clean(input.venueAddress, 300), venuePhone: clean(input.venuePhone, 60), venueEmail: clean(input.venueEmail, 160), venueWebsite: clean(input.venueWebsite, 300), startsAt: date(input.startsAt), endsAt: date(input.endsAt), publicOpeningAt: date(input.publicOpeningAt), submissionDeadline: date(input.submissionDeadline), status, featured: input.featured, submissionsEnabled: input.submissionsEnabled, updatedAt: new Date() }).where(eq(galleryExhibitions.id, id))
  revalidatePath("/admin/exhibitions")
  revalidatePath(`/artists-gallery/exhibitions/${input.slug}`)
  return { ok: true }
}

export async function linkAlbumsAction(exhibitionId: number, albumIds: number[]) {
  await requireEditor()
  await db.delete(galleryExhibitionAlbums).where(eq(galleryExhibitionAlbums.exhibitionId, exhibitionId))
  if (albumIds.length) await db.insert(galleryExhibitionAlbums).values(albumIds.map((albumId, sortOrder) => ({ exhibitionId, albumId, sortOrder })))
  revalidatePath(`/artists-gallery/exhibitions`)
  return { ok: true }
}

export async function submitArtworkAction(input: { exhibitionId: number; artistName: string; artistEmail: string; artistPhone?: string; artistBio?: string; artistStatement?: string; portfolioUrl?: string; socialHandles?: string; artworkTitle: string; medium?: string; dimensions?: string; yearCreated?: number; editionInfo?: string; askingPrice?: string; notForSale?: boolean; artworkDescription?: string; imageUrls?: string[] }) {
  const exhibition = await db.select({ enabled: galleryExhibitions.submissionsEnabled }).from(galleryExhibitions).where(and(eq(galleryExhibitions.id, input.exhibitionId), eq(galleryExhibitions.status, "open"))).limit(1)
  if (!exhibition[0]?.enabled) return { ok: false, error: "Submissions are closed for this exhibition." }
  if (!input.artistName.trim() || !input.artistEmail.includes("@") || !input.artworkTitle.trim()) return { ok: false, error: "Complete your name, email, and artwork title." }
  await db.insert(gallerySubmissions).values({ exhibitionId: input.exhibitionId, artistName: clean(input.artistName, 160), artistEmail: clean(input.artistEmail, 200), artistPhone: clean(input.artistPhone ?? "", 60), artistBio: clean(input.artistBio ?? ""), artistStatement: clean(input.artistStatement ?? ""), portfolioUrl: clean(input.portfolioUrl ?? "", 400), socialHandles: clean(input.socialHandles ?? "", 400), artworkTitle: clean(input.artworkTitle, 200), medium: clean(input.medium ?? "", 120), dimensions: clean(input.dimensions ?? "", 120), yearCreated: input.yearCreated, editionInfo: clean(input.editionInfo ?? "", 120), askingPrice: clean(input.askingPrice ?? "", 120), notForSale: Boolean(input.notForSale), artworkDescription: clean(input.artworkDescription ?? ""), imageUrls: (input.imageUrls ?? []).slice(0, 10) })
  revalidatePath(`/artists-gallery/exhibitions`)
  return { ok: true }
}

export async function updateSubmissionStatusAction(id: number, status: string, reviewNotes: string) {
  await requireEditor()
  await db.update(gallerySubmissions).set({ status, reviewNotes: clean(reviewNotes, 2000), updatedAt: new Date() }).where(eq(gallerySubmissions.id, id))
  return { ok: true }
}

export async function deleteExhibitionAction(id: number) {
  await requireAdmin()
  await db.delete(galleryExhibitionAlbums).where(eq(galleryExhibitionAlbums.exhibitionId, id))
  await db.delete(gallerySubmissions).where(eq(gallerySubmissions.exhibitionId, id))
  await db.delete(galleryExhibitions).where(eq(galleryExhibitions.id, id))
  revalidatePath("/admin/exhibitions")
  return { ok: true }
}
