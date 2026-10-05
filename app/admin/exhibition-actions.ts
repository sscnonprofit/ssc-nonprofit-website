"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor, requirePermission } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { galleryExhibitionAlbums, galleryExhibitions, gallerySubmissions } from "@/lib/db/schema"
import { fromLocalInput } from "@/lib/events/occurrences"
import {
  getExhibitionById,
  isExhibitionStatus,
  isSubmissionStatus,
  listExhibitionSubmissions,
  type ExhibitionForm,
} from "@/lib/gallery/exhibitions"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

export type ExhibitionInput = ExhibitionForm & { id?: number }

export type AdminSubmission = {
  id: number
  artistName: string
  artistEmail: string
  artistPhone: string
  artistBio: string
  artistStatement: string
  portfolioUrl: string
  socialHandles: string
  artworkTitle: string
  medium: string
  dimensions: string
  yearCreated: number | null
  editionInfo: string
  askingPrice: string
  notForSale: boolean
  artworkDescription: string
  imageUrls: string[]
  status: string
  reviewNotes: string
  createdAt: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: string | undefined | null, max = 2000) {
  return (value ?? "").trim().slice(0, max)
}

function safeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 800)
  return null
}

function failure(error: unknown, fallback: string): { ok: false; error: string } {
  const message = error instanceof Error ? error.message : ""
  if (message === "Unauthorized") return { ok: false, error: "Your session has ended. Sign in again." }
  if (message.startsWith("Forbidden")) return { ok: false, error: "You don't have permission to do that." }
  console.error("[exhibitions]", error)
  return { ok: false, error: fallback }
}

function revalidateExhibitions(...slugs: (string | undefined)[]) {
  revalidatePath("/admin/exhibitions")
  revalidatePath("/artists-gallery")
  revalidatePath("/artists-gallery/exhibitions")
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/artists-gallery/exhibitions/${slug}`)
}

async function uniqueSlug(base: string, ignoreId?: number) {
  let candidate = base
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const [existing] = await db.select({ id: galleryExhibitions.id }).from(galleryExhibitions).where(eq(galleryExhibitions.slug, candidate)).limit(1)
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${base}-${attempt}`
  }
  return `${base}-${Date.now().toString(36)}`
}

async function replaceAlbums(exhibitionId: number, albumIds: number[]) {
  const unique = [...new Set(albumIds.filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50)
  await db.delete(galleryExhibitionAlbums).where(eq(galleryExhibitionAlbums.exhibitionId, exhibitionId))
  if (unique.length) {
    await db.insert(galleryExhibitionAlbums).values(unique.map((albumId, sortOrder) => ({ exhibitionId, albumId, sortOrder })))
  }
}

export async function saveExhibitionAction(input: ExhibitionInput): Promise<Result<{ id: number; slug: string }>> {
  try {
    const user = await requireEditor()
    const isAdmin = user.role === "admin"
    const existing = input.id ? await getExhibitionById(input.id) : null
    if (input.id && !existing) return { ok: false, error: "This exhibition no longer exists." }

    const title = clean(input.title, 160)
    if (!title) return { ok: false, error: "Enter an exhibition title." }

    const startsAt = fromLocalInput(input.startsAt)
    const endsAt = fromLocalInput(input.endsAt)
    const publicOpeningAt = fromLocalInput(input.publicOpeningAt)
    const submissionDeadline = fromLocalInput(input.submissionDeadline)
    if (startsAt && endsAt && endsAt < startsAt) return { ok: false, error: "The end date must be after the start date." }

    const venueEmail = clean(input.venueEmail, 160)
    if (venueEmail && !EMAIL_PATTERN.test(venueEmail)) return { ok: false, error: "Enter a valid venue email." }
    const venueWebsite = safeUrl(input.venueWebsite)
    if (venueWebsite === null) return { ok: false, error: "The venue website must start with https://." }
    const coverUrl = safeUrl(input.coverUrl)
    if (coverUrl === null) return { ok: false, error: "The cover image link isn't valid." }

    // Only admins change publish state; editors keep whatever an admin last set.
    const requested = isExhibitionStatus(input.status) ? input.status : "draft"
    const status = isAdmin ? requested : (existing?.status ?? "draft")

    const slug = await uniqueSlug(slugify(input.slug || title) || "exhibition", existing?.id)
    const values = {
      title,
      slug,
      description: clean(input.description, 5000),
      coverUrl: coverUrl || null,
      venueName: clean(input.venueName, 160),
      venueAddress: clean(input.venueAddress, 300),
      venuePhone: clean(input.venuePhone, 60),
      venueEmail,
      venueWebsite,
      startsAt,
      endsAt,
      publicOpeningAt,
      submissionDeadline,
      status,
      featured: Boolean(input.featured),
      submissionsEnabled: Boolean(input.submissionsEnabled),
      updatedAt: new Date(),
    }

    let id: number
    if (existing) {
      await db.update(galleryExhibitions).set(values).where(eq(galleryExhibitions.id, existing.id))
      id = existing.id
    } else {
      const [created] = await db.insert(galleryExhibitions).values({ ...values, createdBy: user.id }).returning({ id: galleryExhibitions.id })
      id = created.id
    }
    await replaceAlbums(id, input.albumIds ?? [])

    revalidateExhibitions(slug, existing?.slug)
    return { ok: true, data: { id, slug } }
  } catch (error) {
    return failure(error, "The exhibition couldn't be saved. Try again.")
  }
}

export async function duplicateExhibitionAction(id: number): Promise<Result<{ id: number }>> {
  try {
    const user = await requireEditor()
    const source = await getExhibitionById(id)
    if (!source) return { ok: false, error: "This exhibition no longer exists." }
    const slug = await uniqueSlug(`${source.slug}-copy`)
    const { id: _ignored, createdAt: _created, ...rest } = source
    const [created] = await db
      .insert(galleryExhibitions)
      .values({ ...rest, title: `${source.title} (copy)`, slug, status: "draft", featured: false, createdBy: user.id, updatedAt: new Date() })
      .returning({ id: galleryExhibitions.id })
    const links = await db.select().from(galleryExhibitionAlbums).where(eq(galleryExhibitionAlbums.exhibitionId, id))
    await replaceAlbums(created.id, links.sort((a, b) => a.sortOrder - b.sortOrder).map((link) => link.albumId))
    revalidateExhibitions()
    return { ok: true, data: { id: created.id } }
  } catch (error) {
    return failure(error, "The exhibition couldn't be duplicated.")
  }
}

export async function setExhibitionStatusAction(id: number, status: string): Promise<Result> {
  try {
    await requireAdmin()
    if (!isExhibitionStatus(status)) return { ok: false, error: "Unknown status." }
    const [updated] = await db.update(galleryExhibitions).set({ status, updatedAt: new Date() }).where(eq(galleryExhibitions.id, id)).returning({ slug: galleryExhibitions.slug })
    if (!updated) return { ok: false, error: "This exhibition no longer exists." }
    revalidateExhibitions(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "The status couldn't be changed.")
  }
}

export async function toggleExhibitionFeaturedAction(id: number, featured: boolean): Promise<Result> {
  try {
    await requireEditor()
    const [updated] = await db.update(galleryExhibitions).set({ featured, updatedAt: new Date() }).where(eq(galleryExhibitions.id, id)).returning({ slug: galleryExhibitions.slug })
    if (!updated) return { ok: false, error: "This exhibition no longer exists." }
    revalidateExhibitions(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "Featured couldn't be changed.")
  }
}

export async function toggleSubmissionsAction(id: number, enabled: boolean): Promise<Result> {
  try {
    await requireEditor()
    const [updated] = await db.update(galleryExhibitions).set({ submissionsEnabled: enabled, updatedAt: new Date() }).where(eq(galleryExhibitions.id, id)).returning({ slug: galleryExhibitions.slug })
    if (!updated) return { ok: false, error: "This exhibition no longer exists." }
    revalidateExhibitions(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "Submissions couldn't be changed.")
  }
}

export async function deleteExhibitionAction(id: number): Promise<Result> {
  try {
    const user = await requireEditor()
    const existing = await getExhibitionById(id)
    if (!existing) return { ok: false, error: "This exhibition no longer exists." }
    if (user.role !== "admin" && existing.status !== "draft") return { ok: false, error: "Only an admin can delete a published exhibition." }
    await db.delete(galleryExhibitionAlbums).where(eq(galleryExhibitionAlbums.exhibitionId, id))
    await db.delete(gallerySubmissions).where(eq(gallerySubmissions.exhibitionId, id))
    await db.delete(galleryExhibitions).where(eq(galleryExhibitions.id, id))
    revalidateExhibitions(existing.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "The exhibition couldn't be deleted.")
  }
}

export async function listSubmissionsAction(exhibitionId: number): Promise<Result<AdminSubmission[]>> {
  try {
    await requirePermission("view_content")
    const rows = await listExhibitionSubmissions(exhibitionId)
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        artistName: row.artistName,
        artistEmail: row.artistEmail,
        artistPhone: row.artistPhone,
        artistBio: row.artistBio,
        artistStatement: row.artistStatement,
        portfolioUrl: row.portfolioUrl,
        socialHandles: row.socialHandles,
        artworkTitle: row.artworkTitle,
        medium: row.medium,
        dimensions: row.dimensions,
        yearCreated: row.yearCreated,
        editionInfo: row.editionInfo,
        askingPrice: row.askingPrice,
        notForSale: row.notForSale,
        artworkDescription: row.artworkDescription,
        imageUrls: Array.isArray(row.imageUrls) ? (row.imageUrls as unknown[]).filter((url): url is string => typeof url === "string") : [],
        status: row.status,
        reviewNotes: row.reviewNotes,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return failure(error, "Submissions couldn't be loaded.")
  }
}

export async function updateSubmissionStatusAction(id: number, status: string, reviewNotes: string): Promise<Result> {
  try {
    const user = await requireEditor()
    if (!isSubmissionStatus(status)) return { ok: false, error: "Unknown review status." }
    await db.update(gallerySubmissions).set({ status, reviewNotes: clean(reviewNotes, 2000), reviewerId: user.id, updatedAt: new Date() }).where(eq(gallerySubmissions.id, id))
    revalidatePath("/admin/exhibitions")
    return { ok: true }
  } catch (error) {
    return failure(error, "The review couldn't be saved.")
  }
}

export async function deleteSubmissionAction(id: number): Promise<Result> {
  try {
    await requireAdmin()
    await db.delete(gallerySubmissions).where(eq(gallerySubmissions.id, id))
    revalidatePath("/admin/exhibitions")
    return { ok: true }
  } catch (error) {
    return failure(error, "The submission couldn't be deleted.")
  }
}

export async function submitArtworkAction(input: {
  exhibitionId: number
  artistName: string
  artistEmail: string
  artistPhone?: string
  artistBio?: string
  artistStatement?: string
  portfolioUrl?: string
  socialHandles?: string
  artworkTitle: string
  medium?: string
  dimensions?: string
  yearCreated?: number
  editionInfo?: string
  askingPrice?: string
  notForSale?: boolean
  artworkDescription?: string
  imageUrls?: string[]
}) {
  const [exhibition] = await db
    .select({ enabled: galleryExhibitions.submissionsEnabled, deadline: galleryExhibitions.submissionDeadline })
    .from(galleryExhibitions)
    .where(and(eq(galleryExhibitions.id, input.exhibitionId), eq(galleryExhibitions.status, "open")))
    .limit(1)
  if (!exhibition?.enabled) return { ok: false, error: "Submissions are closed for this exhibition." }
  if (exhibition.deadline && exhibition.deadline.getTime() < Date.now()) return { ok: false, error: "The submission deadline has passed." }
  if (!input.artistName?.trim() || !EMAIL_PATTERN.test(input.artistEmail?.trim() ?? "") || !input.artworkTitle?.trim()) {
    return { ok: false, error: "Complete your name, a valid email, and the artwork title." }
  }
  const portfolioUrl = safeUrl(input.portfolioUrl ?? "")
  const year = Number(input.yearCreated)
  await db.insert(gallerySubmissions).values({
    exhibitionId: input.exhibitionId,
    artistName: clean(input.artistName, 160),
    artistEmail: clean(input.artistEmail, 200),
    artistPhone: clean(input.artistPhone, 60),
    artistBio: clean(input.artistBio),
    artistStatement: clean(input.artistStatement),
    portfolioUrl: portfolioUrl ?? "",
    socialHandles: clean(input.socialHandles, 400),
    artworkTitle: clean(input.artworkTitle, 200),
    medium: clean(input.medium, 120),
    dimensions: clean(input.dimensions, 120),
    yearCreated: Number.isInteger(year) && year > 1000 && year < 3000 ? year : null,
    editionInfo: clean(input.editionInfo, 120),
    askingPrice: clean(input.askingPrice, 120),
    notForSale: Boolean(input.notForSale),
    artworkDescription: clean(input.artworkDescription),
    imageUrls: (input.imageUrls ?? []).map((url) => safeUrl(url)).filter((url): url is string => Boolean(url)).slice(0, 10),
  })
  revalidatePath("/admin/exhibitions")
  return { ok: true }
}
