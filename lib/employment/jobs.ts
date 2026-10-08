import { and, asc, desc, eq, inArray } from "drizzle-orm"

import { db } from "@/lib/db"
import { jobApplications, jobPostings } from "@/lib/db/schema"
import { formatEventDate, toLocalInput } from "@/lib/events/occurrences"
import { PUBLIC_JOB_STATUSES, type AdminJob, type PublicJob } from "@/lib/employment/job-constants"

export * from "@/lib/employment/job-constants"
export { formatEventDate }

export async function listPublicJobs(): Promise<PublicJob[]> {
  const rows = await db
    .select()
    .from(jobPostings)
    .where(inArray(jobPostings.status, PUBLIC_JOB_STATUSES))
    .orderBy(desc(jobPostings.featured), asc(jobPostings.title))
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    employmentType: row.employmentType,
    summary: row.summary,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    payRange: row.payRange,
    status: row.status,
    featured: row.featured,
    applicationsEnabled: row.applicationsEnabled,
    closingDate: row.closingDate?.toISOString() ?? null,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
  }))
}

export async function getPublicJob(slug: string): Promise<PublicJob | null> {
  const [row] = await db
    .select()
    .from(jobPostings)
    .where(and(eq(jobPostings.slug, slug), inArray(jobPostings.status, PUBLIC_JOB_STATUSES)))
    .limit(1)
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    employmentType: row.employmentType,
    summary: row.summary,
    description: row.description,
    requirements: row.requirements,
    benefits: row.benefits,
    payRange: row.payRange,
    status: row.status,
    featured: row.featured,
    applicationsEnabled: row.applicationsEnabled,
    closingDate: row.closingDate?.toISOString() ?? null,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
  }
}

export async function getJobById(id: number) {
  const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, id)).limit(1)
  return job ?? null
}

export async function listAdminJobs(): Promise<AdminJob[]> {
  const [rows, applications] = await Promise.all([
    db.select().from(jobPostings).orderBy(desc(jobPostings.updatedAt)),
    db.select({ jobId: jobApplications.jobId, status: jobApplications.status }).from(jobApplications),
  ])

  return rows.map((row) => {
    const own = applications.filter((item) => item.jobId === row.id)
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      department: row.department,
      location: row.location,
      employmentType: row.employmentType,
      status: row.status,
      featured: row.featured,
      applicationsEnabled: row.applicationsEnabled,
      closingDate: row.closingDate?.toISOString() ?? null,
      applicationCount: own.length,
      newCount: own.filter((item) => item.status === "new" || item.status === "under_review").length,
      hiredCount: own.filter((item) => item.status === "hired").length,
      form: {
        title: row.title,
        slug: row.slug,
        department: row.department,
        location: row.location,
        employmentType: row.employmentType,
        summary: row.summary,
        description: row.description,
        requirements: row.requirements,
        benefits: row.benefits,
        payRange: row.payRange,
        status: row.status,
        featured: row.featured,
        applicationsEnabled: row.applicationsEnabled,
        closingDate: toLocalInput(row.closingDate),
        contactName: row.contactName,
        contactEmail: row.contactEmail,
      },
    }
  })
}

export async function listJobApplications(jobId: number) {
  return db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId)).orderBy(desc(jobApplications.createdAt))
}
