"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireEditor, requirePermission } from "@/lib/cms/auth-helpers"
import { slugify } from "@/lib/builder/schema"
import { db } from "@/lib/db"
import { jobApplications, jobPostings } from "@/lib/db/schema"
import { fromLocalInput } from "@/lib/events/occurrences"
import {
  getJobById,
  isApplicationStatus,
  isEmploymentType,
  isJobStatus,
  listJobApplications,
  type JobForm,
} from "@/lib/employment/jobs"

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

export type JobInput = JobForm & { id?: number }

export type AdminApplication = {
  id: number
  fullName: string
  email: string
  phone: string
  address: string
  availability: string
  desiredPay: string
  startDate: string
  yearsExperience: string
  referralSource: string
  coverLetter: string
  resumeUrl: string
  resumeFilename: string
  eligibleToWork: boolean
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
  console.error("[jobs]", error)
  return { ok: false, error: fallback }
}

function revalidateJobs(...slugs: (string | undefined)[]) {
  revalidatePath("/admin/jobs")
  revalidatePath("/employment")
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/employment/${slug}`)
}

async function uniqueSlug(base: string, ignoreId?: number) {
  let candidate = base
  for (let attempt = 2; attempt < 50; attempt += 1) {
    const [existing] = await db.select({ id: jobPostings.id }).from(jobPostings).where(eq(jobPostings.slug, candidate)).limit(1)
    if (!existing || existing.id === ignoreId) return candidate
    candidate = `${base}-${attempt}`
  }
  return `${base}-${Date.now().toString(36)}`
}

export async function saveJobAction(input: JobInput): Promise<Result<{ id: number; slug: string }>> {
  try {
    const user = await requireEditor()
    const isAdmin = user.role === "admin"
    const existing = input.id ? await getJobById(input.id) : null
    if (input.id && !existing) return { ok: false, error: "This job posting no longer exists." }

    const title = clean(input.title, 160)
    if (!title) return { ok: false, error: "Enter a job title." }

    const closingDate = fromLocalInput(input.closingDate)

    const contactEmail = clean(input.contactEmail, 160)
    if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) return { ok: false, error: "Enter a valid contact email." }

    const employmentType = isEmploymentType(input.employmentType) ? input.employmentType : "full_time"

    // Only admins change publish state; editors keep whatever an admin last set.
    const requested = isJobStatus(input.status) ? input.status : "draft"
    const status = isAdmin ? requested : (existing?.status ?? "draft")

    const slug = await uniqueSlug(slugify(input.slug || title) || "job", existing?.id)
    const values = {
      title,
      slug,
      department: clean(input.department, 160),
      location: clean(input.location, 160),
      employmentType,
      summary: clean(input.summary, 400),
      description: clean(input.description, 6000),
      requirements: clean(input.requirements, 4000),
      benefits: clean(input.benefits, 4000),
      payRange: clean(input.payRange, 120),
      status,
      featured: Boolean(input.featured),
      applicationsEnabled: Boolean(input.applicationsEnabled),
      closingDate,
      contactName: clean(input.contactName, 160),
      contactEmail,
      updatedBy: user.id,
      updatedAt: new Date(),
    }

    let id: number
    if (existing) {
      await db.update(jobPostings).set(values).where(eq(jobPostings.id, existing.id))
      id = existing.id
    } else {
      const [created] = await db.insert(jobPostings).values(values).returning({ id: jobPostings.id })
      id = created.id
    }

    revalidateJobs(slug, existing?.slug)
    return { ok: true, data: { id, slug } }
  } catch (error) {
    return failure(error, "The job posting couldn't be saved. Try again.")
  }
}

export async function duplicateJobAction(id: number): Promise<Result<{ id: number }>> {
  try {
    const user = await requireEditor()
    const source = await getJobById(id)
    if (!source) return { ok: false, error: "This job posting no longer exists." }
    const slug = await uniqueSlug(`${source.slug}-copy`)
    const { id: _ignored, createdAt: _created, ...rest } = source
    const [created] = await db
      .insert(jobPostings)
      .values({ ...rest, title: `${source.title} (copy)`, slug, status: "draft", featured: false, updatedBy: user.id, updatedAt: new Date() })
      .returning({ id: jobPostings.id })
    revalidateJobs()
    return { ok: true, data: { id: created.id } }
  } catch (error) {
    return failure(error, "The job posting couldn't be duplicated.")
  }
}

export async function setJobStatusAction(id: number, status: string): Promise<Result> {
  try {
    await requireAdmin()
    if (!isJobStatus(status)) return { ok: false, error: "Unknown status." }
    const [updated] = await db.update(jobPostings).set({ status, updatedAt: new Date() }).where(eq(jobPostings.id, id)).returning({ slug: jobPostings.slug })
    if (!updated) return { ok: false, error: "This job posting no longer exists." }
    revalidateJobs(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "The status couldn't be changed.")
  }
}

export async function toggleJobFeaturedAction(id: number, featured: boolean): Promise<Result> {
  try {
    await requireEditor()
    const [updated] = await db.update(jobPostings).set({ featured, updatedAt: new Date() }).where(eq(jobPostings.id, id)).returning({ slug: jobPostings.slug })
    if (!updated) return { ok: false, error: "This job posting no longer exists." }
    revalidateJobs(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "Featured couldn't be changed.")
  }
}

export async function toggleApplicationsAction(id: number, enabled: boolean): Promise<Result> {
  try {
    await requireEditor()
    const [updated] = await db.update(jobPostings).set({ applicationsEnabled: enabled, updatedAt: new Date() }).where(eq(jobPostings.id, id)).returning({ slug: jobPostings.slug })
    if (!updated) return { ok: false, error: "This job posting no longer exists." }
    revalidateJobs(updated.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "Applications couldn't be changed.")
  }
}

export async function deleteJobAction(id: number): Promise<Result> {
  try {
    const user = await requireEditor()
    const existing = await getJobById(id)
    if (!existing) return { ok: false, error: "This job posting no longer exists." }
    if (user.role !== "admin" && existing.status !== "draft") return { ok: false, error: "Only an admin can delete a published job posting." }
    await db.delete(jobApplications).where(eq(jobApplications.jobId, id))
    await db.delete(jobPostings).where(eq(jobPostings.id, id))
    revalidateJobs(existing.slug)
    return { ok: true }
  } catch (error) {
    return failure(error, "The job posting couldn't be deleted.")
  }
}

export async function listApplicationsAction(jobId: number): Promise<Result<AdminApplication[]>> {
  try {
    await requirePermission("view_content")
    const rows = await listJobApplications(jobId)
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        address: row.address,
        availability: row.availability,
        desiredPay: row.desiredPay,
        startDate: row.startDate,
        yearsExperience: row.yearsExperience,
        referralSource: row.referralSource,
        coverLetter: row.coverLetter,
        resumeUrl: row.resumeUrl,
        resumeFilename: row.resumeFilename,
        eligibleToWork: row.eligibleToWork,
        status: row.status,
        reviewNotes: row.reviewNotes,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  } catch (error) {
    return failure(error, "Applications couldn't be loaded.")
  }
}

export async function updateApplicationStatusAction(id: number, status: string, reviewNotes: string): Promise<Result> {
  try {
    const user = await requireEditor()
    if (!isApplicationStatus(status)) return { ok: false, error: "Unknown review status." }
    await db.update(jobApplications).set({ status, reviewNotes: clean(reviewNotes, 2000), reviewerId: user.id, updatedAt: new Date() }).where(eq(jobApplications.id, id))
    revalidatePath("/admin/jobs")
    return { ok: true }
  } catch (error) {
    return failure(error, "The review couldn't be saved.")
  }
}

export async function deleteApplicationAction(id: number): Promise<Result> {
  try {
    await requireAdmin()
    await db.delete(jobApplications).where(eq(jobApplications.id, id))
    revalidatePath("/admin/jobs")
    return { ok: true }
  } catch (error) {
    return failure(error, "The application couldn't be deleted.")
  }
}

export async function submitApplicationAction(input: {
  jobId: number
  fullName: string
  email: string
  phone?: string
  address?: string
  availability?: string
  desiredPay?: string
  startDate?: string
  yearsExperience?: string
  referralSource?: string
  coverLetter?: string
  resumeUrl?: string
  resumeFilename?: string
  eligibleToWork?: boolean
}): Promise<Result> {
  const [job] = await db
    .select({ enabled: jobPostings.applicationsEnabled, status: jobPostings.status, closingDate: jobPostings.closingDate })
    .from(jobPostings)
    .where(eq(jobPostings.id, input.jobId))
    .limit(1)
  if (!job || job.status !== "open" || !job.enabled) return { ok: false, error: "Applications are closed for this position." }
  if (job.closingDate && job.closingDate.getTime() < Date.now()) return { ok: false, error: "The application deadline has passed." }
  if (!input.fullName?.trim() || !EMAIL_PATTERN.test(input.email?.trim() ?? "")) {
    return { ok: false, error: "Complete your name and a valid email." }
  }
  const resumeUrl = safeUrl(input.resumeUrl ?? "")
  if (resumeUrl === null) return { ok: false, error: "The resume link isn't valid." }

  await db.insert(jobApplications).values({
    jobId: input.jobId,
    fullName: clean(input.fullName, 160),
    email: clean(input.email, 200),
    phone: clean(input.phone, 60),
    address: clean(input.address, 300),
    availability: clean(input.availability, 200),
    desiredPay: clean(input.desiredPay, 120),
    startDate: clean(input.startDate, 120),
    yearsExperience: clean(input.yearsExperience, 120),
    referralSource: clean(input.referralSource, 200),
    coverLetter: clean(input.coverLetter, 4000),
    resumeUrl: resumeUrl ?? "",
    resumeFilename: clean(input.resumeFilename, 200),
    eligibleToWork: Boolean(input.eligibleToWork),
  })
  revalidatePath("/admin/jobs")
  return { ok: true }
}
