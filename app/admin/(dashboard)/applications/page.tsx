import type { Metadata } from "next"

import { ApplicationsInbox } from "@/components/admin/jobs/applications-inbox"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listAdminJobs, listInboxApplications } from "@/lib/employment/jobs"

export const metadata: Metadata = { title: "Applications" }
export const dynamic = "force-dynamic"

export default async function ApplicationsAdminPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const [user, applications, jobs, params] = await Promise.all([getSessionUser(), listInboxApplications(), listAdminJobs(), searchParams])
  const jobId = Number(params.job)
  const jobOptions = jobs.filter((job) => job.applicationCount > 0 || job.applicationsEnabled).map((job) => ({ id: job.id, title: job.title }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review everyone who has applied, across every position, and move them through your hiring stages.</p>
      </div>
      <ApplicationsInbox
        applications={applications}
        jobs={jobOptions}
        role={user?.role ?? "viewer"}
        initialJobId={Number.isInteger(jobId) && jobId > 0 ? jobId : null}
      />
    </div>
  )
}
